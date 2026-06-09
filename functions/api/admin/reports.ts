import { json, requireAdmin } from '../_utils';

export const onRequestGet = async ({request, env}) => {
  const u=await requireAdmin(request,env);
  if(!u) return json({error:'Keine Adminrechte.'},403);

  const r=await env.DB.prepare(`
    SELECT reports.*,
           uploads.id AS upload_id,
           uploads.title AS upload_title,
           uploads.status AS upload_status,
           uploads.category AS upload_category,
           creator_profiles.display_name,
           users.email
    FROM reports
    LEFT JOIN uploads ON uploads.id=reports.upload_id
    LEFT JOIN creator_profiles ON creator_profiles.user_id=uploads.user_id
    LEFT JOIN users ON users.id=uploads.user_id
    ORDER BY reports.created_at DESC
    LIMIT 200
  `).all();

  return json({reports:r.results||[]});
};
