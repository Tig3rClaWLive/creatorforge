import { Env,json,currentUser } from '../_utils';
export const onRequestGet = async ({request,env})=>{const u=await currentUser(request,env); if(!u||!['admin','moderator'].includes(u.role))return json({error:'Keine Adminrechte.'},403); const r=await env.DB.prepare("SELECT * FROM uploads WHERE status='pending' ORDER BY created_at ASC").all(); return json({uploads:r.results||[]});}
