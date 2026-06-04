import { json,id,now,hashPassword,createSession,sessionHeader,clean } from './_utils';
export const onRequestPost = async ({request,env})=>{
  const b=await request.json<any>();
  const email=clean(b.email,180).toLowerCase(); const pass=String(b.password||''); const name=clean(b.display_name,80);
  if(!email.includes('@')||pass.length<8||!name) return json({error:'Bitte E-Mail, Passwort ab 8 Zeichen und Creator-Name ausfüllen.'},400);
  const exists=await env.DB.prepare('SELECT id FROM users WHERE email=?').bind(email).first(); if(exists) return json({error:'E-Mail ist bereits registriert.'},400);
  const uid=id(); await env.DB.prepare('INSERT INTO users (id,email,password_hash,role,created_at) VALUES (?,?,?,?,?)').bind(uid,email,await hashPassword(pass),'creator',now()).run();
  await env.DB.prepare('INSERT INTO creator_profiles (id,user_id,display_name,bio,twitch,tiktok,youtube,kick,discord,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?)').bind(id(),uid,name,'','','','','','',now(),now()).run();
  const sid=await createSession(env,uid); return json({message:'Account erstellt.'},200,sessionHeader(sid));
};
