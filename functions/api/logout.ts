import { json, cookie, clearSessionHeader } from './_utils';
export const onRequestPost = async ({request, env}) => { const sid=cookie(request,'cf_session'); if(sid) await env.DB.prepare('DELETE FROM sessions WHERE id=?').bind(sid).run(); return json({message:'Ausgeloggt.'},200,clearSessionHeader()); };
