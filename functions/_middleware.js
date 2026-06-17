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

function platformLabel(platform) {
  return {
    twitch: "Twitch",
    tiktok: "TikTok",
    youtube: "YouTube",
    kick: "Kick",
    discord: "Discord",
    donation_url: "Spendenlink",
  }[platform] || platform;
}

function validatePlatformUrl(platform, value) {
  const raw = clean(value, 300);
  if (!raw) return "";

  let u;
  try {
    u = new URL(raw);
  } catch {
    throw new Error(`${platformLabel(platform)} muss ein vollständiger Link mit https:// sein.`);
  }

  if (u.protocol !== "https:") {
    throw new Error(`${platformLabel(platform)} muss mit https:// beginnen.`);
  }

  const hosts = {
    twitch: ["twitch.tv", "www.twitch.tv"],
    tiktok: ["tiktok.com", "www.tiktok.com", "vm.tiktok.com"],
    youtube: ["youtube.com", "www.youtube.com", "m.youtube.com", "youtu.be"],
    kick: ["kick.com", "www.kick.com"],
    discord: ["discord.gg", "discord.com", "www.discord.com"],
    donation_url: [
      "streamelements.com", "www.streamelements.com",
      "streamlabs.com", "www.streamlabs.com",
      "ko-fi.com", "www.ko-fi.com",
      "paypal.me", "www.paypal.me",
      "buymeacoffee.com", "www.buymeacoffee.com",
      "patreon.com", "www.patreon.com",
      "tipeeestream.com", "www.tipeeestream.com"
    ],
  };

  const host = u.hostname.toLowerCase();
  if (!hosts[platform]?.includes(host)) {
    throw new Error(`${platformLabel(platform)} erlaubt nur passende Links. Eingetragen war: ${host}`);
  }

  if (["twitch", "tiktok", "kick"].includes(platform) && u.pathname.replace(/\/+$/, "").split("/").filter(Boolean).length < 1) {
    throw new Error(`${platformLabel(platform)} braucht einen Profil-Link, nicht nur die Startseite.`);
  }

  if (platform === "youtube") {
    const path = u.pathname.toLowerCase();
    const ok = host === "youtu.be" || path.startsWith("/@") || path.startsWith("/c/") || path.startsWith("/channel/") || path.startsWith("/user/");
    if (!ok) throw new Error("YouTube braucht einen Kanal-Link, zum Beispiel https://youtube.com/@deinname.");
  }

  if (platform === "discord") {
    const path = u.pathname.toLowerCase();
    const ok = host === "discord.gg" || path.startsWith("/invite/");
    if (!ok) throw new Error("Discord braucht einen Einladungslink, zum Beispiel https://discord.gg/deincode.");
  }

  return u.toString();
}

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
        "INSERT INTO creator_profiles (id,user_id,display_name,bio,twitch,tiktok,youtube,kick,discord,donation_url,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)"
      )
        .bind(id(), uid, name, "", "", "", "", "", "", "", now(), now())
        .run();

      const sid = await createSession(env, uid);
      return json({ message: "Account wurde erstellt. Du bist als Creator angemeldet.", role: "creator" }, 200, sessionHeader(sid));
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
                creator_profiles.verified,
                creator_profiles.bio,
                creator_profiles.twitch,
                creator_profiles.tiktok,
                creator_profiles.youtube,
                creator_profiles.kick,
                creator_profiles.discord,
                creator_profiles.donation_url,
                creator_profiles.avatar_url,
                creator_profiles.banner_url,
                COUNT(DISTINCT uploads.id) AS uploads_count,
                (
                  SELECT COALESCE(SUM(u2.downloads), 0)
                  FROM uploads u2
                  WHERE u2.user_id = creator_profiles.user_id
                    AND u2.status = 'approved'
                ) AS downloads_count,
                COUNT(DISTINCT follows.id) AS followers_count
         FROM creator_profiles
         LEFT JOIN uploads
           ON uploads.user_id = creator_profiles.user_id
          AND uploads.status = 'approved'
         LEFT JOIN follows
           ON follows.creator_user_id = creator_profiles.user_id
         GROUP BY creator_profiles.id
         ORDER BY downloads_count DESC,
                  uploads_count DESC,
                  creator_profiles.created_at DESC`
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
      const reports = await env.DB.prepare("SELECT COUNT(*) AS count FROM reports").first();

      return json({
        stats: {
          totalUploads: totalUploads?.count || 0,
          pendingUploads: pendingUploads?.count || 0,
          approvedUploads: approvedUploads?.count || 0,
          rejectedUploads: rejectedUploads?.count || 0,
          users: users?.count || 0,
          downloads: downloads?.count || 0,
          reports: reports?.count || 0,
        }
      });
    }

    if (path === "/api/admin/pending" || path === "/api/admin/uploads") {
      const user = await currentUser(request, env);

      if (!user || !["admin", "moderator"].includes(user.role)) {
        return json({ error: "Kein Adminzugriff." }, 403);
      }

      const status = clean(url.searchParams.get("status"), 20);
      const q = `%${clean(url.searchParams.get("q"), 100)}%`;

      let stmt;
      if (path === "/api/admin/uploads" && ["pending", "approved", "rejected"].includes(status)) {
        stmt = env.DB.prepare(
          `SELECT uploads.*,
                  creator_profiles.display_name,
                  users.email,
                  COUNT(reports.id) AS reports_count
           FROM uploads
           LEFT JOIN creator_profiles ON creator_profiles.user_id = uploads.user_id
           LEFT JOIN users ON users.id = uploads.user_id
           LEFT JOIN reports ON reports.upload_id = uploads.id
           WHERE uploads.status = ?
             AND (uploads.title LIKE ? OR uploads.description LIKE ? OR uploads.category LIKE ? OR users.email LIKE ? OR creator_profiles.display_name LIKE ?)
           GROUP BY uploads.id
           ORDER BY uploads.created_at DESC
           LIMIT 200`
        ).bind(status, q, q, q, q, q);
      } else if (path === "/api/admin/uploads") {
        stmt = env.DB.prepare(
          `SELECT uploads.*,
                  creator_profiles.display_name,
                  users.email,
                  COUNT(reports.id) AS reports_count
           FROM uploads
           LEFT JOIN creator_profiles ON creator_profiles.user_id = uploads.user_id
           LEFT JOIN users ON users.id = uploads.user_id
           LEFT JOIN reports ON reports.upload_id = uploads.id
           WHERE uploads.title LIKE ? OR uploads.description LIKE ? OR uploads.category LIKE ? OR users.email LIKE ? OR creator_profiles.display_name LIKE ?
           GROUP BY uploads.id
           ORDER BY uploads.created_at DESC
           LIMIT 200`
        ).bind(q, q, q, q, q);
      } else {
        stmt = env.DB.prepare(
          `SELECT uploads.*,
                  creator_profiles.display_name,
                  users.email,
                  COUNT(reports.id) AS reports_count
           FROM uploads
           LEFT JOIN creator_profiles ON creator_profiles.user_id = uploads.user_id
           LEFT JOIN users ON users.id = uploads.user_id
           LEFT JOIN reports ON reports.upload_id = uploads.id
           WHERE uploads.status = 'pending'
           GROUP BY uploads.id
           ORDER BY uploads.created_at DESC`
        );
      }

      const r = await stmt.all();
      return json({ uploads: r.results || [] });
    }

    if (path === "/api/admin/reports") {
      const user = await currentUser(request, env);

      if (!user || !["admin", "moderator"].includes(user.role)) {
        return json({ error: "Kein Adminzugriff." }, 403);
      }

      const r = await env.DB.prepare(
        `SELECT reports.*,
                uploads.id AS upload_id,
                uploads.title AS upload_title,
                uploads.status AS upload_status,
                uploads.category AS upload_category,
                creator_profiles.display_name,
                users.email
         FROM reports
         LEFT JOIN uploads ON uploads.id = reports.upload_id
         LEFT JOIN creator_profiles ON creator_profiles.user_id = uploads.user_id
         LEFT JOIN users ON users.id = uploads.user_id
         ORDER BY reports.created_at DESC
         LIMIT 200`
      ).all();

      return json({ reports: r.results || [] });
    }

    if (path === "/api/admin/users") {
  const user = await currentUser(request, env);

  if (!user || user.role !== "admin") {
    return json({ error: "Nur Admins dürfen Nutzer verwalten." }, 403);
  }

  if (request.method === "GET") {
    const r = await env.DB.prepare(
      `SELECT users.id,
              users.email,
              users.role,
              users.created_at,
              creator_profiles.display_name,
              creator_profiles.verified
       FROM users
       LEFT JOIN creator_profiles
         ON creator_profiles.user_id = users.id
       ORDER BY users.created_at DESC`
    ).all();

    return json({ users: r.results || [] });
  }

  if (request.method === "POST") {
    const b = await request.json();
    const targetId = clean(b.id, 80);
    const action = clean(b.action, 30);

    if (action === "set-role") {
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

    if (action === "set-verified") {
      const verified = Number(b.verified) ? 1 : 0;

      if (!targetId) {
        return json({ error: "Nutzer fehlt." }, 400);
      }

      await env.DB.prepare(
        "UPDATE creator_profiles SET verified=?, updated_at=? WHERE user_id=?"
      )
        .bind(verified, now(), targetId)
        .run();

      await env.DB.prepare(
        "INSERT INTO admin_logs (id,admin_user_id,action,target_id,message,created_at) VALUES (?,?,?,?,?,?)"
      )
        .bind(
          id(),
          user.id,
          "set-verified",
          targetId,
          verified ? "Creator verifiziert" : "Creator-Verifizierung entfernt",
          now()
        )
        .run();

      return json({
        message: verified
          ? "Creator wurde verifiziert."
          : "Verifizierung wurde entfernt.",
      });
    }

    return json({ error: "Unbekannte Aktion." }, 400);
  }
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

        await env.DB.prepare("DELETE FROM reports WHERE upload_id=?")
          .bind(uploadId)
          .run();

        await env.DB.prepare("DELETE FROM uploads WHERE id=?")
          .bind(uploadId)
          .run();

        await env.DB.prepare(
          "INSERT INTO admin_logs (id,admin_user_id,action,target_id,message,created_at) VALUES (?,?,?,?,?,?)"
        )
        .bind(id(), user.id, "delete-upload", uploadId, "Upload gelöscht", now())
        .run();

        return json({ message: "Upload wurde gelöscht." });
      }

      const status = action === "approve" ? "approved" : "rejected";
      const reason = action === "reject" ? clean(b.reason || "Durch Moderation abgelehnt", 500) : "";

      await env.DB.prepare("UPDATE uploads SET status=?, rejection_reason=?, updated_at=? WHERE id=?")
        .bind(status, reason, now(), uploadId)
        .run();

      await env.DB.prepare(
        "INSERT INTO admin_logs (id,admin_user_id,action,target_id,message,created_at) VALUES (?,?,?,?,?,?)"
      )
      .bind(id(), user.id, action, uploadId, reason || `Upload ${status}`, now())
      .run();

      return json({
        message: action === "approve"
          ? "Upload freigegeben."
          : "Upload abgelehnt."
      });
    }
         if (path === "/api/edit-upload" && request.method === "POST") {
      const user = await currentUser(request, env);

      if (!user) {
        return json({ error: "Bitte einloggen." }, 401);
      }

      const b = await request.json();

      const uploadId = clean(b.id, 80);
      const title = clean(b.title, 120);
      const description = clean(b.description, 1500);
      const category = clean(b.category, 80) || "Sonstiges";
      const tags = clean(b.tags, 300);

      if (!uploadId) {
        return json({ error: "Upload fehlt." }, 400);
      }

      if (!title) {
        return json({ error: "Titel fehlt." }, 400);
      }

      const upload = await env.DB.prepare(
        "SELECT id, user_id FROM uploads WHERE id=?"
      )
        .bind(uploadId)
        .first();

      if (!upload) {
        return json({ error: "Upload nicht gefunden." }, 404);
      }

      if (upload.user_id !== user.id) {
        return json({ error: "Du darfst diesen Upload nicht bearbeiten." }, 403);
      }

      await env.DB.prepare(
        `UPDATE uploads
         SET title=?,
             description=?,
             category=?,
             tags=?,
             status='pending',
             rejection_reason='',
             updated_at=?
         WHERE id=?`
      )
        .bind(title, description, category, tags, now(), uploadId)
        .run();

      return json({
        message: "Upload wurde gespeichert und wartet erneut auf Freigabe.",
      });
    }
        if (path === "/api/creator-profile") {
      const userId = clean(url.searchParams.get("id"), 80);

      if (!userId) {
        return json({ error: "Creator fehlt." }, 400);
      }

      const creator = await env.DB.prepare(
        `SELECT creator_profiles.id,
                creator_profiles.user_id,
                creator_profiles.display_name,
                creator_profiles.verified,
                creator_profiles.bio,
                creator_profiles.twitch,
                creator_profiles.tiktok,
                creator_profiles.youtube,
                creator_profiles.kick,
                creator_profiles.discord,
                creator_profiles.donation_url,
                creator_profiles.avatar_url,
                creator_profiles.banner_url,
                COUNT(DISTINCT uploads.id) AS uploads_count,
                (
                  SELECT COALESCE(SUM(u2.downloads), 0)
                  FROM uploads u2
                  WHERE u2.user_id = creator_profiles.user_id
                    AND u2.status = 'approved'
                ) AS downloads_count,
                COUNT(DISTINCT follows.id) AS followers_count
         FROM creator_profiles
         LEFT JOIN uploads
           ON uploads.user_id = creator_profiles.user_id
          AND uploads.status = 'approved'
         LEFT JOIN follows
           ON follows.creator_user_id = creator_profiles.user_id
         WHERE creator_profiles.user_id = ?
         GROUP BY creator_profiles.id`
      )
        .bind(userId)
        .first();

      if (!creator) {
        return json({ error: "Creator nicht gefunden." }, 404);
      }

      const uploads = await env.DB.prepare(
        `SELECT uploads.id,
                uploads.title,
                uploads.description,
                uploads.category,
                uploads.tags,
                uploads.downloads,
                uploads.preview_key,
                uploads.created_at
         FROM uploads
         WHERE uploads.user_id = ?
           AND uploads.status = 'approved'
         ORDER BY uploads.created_at DESC`
      )
        .bind(userId)
        .all();

      return json({
        creator,
        uploads: uploads.results || [],
      });
    }
        if (path === "/api/favorite" && request.method === "POST") {
      const user = await currentUser(request, env);

      if (!user) {
        return json({ error: "Bitte einloggen." }, 401);
      }

      const b = await request.json();
      const uploadId = clean(b.upload_id, 80);

      if (!uploadId) {
        return json({ error: "Upload fehlt." }, 400);
      }

      const upload = await env.DB.prepare(
        "SELECT id FROM uploads WHERE id=? AND status='approved'"
      )
        .bind(uploadId)
        .first();

      if (!upload) {
        return json({ error: "Upload nicht gefunden." }, 404);
      }

      const existing = await env.DB.prepare(
        `SELECT id
         FROM favorites
         WHERE user_id=?
           AND upload_id=?`
      )
        .bind(user.id, uploadId)
        .first();

      if (existing) {
        await env.DB.prepare(
          `DELETE FROM favorites
           WHERE user_id=?
             AND upload_id=?`
        )
          .bind(user.id, uploadId)
          .run();

        return json({
          favorite: false,
          message: "Favorit entfernt.",
        });
      }

      await env.DB.prepare(
        `INSERT INTO favorites
          (id,user_id,upload_id,created_at)
         VALUES (?,?,?,?)`
      )
        .bind(id(), user.id, uploadId, now())
        .run();

      return json({
        favorite: true,
        message: "Favorit gespeichert.",
      });
    }

    if (path === "/api/my-favorites") {
      const user = await currentUser(request, env);

      if (!user) {
        return json({ error: "Bitte einloggen." }, 401);
      }

      const r = await env.DB.prepare(
        `SELECT uploads.id,
                uploads.title,
                uploads.description,
                uploads.category,
                uploads.tags,
                uploads.downloads,
                uploads.preview_key,
                uploads.created_at,
                creator_profiles.display_name,
                favorites.created_at AS favorited_at
         FROM favorites
         JOIN uploads
           ON uploads.id = favorites.upload_id
          AND uploads.status = 'approved'
         LEFT JOIN creator_profiles
           ON creator_profiles.user_id = uploads.user_id
         WHERE favorites.user_id = ?
         ORDER BY favorites.created_at DESC`
      )
        .bind(user.id)
        .all();

      return json({
        favorites: r.results || [],
      });
    }
      if (path === "/api/follow" && request.method === "POST") {
  const user = await currentUser(request, env);

  if (!user) {
    return json({ error: "Bitte einloggen." }, 401);
  }

  const b = await request.json();
  const creatorId = clean(b.creator_id, 80);

  if (!creatorId) {
    return json({ error: "Creator fehlt." }, 400);
  }

  if (creatorId === user.id) {
    return json({ error: "Du kannst dir nicht selbst folgen." }, 400);
  }

  const creator = await env.DB.prepare(
    "SELECT user_id FROM creator_profiles WHERE user_id=?"
  )
    .bind(creatorId)
    .first();

  if (!creator) {
    return json({ error: "Creator nicht gefunden." }, 404);
  }

  const existing = await env.DB.prepare(
    `SELECT id
     FROM follows
     WHERE follower_user_id=?
       AND creator_user_id=?`
  )
    .bind(user.id, creatorId)
    .first();

  if (existing) {
    await env.DB.prepare(
      `DELETE FROM follows
       WHERE follower_user_id=?
         AND creator_user_id=?`
    )
      .bind(user.id, creatorId)
      .run();

    return json({
      following: false,
      message: "Creator entfolgt.",
    });
  }

  await env.DB.prepare(
    `INSERT INTO follows
      (id,follower_user_id,creator_user_id,created_at)
     VALUES (?,?,?,?)`
  )
    .bind(id(), user.id, creatorId, now())
    .run();

  return json({
    following: true,
    message: "Creator gefolgt.",
  });
}
      if (path === "/api/home") {
      const latest = await env.DB.prepare(
        `SELECT uploads.id,
                uploads.title,
                uploads.description,
                uploads.category,
                uploads.downloads,
                uploads.preview_key,
                uploads.created_at,
                creator_profiles.display_name
         FROM uploads
         LEFT JOIN creator_profiles
           ON creator_profiles.user_id = uploads.user_id
         WHERE uploads.status = 'approved'
         ORDER BY uploads.created_at DESC
         LIMIT 6`
      ).all();

      const popular = await env.DB.prepare(
        `SELECT uploads.id,
                uploads.title,
                uploads.description,
                uploads.category,
                uploads.downloads,
                uploads.preview_key,
                uploads.created_at,
                creator_profiles.display_name
         FROM uploads
         LEFT JOIN creator_profiles
           ON creator_profiles.user_id = uploads.user_id
         WHERE uploads.status = 'approved'
         ORDER BY uploads.downloads DESC
         LIMIT 6`
      ).all();

      const creators = await env.DB.prepare(
        `SELECT creator_profiles.display_name,
                creator_profiles.avatar_url,
                creator_profiles.banner_url,
                creator_profiles.donation_url,
                COUNT(uploads.id) AS uploads_count,
                COALESCE(SUM(uploads.downloads), 0) AS downloads_count
         FROM creator_profiles
         LEFT JOIN uploads
           ON uploads.user_id = creator_profiles.user_id
          AND uploads.status = 'approved'
         GROUP BY creator_profiles.id
         ORDER BY downloads_count DESC, uploads_count DESC
         LIMIT 6`
      ).all();

      return json({
        latest: latest.results || [],
        popular: popular.results || [],
        creators: creators.results || []
      });
    }    if (path === "/api/upload-detail") {
      const uploadId = clean(url.searchParams.get("id"), 80);

      if (!uploadId) {
        return json({ error: "ID fehlt." }, 400);
      }

      const upload = await env.DB.prepare(
        `SELECT uploads.id,
                uploads.user_id,
                uploads.title,
                uploads.description,
                uploads.category,
                uploads.tags,
                uploads.downloads,
                uploads.created_at,
                uploads.preview_key,
                creator_profiles.display_name,
                creator_profiles.bio AS creator_bio,
                creator_profiles.avatar_url,
                creator_profiles.twitch,
                creator_profiles.tiktok,
                creator_profiles.youtube,
                creator_profiles.kick,
                creator_profiles.discord,
                creator_profiles.donation_url,
                (
                  SELECT COUNT(*)
                  FROM uploads u2
                  WHERE u2.user_id = uploads.user_id
                    AND u2.status = 'approved'
                ) AS creator_uploads_count,
                (
                  SELECT COALESCE(SUM(u3.downloads), 0)
                  FROM uploads u3
                  WHERE u3.user_id = uploads.user_id
                    AND u3.status = 'approved'
                ) AS creator_downloads_count
         FROM uploads
         LEFT JOIN creator_profiles
           ON creator_profiles.user_id = uploads.user_id
         WHERE uploads.id = ? AND uploads.status = 'approved'`
      )
        .bind(uploadId)
        .first();

      if (!upload) {
        return json({ error: "Upload nicht gefunden." }, 404);
      }

      return json({ upload });
    }
    if (path === "/api/admin/delete-upload" && request.method === "POST") {
      const user = await currentUser(request, env);

      if (!user || !["admin", "moderator"].includes(user.role)) {
        return json({ error: "Kein Adminzugriff." }, 403);
      }

      const b = await request.json();
      const uploadId = clean(b.id, 80);
      const reason = clean(b.reason || "Manuell gelöscht", 500);

      const upload = await env.DB.prepare("SELECT * FROM uploads WHERE id=?")
        .bind(uploadId)
        .first();

      if (!upload) {
        return json({ error: "Upload nicht gefunden." }, 404);
      }

      if (upload.file_key) {
        await env.R2.delete(upload.file_key);
      }

      if (upload.preview_key) {
        await env.R2.delete(upload.preview_key);
      }

      await env.DB.prepare("DELETE FROM reports WHERE upload_id=?")
        .bind(uploadId)
        .run();

      await env.DB.prepare("DELETE FROM uploads WHERE id=?")
        .bind(uploadId)
        .run();

      await env.DB.prepare(
        "INSERT INTO admin_logs (id,admin_user_id,action,target_id,message,created_at) VALUES (?,?,?,?,?,?)"
      )
        .bind(id(), user.id, "delete_upload", uploadId, reason, now())
        .run();

      return json({ message: "Upload wurde gelöscht." });
    }    	
    return context.next();
  } catch (err) {
    return json({ error: "Serverfehler", detail: String(err?.message || err) }, 500);
  }
}