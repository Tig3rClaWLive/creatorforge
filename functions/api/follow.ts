import { json, currentUser, id, now, clean } from './_utils';

export const onRequestPost = async ({ request, env }) => {
  const user = await currentUser(request, env);

  if (!user) {
    return json({ error: 'Bitte einloggen.' }, 401);
  }

  const body = await request.json();
  const creatorId = clean(body.creator_id, 80);

  if (!creatorId) {
    return json({ error: 'Creator fehlt.' }, 400);
  }

  if (creatorId === user.id) {
    return json({ error: 'Du kannst dir nicht selbst folgen.' }, 400);
  }

  const creator = await env.DB.prepare(
    'SELECT user_id FROM creator_profiles WHERE user_id=?'
  )
    .bind(creatorId)
    .first();

  if (!creator) {
    return json({ error: 'Creator nicht gefunden.' }, 404);
  }

  const existing = await env.DB.prepare(
    `SELECT id
     FROM follows
     WHERE follower_user_id=?
       AND creator_user_id=?`
  )
    .bind(user.id, creatorId)
    .first();

  if (existing) {
    await env.DB.prepare(
      `DELETE FROM follows
       WHERE follower_user_id=?
         AND creator_user_id=?`
    )
      .bind(user.id, creatorId)
      .run();

    return json({
      following: false,
      message: 'Creator entfolgt.',
    });
  }

  await env.DB.prepare(
    `INSERT INTO follows
      (id, follower_user_id, creator_user_id, created_at)
     VALUES (?, ?, ?, ?)`
  )
    .bind(id(), user.id, creatorId, now())
    .run();

  return json({
    following: true,
    message: 'Creator gefolgt.',
  });
};