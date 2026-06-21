(function () {
  const list = document.querySelector("[data-industry-news-list]");
  const status = document.querySelector("[data-industry-news-status]");
  const sources = document.querySelector("[data-industry-news-sources]");
  if (!list) return;

  const lang = (document.documentElement.lang || "en").toLowerCase();
  const locale = lang.startsWith("zh") ? "zh-CN" : lang.startsWith("ja") ? "ja-JP" : lang.startsWith("es") ? "es" : undefined;
  const copy = {
    en: {
      labels: {
        shows: "Shows & events",
        auctions: "Auctions & breeder updates",
        videos: "Video updates",
        market: "Market notes",
        learning: "Learning"
      },
      datePending: "Date pending",
      sourcePending: "Source pending",
      global: "Global",
      lastUpdated: "Last updated",
      loadError: "News data could not be loaded. Please try again later."
    },
    zh: {
      labels: {
        shows: "展会与活动",
        auctions: "拍卖与鱼场动态",
        videos: "视频更新",
        market: "市场信息",
        learning: "知识资源"
      },
      datePending: "日期待确认",
      sourcePending: "来源待确认",
      global: "全球",
      lastUpdated: "最近更新",
      loadError: "行业动态暂时无法加载，请稍后再试。"
    },
    es: {
      labels: {
        shows: "Exposiciones y eventos",
        auctions: "Subastas y criadores",
        videos: "Videos",
        market: "Mercado",
        learning: "Aprendizaje"
      },
      datePending: "Fecha pendiente",
      sourcePending: "Fuente pendiente",
      global: "Global",
      lastUpdated: "Actualizado",
      loadError: "No se pudieron cargar las noticias. Intente de nuevo mas tarde."
    },
    ja: {
      labels: {
        shows: "品評会・イベント",
        auctions: "オークション・生産者情報",
        videos: "動画更新",
        market: "市場情報",
        learning: "学習資料"
      },
      datePending: "日付未確認",
      sourcePending: "情報源未確認",
      global: "世界",
      lastUpdated: "最終更新",
      loadError: "ニュースを読み込めませんでした。時間をおいて再度お試しください。"
    }
  };
  const t = lang.startsWith("zh") ? copy.zh : lang.startsWith("ja") ? copy.ja : lang.startsWith("es") ? copy.es : copy.en;

  function formatDate(value) {
    if (!value) return t.datePending;
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return date.toLocaleDateString(locale, { year: "numeric", month: "short", day: "numeric" });
  }

  function escapeHTML(value) {
    return String(value || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function itemCard(item) {
    const card = document.createElement("article");
    card.className = "news-card";
    const category = t.labels[item.category] || item.category || "Industry";
    card.innerHTML = `
      <p class="tag">${escapeHTML(category)}</p>
      <h3><a href="${escapeHTML(item.url)}" target="_blank" rel="noopener noreferrer">${escapeHTML(item.title)}</a></h3>
      <p class="news-meta">${escapeHTML(formatDate(item.publishedAt))} &middot; ${escapeHTML(item.source || t.sourcePending)} &middot; ${escapeHTML(item.region || t.global)}</p>
      <p>${escapeHTML(item.summary || "")}</p>
    `;
    return card;
  }

  function sourceRow(source) {
    const li = document.createElement("li");
    li.innerHTML = `<a href="${escapeHTML(source.url)}" target="_blank" rel="noopener noreferrer">${escapeHTML(source.name)}</a> <span>${escapeHTML(source.type || "source")}</span><p>${escapeHTML(source.notes || "")}</p>`;
    return li;
  }

  function render(data) {
    list.innerHTML = "";
    (data.items || []).forEach((item) => list.appendChild(itemCard(item)));
    if (sources) {
      sources.innerHTML = "";
      (data.sourceWatchlist || []).forEach((source) => sources.appendChild(sourceRow(source)));
    }
    if (status) {
      const generated = data.generatedAt ? formatDate(data.generatedAt) : "not generated yet";
      status.textContent = `${t.lastUpdated}: ${generated}.`;
    }
  }

  function loadStaticFallback() {
    return fetch("/industry-news.json", { cache: "no-store" }).then((response) => response.json());
  }

  fetch("/api/industry-news", { cache: "no-store" })
    .then((response) => {
      if (!response.ok) return loadStaticFallback();
      return response.json();
    })
    .then(render)
    .catch(() => {
      if (status) status.textContent = t.loadError;
    });
})();
