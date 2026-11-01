<div align="center">
  <img src="https://github.com/Skoolgq/Polaris/assets/93336301/dc994d43-06f4-4947-a15f-226c840f6880" width="600px">

  <h2 style="color: yellow;">Polaris has been deprecated. New updates will not be made but bugs may still be fixed.</h2>
  
  <s><p><a href="https://dsc.gg/skoolworld">Join our Discord server</a></p></s>

  ![Discord](https://img.shields.io/discord/950407933408198717?label=Discord&style=for-the-badge)
  ![Commit activity](https://img.shields.io/github/commit-activity/w/SkoolGQ/Polaris?style=for-the-badge)
  
  <h2>Quick Web Deployment</h2>

[![Deploy to Vercel](https://binbashbanana.github.io/deploy-buttons/buttons/remade/vercel.svg)](https://vercel.com/new/clone?repository-url=https://github.com/Skoolgq/Polaris)
[![Deploy to Koyeb](https://binbashbanana.github.io/deploy-buttons/buttons/remade/koyeb.svg)](https://app.koyeb.com/deploy?type=git&repository=github.com/Skoolgq/Polaris&branch=main&name=Polaris)
[![Deploy to Render](https://binbashbanana.github.io/deploy-buttons/buttons/remade/render.svg)](https://render.com/deploy?repo=https://github.com/Skoolgq/Polaris)
[![Deploy to Cyclic](https://binbashbanana.github.io/deploy-buttons/buttons/remade/cyclic.svg)](https://app.cyclic.sh/api/app/deploy/Skoolgq/Polaris)

  <br>
  <h2>Terminal Deployment</h2>
</div>

> [!NOTE]
> We require a NodeJS version >=18.

1. Clone the repo to your machine: `git clone https://github.com/Skoolgq/Polaris.git && cd Polaris`
2. Install Dependencies: `npm install`
3. Start the app: `npm start`
4. Visit [localhost:8080](http://localhost:8080) for your local Polaris!


<br>

## Netlify Deployment

Netlify serves Polaris as a static site. `npm run build:static` renders the
`templates/` partials into every page, writes the `/api` catalogs as JSON files
and vendors the proxy client into `dist/`, which is what gets published. The
`/cdn` asset host and `/api/favicon` are handled by an edge function and a
function respectively, so no long running server is involved.

One piece cannot move to a static host: the `/wisp/` websocket endpoint that the
Ultraviolet transports tunnel through. Games served from `/cdn` do not need it
and work as-is, but proxying an external site does. Point the deploy at a wisp
server you run elsewhere by setting the `POLARIS_WISP_URL` environment variable,
for example `wss://wisp.example.com/wisp/`.
