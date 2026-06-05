export async function onRequest(context) {
  const url = new URL(context.request.url);
  const path = url.pathname;

  if (path === "/api/categories") {
    return new Response(JSON.stringify({ ok: true, route: "categories", categories: [] }), {
      headers: { "content-type": "application/json" },
    });
  }

  if (path === "/api/creators") {
    return new Response(JSON.stringify({ ok: true, route: "creators", creators: [] }), {
      headers: { "content-type": "application/json" },
    });
  }

  return new Response(JSON.stringify({ ok: false, error: "API Route nicht gefunden", path }), {
    status: 404,
    headers: { "content-type": "application/json" },
  });
}