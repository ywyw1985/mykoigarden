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

const industryNewsSources = {
  feeds: [
    {
      name: "KoiQuestion",
      url: "https://koiquestion.com/en/feed/",
      category: "learning",
      region: "Global",
      notes: "English koi education RSS feed."
    },
    {
      name: "Sacramento Koi YouTube",
      url: "https://www.youtube.com/feeds/videos.xml?channel_id=UCj4w-lO17mAN89Iawg_t30A",
      category: "videos",
      region: "United States",
      notes: "YouTube updates from Sacramento Koi."
    },
    {
      name: "KOI PARTNER YouTube",
      url: "https://www.youtube.com/feeds/videos.xml?channel_id=UCswjjMpBjlblrnzc0xgQ7qQ",
      category: "videos",
      region: "Europe",
      notes: "YouTube updates from KOI PARTNER."
    },
    {
      name: "More Koi Partner YouTube",
      url: "https://www.youtube.com/feeds/videos.xml?channel_id=UCVS_PVUQyCeb9XV5HRzY5MA",
      category: "videos",
      region: "Europe",
      notes: "YouTube updates from More Koi Partner."
    }
  ],
  watchPages: [
    {
      name: "KoiShowNews",
      url: "https://koishownews.koiwork.com/",
      category: "shows",
      region: "Global",
      notes: "Koi show calendar and event watch page."
    },
    {
      name: "JNPA",
      url: "https://jnpa.info/en/",
      category: "shows",
      region: "Japan",
      notes: "Japanese Nishikigoi Promotion Association watch page."
    },
    {
      name: "ZNA",
      url: "https://zna.jp/en/",
      category: "shows",
      region: "Global",
      notes: "ZNA organization and show information watch page."
    }
  ]
};

function industrySourceWatchlist() {
  return [
    ...industryNewsSources.feeds.map((source) => ({ ...source, type: "feed" })),
    ...industryNewsSources.watchPages.map((source) => ({ ...source, type: "watch page" }))
  ];
}

function cleanIndustryText(value, maxLength = 1200) {
  return String(value || "")
    .replace(/<!\[CDATA\[(.*?)\]\]>/gs, "$1")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, maxLength);
}

function hashString(value) {
  let hash = 5381;
  const text = String(value || "");
  for (let i = 0; i < text.length; i += 1) {
    hash = ((hash << 5) + hash) ^ text.charCodeAt(i);
  }
  return (hash >>> 0).toString(36);
}

function firstMatch(text, pattern) {
  const match = text.match(pattern);
  return match ? match[1] : "";
}

function parseRssItems(xmlText, source) {
  const items = [];
  const blocks = xmlText.match(/<item[\s\S]*?<\/item>/gi) || xmlText.match(/<entry[\s\S]*?<\/entry>/gi) || [];
  for (const block of blocks.slice(0, 12)) {
    const title = cleanIndustryText(firstMatch(block, /<title[^>]*>([\s\S]*?)<\/title>/i), 180);
    const link = cleanIndustryText(firstMatch(block, /<link[^>]*href=["']([^"']+)["'][^>]*>/i) || firstMatch(block, /<link[^>]*>([\s\S]*?)<\/link>/i), 600);
    const published = cleanIndustryText(
      firstMatch(block, /<pubDate[^>]*>([\s\S]*?)<\/pubDate>/i) ||
      firstMatch(block, /<published[^>]*>([\s\S]*?)<\/published>/i) ||
      firstMatch(block, /<updated[^>]*>([\s\S]*?)<\/updated>/i),
      80
    );
    const summary = cleanIndustryText(
      firstMatch(block, /<description[^>]*>([\s\S]*?)<\/description>/i) ||
      firstMatch(block, /<summary[^>]*>([\s\S]*?)<\/summary>/i) ||
      firstMatch(block, /<content[^>]*>([\s\S]*?)<\/content>/i),
      420
    );
    if (!title || !link) continue;
    items.push({
      id: `${hashString(`${source.name}:${link}`)}`,
      category: source.category,
      source: source.name,
      title,
      url: link,
      publishedAt: published ? new Date(published).toISOString() : nowIso(),
      summary,
      confidence: "source feed, review recommended",
      region: source.region || "Global"
    });
  }
  return items;
}

