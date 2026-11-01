/**
 * Deploy time configuration. Replaced during the Netlify build when a
 * POLARIS_WISP_URL is set, since a static deploy cannot serve /wisp/ itself.
 *
 * Left as null, the proxy transports fall back to the current origin, which is
 * what a self hosted `npm start` serves.
 */
globalThis.__POLARIS_WISP_URL__ = null;
