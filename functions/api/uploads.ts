import { Env,json } from './_utils';
export const onRequestGet = async ({env})=>{const r=await env.DB.prepare("SELECT id,title,description,category,tags,downloads,created_at FROM uploads WHERE status='approved' ORDER BY created_at DESC").all(); return json({uploads:r.results||[]});}
