(function () {
  "use strict";

  const language = (document.documentElement.lang || "en").toLowerCase().slice(0, 2);
  const copy = {
    en: {
      heroKicker: "Local koi community", heroTitle: "Find koi keepers near you",
      heroText: "Share local koi listings, find new homes for healthy fish, and ask practical questions. My Koi Garden provides information and communication tools only.",
      listings: "Local listings", questions: "Koi Q&A", heading: "Koi near you",
      intro: "Browse koi offered for sale, free rehoming, exchange, or wanted by nearby hobbyists. Exact home addresses and private emails are never displayed.",
      useLocation: "Use my location", changeLocation: "Search location", locationPlaceholder: "City, region, country, or postal code",
      allTypes: "All listings", sale: "For sale", rehoming: "Free rehoming", exchange: "Exchange", wanted: "Wanted",
      radius: "Distance", nearest: "Nearest first", recent: "Recent listings", post: "Post a local listing",
      postIntro: "Listings are reviewed before publication and expire after 30 days. Add current photos of the actual koi.",
      title: "Listing title", titleHint: "Example: Kohaku, approximately 18 inches", type: "Listing type", variety: "Variety",
      size: "Approx. size", price: "Price or exchange terms", country: "Country", region: "State / province / region",
      city: "City", postal: "Postal code", health: "Known health information", healthHint: "Current condition, recent treatment, testing, or write Not tested.",
      notes: "Description", name: "Your name", email: "Private contact email", photos: "Photos", photoHelp: "Up to 9 JPG, PNG, or WebP photos. Wanted posts may be submitted without a photo.",
      markLocation: "Use current location for distance", locationSaved: "Approximate coordinates added. Your exact location will not be displayed.",
      agreement: "I confirm that this information is accurate and understand that My Koi Garden does not process payments, inspect koi, arrange transport, or guarantee transactions.",
      submit: "Submit for review", submitting: "Submitting...", received: "Your listing was received and is waiting for review.",
      loading: "Loading local listings...", empty: "No approved listings match this area yet. Be the first local hobbyist to post.",
      approximate: "Approximate location", away: "away", expires: "Expires", photosCount: "photos", inquire: "Ask about this listing",
      inquiryMessage: "Message", inquiryHint: "Ask about availability, health history, viewing, or local pickup.", send: "Send inquiry", sent: "Your inquiry was sent to the listing contact.",
      platformNote: "Community noticeboard only", platformText: "My Koi Garden does not collect payment, hold deposits, inspect fish, arrange delivery, or provide a transaction guarantee. Verify fish health, ownership, price, and pickup details directly.",
      locationDenied: "Location was not shared. You can still search by city or region.", networkLocation: "Approximate network location",
      error: "Something did not work. Please check the form and try again.", sold: "Sold", pending: "On hold", rehomed: "Rehomed", exchanged: "Exchanged", closed: "Closed", available: "Available",
    },
    zh: {
      heroKicker: "本地锦鲤鱼友社区", heroTitle: "找到你附近的锦鲤鱼友",
      heroText: "发布本地锦鲤出售、赠养、交换或求购信息，也可以交流实际养殖问题。My Koi Garden只提供信息展示和联系工具。",
      listings: "本地信息", questions: "锦鲤问答", heading: "附近的锦鲤信息",
      intro: "浏览附近鱼友发布的出售、免费赠养、交换和求购信息。家庭详细地址、私人邮箱均不会公开。",
      useLocation: "使用我的位置", changeLocation: "搜索地区", locationPlaceholder: "城市、省州、国家或邮编",
      allTypes: "全部信息", sale: "出售", rehoming: "免费赠养", exchange: "交换", wanted: "求购",
      radius: "距离范围", nearest: "距离优先", recent: "最新发布", post: "发布本地信息",
      postIntro: "所有信息经审核后公开，30天后自动到期。请上传所发布锦鲤的近期实拍照片。",
      title: "信息标题", titleHint: "例如：红白，体长约45厘米", type: "信息类型", variety: "品种",
      size: "大概尺寸", price: "价格或交换条件", country: "国家", region: "省／州／地区",
      city: "城市", postal: "邮政编码", health: "已知健康情况", healthHint: "填写当前状态、近期治疗、检测结果，未检测请明确写“未检测”。",
      notes: "详细说明", name: "您的称呼", email: "私人联系邮箱", photos: "照片", photoHelp: "最多9张JPG、PNG或WebP实拍照片；求购信息可以不上传照片。",
      markLocation: "使用当前位置计算距离", locationSaved: "已记录大概坐标，页面不会显示您的精确位置。",
      agreement: "我确认所填信息真实，并理解My Koi Garden不收款、不验鱼、不安排运输，也不对交易提供担保。",
      submit: "提交审核", submitting: "正在提交……", received: "信息已收到，审核通过后会公开显示。",
      loading: "正在加载本地信息……", empty: "这个地区暂时没有符合条件的已审核信息，您可以成为当地第一位发布者。",
      approximate: "大概位置", away: "外", expires: "到期", photosCount: "张照片", inquire: "询问发布者",
      inquiryMessage: "询问内容", inquiryHint: "可询问是否仍有效、健康记录、看鱼或本地自提安排。", send: "发送询问", sent: "询问已发送给发布者。",
      platformNote: "仅为社区信息栏", platformText: "My Koi Garden不代收款、不保管订金、不检查鱼况、不安排运输，也不提供交易担保。请双方自行核实鱼况、所有权、价格和自提安排。",
      locationDenied: "没有获得定位权限，您仍可以按城市或地区搜索。", networkLocation: "网络推测的大概位置",
      error: "操作未成功，请检查填写内容后重试。", sold: "已售", pending: "暂定", rehomed: "已赠养", exchanged: "已交换", closed: "已结束", available: "有效",
    },
    es: {
      heroKicker: "Comunidad local de koi", heroTitle: "Encuentra aficionados al koi cerca de ti",
      heroText: "Publica anuncios locales de venta, adopción gratuita, intercambio o búsqueda de koi y comparte preguntas prácticas. My Koi Garden solo facilita información y contacto.",
      listings: "Anuncios locales", questions: "Preguntas y respuestas", heading: "Koi cerca de ti",
      intro: "Consulta anuncios de aficionados cercanos. Las direcciones exactas y los correos privados nunca se muestran públicamente.",
      useLocation: "Usar mi ubicación", changeLocation: "Buscar ubicación", locationPlaceholder: "Ciudad, región, país o código postal",
      allTypes: "Todos", sale: "En venta", rehoming: "Adopción gratuita", exchange: "Intercambio", wanted: "Se busca",
      radius: "Distancia", nearest: "Más cercanos", recent: "Más recientes", post: "Publicar un anuncio local",
      postIntro: "Los anuncios se revisan antes de publicarse y caducan a los 30 días. Añade fotos actuales del koi real.",
      title: "Título", titleHint: "Ejemplo: Kohaku de unos 45 cm", type: "Tipo de anuncio", variety: "Variedad",
      size: "Tamaño aproximado", price: "Precio o condiciones", country: "País", region: "Estado / provincia / región",
      city: "Ciudad", postal: "Código postal", health: "Información de salud conocida", healthHint: "Estado actual, tratamientos recientes, pruebas o indique No analizado.",
      notes: "Descripción", name: "Nombre", email: "Correo privado de contacto", photos: "Fotos", photoHelp: "Hasta 9 fotos JPG, PNG o WebP. Los anuncios de búsqueda pueden publicarse sin foto.",
      markLocation: "Usar ubicación actual para la distancia", locationSaved: "Se añadió una ubicación aproximada. La posición exacta no se mostrará.",
      agreement: "Confirmo que la información es correcta y entiendo que My Koi Garden no procesa pagos, inspecciona koi, organiza transporte ni garantiza transacciones.",
      submit: "Enviar para revisión", submitting: "Enviando...", received: "El anuncio fue recibido y está pendiente de revisión.",
      loading: "Cargando anuncios locales...", empty: "Todavía no hay anuncios aprobados para esta zona.",
      approximate: "Ubicación aproximada", away: "de distancia", expires: "Caduca", photosCount: "fotos", inquire: "Preguntar por este anuncio",
      inquiryMessage: "Mensaje", inquiryHint: "Pregunta por disponibilidad, salud, visita o recogida local.", send: "Enviar consulta", sent: "La consulta se envió al contacto del anuncio.",
      platformNote: "Solo tablón comunitario", platformText: "My Koi Garden no cobra pagos, retiene depósitos, inspecciona peces, organiza entregas ni ofrece garantías. Verifica directamente la salud, propiedad, precio y recogida.",
      locationDenied: "No se compartió la ubicación. Puedes buscar por ciudad o región.", networkLocation: "Ubicación aproximada de red",
      error: "No se pudo completar la operación. Revisa el formulario e inténtalo de nuevo.", sold: "Vendido", pending: "Reservado", rehomed: "Reubicado", exchanged: "Intercambiado", closed: "Cerrado", available: "Disponible",
    },
    ja: {
      heroKicker: "地域の錦鯉コミュニティ", heroTitle: "近くの錦鯉愛好家とつながる",
      heroText: "錦鯉の販売、無償譲渡、交換、募集を地域ごとに掲載し、飼育について質問できます。My Koi Gardenは情報掲載と連絡手段のみを提供します。",
      listings: "地域の情報", questions: "錦鯉Q&A", heading: "近くの錦鯉情報",
      intro: "近隣の愛好家による販売、無償譲渡、交換、募集情報を閲覧できます。自宅の詳細住所や非公開メールは表示されません。",
      useLocation: "現在地を使用", changeLocation: "地域を検索", locationPlaceholder: "市区町村、都道府県、国、郵便番号",
      allTypes: "すべて", sale: "販売", rehoming: "無償譲渡", exchange: "交換", wanted: "募集",
      radius: "距離", nearest: "近い順", recent: "新着順", post: "地域情報を投稿",
      postIntro: "投稿は審査後に公開され、30日後に期限切れになります。実際の錦鯉の最近の写真を追加してください。",
      title: "タイトル", titleHint: "例：紅白、約45cm", type: "投稿区分", variety: "品種",
      size: "おおよそのサイズ", price: "価格または交換条件", country: "国", region: "都道府県／地域",
      city: "市区町村", postal: "郵便番号", health: "把握している健康情報", healthHint: "現在の状態、最近の治療、検査結果。未検査の場合は「未検査」と明記してください。",
      notes: "詳細", name: "お名前", email: "非公開の連絡用メール", photos: "写真", photoHelp: "JPG、PNG、WebPを最大9枚。募集投稿は写真なしでも送信できます。",
      markLocation: "現在地を距離計算に使用", locationSaved: "おおよその座標を追加しました。正確な位置は公開されません。",
      agreement: "情報が正確であることを確認し、My Koi Gardenが決済、魚の検査、輸送手配、取引保証を行わないことに同意します。",
      submit: "審査に送信", submitting: "送信中...", received: "投稿を受け付けました。審査後に公開されます。",
      loading: "地域情報を読み込んでいます...", empty: "この地域には条件に合う承認済み情報がまだありません。",
      approximate: "おおよその地域", away: "先", expires: "期限", photosCount: "枚", inquire: "投稿者に問い合わせる",
      inquiryMessage: "お問い合わせ内容", inquiryHint: "掲載状況、健康履歴、見学、地域での受け渡しについて質問できます。", send: "問い合わせを送信", sent: "投稿者へ問い合わせを送信しました。",
      platformNote: "地域コミュニティ掲示板", platformText: "My Koi Gardenは代金や手付金を預からず、魚の検査、配送手配、取引保証を行いません。健康状態、所有権、価格、受け渡し方法は当事者間で確認してください。",
      locationDenied: "位置情報は共有されませんでした。市区町村や地域名で検索できます。", networkLocation: "ネットワークによるおおよその位置",
      error: "処理できませんでした。入力内容を確認してもう一度お試しください。", sold: "売約済み", pending: "保留中", rehomed: "譲渡済み", exchanged: "交換済み", closed: "終了", available: "掲載中",
    },
  };

  const words = copy[language] || copy.en;
  const main = document.querySelector("main");
  const questionsPanel = main && main.querySelector(".article-layout");
  if (!main || !questionsPanel || document.querySelector("[data-local-community]")) return;

  document.querySelectorAll('.nav > a[href*="local-koi-for-sale"]').forEach((link) => link.remove());
  const hero = main.querySelector(".page-hero");
  if (hero) {
    const kicker = hero.querySelector(".article-meta");
    const title = hero.querySelector("h1");
    const text = hero.querySelector(".page-hero-inner > p:not(.article-meta)");
    if (kicker) kicker.textContent = words.heroKicker;
    if (title) title.textContent = words.heroTitle;
    if (text) text.textContent = words.heroText;
    const actions = hero.querySelector(".hero-actions");
    if (actions) actions.remove();
  }

  const hub = document.createElement("section");
  hub.className = "local-community";
  hub.dataset.localCommunity = "";
  hub.innerHTML = `
    <div class="community-tabs" role="tablist" aria-label="Community views">
      <button type="button" role="tab" data-community-tab="listings">${words.listings}</button>
      <button type="button" role="tab" data-community-tab="questions">${words.questions}</button>
    </div>
    <div class="local-listings-panel" data-community-panel="listings">
      <div class="local-listings-heading">
        <div><p class="section-kicker">${words.heroKicker}</p><h2>${words.heading}</h2><p>${words.intro}</p></div>
        <details class="local-post-disclosure"><summary class="button primary">${words.post}</summary><div data-listing-form-slot></div></details>
      </div>
      <div class="local-platform-note"><strong>${words.platformNote}</strong><span>${words.platformText}</span></div>
      <div class="local-listing-controls">
        <label>${words.changeLocation}<input type="search" data-location-search placeholder="${words.locationPlaceholder}"></label>
        <label>${words.type}<select data-type-filter><option value="all">${words.allTypes}</option><option value="sale">${words.sale}</option><option value="rehoming">${words.rehoming}</option><option value="exchange">${words.exchange}</option><option value="wanted">${words.wanted}</option></select></label>
        <label>${words.radius}<select data-radius-filter><option value="25">25 km</option><option value="50">50 km</option><option value="100" selected>100 km</option><option value="250">250 km</option><option value="1000">1000 km</option></select></label>
        <button class="button secondary" type="button" data-use-location>${words.useLocation}</button>
      </div>
      <p class="local-location-status" data-location-status>${words.loading}</p>
      <div class="local-listing-grid" data-local-listings aria-live="polite"></div>
    </div>
  `;
  main.insertBefore(hub, questionsPanel);
  questionsPanel.dataset.communityPanel = "questions";

  const form = document.createElement("form");
  form.className = "local-listing-form";
  form.dataset.localListingForm = "";
  form.innerHTML = `
    <p>${words.postIntro}</p>
    <div class="form-grid"><label>${words.type}<select name="listingType"><option value="sale">${words.sale}</option><option value="rehoming">${words.rehoming}</option><option value="exchange">${words.exchange}</option><option value="wanted">${words.wanted}</option></select></label><label>${words.title}<input name="title" required maxlength="120" placeholder="${words.titleHint}"></label></div>
    <div class="form-grid"><label>${words.variety}<input name="variety" maxlength="80"></label><label>${words.size}<input name="sizeText" maxlength="80"></label></div>
    <label>${words.price}<input name="price" maxlength="60"></label>
    <div class="form-grid"><label>${words.country}<input name="country" required maxlength="100"></label><label>${words.region}<input name="region" maxlength="100"></label></div>
    <div class="form-grid"><label>${words.city}<input name="city" required maxlength="100"></label><label>${words.postal}<input name="postalCode" maxlength="30"></label></div>
    <button class="local-form-location" type="button" data-form-location>${words.markLocation}</button><span class="local-form-location-status" data-form-location-status></span>
    <input name="latitude" type="hidden"><input name="longitude" type="hidden"><input name="lang" type="hidden" value="${language}"><input class="listing-honeypot" name="website" tabindex="-1" autocomplete="off">
    <label>${words.health}<textarea name="healthNote" rows="3" placeholder="${words.healthHint}"></textarea></label>
    <label>${words.notes}<textarea name="notes" rows="5"></textarea></label>
    <div class="form-grid"><label>${words.name}<input name="sellerName" required maxlength="80" autocomplete="name"></label><label>${words.email}<input name="sellerEmail" required type="email" maxlength="160" autocomplete="email"></label></div>
    <label>${words.photos}<input name="images" type="file" accept="image/jpeg,image/png,image/webp" multiple><span class="field-help">${words.photoHelp}</span></label>
    <label class="local-listing-agreement"><input name="agreement" type="checkbox" required><span>${words.agreement}</span></label>
    <button class="button primary" type="submit">${words.submit}</button><p class="form-status" data-listing-form-status aria-live="polite"></p>
  `;
  hub.querySelector("[data-listing-form-slot]").appendChild(form);

  const tabs = Array.from(hub.querySelectorAll("[data-community-tab]"));
  const listingsPanel = hub.querySelector('[data-community-panel="listings"]');
  const initialView = new URL(location.href).searchParams.get("view") === "listings" ? "listings" : "questions";

  function selectView(view, updateUrl) {
    tabs.forEach((tab) => {
      const active = tab.dataset.communityTab === view;
      tab.setAttribute("aria-selected", String(active));
      tab.tabIndex = active ? 0 : -1;
    });
    listingsPanel.hidden = view !== "listings";
    questionsPanel.hidden = view !== "questions";
    if (updateUrl) {
      const url = new URL(location.href);
      if (view === "listings") url.searchParams.set("view", "listings");
      else url.searchParams.delete("view");
      history.pushState({ communityView: view }, "", url);
    }
  }
  tabs.forEach((tab) => tab.addEventListener("click", () => selectView(tab.dataset.communityTab, true)));
  window.addEventListener("popstate", () => selectView(new URL(location.href).searchParams.get("view") === "listings" ? "listings" : "questions", false));
  selectView(initialView, false);

  const listingGrid = hub.querySelector("[data-local-listings]");
  const locationStatus = hub.querySelector("[data-location-status]");
  const searchInput = hub.querySelector("[data-location-search]");
  const typeFilter = hub.querySelector("[data-type-filter]");
  const radiusFilter = hub.querySelector("[data-radius-filter]");
  let visitorLocation = null;
  let loadTimer = 0;

  function setLocationStatus(message, tone) {
    locationStatus.textContent = message;
    locationStatus.dataset.tone = tone || "neutral";
  }

  function countryName(code) {
    if (!code) return "";
    try { return new Intl.DisplayNames([language], { type: "region" }).of(code.toUpperCase()) || code; }
    catch (error) { return code; }
  }

  function parseImages(value) {
    if (!value) return [];
    if (Array.isArray(value)) return value.filter(Boolean).slice(0, 9);
    if (typeof value === "string" && value.startsWith("/api/sale-image?key=")) return [value];
    try { return JSON.parse(value).filter((item) => typeof item === "string").slice(0, 9); }
    catch (error) { return []; }
  }

  function formatDistance(km, country) {
    if (!Number.isFinite(Number(km))) return "";
    const useMiles = String(country || "").toLowerCase().includes("united states") || String(country || "").toUpperCase() === "US";
    const value = useMiles ? Number(km) * 0.621371 : Number(km);
    return `${value < 10 ? value.toFixed(1) : Math.round(value)} ${useMiles ? "mi" : "km"} ${words.away}`;
  }

  function typeLabel(type) { return words[type] || words.sale; }
  function statusLabel(status) { return words[status] || words.available; }

  function openImages(images, title) {
    if (!images.length) return;
    let index = 0;
    const dialog = document.createElement("dialog");
    dialog.className = "local-image-dialog";
    dialog.innerHTML = `<button type="button" class="local-dialog-close" aria-label="Close">×</button><button type="button" class="local-dialog-prev" aria-label="Previous">‹</button><figure><img alt=""><figcaption></figcaption></figure><button type="button" class="local-dialog-next" aria-label="Next">›</button>`;
    function render() {
      dialog.querySelector("img").src = images[index];
      dialog.querySelector("img").alt = `${title} ${index + 1}`;
      dialog.querySelector("figcaption").textContent = `${index + 1} / ${images.length}`;
      dialog.querySelector(".local-dialog-prev").hidden = images.length < 2;
      dialog.querySelector(".local-dialog-next").hidden = images.length < 2;
    }
    dialog.querySelector(".local-dialog-close").addEventListener("click", () => dialog.close());
    dialog.querySelector(".local-dialog-prev").addEventListener("click", () => { index = (index - 1 + images.length) % images.length; render(); });
    dialog.querySelector(".local-dialog-next").addEventListener("click", () => { index = (index + 1) % images.length; render(); });
    dialog.addEventListener("close", () => dialog.remove());
    document.body.appendChild(dialog); render(); dialog.showModal();
  }

  function listingCard(item) {
    const card = document.createElement("article");
    card.className = "local-listing-card";
    const images = parseImages(item.image_data_url);
    const media = document.createElement("button");
    media.className = "local-listing-media";
    media.type = "button";
    if (images.length) {
      const image = document.createElement("img");
      image.src = images[0]; image.alt = item.title || "Local koi"; image.loading = "lazy";
      media.appendChild(image);
      if (images.length > 1) {
        const count = document.createElement("span"); count.className = "local-photo-count"; count.textContent = `${images.length} ${words.photosCount}`; media.appendChild(count);
      }
      media.addEventListener("click", () => openImages(images, item.title || "Local koi"));
    } else {
      media.classList.add("is-placeholder"); media.textContent = typeLabel(item.listing_type);
    }
    card.appendChild(media);

    const body = document.createElement("div"); body.className = "local-listing-body";
    const meta = document.createElement("div"); meta.className = "local-listing-meta";
    const type = document.createElement("span"); type.textContent = typeLabel(item.listing_type);
    const state = document.createElement("span"); state.textContent = statusLabel(item.listing_status);
    if (item.listing_status !== "available") state.classList.add("is-closed");
    meta.append(type, state);
    const title = document.createElement("h3"); title.textContent = item.title || typeLabel(item.listing_type);
    const locationLine = document.createElement("p"); locationLine.className = "local-listing-location";
    const locationParts = [item.city, item.region, item.country].filter(Boolean);
    const distance = formatDistance(item.distance_km, item.country);
    locationLine.textContent = [locationParts.join(", ") || item.location_label || words.approximate, distance].filter(Boolean).join(" · ");
    body.append(meta, title, locationLine);

    const facts = document.createElement("dl"); facts.className = "local-listing-facts";
    [[words.variety, item.variety], [words.size, item.size_text], [words.price, item.price]].forEach(([label, value]) => {
      if (!value) return;
      const row = document.createElement("div"); const dt = document.createElement("dt"); const dd = document.createElement("dd"); dt.textContent = label; dd.textContent = value; row.append(dt, dd); facts.appendChild(row);
    });
    if (facts.children.length) body.appendChild(facts);
    if (item.health_note) { const health = document.createElement("p"); health.className = "local-listing-note"; health.textContent = `${words.health}: ${item.health_note}`; body.appendChild(health); }
    if (item.notes) { const notes = document.createElement("p"); notes.className = "local-listing-note"; notes.textContent = item.notes; body.appendChild(notes); }

    const inquiry = document.createElement("details"); inquiry.className = "local-listing-inquiry";
    inquiry.innerHTML = `<summary>${words.inquire}</summary><form><div class="form-grid"><label>${words.name}<input name="name" required autocomplete="name"></label><label>${words.email}<input name="email" required type="email" autocomplete="email"></label></div><label>${words.inquiryMessage}<textarea name="message" rows="4" required placeholder="${words.inquiryHint}"></textarea></label><input class="listing-honeypot" name="website" tabindex="-1" autocomplete="off"><button class="button primary" type="submit">${words.send}</button><p class="form-status" aria-live="polite"></p></form>`;
    const inquiryForm = inquiry.querySelector("form");
    inquiryForm.addEventListener("submit", async (event) => {
      event.preventDefault();
      const status = inquiryForm.querySelector(".form-status"); const button = inquiryForm.querySelector("button");
      button.disabled = true; status.textContent = words.submitting;
      const payload = Object.fromEntries(new FormData(inquiryForm).entries()); payload.listingId = item.id; payload.lang = language;
      try {
        const response = await fetch("/api/listing-inquiries", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
        const result = await response.json().catch(() => null);
        if (!response.ok || !result || !result.ok) throw new Error(result && result.message);
        inquiryForm.reset(); status.textContent = words.sent; status.dataset.tone = "success";
      } catch (error) { status.textContent = (error && error.message) || words.error; status.dataset.tone = "error"; }
      finally { button.disabled = false; }
    });
    body.appendChild(inquiry); card.appendChild(body); return card;
  }

  async function loadListings() {
    setLocationStatus(words.loading);
    const params = new URLSearchParams();
    params.set("type", typeFilter.value);
    if (searchInput.value.trim()) params.set("search", searchInput.value.trim());
    if (!searchInput.value.trim() && visitorLocation && Number.isFinite(visitorLocation.latitude) && Number.isFinite(visitorLocation.longitude)) {
      params.set("lat", visitorLocation.latitude); params.set("lng", visitorLocation.longitude); params.set("radiusKm", radiusFilter.value);
    }
    try {
      const response = await fetch(`/api/local-listings?${params}`, { cache: "no-store" });
      const result = await response.json().catch(() => null);
      if (!response.ok || !result || !result.ok) throw new Error();
      listingGrid.replaceChildren(...(result.listings || []).map(listingCard));
      if (!result.listings.length) listingGrid.innerHTML = `<p class="local-listing-empty">${words.empty}</p>`;
      const locationLabel = visitorLocation ? [visitorLocation.city, visitorLocation.region, visitorLocation.country].filter(Boolean).join(", ") : "";
      setLocationStatus(locationLabel ? `${words.nearest} · ${locationLabel}` : words.recent, "success");
    } catch (error) { listingGrid.innerHTML = `<p class="local-listing-empty">${words.error}</p>`; setLocationStatus(words.error, "error"); }
  }

  function scheduleLoad() { clearTimeout(loadTimer); loadTimer = setTimeout(loadListings, 250); }
  searchInput.addEventListener("input", scheduleLoad); typeFilter.addEventListener("change", loadListings); radiusFilter.addEventListener("change", loadListings);

  async function useBrowserLocation(forForm) {
    if (!navigator.geolocation) { setLocationStatus(words.locationDenied, "error"); return; }
    navigator.geolocation.getCurrentPosition((position) => {
      const latitude = Math.round(position.coords.latitude * 100) / 100;
      const longitude = Math.round(position.coords.longitude * 100) / 100;
      if (forForm) {
        form.elements.latitude.value = latitude; form.elements.longitude.value = longitude;
        form.querySelector("[data-form-location-status]").textContent = words.locationSaved;
      } else {
        visitorLocation = { ...(visitorLocation || {}), latitude, longitude };
        sessionStorage.setItem("mkgVisitorLocation", JSON.stringify(visitorLocation)); loadListings();
      }
    }, () => setLocationStatus(words.locationDenied, "error"), { enableHighAccuracy: false, timeout: 8000, maximumAge: 300000 });
  }
  hub.querySelector("[data-use-location]").addEventListener("click", () => useBrowserLocation(false));
  form.querySelector("[data-form-location]").addEventListener("click", () => useBrowserLocation(true));

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const status = form.querySelector("[data-listing-form-status]"); const button = form.querySelector("button[type='submit']");
    const files = Array.from(form.elements.images.files || []);
    if (files.length > 9) { status.textContent = words.photoHelp; status.dataset.tone = "error"; return; }
    button.disabled = true; button.textContent = words.submitting; status.textContent = words.submitting;
    try {
      const response = await fetch("/api/local-listings", { method: "POST", body: new FormData(form) });
      const result = await response.json().catch(() => null);
      if (!response.ok || !result || !result.ok) throw new Error(result && result.message);
      form.reset(); form.elements.lang.value = language; status.textContent = words.received; status.dataset.tone = "success";
    } catch (error) { status.textContent = (error && error.message) || words.error; status.dataset.tone = "error"; }
    finally { button.disabled = false; button.textContent = words.submit; }
  });

  try { visitorLocation = JSON.parse(sessionStorage.getItem("mkgVisitorLocation") || "null"); } catch (error) { visitorLocation = null; }
  if (visitorLocation) loadListings();
  else fetch("/api/visitor-location", { cache: "no-store" }).then((response) => response.json()).then((result) => {
    if (!result || !result.ok || !result.location) throw new Error();
    visitorLocation = result.location;
    if (visitorLocation.country && visitorLocation.country.length === 2) visitorLocation.country = countryName(visitorLocation.country);
    form.elements.country.value = visitorLocation.country || "";
    form.elements.region.value = visitorLocation.region || "";
    form.elements.city.value = visitorLocation.city || "";
    form.elements.postalCode.value = visitorLocation.postalCode || "";
    form.elements.latitude.value = visitorLocation.latitude ?? "";
    form.elements.longitude.value = visitorLocation.longitude ?? "";
    setLocationStatus(`${words.networkLocation}: ${[visitorLocation.city, visitorLocation.region, visitorLocation.country].filter(Boolean).join(", ")}`, "neutral");
    loadListings();
  }).catch(() => { visitorLocation = null; loadListings(); });
})();
