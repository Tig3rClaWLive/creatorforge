import { json,currentUser } from './_utils';
export const onRequestGet = async ({request,env})=>{const u=await currentUser(request,env); if(!u)return json({error:'Nicht eingeloggt.'},401); const p=await env.DB.prepare('SELECT * FROM creator_profiles WHERE user_id=?').bind(u.id).first(); return json({id:u.id,email:u.email,role:u.role,profile:p});};
