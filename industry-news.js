(function () {
  const list = document.querySelector("[data-industry-news-list]");
  const status = document.querySelector("[data-industry-news-status]");
  const sources = document.querySelector("[data-industry-news-sources]");
  if (!list) return;

  const labels = {
    shows: "Shows & events",
    auctions: "Auctions & breeder updates",
    videos: "Video updates",
    market: "Market notes",
    learning: "Learning"
  };

  function formatDate(value) {
    if (!value) return "Date pending";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return date.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
  }

  function itemCard(item) {
    const card = document.createElement("article");
    card.className = "news-card";
    const category = labels[item.category] || item.category || "Industry";
    card.innerHTML = `
      <p class="tag">${category}</p>
      <h3><a href="${item.url}" target="_blank" rel="noopener noreferrer">${item.title}</a></h3>
      <p class="news-meta">${formatDate(item.publishedAt)} · ${item.source || "Source pending"} · ${item.region || "Global"}</p>
      <p>${item.summary || ""}</p>
      <p class="news-confidence">Status: ${item.confidence || "review needed"}</p>
    `;
    return card;
  }

  function sourceRow(source) {
    const li = document.createElement("li");
    li.innerHTML = `<a href="${source.url}" target="_blank" rel="noopener noreferrer">${source.name}</a> <span>${source.type || "source"}</span><p>${source.notes || ""}</p>`;
    return li;
  }

  fetch("/industry-news.json", { cache: "no-store" })
    .then((response) => response.json())
    .then((data) => {
      list.innerHTML = "";
      (data.items || []).forEach((item) => list.appendChild(itemCard(item)));
      if (sources) {
        sources.innerHTML = "";
        (data.sourceWatchlist || []).forEach((source) => sources.appendChild(sourceRow(source)));
      }
      if (status) {
        const generated = data.generatedAt ? formatDate(data.generatedAt) : "not generated yet";
        status.textContent = `Last generated: ${generated}. Mode: ${data.status || "draft"}.`;
      }
    })
    .catch(() => {
      if (status) status.textContent = "News data could not be loaded. Please try again later.";
    });
})();