async function ensureIndustryNewsSchema(env) {
  if (!env.MKG_DB) return;
  await env.MKG_DB.prepare(
    "CREATE TABLE IF NOT EXISTS industry_news_items (id TEXT PRIMARY KEY, category TEXT NOT NULL DEFAULT 'learning', source TEXT NOT NULL, title TEXT NOT NULL, url TEXT NOT NULL, published_at TEXT, summary TEXT, confidence TEXT NOT NULL DEFAULT 'review-needed', region TEXT DEFAULT 'Global', status TEXT NOT NULL DEFAULT 'published', created_at TEXT NOT NULL, updated_at TEXT NOT NULL)"
  ).run();
  await env.MKG_DB.prepare(
    "CREATE INDEX IF NOT EXISTS idx_industry_news_public ON industry_news_items (status, published_at)"
  ).run();
}

async function upsertIndustryNewsItem(env, item) {
  await env.MKG_DB.prepare(
    "INSERT INTO industry_news_items (id, category, source, title, url, published_at, summary, confidence, region, status, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'published', ?, ?) ON CONFLICT(id) DO UPDATE SET category = excluded.category, source = excluded.source, title = excluded.title, url = excluded.url, published_at = excluded.published_at, summary = excluded.summary, confidence = excluded.confidence, region = excluded.region, updated_at = excluded.updated_at"
  ).bind(
    item.id,
    cleanText(item.category, 40) || "learning",
    cleanText(item.source, 120),
    cleanText(item.title, 220),
    cleanText(item.url, 800),
    item.publishedAt || nowIso(),
    cleanIndustryText(item.summary, 600),
    cleanText(item.confidence, 80) || "review-needed",
    cleanText(item.region, 80) || "Global",
    nowIso(),
    nowIso()
  ).run();
}

async function collectIndustryNews(env) {
  if (!env.MKG_DB) return { ok: false, message: "MKG_DB is not connected." };
  await ensureIndustryNewsSchema(env);
  const collected = [];

  for (const source of industryNewsSources.feeds) {
    try {
      const response = await fetch(source.url, {
        headers: { "User-Agent": "MyKoiGardenBot/1.0 (+https://mykoigarden.com/industry-news.html)" }
      });
      if (!response.ok) continue;
      const text = await response.text();
      collected.push(...parseRssItems(text, source));
    } catch (error) {
      // A single source should not stop the daily collection.
    }
  }

  for (const source of industryNewsSources.watchPages) {
    const item = {
      id: `${hashString(`watch:${source.name}:${source.url}`)}`,
      category: source.category,
      source: source.name,
      title: `${source.name} official updates`,
      url: source.url,
      publishedAt: nowIso(),
      summary: `${source.name} is on the My Koi Garden watchlist for koi shows, organization updates, and event information. Review the source page for current announcements before publishing date-sensitive details.`,
      confidence: "watchlist source, human review required",
      region: source.region || "Global"
    };
    collected.push(item);
  }

  for (const item of collected.slice(0, 40)) {
    await upsertIndustryNewsItem(env, item);
  }

  return { ok: true, insertedOrUpdated: collected.length, generatedAt: nowIso() };
}

async function staticIndustryNewsFallback(request, env) {
  if (!env.ASSETS) return json({ ok: false, items: [], sourceWatchlist: industrySourceWatchlist() }, 503);
  const url = new URL("/industry-news.json", request.url);
  const response = await env.ASSETS.fetch(new Request(url.toString(), { method: "GET" }));
  if (!response.ok) return json({ ok: false, items: [], sourceWatchlist: industrySourceWatchlist() }, 503);
  const data = await response.json();
  return json(data);
}

