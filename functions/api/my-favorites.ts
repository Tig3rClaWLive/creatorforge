import { json, currentUser } from './_utils';

export const onRequestGet = async ({ request, env }) => {
  const user = await currentUser(request, env);

  if (!user) {
    return json({ error: 'Bitte einloggen.' }, 401);
  }

  const r = await env.DB.prepare(
    `SELECT uploads.id,
            uploads.title,
            uploads.description,
            uploads.category,
            uploads.tags,
            uploads.downloads,
            uploads.preview_key,
            uploads.created_at,
            creator_profiles.display_name,
            favorites.created_at AS favorited_at
     FROM favorites
     JOIN uploads
       ON uploads.id = favorites.upload_id
      AND uploads.status = 'approved'
     LEFT JOIN creator_profiles
       ON creator_profiles.user_id = uploads.user_id
     WHERE favorites.user_id = ?
     ORDER BY favorites.created_at DESC`
  )
    .bind(user.id)
    .all();

  return json({
    favorites: r.results || [],
  });
};