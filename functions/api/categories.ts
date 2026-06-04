import { json } from './_utils';
export const onRequestGet = async ({env}) => { const r=await env.DB.prepare('SELECT * FROM categories ORDER BY name ASC').all(); return json({categories:r.results||[]}); };
