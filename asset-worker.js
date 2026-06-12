const jsonHeaders = {
  "Content-Type": "application/json; charset=utf-8",
  "Cache-Control": "no-store",
};

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: jsonHeaders,
  });
}

function hasCommunityStorage(env) {
  return Boolean(env.MKG_DB);
}

function requireCommunityStorage(env) {
  if (!hasCommunityStorage(env)) {
    return json({
      ok: false,
      code: "COMMUNITY_STORAGE_NOT_CONFIGURED",
      message: "Community storage is not connected yet. Bind a Cloudflare D1 database as MKG_DB before accepting visitor posts.",
    }, 503);
  }
  return null;
}

function cleanText(value, maxLength = 2000) {
  return String(value || "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, maxLength);
}

function cleanLongText(value, maxLength = 6000) {
  return String(value || "")
    .replace(/\r\n/g, "\n")
    .replace(/\n{4,}/g, "\n\n\n")
    .trim()
    .slice(0, maxLength);
}

function cleanStatus(value) {
  const status = cleanText(value, 24).toLowerCase();
  if (["published", "available", "draft", "sold", "hold"].includes(status)) return status;
  return "draft";
}

function nowIso() {
  return new Date().toISOString();
}

async function getApprovedComments(request, env) {
  const storageError = requireCommunityStorage(env);
  if (storageError) return storageError;

  const url = new URL(request.url);
  const page = cleanText(url.searchParams.get("page") || "community", 160);
  const lang = cleanText(url.searchParams.get("lang") || "en", 12);

  const result = await env.MKG_DB.prepare(
    "SELECT id, page, lang, topic, name, message, owner_reply, created_at, approved_at FROM community_comments WHERE status = 'approved' AND page = ? AND lang = ? ORDER BY approved_at DESC, created_at DESC LIMIT 50"
  ).bind(page, lang).all();

  return json({ ok: true, comments: result.results || [] });
}

async function createComment(request, env) {
  const storageError = requireCommunityStorage(env);
  if (storageError) return storageError;

  const body = await request.json().catch(() => null);
  if (!body) {
    return json({ ok: false, message: "Please send a valid question." }, 400);
  }

  const name = cleanText(body.name, 80) || "Koi keeper";
  const email = cleanText(body.email, 160);
  const topic = cleanText(body.topic, 80) || "General koi question";
  const page = cleanText(body.page, 160) || "community";
  const lang = cleanText(body.lang, 12) || "en";
  const message = cleanLongText(body.message, 6000);
  const pondInfo = cleanLongText(body.pondInfo, 3000);
  const createdAt = nowIso();

  if (message.length < 20) {
    return json({ ok: false, message: "Please include a little more detail so the question can be reviewed." }, 400);
  }

  await env.MKG_DB.prepare(
    "INSERT INTO community_comments (page, lang, topic, name, email, message, pond_info, status, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, 'pending', ?)"
  ).bind(page, lang, topic, name, email, message, pondInfo, createdAt).run();

  return json({
    ok: true,
    status: "pending",
    message: "Thank you. Your post is waiting for review before it appears publicly.",
  }, 201);
}

async function createUpload(request, env) {
  const storageError = requireCommunityStorage(env);
  if (storageError) return storageError;
  if (!env.MKG_UPLOADS) {
    return json({
      ok: false,
      code: "UPLOAD_STORAGE_NOT_CONFIGURED",
      message: "Image upload storage is not connected yet. Bind a Cloudflare R2 bucket as MKG_UPLOADS.",
    }, 503);
  }

  const form = await request.formData();
  const file = form.get("image");
  if (!file || typeof file === "string") {
    return json({ ok: false, message: "Please choose an image." }, 400);
  }

  const allowed = new Set(["image/jpeg", "image/png", "image/webp"]);
  if (!allowed.has(file.type)) {
    return json({ ok: false, message: "Please upload a JPG, PNG, or WebP image." }, 400);
  }
  if (file.size > 8 * 1024 * 1024) {
    return json({ ok: false, message: "Please keep images under 8 MB." }, 400);
  }

  const createdAt = nowIso();
  const safeName = cleanText(file.name, 90).replace(/[^a-z0-9._-]/gi, "-") || "koi-image";
  const key = `pending/${createdAt.slice(0, 10)}/${crypto.randomUUID()}-${safeName}`;
  await env.MKG_UPLOADS.put(key, file.stream(), {
    httpMetadata: { contentType: file.type },
    customMetadata: { originalName: safeName },
  });

  await env.MKG_DB.prepare(
    "INSERT INTO community_uploads (r2_key, page, lang, name, email, caption, status, created_at) VALUES (?, ?, ?, ?, ?, ?, 'pending', ?)"
  ).bind(
    key,
    cleanText(form.get("page"), 160) || "community",
    cleanText(form.get("lang"), 12) || "en",
    cleanText(form.get("name"), 80) || "Koi keeper",
    cleanText(form.get("email"), 160),
    cleanLongText(form.get("caption"), 2000),
    createdAt
  ).run();

  return json({
    ok: true,
    status: "pending",
    message: "Image received. It will appear only after review.",
  }, 201);
}

function isAdmin(request, env) {
  const expected = env.ADMIN_SECRET;
  if (!expected) return false;
  const auth = request.headers.get("Authorization") || "";
  if (auth === `Bearer ${expected}`) return true;
  const url = new URL(request.url);
  return url.searchParams.get("secret") === expected;
}

async function adminList(request, env) {
  const storageError = requireCommunityStorage(env);
  if (storageError) return storageError;
  if (!isAdmin(request, env)) return json({ ok: false, message: "Unauthorized." }, 401);

  const comments = await env.MKG_DB.prepare(
    "SELECT id, page, lang, topic, name, email, message, pond_info, owner_reply, status, created_at, approved_at FROM community_comments WHERE status = 'pending' ORDER BY created_at DESC LIMIT 100"
  ).all();
  const uploads = await env.MKG_DB.prepare(
    "SELECT id, r2_key, page, lang, name, email, caption, status, created_at, approved_at FROM community_uploads WHERE status = 'pending' ORDER BY created_at DESC LIMIT 100"
  ).all();

  return json({
    ok: true,
    comments: comments.results || [],
    uploads: uploads.results || [],
  });
}

async function adminModerate(request, env) {
  const storageError = requireCommunityStorage(env);
  if (storageError) return storageError;
  if (!isAdmin(request, env)) return json({ ok: false, message: "Unauthorized." }, 401);

  const body = await request.json().catch(() => null);
  if (!body) return json({ ok: false, message: "Missing moderation payload." }, 400);

  const type = cleanText(body.type, 20);
  const id = Number(body.id);
  const action = cleanText(body.action, 20);
  const reply = cleanLongText(body.reply, 4000);
  const table = type === "upload" ? "community_uploads" : "community_comments";

  if (!Number.isInteger(id) || id < 1) {
    return json({ ok: false, message: "Invalid item id." }, 400);
  }

  if (action === "approve") {
    if (table === "community_comments") {
      await env.MKG_DB.prepare(
        "UPDATE community_comments SET status = 'approved', owner_reply = ?, approved_at = ? WHERE id = ?"
      ).bind(reply, nowIso(), id).run();
    } else {
      await env.MKG_DB.prepare(
        "UPDATE community_uploads SET status = 'approved', approved_at = ? WHERE id = ?"
      ).bind(nowIso(), id).run();
    }
    return json({ ok: true, status: "approved" });
  }

  if (action === "reject") {
    await env.MKG_DB.prepare(`UPDATE ${table} SET status = 'rejected' WHERE id = ?`).bind(id).run();
    return json({ ok: true, status: "rejected" });
  }

  return json({ ok: false, message: "Use approve or reject." }, 400);
}

async function getSaleListings(request, env) {
  const storageError = requireCommunityStorage(env);
  if (storageError) return storageError;

  const url = new URL(request.url);
  const includeDrafts = url.searchParams.get("all") === "1" && isAdmin(request, env);
  const sql = includeDrafts
    ? "SELECT id, title, variety, size_text, sex, price, status, image_data_url, notes, location_note, created_at, updated_at FROM sale_listings ORDER BY updated_at DESC, id DESC LIMIT 100"
    : "SELECT id, title, variety, size_text, sex, price, status, image_data_url, notes, location_note, created_at, updated_at FROM sale_listings WHERE status IN ('published', 'available', 'hold', 'sold') ORDER BY CASE status WHEN 'published' THEN 1 WHEN 'available' THEN 1 WHEN 'hold' THEN 2 WHEN 'sold' THEN 3 ELSE 4 END, updated_at DESC, id DESC LIMIT 100";
  const result = await env.MKG_DB.prepare(sql).all();
  return json({ ok: true, listings: result.results || [] });
}

async function adminSaveSaleListing(request, env) {
  const storageError = requireCommunityStorage(env);
  if (storageError) return storageError;
  if (!isAdmin(request, env)) return json({ ok: false, message: "Unauthorized." }, 401);

  const body = await request.json().catch(() => null);
  if (!body) return json({ ok: false, message: "Missing listing payload." }, 400);

  const id = Number(body.id || 0);
  const now = nowIso();
  const listing = {
    title: cleanText(body.title, 120),
    variety: cleanText(body.variety, 80),
    sizeText: cleanText(body.sizeText || body.size_text, 80),
    sex: cleanText(body.sex, 40),
    price: cleanText(body.price, 60),
    status: cleanStatus(body.status),
    imageDataUrl: String(body.imageDataUrl || body.image_data_url || "").startsWith("data:image/") ? String(body.imageDataUrl || body.image_data_url).slice(0, 1400000) : "",
    notes: cleanLongText(body.notes, 3000),
    locationNote: cleanText(body.locationNote || body.location_note, 200) || "Local pickup near ZIP code 33331.",
  };

  if (listing.title.length < 2) {
    return json({ ok: false, message: "Please enter a listing title." }, 400);
  }

  if (Number.isInteger(id) && id > 0) {
    const existing = await env.MKG_DB.prepare("SELECT image_data_url FROM sale_listings WHERE id = ?").bind(id).first();
    const image = listing.imageDataUrl || (existing && existing.image_data_url) || "";
    await env.MKG_DB.prepare(
      "UPDATE sale_listings SET title = ?, variety = ?, size_text = ?, sex = ?, price = ?, status = ?, image_data_url = ?, notes = ?, location_note = ?, updated_at = ? WHERE id = ?"
    ).bind(listing.title, listing.variety, listing.sizeText, listing.sex, listing.price, listing.status, image, listing.notes, listing.locationNote, now, id).run();
    return json({ ok: true, id, status: listing.status, message: "Listing updated." });
  }

  const result = await env.MKG_DB.prepare(
    "INSERT INTO sale_listings (title, variety, size_text, sex, price, status, image_data_url, notes, location_note, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)"
  ).bind(listing.title, listing.variety, listing.sizeText, listing.sex, listing.price, listing.status, listing.imageDataUrl, listing.notes, listing.locationNote, now, now).run();

  return json({ ok: true, id: result.meta?.last_row_id, status: listing.status, message: "Listing saved." }, 201);
}

async function adminDeleteSaleListing(request, env) {
  const storageError = requireCommunityStorage(env);
  if (storageError) return storageError;
  if (!isAdmin(request, env)) return json({ ok: false, message: "Unauthorized." }, 401);

  const body = await request.json().catch(() => null);
  const id = Number(body && body.id);
  if (!Number.isInteger(id) || id < 1) return json({ ok: false, message: "Invalid listing id." }, 400);

  await env.MKG_DB.prepare("DELETE FROM sale_listings WHERE id = ?").bind(id).run();
  return json({ ok: true, message: "Listing deleted." });
}

async function apiFetch(request, env) {
  const url = new URL(request.url);
  if (url.pathname === "/api/comments" && request.method === "GET") return getApprovedComments(request, env);
  if (url.pathname === "/api/comments" && request.method === "POST") return createComment(request, env);
  if (url.pathname === "/api/uploads" && request.method === "POST") return createUpload(request, env);
  if (url.pathname === "/api/admin/submissions" && request.method === "GET") return adminList(request, env);
  if (url.pathname === "/api/admin/moderate" && request.method === "POST") return adminModerate(request, env);
  if (url.pathname === "/api/sale-listings" && request.method === "GET") return getSaleListings(request, env);
  if (url.pathname === "/api/admin/sale-listings" && request.method === "GET") return getSaleListings(request, env);
  if (url.pathname === "/api/admin/sale-listings" && request.method === "POST") return adminSaveSaleListing(request, env);
  if (url.pathname === "/api/admin/sale-listings/delete" && request.method === "POST") return adminDeleteSaleListing(request, env);
  return json({ ok: false, message: "API route not found." }, 404);
}

function contentTypeForPath(pathname) {
  if (pathname.endsWith("/") || pathname.endsWith(".html")) return "text/html; charset=utf-8";
  if (pathname.endsWith(".css")) return "text/css; charset=utf-8";
  if (pathname.endsWith(".js")) return "application/javascript; charset=utf-8";
  if (pathname.endsWith(".json") || pathname.endsWith(".webmanifest")) return "application/manifest+json; charset=utf-8";
  if (pathname.endsWith(".xml")) return "application/xml; charset=utf-8";
  if (pathname.endsWith(".svg")) return "image/svg+xml; charset=utf-8";
  return null;
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname.startsWith("/api/")) {
      return apiFetch(request, env);
    }

    const response = await env.ASSETS.fetch(request);
    const headers = new Headers(response.headers);
    const contentType = contentTypeForPath(url.pathname);

    if (contentType) {
      headers.set("Content-Type", contentType);
    }
    if (
      url.pathname.endsWith("/") ||
      url.pathname.endsWith(".html") ||
      url.pathname.endsWith(".js") ||
      url.pathname.endsWith(".css") ||
      url.pathname.endsWith(".webmanifest")
    ) {
      headers.set("Cache-Control", "no-cache, must-revalidate");
    }

    headers.set("X-MKG-Worker", "community-pwa-20260611");

    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers,
    });
  },
};
