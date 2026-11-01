/**
 * Replaces the express /api/favicon route, used by the tab cloaking settings to
 * grab the icon of whatever site the user is pretending to be on.
 */
export default async (request) => {
    const domain = new URL(request.url).searchParams.get('domain');

    if (!domain) return Response.redirect(new URL('/assets/img/logo.png', request.url), 302);

    try {
        const response = await fetch(`https://www.google.com/s2/favicons?domain=${encodeURIComponent(domain)}`);

        if (!response.ok) throw new Error(`Upstream responded ${response.status}`);

        return new Response(await response.arrayBuffer(), {
            headers: {
                'content-type': response.headers.get('content-type') || 'image/png',
                'cache-control': 'public, max-age=86400'
            }
        });
    } catch {
        return Response.redirect(new URL('/assets/img/logo.png', request.url), 302);
    }
};

export const config = {
    path: '/api/favicon'
};
