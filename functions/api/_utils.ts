export interface Env { DB: any; R2: any; }
export const json=(data:any,status=200,headers:HeadersInit={})=>new Response(JSON.stringify(data),{status,headers:{'content-type':'application/json',...headers}});
export const now=()=>new Date().toISOString();
export const id=()=>crypto.randomUUID();
const enc=new TextEncoder();
const b64=(buf:ArrayBuffer)=>btoa(String.fromCharCode(...new Uint8Array(buf)));
const fromB64=(s:string)=>Uint8Array.from(atob(s),c=>c.charCodeAt(0));
export async function hashPassword(password:string){const salt=crypto.getRandomValues(new Uint8Array(16)); const key=await crypto.subtle.importKey('raw',enc.encode(password),'PBKDF2',false,['deriveBits']); const bits=await crypto.subtle.deriveBits({name:'PBKDF2',salt,iterations:100000,hash:'SHA-256'},key,256); return `pbkdf2$${b64(salt.buffer)}$${b64(bits)}`;}
export async function verifyPassword(password:string,stored:string){const [alg,saltB,hashB]=stored.split('$'); if(alg!=='pbkdf2') return false; const salt=fromB64(saltB); const key=await crypto.subtle.importKey('raw',enc.encode(password),'PBKDF2',false,['deriveBits']); const bits=await crypto.subtle.deriveBits({name:'PBKDF2',salt,iterations:100000,hash:'SHA-256'},key,256); return b64(bits)===hashB;}
export function cookie(req:Request,name:string){const c=req.headers.get('cookie')||''; return c.split(';').map(x=>x.trim()).find(x=>x.startsWith(name+'='))?.split('=')[1];}
export async function currentUser(req:Request,env:Env){const token=cookie(req,'cf_session'); if(!token)return null; const row=await env.DB.prepare('SELECT users.* FROM sessions JOIN users ON users.id=sessions.user_id WHERE sessions.id=? AND sessions.expires_at>?').bind(token,now()).first<any>(); return row||null;}
export async function createSession(env:Env,userId:string){const sid=id(); const exp=new Date(Date.now()+1000*60*60*24*30).toISOString(); await env.DB.prepare('INSERT INTO sessions (id,user_id,created_at,expires_at) VALUES (?,?,?,?)').bind(sid,userId,now(),exp).run(); return sid;}
export const sessionHeader=(sid:string)=>({'set-cookie':`cf_session=${sid}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=2592000`});
