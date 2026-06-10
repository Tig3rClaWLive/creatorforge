import {
  json,
  currentUser,
  id,
  now,
  clean,
  slugFile,
  allowedTypes,
} from './_utils';

export const onRequestPost = async ({ request, env }) => {
  const user = await currentUser(request, env);

  if (!user) {
    return json({ error: 'Bitte zuerst einloggen.' }, 401);
  }

  const fd = await request.formData();

  if (!fd.get('rights')) {
    return json({ error: 'Rechtebestätigung fehlt.' }, 400);
  }

  const file = fd.get('file') as File | null;

  if (!file) {
    return json({ error: 'Datei fehlt.' }, 400);
  }

  if (file.size > 50 * 1024 * 1024) {
    return json({ error: 'Maximal 50 MB pro Upload.' }, 400);
  }

  if (file.type && !allowedTypes.includes(file.type)) {
    return json({ error: 'Dateityp nicht erlaubt.' }, 400);
  }

  const title = clean(fd.get('title'), 120);

  if (!title) {
    return json({ error: 'Titel fehlt.' }, 400);
  }

  const uploadId = id();
  const originalFilename = clean(file.name, 255);
  const mimeType = file.type || 'application/octet-stream';
  const key = `uploads/${user.id}/${uploadId}/${slugFile(originalFilename)}`;

  await env.R2.put(key, file.stream(), {
    httpMetadata: {
      contentType: mimeType,
    },
  });

  let previewKey = '';
  const preview = fd.get('preview') as File | null;

  if (preview && preview.size > 0) {
    if (!['image/png', 'image/jpeg', 'image/webp'].includes(preview.type)) {
      return json({ error: 'Vorschau nur PNG/JPG/WEBP.' }, 400);
    }

    if (preview.size > 5 * 1024 * 1024) {
      return json({ error: 'Vorschau maximal 5 MB.' }, 400);
    }

    previewKey = `previews/${user.id}/${uploadId}/${slugFile(preview.name)}`;

    await env.R2.put(previewKey, preview.stream(), {
      httpMetadata: {
        contentType: preview.type,
      },
    });
  }

  await env.DB.prepare(
    `INSERT INTO uploads (
      id,
      user_id,
      title,
      description,
      category,
      tags,
      file_key,
      preview_key,
      original_filename,
      mime_type,
      status,
      downloads,
      created_at,
      updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  )
    .bind(
      uploadId,
      user.id,
      title,
      clean(fd.get('description'), 1500),
      clean(fd.get('category'), 80) || 'Sonstiges',
      clean(fd.get('tags'), 300),
      key,
      previewKey,
      originalFilename,
      mimeType,
      'pending',
      0,
      now(),
      now()
    )
    .run();

  return json({ message: 'Upload gespeichert und wartet auf Freigabe.' });
};
