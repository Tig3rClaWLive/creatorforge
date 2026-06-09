import { json,currentUser,now,clean,validatePlatformUrl } from './_utils';

export const onRequestPost = async ({request,env})=>{
  const u=await currentUser(request,env);
  if(!u)return json({error:'Nicht eingeloggt.'},401);

  try {
    const b=await request.json<any>();
    const twitch=validatePlatformUrl('twitch', b.twitch);
    const tiktok=validatePlatformUrl('tiktok', b.tiktok);
    const youtube=validatePlatformUrl('youtube', b.youtube);
    const kick=validatePlatformUrl('kick', b.kick);
    const discord=validatePlatformUrl('discord', b.discord);
    const donation=validatePlatformUrl('donation_url', b.donation_url);

    await env.DB.prepare('UPDATE creator_profiles SET display_name=?, bio=?, twitch=?, tiktok=?, youtube=?, kick=?, discord=?, donation_url=?, updated_at=? WHERE user_id=?')
      .bind(clean(b.display_name,80),clean(b.bio,1000),twitch,tiktok,youtube,kick,discord,donation,now(),u.id)
      .run();

    return json({message:'Profil gespeichert.'});
  } catch (err:any) {
    return json({error:String(err?.message || err)},400);
  }
};
