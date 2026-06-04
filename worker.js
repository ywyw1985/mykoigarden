export default {
  async fetch(request, env) {
    const response = await env.ASSETS.fetch(request);
    const headers = new Headers(response.headers);
    const url = new URL(request.url);
    const pathname = url.pathname;

    if (pathname.endsWith("/") || pathname.endsWith(".html")) {
      headers.set("Content-Type", "text/html; charset=utf-8");
    } else if (pathname.endsWith(".css")) {
      headers.set("Content-Type", "text/css; charset=utf-8");
    } else if (pathname.endsWith(".js")) {
      headers.set("Content-Type", "application/javascript; charset=utf-8");
    } else if (pathname.endsWith(".xml")) {
      headers.set("Content-Type", "application/xml; charset=utf-8");
    } else if (pathname.endsWith(".txt")) {
      headers.set("Content-Type", "text/plain; charset=utf-8");
    }

    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers,
    });
  },
};
