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

  function imageGallery(item) {
    const images = parseImages(item.image_data_url);
    if (!images.length) return '<div class="sale-photo-placeholder">Photo coming soon</div>';
    return `<div class="sale-photo-gallery">${images.map((image, index) => `<a href="${image}" target="_blank" rel="noopener"><img src="${image}" alt="${item.title || "Koi for sale"} photo ${index + 1}"></a>`).join("")}</div>`;
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
        <div class="grid two">
          <label><span class="sale-name-label"></span><input name="name" type="text" autocomplete="name"></label>
          <label><span class="sale-email-label"></span><input name="email" type="email" autocomplete="email"></label>
        </div>
        <label><span class="sale-message-label"></span><textarea name="message" rows="4" required></textarea></label>
        <button class="primary" type="submit"></button>
        <p class="form-status" aria-live="polite"></p>
      </form>
    `;
    article.querySelector(".sale-media").innerHTML = imageGallery(item);
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
