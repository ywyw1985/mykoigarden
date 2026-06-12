(function () {
  const grid = document.querySelector("[data-sale-listings]");
  if (!grid) return;

  function statusLabel(status) {
    return {
      published: "Available",
      available: "Available",
      hold: "On hold",
      sold: "Sold",
      draft: "Draft",
    }[status] || "Available";
  }

  function card(item) {
    const article = document.createElement("article");
    article.className = "sale-card";
    article.innerHTML = `
      <div class="sale-photo-placeholder"></div>
      <p class="tag"></p>
      <h3></h3>
      <dl>
        <div><dt>Variety</dt><dd class="variety"></dd></div>
        <div><dt>Size</dt><dd class="size"></dd></div>
        <div><dt>Sex</dt><dd class="sex"></dd></div>
        <div><dt>Price</dt><dd class="price"></dd></div>
        <div><dt>Notes</dt><dd class="notes"></dd></div>
      </dl>
    `;
    const photo = article.querySelector(".sale-photo-placeholder");
    if (item.image_data_url) {
      photo.className = "sale-photo";
      photo.innerHTML = `<a href="${item.image_data_url}" target="_blank" rel="noopener"><img src="${item.image_data_url}" alt="${item.title || "Koi for sale"}"></a>`;
    } else {
      photo.textContent = "Photo coming soon";
    }
    article.querySelector(".tag").textContent = statusLabel(item.status);
    article.querySelector("h3").textContent = item.title || "Koi for sale";
    article.querySelector(".variety").textContent = item.variety || "Ask for details";
    article.querySelector(".size").textContent = item.size_text || "To be measured";
    article.querySelector(".sex").textContent = item.sex || "Unknown";
    article.querySelector(".price").textContent = item.price || "Ask for price";
    article.querySelector(".notes").textContent = item.notes || item.location_note || "Local pickup near ZIP code 33331.";
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
