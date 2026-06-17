import { json, currentUser, clean, now } from './_utils';

export const onRequestPost = async ({ request, env }) => {
  const user = await currentUser(request, env);

  if (!user) {
    return json({ error: 'Bitte einloggen.' }, 401);
  }

  const body = await request.json();

  const uploadId = clean(body.id, 80);
  const title = clean(body.title, 120);
  const description = clean(body.description, 1500);
  const category = clean(body.category, 80) || 'Sonstiges';
  const tags = clean(body.tags, 300);

  if (!uploadId) {
    return json({ error: 'Upload fehlt.' }, 400);
  }

  if (!title) {
    return json({ error: 'Titel fehlt.' }, 400);
  }

  const upload = await env.DB.prepare(
    'SELECT id, user_id FROM uploads WHERE id=?'
  )
    .bind(uploadId)
    .first<any>();

  if (!upload) {
    return json({ error: 'Upload nicht gefunden.' }, 404);
  }

  if (upload.user_id !== user.id) {
    return json({ error: 'Du darfst diesen Upload nicht bearbeiten.' }, 403);
  }

  await env.DB.prepare(
    `UPDATE uploads
     SET title=?,
         description=?,
         category=?,
         tags=?,
         status='pending',
         rejection_reason='',
         updated_at=?
     WHERE id=?`
  )
    .bind(title, description, category, tags, now(), uploadId)
    .run();

  return json({
    message: 'Upload wurde gespeichert und wartet erneut auf Freigabe.',
  });
};