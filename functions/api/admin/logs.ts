import { json, currentUser } from '../../_utils';

export const onRequestGet = async ({ request, env }) => {
  const user = await currentUser(request, env);

  if (!user || user.role !== 'admin') {
    return json({ error: 'Nur Admins dürfen Logs sehen.' }, 403);
  }

  const r = await env.DB.prepare(
    `SELECT admin_logs.id,
            admin_logs.admin_user_id,
            admin_logs.action,
            admin_logs.target_id,
            admin_logs.message,
            admin_logs.created_at,
            users.email AS admin_email,
            creator_profiles.display_name AS admin_name
     FROM admin_logs
     LEFT JOIN users
       ON users.id = admin_logs.admin_user_id
     LEFT JOIN creator_profiles
       ON creator_profiles.user_id = admin_logs.admin_user_id
     ORDER BY admin_logs.created_at DESC
     LIMIT 300`
  ).all();

  return json({
    logs: r.results || [],
  });
};