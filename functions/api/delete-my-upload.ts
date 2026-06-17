import { json, currentUser, clean } from './_utils';

export const onRequestPost = async ({ request, env }) => {
  const user = await currentUser(request, env);

  if (!user) {
    return json({ error: 'Bitte einloggen.' }, 401);
  }

  const body = await request.json();
  const uploadId = clean(body.id, 80);

  if (!uploadId) {
    return json({ error: 'Upload fehlt.' }, 400);
  }

  const upload = await env.DB.prepare(
    'SELECT * FROM uploads WHERE id=? AND user_id=?'
  )
    .bind(uploadId, user.id)
    .first<any>();

  if (!upload) {
    return json({ error: 'Upload nicht gefunden oder keine Berechtigung.' }, 404);
  }

  if (upload.file_key) {
    await env.R2.delete(upload.file_key);
  }

  if (upload.preview_key) {
    await env.R2.delete(upload.preview_key);
  }

  await env.DB.prepare('DELETE FROM reports WHERE upload_id=?')
    .bind(uploadId)
    .run();

  await env.DB.prepare('DELETE FROM favorites WHERE upload_id=?')
    .bind(uploadId)
    .run();

  await env.DB.prepare('DELETE FROM uploads WHERE id=?')
    .bind(uploadId)
    .run();

  return json({
    message: 'Upload wurde gelöscht.',
  });
};