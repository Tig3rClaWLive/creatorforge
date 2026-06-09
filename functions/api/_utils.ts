export interface Env { DB: any; R2: any; }

export const json = (data:any, status=200, headers:HeadersInit={}) =>
  new Response(JSON.stringify(data), { status, headers: { 'content-type':'application/json; charset=utf-8', ...headers } });

export const now = () => new Date().toISOString();
export const id = () => crypto.randomUUID();

const enc = new TextEncoder();
const b64 = (buf:ArrayBuffer) => btoa(String.fromCharCode(...new Uint8Array(buf)));
const fromB64 = (s:string) => Uint8Array.from(atob(s), c => c.charCodeAt(0));

export function clean(s:any, max=500){ return String(s ?? '').trim().slice(0,max); }
export function slugFile(name:string){ return name.replace(/[^a-zA-Z0-9._-]/g,'_').slice(0,120); }

export async function hashPassword(password:string){
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const key = await crypto.subtle.importKey('raw', enc.encode(password), 'PBKDF2', false, ['deriveBits']);
  const bits = await crypto.subtle.deriveBits({ name:'PBKDF2', salt, iterations:120000, hash:'SHA-256' }, key, 256);
  return `pbkdf2$${b64(salt.buffer)}$${b64(bits)}`;
}

export async function verifyPassword(password:string, stored:string){
  const [alg, saltB, hashB] = String(stored||'').split('$');
  if (alg !== 'pbkdf2' || !saltB || !hashB) return false;
  const salt = fromB64(saltB);
  const key = await crypto.subtle.importKey('raw', enc.encode(password), 'PBKDF2', false, ['deriveBits']);
  const bits = await crypto.subtle.deriveBits({ name:'PBKDF2', salt, iterations:120000, hash:'SHA-256' }, key, 256);
  return b64(bits) === hashB;
}

export function cookie(req:Request, name:string){
  const c = req.headers.get('cookie') || '';
  return c.split(';').map(x => x.trim()).find(x => x.startsWith(name + '='))?.split('=').slice(1).join('=');
}

export async function currentUser(req:Request, env:Env){
  const token = cookie(req, 'cf_session');
  if (!token) return null;
  const row = await env.DB.prepare('SELECT users.* FROM sessions JOIN users ON users.id=sessions.user_id WHERE sessions.id=? AND sessions.expires_at>?').bind(token, now()).first<any>();
  return row || null;
}

export async function requireAdmin(req:Request, env:Env){
  const u = await currentUser(req, env);
  if (!u || !['admin','moderator'].includes(u.role)) return null;
  return u;
}

export async function createSession(env:Env, userId:string){
  const sid = id();
  const exp = new Date(Date.now() + 1000*60*60*24*30).toISOString();
  await env.DB.prepare('INSERT INTO sessions (id,user_id,created_at,expires_at) VALUES (?,?,?,?)').bind(sid, userId, now(), exp).run();
  return sid;
}

export const sessionHeader = (sid:string) => ({ 'set-cookie': `cf_session=${sid}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=2592000` });
export const clearSessionHeader = () => ({ 'set-cookie': 'cf_session=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0' });
export const allowedTypes = ['application/zip','application/x-zip-compressed','image/png','image/jpeg','image/webp','video/webm','video/mp4'];

const PLATFORM_HOSTS: Record<string, string[]> = {
  twitch: ['twitch.tv', 'www.twitch.tv'],
  tiktok: ['tiktok.com', 'www.tiktok.com', 'vm.tiktok.com'],
  youtube: ['youtube.com', 'www.youtube.com', 'm.youtube.com', 'youtu.be'],
  kick: ['kick.com', 'www.kick.com'],
  discord: ['discord.gg', 'discord.com', 'www.discord.com'],
  donation_url: [
    'streamelements.com', 'www.streamelements.com',
    'streamlabs.com', 'www.streamlabs.com',
    'ko-fi.com', 'www.ko-fi.com',
    'paypal.me', 'www.paypal.me',
    'buymeacoffee.com', 'www.buymeacoffee.com',
    'patreon.com', 'www.patreon.com',
    'tipeeestream.com', 'www.tipeeestream.com'
  ],
};

export function validatePlatformUrl(platform:string, value:any){
  const raw = clean(value, 300);
  if (!raw) return '';

  let u: URL;
  try {
    u = new URL(raw);
  } catch {
    throw new Error(`${platformLabel(platform)} muss ein vollständiger Link mit https:// sein.`);
  }

  if (u.protocol !== 'https:') {
    throw new Error(`${platformLabel(platform)} muss mit https:// beginnen.`);
  }

  const host = u.hostname.toLowerCase();
  const allowed = PLATFORM_HOSTS[platform] || [];
  if (!allowed.includes(host)) {
    throw new Error(`${platformLabel(platform)} erlaubt nur passende Links. Eingetragen war: ${host}`);
  }

  if (['twitch','tiktok','kick'].includes(platform) && u.pathname.replace(/\/+$/,'').split('/').filter(Boolean).length < 1) {
    throw new Error(`${platformLabel(platform)} braucht einen Profil-Link, nicht nur die Startseite.`);
  }

  if (platform === 'youtube') {
    const p = u.pathname.toLowerCase();
    const ok = host === 'youtu.be' || p.startsWith('/@') || p.startsWith('/c/') || p.startsWith('/channel/') || p.startsWith('/user/');
    if (!ok) throw new Error('YouTube braucht einen Kanal-Link, zum Beispiel https://youtube.com/@deinname.');
  }

  if (platform === 'discord') {
    const p = u.pathname.toLowerCase();
    const ok = host === 'discord.gg' || p.startsWith('/invite/');
    if (!ok) throw new Error('Discord braucht einen Einladungslink, zum Beispiel https://discord.gg/deincode.');
  }

  return u.toString();
}

function platformLabel(platform:string){
  const labels: Record<string,string> = {
    twitch: 'Twitch',
    tiktok: 'TikTok',
    youtube: 'YouTube',
    kick: 'Kick',
    discord: 'Discord',
    donation_url: 'Spendenlink',
  };
  return labels[platform] || platform;
}
