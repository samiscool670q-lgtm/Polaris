/**
 * Serves /cdn/* from the Polaris asset hosts.
 *
 * This cannot be a plain proxy redirect: raw.githubusercontent.com answers with
 * text/plain for everything, so game pages would render as source instead of
 * running. The express server set the type from the file extension, and so does
 * this.
 */

const hosts = {
    '/cdn/3kh0/': 'https://player.work/',
    '/cdn/': 'https://raw.githubusercontent.com/Skoolgq/Polaris-Assets/main/'
};

const types: Record<string, string> = {
    html: 'text/html; charset=utf-8',
    htm: 'text/html; charset=utf-8',
    js: 'text/javascript; charset=utf-8',
    mjs: 'text/javascript; charset=utf-8',
    cjs: 'text/javascript; charset=utf-8',
    json: 'application/json; charset=utf-8',
    css: 'text/css; charset=utf-8',
    txt: 'text/plain; charset=utf-8',
    xml: 'application/xml; charset=utf-8',
    svg: 'image/svg+xml',
    png: 'image/png',
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    gif: 'image/gif',
    webp: 'image/webp',
    avif: 'image/avif',
    ico: 'image/x-icon',
    bmp: 'image/bmp',
    mp3: 'audio/mpeg',
    ogg: 'audio/ogg',
    wav: 'audio/wav',
    m4a: 'audio/mp4',
    mp4: 'video/mp4',
    webm: 'video/webm',
    woff: 'font/woff',
    woff2: 'font/woff2',
    ttf: 'font/ttf',
    otf: 'font/otf',
    eot: 'application/vnd.ms-fontobject',
    wasm: 'application/wasm',
    swf: 'application/x-shockwave-flash',
    zip: 'application/zip',
    pdf: 'application/pdf',
    // Unity WebGL builds; these arrive pre-compressed and the loader reads them
    // as opaque binary.
    unityweb: 'application/octet-stream',
    data: 'application/octet-stream',
    mem: 'application/octet-stream',
    symbols: 'application/octet-stream'
};

/**
 * Hides a game page that somebody opened directly rather than through /view,
 * the way the express /cdn handler used to.
 */
const inject = '<script src=\'/assets/js/cdn.inject.js\' preload=\'true\'></script>';

export default async (request: Request) => {
    const url = new URL(request.url);

    const prefix = Object.keys(hosts).find(prefix => url.pathname.startsWith(prefix));

    if (!prefix) return;

    const target = hosts[prefix as keyof typeof hosts] + url.pathname.slice(prefix.length) + url.search;
    const extension = url.pathname.split('/').pop()?.split('.').slice(1).pop()?.toLowerCase() || '';
    const type = types[extension];

    const forwarded = new Headers({ accept: request.headers.get('accept') || '*/*' });

    if (request.headers.has('range')) forwarded.set('range', request.headers.get('range')!);

    let upstream: Response;

    try {
        upstream = await fetch(target, { headers: forwarded });
    } catch {
        return new Response('Asset host unreachable', { status: 502 });
    }

    if (!upstream.ok) return new Response(null, { status: upstream.status });

    const headers = new Headers({
        'content-type': type || upstream.headers.get('content-type') || 'application/octet-stream',
        'cache-control': 'public, max-age=3600'
    });

    if (upstream.headers.has('content-range')) headers.set('content-range', upstream.headers.get('content-range')!);

    if (type?.startsWith('text/html')) return new Response((await upstream.text()) + inject, {
        status: upstream.status,
        headers
    });

    return new Response(upstream.body, {
        status: upstream.status,
        headers
    });
};

export const config = {
    path: '/cdn/*'
};
