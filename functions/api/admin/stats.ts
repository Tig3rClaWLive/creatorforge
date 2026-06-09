import { json, requireAdmin } from '../_utils';

export const onRequestGet = async ({request, env}) => {
  const u=await requireAdmin(request,env);
  if(!u) return json({error:'Keine Adminrechte.'},403);

  const totalUploads=await env.DB.prepare('SELECT COUNT(*) AS count FROM uploads').first<any>();
  const pendingUploads=await env.DB.prepare("SELECT COUNT(*) AS count FROM uploads WHERE status='pending'").first<any>();
  const approvedUploads=await env.DB.prepare("SELECT COUNT(*) AS count FROM uploads WHERE status='approved'").first<any>();
  const rejectedUploads=await env.DB.prepare("SELECT COUNT(*) AS count FROM uploads WHERE status='rejected'").first<any>();
  const users=await env.DB.prepare('SELECT COUNT(*) AS count FROM users').first<any>();
  const downloads=await env.DB.prepare('SELECT COALESCE(SUM(downloads),0) AS count FROM uploads').first<any>();
  const reports=await env.DB.prepare('SELECT COUNT(*) AS count FROM reports').first<any>();

  return json({
    stats:{
      totalUploads:totalUploads?.count||0,
      pendingUploads:pendingUploads?.count||0,
      approvedUploads:approvedUploads?.count||0,
      rejectedUploads:rejectedUploads?.count||0,
      users:users?.count||0,
      downloads:downloads?.count||0,
      reports:reports?.count||0,
    }
  });
};
