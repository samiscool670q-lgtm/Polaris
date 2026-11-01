/**
 * Builds the static version of Polaris that gets published to Netlify.
 *
 * Netlify serves files from a CDN instead of running server/index.js, so the
 * work that express used to do per request (template injection, the /api
 * endpoints, vendoring the proxy client files) happens here instead, once, at
 * deploy time. Everything that still needs a server at request time is handled
 * by the redirects in netlify.toml, the /cdn edge function or the favicon
 * function.
 */

import { epoxyPath } from '@mercuryworkshop/epoxy-transport';
import { uvPath } from '@titaniumnetwork-dev/ultraviolet';
import { baremuxPath } from '@mercuryworkshop/bare-mux/node';

import path from 'node:path';
import url from 'node:url';
import fs from 'node:fs';

const __dirname = url.fileURLToPath(new URL('.', import.meta.url));
const root = path.join(__dirname, '..');
const dist = path.join(root, 'dist');

const packageFile = JSON.parse(fs.readFileSync(path.join(root, 'package.json')));

const copy = (from, to) => fs.cpSync(from, to, { recursive: true });
const write = (file, data) => {
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(file, data);
};

/**
 * Replaces the <!--el:name--> markers with the matching file in /templates.
 *
 * Conditional markers (<!--el:{{expr}}:name-->) are always dropped: the server
 * only ever inserted those when allowDangerousTemplateInsert was on, which is
 * off in production.
 */
const render = (data) => {
    let html = String(data);

    html = html.replace(/<!--el:\{\{.*?\}\}:.*?-->/g, '');

    html = html.replace(/<!--el:([\w-]+)-->/g, (marker, name) => {
        const template = path.join(root, 'templates', name + '.html');

        if (!fs.existsSync(template)) return '';

        return fs.readFileSync(template).toString();
    });

    return html;
};

const renderTree = (dir) => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        const target = path.join(dir, entry.name);

        if (entry.isDirectory()) renderTree(target);
        else if (entry.name.endsWith('.html')) write(target, render(fs.readFileSync(target)));
    }
};

/**
 * Turns one of the JSON data files into the shape /api used to return.
 *
 * The server proxied every image through /api/<type>/<id>/image; here the
 * original image path is handed to the browser directly, which the /cdn edge
 * function resolves for us.
 */
const list = (name) => JSON.parse(fs.readFileSync(path.join(root, 'static/assets/JSON', name + '.json')))
    .map(entry => ({
        name: entry.name,
        target: entry.target,
        image: entry.image,
        popular: Boolean(entry.popular)
    }));

fs.rmSync(dist, { recursive: true, force: true });
fs.mkdirSync(dist, { recursive: true });

// The proxy client files go down first so that the copies kept in /static
// (which carry Polaris' own uv.config.js and service worker) win on conflict,
// matching the route order the express server used.
copy(uvPath, path.join(dist, 'uv'));
copy(epoxyPath, path.join(dist, 'epoxy'));
copy(baremuxPath, path.join(dist, 'baremux'));

copy(path.join(root, 'static'), dist);

write(path.join(dist, '404.html'), render(fs.readFileSync(path.join(root, 'pages/404.html'))));
write(path.join(dist, 'proxy_404.html'), render(fs.readFileSync(path.join(root, 'pages/proxy_404.html'))));

renderTree(dist);

// Point the proxy transports at an external wisp server when one is
// configured. Netlify cannot accept the websocket upgrade itself.
if (process.env.POLARIS_WISP_URL) write(
    path.join(dist, 'assets/js/config.js'),
    `globalThis.__POLARIS_WISP_URL__ = ${JSON.stringify(process.env.POLARIS_WISP_URL)};\n`
);

const games = list('games');

write(path.join(dist, 'api/games.json'), JSON.stringify({
    popular: games.filter(game => game.popular),
    all: games
}));

write(path.join(dist, 'api/apps.json'), JSON.stringify(list('apps')));
write(path.join(dist, 'api/cheats.json'), JSON.stringify(list('cheats')));

const commit = process.env.COMMIT_REF || 'unknown';

write(path.join(dist, 'api/changelog.json'), JSON.stringify({
    version: packageFile.version + (Number(packageFile.version.split('.')[0]) <= 1 ? ' Beta' : ''),
    changelog: JSON.parse(fs.readFileSync(path.join(root, 'static/assets/JSON/changelog.json'))),
    commit: {
        sha: commit,
        message: process.env.COMMIT_MESSAGE || 'unknown'
    },
    upToDate: commit !== 'unknown',
    mode: 'production'
}));

console.log(`Polaris static build complete\n\nOutput: ${path.relative(root, dist)}\nGames: ${games.length}\nWisp server: ${process.env.POLARIS_WISP_URL || 'not configured'}`);
