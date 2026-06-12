(function () {
  const grid = document.querySelector("[data-sale-listings]");
  if (!grid) return;

  function lang() {
    return document.documentElement.lang || "en";
  }

  function text(key) {
    const dictionary = {
      inquiry: { zh: "询价 / 问询", es: "Consultar", ja: "問い合わせる", en: "Ask about this koi" },
      name: { zh: "姓名", es: "Nombre", ja: "お名前", en: "Name" },
      email: { zh: "邮箱", es: "Email", ja: "メール", en: "Email" },
      message: { zh: "想了解的问题", es: "Mensaje", ja: "お問い合わせ内容", en: "Message" },
      submit: { zh: "提交询价", es: "Enviar consulta", ja: "送信", en: "Send inquiry" },
      sending: { zh: "正在提交...", es: "Enviando...", ja: "送信中...", en: "Sending..." },
      success: { zh: "已提交，等待审核后我会回复。", es: "Enviado. Revisare el mensaje y respondere.", ja: "送信されました。確認後に返信します。", en: "Sent. I will review it and reply." },
      short: { zh: "请先填写询价内容。", es: "Escribe tu mensaje primero.", ja: "内容を入力してください。", en: "Please write your message first." },
      error: { zh: "提交没有成功，请稍后再试。", es: "No se pudo enviar. Intenta de nuevo.", ja: "送信できませんでした。もう一度お試しください。", en: "Could not send. Please try again." },
      details: { zh: "我想了解这条锦鲤的价格、尺寸、健康状况和看鱼时间。", es: "Me interesa conocer precio, tamano, salud y disponibilidad.", ja: "価格、サイズ、健康状態、見学可能時間を知りたいです。", en: "I would like to ask about price, size, health, and viewing availability." }
    };
    dictionary.inquiry.zh = "\u8be2\u4ef7 / \u95ee\u8be2";
    dictionary.name.zh = "\u59d3\u540d";
    dictionary.email.zh = "\u90ae\u7bb1";
    dictionary.message.zh = "\u60f3\u4e86\u89e3\u7684\u95ee\u9898";
    dictionary.submit.zh = "\u63d0\u4ea4\u8be2\u4ef7";
    dictionary.sending.zh = "\u6b63\u5728\u63d0\u4ea4...";
    dictionary.success.zh = "\u5df2\u63d0\u4ea4\uff0c\u7b49\u5f85\u5ba1\u6838\u540e\u6211\u4f1a\u56de\u590d\u3002";
    dictionary.short.zh = "\u8bf7\u5148\u586b\u5199\u8be2\u4ef7\u5185\u5bb9\u3002";
    dictionary.error.zh = "\u63d0\u4ea4\u6ca1\u6709\u6210\u529f\uff0c\u8bf7\u7a0d\u540e\u518d\u8bd5\u3002";
    dictionary.details.zh = "\u6211\u60f3\u4e86\u89e3\u8fd9\u6761\u9526\u9ca4\u7684\u4ef7\u683c\u3001\u5c3a\u5bf8\u3001\u5065\u5eb7\u72b6\u51b5\u548c\u770b\u9c7c\u65f6\u95f4\u3002";
    dictionary.inquiry.ja = "\u554f\u3044\u5408\u308f\u305b\u308b";
    dictionary.name.ja = "\u304a\u540d\u524d";
    dictionary.email.ja = "\u30e1\u30fc\u30eb";
    dictionary.message.ja = "\u304a\u554f\u3044\u5408\u308f\u305b\u5185\u5bb9";
    dictionary.submit.ja = "\u9001\u4fe1";
    dictionary.sending.ja = "\u9001\u4fe1\u4e2d...";
    dictionary.success.ja = "\u9001\u4fe1\u3055\u308c\u307e\u3057\u305f\u3002\u78ba\u8a8d\u5f8c\u306b\u8fd4\u4fe1\u3057\u307e\u3059\u3002";
    dictionary.short.ja = "\u5185\u5bb9\u3092\u5165\u529b\u3057\u3066\u304f\u3060\u3055\u3044\u3002";
    dictionary.error.ja = "\u9001\u4fe1\u3067\u304d\u307e\u305b\u3093\u3067\u3057\u305f\u3002\u3082\u3046\u4e00\u5ea6\u304a\u8a66\u3057\u304f\u3060\u3055\u3044\u3002";
    dictionary.details.ja = "\u4fa1\u683c\u3001\u30b5\u30a4\u30ba\u3001\u5065\u5eb7\u72b6\u614b\u3001\u898b\u5b66\u53ef\u80fd\u6642\u9593\u3092\u77e5\u308a\u305f\u3044\u3067\u3059\u3002";
    const code = lang().toLowerCase().slice(0, 2);
    return (dictionary[key] && (dictionary[key][code] || dictionary[key].en)) || key;
  }

  function statusLabel(status) {
    return {
      published: "Available",
      available: "Available",
      hold: "On hold",
      sold: "Sold",
      draft: "Draft",
    }[status] || "Available";
  }

  function parseImages(value) {
    if (!value) return [];
    if (Array.isArray(value)) return value.filter(Boolean).slice(0, 9);
    if (typeof value === "string" && value.startsWith("data:image/")) return [value];
    if (typeof value === "string" && value.trim().startsWith("[")) {
      try {
        return JSON.parse(value).filter((item) => typeof item === "string" && item.startsWith("data:image/")).slice(0, 9);
      } catch (error) {
        return [];
      }
    }
    return [];
  }

  function ensureLightbox() {
    let lightbox = document.querySelector("[data-sale-lightbox]");
    if (lightbox) return lightbox;
    lightbox = document.createElement("div");
    lightbox.className = "sale-lightbox";
    lightbox.setAttribute("data-sale-lightbox", "");
    lightbox.hidden = true;
    lightbox.innerHTML = `
      <button class="sale-lightbox-close" type="button" aria-label="Close image">Close</button>
      <button class="sale-lightbox-prev" type="button" aria-label="Previous image">‹</button>
      <figure>
        <img alt="">
        <figcaption></figcaption>
      </figure>
      <button class="sale-lightbox-next" type="button" aria-label="Next image">›</button>
    `;
    document.body.appendChild(lightbox);
    lightbox.addEventListener("click", (event) => {
      if (event.target === lightbox || event.target.closest(".sale-lightbox-close")) closeLightbox();
    });
    document.addEventListener("keydown", (event) => {
      if (lightbox.hidden) return;
      if (event.key === "Escape") closeLightbox();
      if (event.key === "ArrowLeft") stepLightbox(-1);
      if (event.key === "ArrowRight") stepLightbox(1);
    });
    lightbox.querySelector(".sale-lightbox-prev").addEventListener("click", () => stepLightbox(-1));
    lightbox.querySelector(".sale-lightbox-next").addEventListener("click", () => stepLightbox(1));
    return lightbox;
  }

  let lightboxImages = [];
  let lightboxIndex = 0;
  let lightboxTitle = "";

  function renderLightbox() {
    const lightbox = ensureLightbox();
    const image = lightboxImages[lightboxIndex];
    if (!image) return;
    lightbox.querySelector("img").src = image;
    lightbox.querySelector("img").alt = `${lightboxTitle || "Koi photo"} ${lightboxIndex + 1}`;
    lightbox.querySelector("figcaption").textContent = `${lightboxTitle || "Koi photo"} - photo ${lightboxIndex + 1} of ${lightboxImages.length}`;
    lightbox.querySelector(".sale-lightbox-prev").hidden = lightboxImages.length < 2;
    lightbox.querySelector(".sale-lightbox-next").hidden = lightboxImages.length < 2;
  }

  function openLightbox(images, index, title) {
    lightboxImages = images;
    lightboxIndex = index;
    lightboxTitle = title || "Koi photo";
    const lightbox = ensureLightbox();
    renderLightbox();
    lightbox.hidden = false;
    document.body.classList.add("sale-lightbox-open");
  }

  function closeLightbox() {
    const lightbox = ensureLightbox();
    lightbox.hidden = true;
    document.body.classList.remove("sale-lightbox-open");
  }

  function stepLightbox(step) {
    if (!lightboxImages.length) return;
    lightboxIndex = (lightboxIndex + step + lightboxImages.length) % lightboxImages.length;
    renderLightbox();
  }

  function imageGallery(item) {
    const images = parseImages(item.image_data_url);
    if (!images.length) return '<div class="sale-photo-placeholder">Photo coming soon</div>';
    return `<div class="sale-photo-gallery">${images.map((image, index) => `<button class="sale-photo-zoom" type="button" data-index="${index}" aria-label="Open koi photo ${index + 1}"><img src="${image}" alt="Koi for sale photo ${index + 1}"></button>`).join("")}</div>`;
  }

  function card(item) {
    const article = document.createElement("article");
    article.className = "sale-card";
    article.innerHTML = `
      <div class="sale-media"></div>
      <p class="tag"></p>
      <h3></h3>
      <dl>
        <div><dt>Variety</dt><dd class="variety"></dd></div>
        <div><dt>Size</dt><dd class="size"></dd></div>
        <div><dt>Sex</dt><dd class="sex"></dd></div>
        <div><dt>Price</dt><dd class="price"></dd></div>
        <div><dt>Notes</dt><dd class="notes"></dd></div>
      </dl>
      <button class="sale-inquiry-toggle" type="button"></button>
      <form class="qa-form sale-inquiry-form" hidden>
        <div class="form-grid">
          <label><span class="sale-name-label"></span><input name="name" type="text" autocomplete="name"></label>
          <label><span class="sale-email-label"></span><input name="email" type="email" autocomplete="email"></label>
        </div>
        <label><span class="sale-message-label"></span><textarea name="message" rows="4" required></textarea></label>
        <button class="button primary" type="submit"></button>
        <p class="form-status" aria-live="polite"></p>
      </form>
    `;
    article.querySelector(".sale-media").innerHTML = imageGallery(item);
    const galleryImages = parseImages(item.image_data_url);
    article.querySelectorAll(".sale-photo-zoom").forEach((button) => {
      button.addEventListener("click", () => {
        openLightbox(galleryImages, Number(button.dataset.index || 0), item.title || "Koi for sale");
      });
    });
    article.querySelector(".tag").textContent = statusLabel(item.status);
    article.querySelector("h3").textContent = item.title || "Koi for sale";
    article.querySelector(".variety").textContent = item.variety || "Ask for details";
    article.querySelector(".size").textContent = item.size_text || "To be measured";
    article.querySelector(".sex").textContent = item.sex || "Unknown";
    article.querySelector(".price").textContent = item.price || "Ask for price";
    article.querySelector(".notes").textContent = item.notes || item.location_note || "Local pickup near ZIP code 33331.";
    const toggle = article.querySelector(".sale-inquiry-toggle");
    const form = article.querySelector(".sale-inquiry-form");
    toggle.textContent = text("inquiry");
    article.querySelector(".sale-name-label").textContent = text("name");
    article.querySelector(".sale-email-label").textContent = text("email");
    article.querySelector(".sale-message-label").textContent = text("message");
    form.elements.message.value = text("details");
    form.querySelector("button[type='submit']").textContent = text("submit");
    toggle.addEventListener("click", () => {
      form.hidden = !form.hidden;
      if (!form.hidden) form.elements.message.focus();
    });
    form.addEventListener("submit", async (event) => {
      event.preventDefault();
      const status = form.querySelector(".form-status");
      const payload = Object.fromEntries(new FormData(form).entries());
      payload.page = "sale";
      payload.lang = lang();
      payload.topic = `Sale inquiry: ${item.title || "Available koi"}`;
      payload.pondInfo = [item.variety, item.size_text, item.price].filter(Boolean).join(" | ");
      if (!payload.message || payload.message.trim().length < 2) {
        status.textContent = text("short");
        status.dataset.tone = "error";
        return;
      }
      status.textContent = text("sending");
      status.dataset.tone = "neutral";
      const button = form.querySelector("button[type='submit']");
      button.disabled = true;
      try {
        const response = await fetch("/api/comments", {
          method: "POST",
          cache: "no-store",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });
        const result = await response.json().catch(() => null);
        if (!response.ok || !result || !result.ok) throw new Error("inquiry failed");
        form.reset();
        form.elements.message.value = text("details");
        status.textContent = text("success");
        status.dataset.tone = "success";
      } catch (error) {
        status.textContent = text("error");
        status.dataset.tone = "error";
      } finally {
        button.disabled = false;
      }
    });
    return article;
  }

  async function load() {
    const response = await fetch("/api/sale-listings");
    const result = await response.json().catch(() => null);
    if (!response.ok || !result || !result.ok || !result.listings || result.listings.length === 0) return;
    grid.replaceChildren(...result.listings.map(card));
  }

  load();
})();
