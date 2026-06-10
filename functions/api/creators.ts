import { json } from './_utils';

export const onRequestGet = async ({ env }) => {
  const r = await env.DB.prepare(`
    SELECT creator_profiles.id,
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
           COALESCE(SUM(uploads.downloads), 0) AS downloads_count,
           COUNT(DISTINCT follows.id) AS followers_count

    FROM creator_profiles

    LEFT JOIN uploads
      ON uploads.user_id = creator_profiles.user_id
     AND uploads.status = 'approved'

    LEFT JOIN follows
      ON follows.creator_user_id = creator_profiles.user_id

    GROUP BY creator_profiles.id

    ORDER BY downloads_count DESC,
             uploads_count DESC,
             creator_profiles.created_at DESC
  `).all();

  return json({
    creators: r.results || [],
  });
};