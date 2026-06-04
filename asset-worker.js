export default {
  async fetch(request, env) {
    const response = await env.ASSETS.fetch(request);
    const url = new URL(request.url);
    const headers = new Headers(response.headers);

    if (url.pathname.endsWith("/") || url.pathname.endsWith(".html")) {
      headers.set("Content-Type", "text/html; charset=utf-8");
    } else if (url.pathname.endsWith(".css")) {
      headers.set("Content-Type", "text/css; charset=utf-8");
    } else if (url.pathname.endsWith(".js")) {
      headers.set("Content-Type", "application/javascript; charset=utf-8");
    } else if (url.pathname.endsWith(".xml")) {
      headers.set("Content-Type", "application/xml; charset=utf-8");
    }

    headers.set("X-MKG-Worker", "asset-only-20260604-1939");

    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers,
    });
  },
};
