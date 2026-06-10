import { json, clean } from './_utils';

function safeFilename(name: string) {
  return String(name || 'creatorforge-download')
    .replace(/[\\/:*?"<>|]/g, '_')
    .replace(/\s+/g, '_')
    .slice(0, 180);
}

function extFromMime(type: string) {
  const t = String(type || '').toLowerCase();

  if (t.includes('image/png')) return '.png';
  if (t.includes('image/jpeg')) return '.jpg';
  if (t.includes('image/webp')) return '.webp';
  if (t.includes('image/gif')) return '.gif';
  if (t.includes('application/zip')) return '.zip';
  if (t.includes('application/pdf')) return '.pdf';

  return '';
}

export const onRequestGet = async ({ request, env }) => {
  const url = new URL(request.url);
  const uploadId = clean(url.searchParams.get('id'), 80);

  if (!uploadId) {
    return json({ error: 'ID fehlt.' }, 400);
  }

  const upload = await env.DB.prepare(
    "SELECT * FROM uploads WHERE id=? AND status='approved'"
  )
    .bind(uploadId)
    .first<any>();

  if (!upload) {
    return json({ error: 'Nicht gefunden.' }, 404);
  }

  const obj = await env.R2.get(upload.file_key);

  if (!obj) {
    return json({ error: 'Datei fehlt.' }, 404);
  }

  const contentType =
    upload.mime_type ||
    obj.httpMetadata?.contentType ||
    'application/octet-stream';

  let filename = upload.original_filename || '';

  if (!filename) {
    filename = `${upload.title || 'creatorforge-download'}${extFromMime(contentType)}`;
  }

  filename = safeFilename(filename);

  await env.DB.prepare('UPDATE uploads SET downloads=downloads+1 WHERE id=?')
    .bind(uploadId)
    .run();

  return new Response(obj.body, {
    headers: {
      'Content-Type': contentType,
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Cache-Control': 'private, no-store',
    },
  });
};