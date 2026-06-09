import { json, requireAdmin, clean } from '../_utils';

export const onRequestGet = async ({request, env}) => {
  const admin = await requireAdmin(request, env);
  if (!admin) return json({error:'Keine Adminrechte.'},403);

  const url = new URL(request.url);
  const status = clean(url.searchParams.get('status'), 20);
  const q = `%${clean(url.searchParams.get('q'), 100)}%`;

  let stmt;
  if (status && ['pending','approved','rejected'].includes(status)) {
    stmt = env.DB.prepare(`
      SELECT uploads.*, creator_profiles.display_name, users.email,
             COUNT(reports.id) AS reports_count
      FROM uploads
      LEFT JOIN creator_profiles ON creator_profiles.user_id = uploads.user_id
      LEFT JOIN users ON users.id = uploads.user_id
      LEFT JOIN reports ON reports.upload_id = uploads.id
      WHERE uploads.status = ?
        AND (uploads.title LIKE ? OR uploads.description LIKE ? OR uploads.category LIKE ? OR users.email LIKE ? OR creator_profiles.display_name LIKE ?)
      GROUP BY uploads.id
      ORDER BY uploads.created_at DESC
      LIMIT 200
    `).bind(status, q, q, q, q, q);
  } else {
    stmt = env.DB.prepare(`
      SELECT uploads.*, creator_profiles.display_name, users.email,
             COUNT(reports.id) AS reports_count
      FROM uploads
      LEFT JOIN creator_profiles ON creator_profiles.user_id = uploads.user_id
      LEFT JOIN users ON users.id = uploads.user_id
      LEFT JOIN reports ON reports.upload_id = uploads.id
      WHERE uploads.title LIKE ? OR uploads.description LIKE ? OR uploads.category LIKE ? OR users.email LIKE ? OR creator_profiles.display_name LIKE ?
      GROUP BY uploads.id
      ORDER BY uploads.created_at DESC
      LIMIT 200
    `).bind(q, q, q, q, q);
  }

  const r = await stmt.all();
  return json({uploads:r.results||[]});
};
