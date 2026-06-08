const json = (data, status = 200, headers = {}) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json; charset=utf-8", ...headers },
  });

const now = () => new Date().toISOString();
const id = () => crypto.randomUUID();
const enc = new TextEncoder();

const b64 = (buf) => btoa(String.fromCharCode(...new Uint8Array(buf)));
const fromB64 = (s) => Uint8Array.from(atob(s), (c) => c.charCodeAt(0));
const clean = (s, max = 500) => String(s ?? "").trim().slice(0, max);

async function hashPassword(password) {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const key = await crypto.subtle.importKey("raw", enc.encode(password), "PBKDF2", false, ["deriveBits"]);
  const bits = await crypto.subtle.deriveBits({ name: "PBKDF2", salt, iterations: 100000, hash: "SHA-256" }, key, 256);
  return `pbkdf2$${b64(salt.buffer)}$${b64(bits)}`;
}

async function verifyPassword(password, stored) {
  const [alg, saltB, hashB] = String(stored || "").split("$");
  if (alg !== "pbkdf2" || !saltB || !hashB) return false;
  const salt = fromB64(saltB);
  const key = await crypto.subtle.importKey("raw", enc.encode(password), "PBKDF2", false, ["deriveBits"]);
  const bits = await crypto.subtle.deriveBits({ name: "PBKDF2", salt, iterations: 100000, hash: "SHA-256" }, key, 256);
  return b64(bits) === hashB;
}

function getCookie(req, name) {
  const c = req.headers.get("cookie") || "";
  return c
    .split(";")
    .map((x) => x.trim())
    .find((x) => x.startsWith(name + "="))
    ?.split("=")
    .slice(1)
    .join("=");
}

async function createSession(env, userId) {
  const sid = id();
  const exp = new Date(Date.now() + 1000 * 60 * 60 * 24 * 30).toISOString();

  await env.DB.prepare("INSERT INTO sessions (id,user_id,created_at,expires_at) VALUES (?,?,?,?)")
    .bind(sid, userId, now(), exp)
    .run();

  return sid;
}

async function currentUser(req, env) {
  const token = getCookie(req, "cf_session");
  if (!token) return null;

  return await env.DB.prepare(
    `SELECT users.id, users.email, users.role, users.created_at
     FROM sessions
     JOIN users ON users.id = sessions.user_id
     WHERE sessions.id = ? AND sessions.expires_at > ?`
  )
    .bind(token, now())
    .first();
}

const sessionHeader = (sid) => ({
  "set-cookie": `cf_session=${sid}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=2592000`,
});

const clearSessionHeader = () => ({
  "set-cookie": "cf_session=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0",
});