async function getIndustryNews(request, env) {
  if (!env.MKG_DB) return staticIndustryNewsFallback(request, env);
  try {
    await ensureIndustryNewsSchema(env);
    let result = await env.MKG_DB.prepare(
      "SELECT id, category, source, title, url, published_at AS publishedAt, summary, confidence, region FROM industry_news_items WHERE status = 'published' ORDER BY published_at DESC, updated_at DESC LIMIT 60"
    ).all();
    let items = result.results || [];
    const videoCount = await env.MKG_DB.prepare(
      "SELECT COUNT(*) AS count FROM industry_news_items WHERE status = 'published' AND category = 'videos'"
    ).first();
    if (!items.length || Number(videoCount?.count || 0) === 0) {
      await collectIndustryNews(env);
      result = await env.MKG_DB.prepare(
        "SELECT id, category, source, title, url, published_at AS publishedAt, summary, confidence, region FROM industry_news_items WHERE status = 'published' ORDER BY published_at DESC, updated_at DESC LIMIT 60"
      ).all();
      items = result.results || [];
    }
    if (!items.length) return staticIndustryNewsFallback(request, env);
    return json({
      generatedAt: nowIso(),
      status: "automated-source-watch",
      items,
      sourceWatchlist: industrySourceWatchlist()
    });
  } catch (error) {
    return staticIndustryNewsFallback(request, env);
  }
}

async function notifyNewQuestion(env, item) {
  const isSale = item.page === "sale";
  const subject = isSale
    ? `[My Koi Garden] New koi sale inquiry: ${item.topic || "Available koi"}`
    : `[My Koi Garden] New koi question: ${item.topic || "Community"}`;
  const lines = [
    isSale ? "A new sale inquiry is waiting for review." : "A new question is waiting for review.",
    "",
    `Name: ${item.name || "Koi keeper"}`,
    `Email: ${item.email || ""}`,
    `Topic: ${item.topic || ""}`,
    `Page: ${item.page || "community"}`,
    `Language: ${item.lang || "en"}`,
    "",
    item.message || "",
    "",
    item.pondInfo ? `Pond details: ${item.pondInfo}` : "",
    "",
    "Review: https://mykoigarden.com/admin/community.html"
  ].filter(Boolean);

  try {
    if (env.RESEND_API_KEY && env.NOTIFY_EMAIL_TO && env.NOTIFY_EMAIL_FROM) {
      await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${env.RESEND_API_KEY}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          from: env.NOTIFY_EMAIL_FROM,
          to: [env.NOTIFY_EMAIL_TO],
          subject,
          text: lines.join("\n")
        })
      });
    }

    if (env.NOTIFY_WEBHOOK_URL) {
      await fetch(env.NOTIFY_WEBHOOK_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subject, text: lines.join("\n"), item })
      });
    }
  } catch (error) {
    // Notification should never block visitor submission.
  }
}

