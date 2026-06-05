export async function onRequest() {
  return new Response(JSON.stringify({ ok: true, message: "CreatorForge API läuft" }), {
    headers: { "content-type": "application/json" },
  });
}