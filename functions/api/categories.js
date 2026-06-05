export async function onRequestGet({ env }) {
  const r = await env.DB.prepare('SELECT * FROM categories ORDER BY name ASC').all();
  return new Response(JSON.stringify({ categories: r.results || [] }), {
    headers: { "content-type": "application/json" },
  });
}