async function getApprovedComments(request, env) {
  const storageError = requireCommunityStorage(env);
  if (storageError) return storageError;

  const url = new URL(request.url);
  const page = cleanText(url.searchParams.get("page") || "community", 160);
  const lang = cleanText(url.searchParams.get("lang") || "en", 12);

  const result = await env.MKG_DB.prepare(
    "SELECT id, page, lang, topic, name, message, owner_reply, pinned, created_at, approved_at FROM community_comments WHERE status = 'approved' AND deleted_at IS NULL AND page = ? AND lang = ? ORDER BY pinned DESC, approved_at DESC, created_at DESC LIMIT 50"
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

  if (message.length < 2) {
    return json({ ok: false, message: "Please write your question first." }, 400);
  }

  const insert = await env.MKG_DB.prepare(
    "INSERT INTO community_comments (page, lang, topic, name, email, message, pond_info, status, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, 'pending', ?)"
  ).bind(page, lang, topic, name, email, message, pondInfo, createdAt).run();

  await notifyNewQuestion(env, {
    id: insert.meta?.last_row_id,
    page,
    lang,
    topic,
    name,
    email,
    message,
    pondInfo,
    createdAt
  });

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

function normalizeSaleImages(value) {
  const raw = String(value || "").trim();
  if (!raw) return "";
  if (raw.startsWith("data:image/")) return raw.slice(0, 1400000);
  if (raw.startsWith("/api/sale-image?key=")) return raw.slice(0, 500);
  if (!raw.startsWith("[")) return "";
  try {
    const images = JSON.parse(raw)
      .filter((item) => typeof item === "string" && (item.startsWith("data:image/") || item.startsWith("/api/sale-image?key=")))
      .slice(0, 9)
      .map((item) => item.startsWith("data:image/") ? item.slice(0, 1400000) : item.slice(0, 500));
    return images.length ? JSON.stringify(images) : "";
  } catch (error) {
    return "";
  }
}

async function adminUploadSaleImages(request, env) {
  const storageError = requireCommunityStorage(env);
  if (storageError) return storageError;
  if (!isAdmin(request, env)) return json({ ok: false, message: "Unauthorized." }, 401);
  if (!env.MKG_UPLOADS) {
    return json({ ok: false, message: "Upload storage is not connected." }, 503);
  }

  const form = await request.formData();
  const files = form.getAll("images").filter((file) => file && typeof file !== "string").slice(0, 9);
  if (!files.length) return json({ ok: false, message: "Please choose at least one image." }, 400);

  const allowed = new Set(["image/jpeg", "image/png", "image/webp"]);
  const urls = [];
  for (const file of files) {
    if (!allowed.has(file.type)) return json({ ok: false, message: "Please upload JPG, PNG, or WebP images." }, 400);
    if (file.size > 8 * 1024 * 1024) return json({ ok: false, message: "Please keep each image under 8 MB." }, 400);
    const safeName = cleanText(file.name, 90).replace(/[^a-z0-9._-]/gi, "-") || "koi-sale-photo.jpg";
    const key = `sale/${nowIso().slice(0, 10)}/${crypto.randomUUID()}-${safeName}`;
    await env.MKG_UPLOADS.put(key, file.stream(), {
      httpMetadata: { contentType: file.type },
      customMetadata: { originalName: safeName },
    });
    urls.push(`/api/sale-image?key=${encodeURIComponent(key)}`);
  }

  return json({ ok: true, urls });
}

async function getSaleImage(request, env) {
  if (!env.MKG_UPLOADS) return json({ ok: false, message: "Upload storage is not connected." }, 503);
  const url = new URL(request.url);
  const key = url.searchParams.get("key") || "";
  if (!key.startsWith("sale/")) return json({ ok: false, message: "Image not found." }, 404);
  const object = await env.MKG_UPLOADS.get(key);
  if (!object) return json({ ok: false, message: "Image not found." }, 404);
  const headers = new Headers();
  object.writeHttpMetadata(headers);
  headers.set("Cache-Control", "public, max-age=31536000, immutable");
  return new Response(object.body, { headers });
}

async function adminList(request, env) {
  const storageError = requireCommunityStorage(env);
  if (storageError) return storageError;
  if (!isAdmin(request, env)) return json({ ok: false, message: "Unauthorized." }, 401);

  const comments = await env.MKG_DB.prepare(
    "SELECT id, page, lang, topic, name, email, message, pond_info, owner_reply, pinned, status, created_at, approved_at FROM community_comments WHERE deleted_at IS NULL AND status IN ('pending', 'approved') ORDER BY CASE status WHEN 'pending' THEN 0 ELSE 1 END, pinned DESC, created_at DESC LIMIT 150"
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

  if (action === "pin" || action === "unpin") {
    if (table !== "community_comments") return json({ ok: false, message: "Only questions can be pinned." }, 400);
    await env.MKG_DB.prepare("UPDATE community_comments SET pinned = ? WHERE id = ?").bind(action === "pin" ? 1 : 0, id).run();
    return json({ ok: true, pinned: action === "pin" });
  }

  if (action === "delete") {
    if (table === "community_comments") {
      await env.MKG_DB.prepare("UPDATE community_comments SET status = 'deleted', deleted_at = ? WHERE id = ?").bind(nowIso(), id).run();
    } else {
      await env.MKG_DB.prepare("UPDATE community_uploads SET status = 'deleted' WHERE id = ?").bind(id).run();
    }
    return json({ ok: true, status: "deleted" });
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
    imageDataUrl: normalizeSaleImages(body.imageDataUrl || body.image_data_url),
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

const varietyPollOptions = [
  "kohaku",
  "sanke",
  "showa",
  "tancho",
  "utsuri",
  "ogon",
  "asagi",
  "longfin"
];

async function ensureVarietyPollSchema(env) {
  if (!env.MKG_DB) return;
  await env.MKG_DB.prepare(
    "CREATE TABLE IF NOT EXISTS variety_poll_votes (id INTEGER PRIMARY KEY AUTOINCREMENT, poll_id TEXT NOT NULL, voter_id TEXT NOT NULL, option_id TEXT NOT NULL, lang TEXT DEFAULT 'en', created_at TEXT NOT NULL, updated_at TEXT NOT NULL, UNIQUE(poll_id, voter_id))"
  ).run();
  await env.MKG_DB.prepare(
    "CREATE INDEX IF NOT EXISTS idx_variety_poll_results ON variety_poll_votes (poll_id, option_id)"
  ).run();
}

async function getVarietyPoll(request, env) {
  const storageError = requireCommunityStorage(env);
  if (storageError) return storageError;

  await ensureVarietyPollSchema(env);
  const url = new URL(request.url);
  const pollId = cleanText(url.searchParams.get("poll") || "mainstream-variety-2026", 80);
  const result = await env.MKG_DB.prepare(
    "SELECT option_id AS optionId, COUNT(*) AS count FROM variety_poll_votes WHERE poll_id = ? GROUP BY option_id"
  ).bind(pollId).all();
  const counts = Object.fromEntries(varietyPollOptions.map((id) => [id, 0]));
  for (const row of result.results || []) {
    if (varietyPollOptions.includes(row.optionId)) counts[row.optionId] = Number(row.count || 0);
  }
  const total = Object.values(counts).reduce((sum, value) => sum + value, 0);
  return json({ ok: true, pollId, counts, total });
}

async function voteVarietyPoll(request, env) {
  const storageError = requireCommunityStorage(env);
  if (storageError) return storageError;

  const body = await request.json().catch(() => null);
  if (!body) return json({ ok: false, message: "Missing vote." }, 400);

  const pollId = cleanText(body.pollId || "mainstream-variety-2026", 80);
  const optionId = cleanText(body.optionId, 40);
  const voterId = cleanText(body.voterId, 100);
  const lang = cleanText(body.lang || "en", 12);
  if (!varietyPollOptions.includes(optionId)) {
    return json({ ok: false, message: "Please choose a listed koi variety." }, 400);
  }
  if (voterId.length < 16) {
    return json({ ok: false, message: "Vote identifier is missing." }, 400);
  }

  await ensureVarietyPollSchema(env);
  const now = nowIso();
  await env.MKG_DB.prepare(
    "INSERT INTO variety_poll_votes (poll_id, voter_id, option_id, lang, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?) ON CONFLICT(poll_id, voter_id) DO UPDATE SET option_id = excluded.option_id, lang = excluded.lang, updated_at = excluded.updated_at"
  ).bind(pollId, voterId, optionId, lang, now, now).run();

  return getVarietyPoll(new Request(new URL(`/api/variety-poll?poll=${encodeURIComponent(pollId)}`, request.url).toString()), env);
}

async function apiFetch(request, env) {
  const url = new URL(request.url);
  if (url.pathname === "/api/comments" && request.method === "GET") return getApprovedComments(request, env);
  if (url.pathname === "/api/comments" && request.method === "POST") return createComment(request, env);
  if (url.pathname === "/api/uploads" && request.method === "POST") return createUpload(request, env);
  if (url.pathname === "/api/admin/submissions" && request.method === "GET") return adminList(request, env);
  if (url.pathname === "/api/admin/moderate" && request.method === "POST") return adminModerate(request, env);
  if (url.pathname === "/api/sale-listings" && request.method === "GET") return getSaleListings(request, env);
  if (url.pathname === "/api/sale-image" && request.method === "GET") return getSaleImage(request, env);
  if (url.pathname === "/api/admin/sale-images" && request.method === "POST") return adminUploadSaleImages(request, env);
  if (url.pathname === "/api/admin/sale-listings" && request.method === "GET") return getSaleListings(request, env);
  if (url.pathname === "/api/admin/sale-listings" && request.method === "POST") return adminSaveSaleListing(request, env);
  if (url.pathname === "/api/admin/sale-listings/delete" && request.method === "POST") return adminDeleteSaleListing(request, env);
  if (url.pathname === "/api/industry-news" && request.method === "GET") return getIndustryNews(request, env);
  if (url.pathname === "/api/variety-poll" && request.method === "GET") return getVarietyPoll(request, env);
  if (url.pathname === "/api/variety-poll" && request.method === "POST") return voteVarietyPoll(request, env);
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
  async scheduled(event, env, ctx) {
    ctx.waitUntil(collectIndustryNews(env));
  },

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
