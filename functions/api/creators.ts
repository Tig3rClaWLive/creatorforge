import { Env,json } from './_utils';
export const onRequestGet = async ({env})=>{const r=await env.DB.prepare('SELECT id,display_name,bio,twitch,tiktok,youtube,kick,discord FROM creator_profiles ORDER BY created_at DESC').all(); return json({creators:r.results||[]});}