export async function onRequest(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const path = url.pathname;

  try {
    if (path === "/api/ping") {
      return json({ ok: true, message: "CreatorForge API läuft" });
    }

    if (path === "/api/register" && request.method === "POST") {
      const b = await request.json();
      const email = clean(b.email, 180).toLowerCase();
      const pass = String(b.password || "");
      const name = clean(b.display_name, 80);

      if (!email.includes("@") || pass.length < 8 || !name) {
        return json({ error: "Bitte E-Mail, Passwort ab 8 Zeichen und Creator-Name ausfüllen." }, 400);
      }

      const exists = await env.DB.prepare("SELECT id FROM users WHERE email=?").bind(email).first();
      if (exists) return json({ error: "E-Mail ist bereits registriert." }, 400);

      const uid = id();

      await env.DB.prepare("INSERT INTO users (id,email,password_hash,role,created_at) VALUES (?,?,?,?,?)")
        .bind(uid, email, await hashPassword(pass), "creator", now())
        .run();

      await env.DB.prepare(
        "INSERT INTO creator_profiles (id,user_id,display_name,bio,twitch,tiktok,youtube,kick,discord,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?)"
      )
        .bind(id(), uid, name, "", "", "", "", "", "", now(), now())
        .run();

      const sid = await createSession(env, uid);
      return json({ message: "Account erstellt." }, 200, sessionHeader(sid));
    }

    if (path === "/api/login" && request.method === "POST") {
      const b = await request.json();
      const email = clean(b.email, 180).toLowerCase();
      const pass = String(b.password || "");

      const user = await env.DB.prepare("SELECT * FROM users WHERE email=?").bind(email).first();

      if (!user || !(await verifyPassword(pass, user.password_hash))) {
        return json({ error: "Login fehlgeschlagen." }, 401);
      }

      const sid = await createSession(env, user.id);
      return json({ message: "Login erfolgreich." }, 200, sessionHeader(sid));
    }

    if (path === "/api/logout") {
      return json({ message: "Abgemeldet." }, 200, clearSessionHeader());
    }

    if (path === "/api/me") {
      const user = await currentUser(request, env);
      if (!user) return json({ user: null }, 401);

      const profile = await env.DB.prepare("SELECT * FROM creator_profiles WHERE user_id=?")
        .bind(user.id)
        .first();

      return json({ user, profile });
    }

    if (path === "/api/categories") {
      const r = await env.DB.prepare("SELECT * FROM categories ORDER BY name ASC").all();
      return json({ categories: r.results || [] });
    }

    if (path === "/api/creators") {
      const r = await env.DB.prepare(
        `SELECT creator_profiles.id,
                creator_profiles.user_id,
                creator_profiles.display_name,
                creator_profiles.bio,
                creator_profiles.twitch,
                creator_profiles.tiktok,
                creator_profiles.youtube,
                creator_profiles.kick,
                creator_profiles.discord,
                creator_profiles.avatar_url,
                creator_profiles.banner_url,
                COUNT(uploads.id) AS uploads_count
         FROM creator_profiles
         LEFT JOIN uploads
           ON uploads.user_id = creator_profiles.user_id
          AND uploads.status = 'approved'
         GROUP BY creator_profiles.id
         ORDER BY creator_profiles.created_at DESC`
      ).all();

      return json({ creators: r.results || [] });
    }
        if (path === "/api/admin/stats") {
      const user = await currentUser(request, env);

      if (!user || !["admin", "moderator"].includes(user.role)) {
        return json({ error: "Kein Adminzugriff." }, 403);
      }

      const totalUploads = await env.DB.prepare("SELECT COUNT(*) AS count FROM uploads").first();
      const pendingUploads = await env.DB.prepare("SELECT COUNT(*) AS count FROM uploads WHERE status='pending'").first();
      const approvedUploads = await env.DB.prepare("SELECT COUNT(*) AS count FROM uploads WHERE status='approved'").first();
      const rejectedUploads = await env.DB.prepare("SELECT COUNT(*) AS count FROM uploads WHERE status='rejected'").first();
      const users = await env.DB.prepare("SELECT COUNT(*) AS count FROM users").first();
      const downloads = await env.DB.prepare("SELECT COALESCE(SUM(downloads),0) AS count FROM uploads").first();

      return json({
        stats: {
          totalUploads: totalUploads?.count || 0,
          pendingUploads: pendingUploads?.count || 0,
          approvedUploads: approvedUploads?.count || 0,
          rejectedUploads: rejectedUploads?.count || 0,
          users: users?.count || 0,
          downloads: downloads?.count || 0,
        }
      });
    }

    if (path === "/api/admin/pending") {
      const user = await currentUser(request, env);

      if (!user || !["admin", "moderator"].includes(user.role)) {
        return json({ error: "Kein Adminzugriff." }, 403);
      }

      const r = await env.DB.prepare(
        `SELECT uploads.*,
                creator_profiles.display_name,
                users.email
         FROM uploads
         LEFT JOIN creator_profiles
           ON creator_profiles.user_id = uploads.user_id
         LEFT JOIN users
           ON users.id = uploads.user_id
         WHERE uploads.status = 'pending'
         ORDER BY uploads.created_at DESC`
      ).all();

      return json({ uploads: r.results || [] });
    }

    if (path === "/api/admin/users") {
      const user = await currentUser(request, env);

      if (!user || user.role !== "admin") {
        return json({ error: "Nur Admins dürfen Nutzer verwalten." }, 403);
      }

      const r = await env.DB.prepare(
        `SELECT users.id,
                users.email,
                users.role,
                users.created_at,
                creator_profiles.display_name
         FROM users
         LEFT JOIN creator_profiles
           ON creator_profiles.user_id = users.id
         ORDER BY users.created_at DESC`
      ).all();

      return json({ users: r.results || [] });
    }

    if (path === "/api/admin/set-role" && request.method === "POST") {
      const user = await currentUser(request, env);

      if (!user || user.role !== "admin") {
        return json({ error: "Nur Admins dürfen Rollen ändern." }, 403);
      }

      const b = await request.json();
      const targetId = clean(b.id, 80);
      const role = clean(b.role, 20);

      if (!targetId || !["creator", "moderator", "admin"].includes(role)) {
        return json({ error: "Ungültige Rolle." }, 400);
      }

      await env.DB.prepare("UPDATE users SET role=? WHERE id=?")
        .bind(role, targetId)
        .run();

      await env.DB.prepare(
        "INSERT INTO admin_logs (id,admin_user_id,action,target_id,message,created_at) VALUES (?,?,?,?,?,?)"
      )
      .bind(id(), user.id, "set-role", targetId, `Rolle geändert zu ${role}`, now())
      .run();

      return json({ message: "Rolle wurde geändert." });
    }

    if (path === "/api/admin/moderate" && request.method === "POST") {
      const user = await currentUser(request, env);

      if (!user || !["admin", "moderator"].includes(user.role)) {
        return json({ error: "Kein Adminzugriff." }, 403);
      }

      const b = await request.json();
      const uploadId = clean(b.id, 80);
      const action = clean(b.action, 20);

      if (!uploadId || !["approve", "reject", "delete"].includes(action)) {
        return json({ error: "Ungültige Aktion." }, 400);
      }

      const upload = await env.DB.prepare("SELECT * FROM uploads WHERE id=?")
        .bind(uploadId)
        .first();

      if (!upload) {
        return json({ error: "Upload nicht gefunden." }, 404);
      }

      if (action === "delete") {
        if (upload.file_key) {
          await env.R2.delete(upload.file_key);
        }

        if (upload.preview_key) {
          await env.R2.delete(upload.preview_key);
        }

        await env.DB.prepare("DELETE FROM uploads WHERE id=?")
          .bind(uploadId)
          .run();

        await env.DB.prepare(
          "INSERT INTO admin_logs (id,admin_user_id,action,target_id,message,created_at) VALUES (?,?,?,?,?,?)"
        )
        .bind(id(), user.id, "delete-upload", uploadId, "Upload gelöscht", now())
        .run();

        return json({ message: "Upload gelöscht." });
      }

      const status = action === "approve" ? "approved" : "rejected";

      await env.DB.prepare("UPDATE uploads SET status=?, updated_at=? WHERE id=?")
        .bind(status, now(), uploadId)
        .run();

      await env.DB.prepare(
        "INSERT INTO admin_logs (id,admin_user_id,action,target_id,message,created_at) VALUES (?,?,?,?,?,?)"
      )
      .bind(id(), user.id, action, uploadId, `Upload ${status}`, now())
      .run();

      return json({
        message: action === "approve"
          ? "Upload freigegeben."
          : "Upload abgelehnt."
      });
    }
    return context.next();
  } catch (err) {
    return json({ error: "Serverfehler", detail: String(err?.message || err) }, 500);
  }
}