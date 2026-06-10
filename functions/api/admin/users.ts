import { json, requireAdmin, clean } from '../_utils';

export const onRequestGet = async ({ request, env }) => {
  const admin = await requireAdmin(request, env);

  if (!admin) {
    return json({ error: 'Keine Adminrechte.' }, 403);
  }

  const r = await env.DB.prepare(
    `SELECT users.id,
            users.email,
            users.role,
            users.created_at,
            creator_profiles.display_name,
            creator_profiles.verified
     FROM users
     LEFT JOIN creator_profiles
       ON creator_profiles.user_id = users.id
     ORDER BY users.created_at DESC
     LIMIT 200`
  ).all();

  return json({
    users: r.results || [],
  });
};

export const onRequestPost = async ({ request, env }) => {
  const admin = await requireAdmin(request, env);

  if (!admin) {
    return json({ error: 'Keine Adminrechte.' }, 403);
  }

  const body = await request.json<any>();
  const userId = clean(body.id, 80);
  const action = clean(body.action, 30);

  if (action === 'set-role') {
    const role = clean(body.role, 20);

    if (!['creator', 'moderator', 'admin'].includes(role)) {
      return json({ error: 'Ungültige Rolle.' }, 400);
    }

    await env.DB.prepare('UPDATE users SET role=? WHERE id=?')
      .bind(role, userId)
      .run();

    return json({ message: 'Rolle gespeichert.' });
  }

  if (action === 'set-verified') {
    const verified = Number(body.verified) ? 1 : 0;

    await env.DB.prepare(
      'UPDATE creator_profiles SET verified=? WHERE user_id=?'
    )
      .bind(verified, userId)
      .run();

    return json({
      message: verified
        ? 'Creator wurde verifiziert.'
        : 'Verifizierung wurde entfernt.',
    });
  }

  return json({ error: 'Unbekannte Aktion.' }, 400);
};