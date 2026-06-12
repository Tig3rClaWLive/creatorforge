import { json, currentUser, id, now, clean } from './_utils';

export const onRequestPost = async ({ request, env }) => {
  const user = await currentUser(request, env);

  if (!user) {
    return json({ error: 'Bitte einloggen.' }, 401);
  }

  const body = await request.json();
  const uploadId = clean(body.upload_id, 80);

  if (!uploadId) {
    return json({ error: 'Upload fehlt.' }, 400);
  }

  const upload = await env.DB.prepare(
    "SELECT id FROM uploads WHERE id=? AND status='approved'"
  )
    .bind(uploadId)
    .first();

  if (!upload) {
    return json({ error: 'Upload nicht gefunden.' }, 404);
  }

  const existing = await env.DB.prepare(
    `SELECT id
     FROM favorites
     WHERE user_id=?
       AND upload_id=?`
  )
    .bind(user.id, uploadId)
    .first();

  if (existing) {
    await env.DB.prepare(
      `DELETE FROM favorites
       WHERE user_id=?
         AND upload_id=?`
    )
      .bind(user.id, uploadId)
      .run();

    return json({
      favorite: false,
      message: 'Favorit entfernt.',
    });
  }

  await env.DB.prepare(
    `INSERT INTO favorites
      (id, user_id, upload_id, created_at)
     VALUES (?, ?, ?, ?)`
  )
    .bind(id(), user.id, uploadId, now())
    .run();

  return json({
    favorite: true,
    message: 'Favorit gespeichert.',
  });
};