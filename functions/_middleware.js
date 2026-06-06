export async function onRequest(context) {
  const url = new URL(context.request.url);

  if (url.pathname === "/api/ping") {
    return new Response(JSON.stringify({ ok: true, message: "Middleware API läuft" }), {
      headers: { "content-type": "application/json" },
    });
  }

  return context.next();
}