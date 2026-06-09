import { json,currentUser,now,id,clean } from '../_utils';

export const onRequestPost = async ({request,env})=>{
  const u=await currentUser(request,env);
  if(!u||!['admin','moderator'].includes(u.role))return json({error:'Keine Adminrechte.'},403);

  const b=await request.json<any>();
  const action=clean(b.action,20);
  if(!['approve','reject'].includes(action)) return json({error:'Ungültige Aktion.'},400);

  const status=action==='approve'?'approved':'rejected';
  const reason=action==='reject'?clean(b.reason || 'Durch Moderation abgelehnt',500):'';

  await env.DB.prepare('UPDATE uploads SET status=?, rejection_reason=?, updated_at=? WHERE id=?')
    .bind(status,reason,now(),clean(b.id,80))
    .run();

  await env.DB.prepare('INSERT INTO admin_logs (id,admin_user_id,action,target_id,message,created_at) VALUES (?,?,?,?,?,?)')
    .bind(id(),u.id,action,clean(b.id,80),reason,now())
    .run();

  return json({message:status==='approved'?'Upload freigegeben.':'Upload abgelehnt.'});
};
