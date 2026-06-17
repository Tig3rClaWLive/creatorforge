import { json, clean } from './_utils';

export const onRequestGet = async ({ request, env }) => {
  const url = new URL(request.url);
  const userId = clean(url.searchParams.get('id'), 80);

  if (!userId) {
    return json({ error: 'Creator fehlt.' }, 400);
  }

  const creator = await env.DB.prepare(
    `SELECT creator_profiles.id,
            creator_profiles.user_id,
            creator_profiles.display_name,
            creator_profiles.verified,
            creator_profiles.bio,
            creator_profiles.twitch,
            creator_profiles.tiktok,
            creator_profiles.youtube,
            creator_profiles.kick,
            creator_profiles.discord,
            creator_profiles.donation_url,
            creator_profiles.avatar_url,
            creator_profiles.banner_url,
            COUNT(DISTINCT uploads.id) AS uploads_count,
            (
              SELECT COALESCE(SUM(u2.downloads), 0)
              FROM uploads u2
              WHERE u2.user_id = creator_profiles.user_id
                AND u2.status = 'approved'
            ) AS downloads_count,
            COUNT(DISTINCT follows.id) AS followers_count
     FROM creator_profiles
     LEFT JOIN uploads
       ON uploads.user_id = creator_profiles.user_id
      AND uploads.status = 'approved'
     LEFT JOIN follows
       ON follows.creator_user_id = creator_profiles.user_id
     WHERE creator_profiles.user_id = ?
     GROUP BY creator_profiles.id`
  )
    .bind(userId)
    .first();

  if (!creator) {
    return json({ error: 'Creator nicht gefunden.' }, 404);
  }

  const uploads = await env.DB.prepare(
    `SELECT uploads.id,
            uploads.title,
            uploads.description,
            uploads.category,
            uploads.tags,
            uploads.downloads,
            uploads.preview_key,
            uploads.created_at
     FROM uploads
     WHERE uploads.user_id = ?
       AND uploads.status = 'approved'
     ORDER BY uploads.created_at DESC`
  )
    .bind(userId)
    .all();

  return json({
    creator,
    uploads: uploads.results || [],
  });
};