(function () {
  const secret = document.getElementById("adminSecret");
  const loadButton = document.getElementById("loadListings");
  const status = document.getElementById("status");
  const form = document.getElementById("saleForm");
  const listingList = document.getElementById("listingList");
  const imageInput = document.getElementById("saleImage");
  const imagePreview = document.getElementById("imagePreview");
  const resetForm = document.getElementById("resetForm");
  const idInput = document.getElementById("listingId");
  let imageDataUrl = "";
  let listings = [];

  function setStatus(message, isError) {
    status.textContent = message;
    status.style.color = isError ? "#8a1111" : "#17221d";
  }

  function headers() {
    return {
      Authorization: `Bearer ${secret.value.trim()}`,
      "Content-Type": "application/json",
    };
  }

  function readFile(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  async function compressImage(file) {
    const dataUrl = await readFile(file);
    const image = new Image();
    await new Promise((resolve, reject) => {
      image.onload = resolve;
      image.onerror = reject;
      image.src = dataUrl;
    });
    const maxSide = 1400;
    const scale = Math.min(1, maxSide / Math.max(image.width, image.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(image.width * scale));
    canvas.height = Math.max(1, Math.round(image.height * scale));
    const context = canvas.getContext("2d");
    context.drawImage(image, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL("image/jpeg", 0.82);
  }

  function showImage(dataUrl) {
    if (!dataUrl) {
      imagePreview.className = "sale-admin-preview empty-state";
      imagePreview.textContent = "No image selected.";
      return;
    }
    imagePreview.className = "sale-admin-preview";
    imagePreview.innerHTML = `<img src="${dataUrl}" alt="Selected koi photo">`;
  }

  function formData() {
    const data = Object.fromEntries(new FormData(form).entries());
    data.id = idInput.value;
    data.imageDataUrl = imageDataUrl;
    return data;
  }

  function clearForm() {
    form.reset();
    idInput.value = "";
    imageDataUrl = "";
    form.elements.locationNote.value = "Local pickup near ZIP code 33331.";
    showImage("");
  }

  function fillForm(item) {
    idInput.value = item.id || "";
    form.elements.title.value = item.title || "";
    form.elements.status.value = item.status || "draft";
    form.elements.variety.value = item.variety || "";
    form.elements.sizeText.value = item.size_text || "";
    form.elements.sex.value = item.sex || "";
    form.elements.price.value = item.price || "";
    form.elements.notes.value = item.notes || "";
    form.elements.locationNote.value = item.location_note || "Local pickup near ZIP code 33331.";
    imageDataUrl = "";
    showImage(item.image_data_url || "");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function card(item) {
    const article = document.createElement("article");
    article.className = "field-card sale-listing-admin-card";
    article.innerHTML = `
      <div class="sale-listing-admin-row">
        <div class="sale-listing-thumb"></div>
        <div>
          <div class="field-meta"><span></span><span></span><span></span></div>
          <h3></h3>
          <p></p>
          <div class="moderation-actions">
            <button class="primary edit" type="button">Edit</button>
            <button class="reject delete" type="button">Delete</button>
          </div>
        </div>
      </div>
    `;
    article.querySelector(".sale-listing-thumb").innerHTML = item.image_data_url ? `<img src="${item.image_data_url}" alt="">` : "No photo";
    const meta = article.querySelectorAll(".field-meta span");
    meta[0].textContent = item.status || "draft";
    meta[1].textContent = item.price || "No price";
    meta[2].textContent = item.updated_at || "";
    article.querySelector("h3").textContent = item.title || "Untitled koi";
    article.querySelector("p").textContent = [item.variety, item.size_text, item.sex].filter(Boolean).join(" | ") || "No details yet.";
    article.querySelector(".edit").addEventListener("click", () => fillForm(item));
    article.querySelector(".delete").addEventListener("click", () => deleteListing(item.id));
    return article;
  }

  function render() {
    listingList.className = "fields";
    if (!listings.length) {
      listingList.className = "fields empty-state";
      listingList.textContent = "No listings yet.";
      return;
    }
    listingList.replaceChildren(...listings.map(card));
  }

  async function loadListings() {
    setStatus("Loading listings...");
    const response = await fetch("/api/admin/sale-listings?all=1", { headers: headers() });
    const result = await response.json().catch(() => null);
    if (!response.ok || !result || !result.ok) {
      setStatus((result && result.message) || "Could not load listings.", true);
      return;
    }
    listings = result.listings || [];
    render();
    setStatus("Listings loaded.");
  }

  async function saveListing(event) {
    event.preventDefault();
    setStatus("Saving listing...");
    const response = await fetch("/api/admin/sale-listings", {
      method: "POST",
      headers: headers(),
      body: JSON.stringify(formData()),
    });
    const result = await response.json().catch(() => null);
    if (!response.ok || !result || !result.ok) {
      setStatus((result && result.message) || "Could not save listing.", true);
      return;
    }
    setStatus(result.message || "Listing saved.");
    clearForm();
    await loadListings();
  }

  async function deleteListing(id) {
    if (!confirm("Delete this listing?")) return;
    setStatus("Deleting listing...");
    const response = await fetch("/api/admin/sale-listings/delete", {
      method: "POST",
      headers: headers(),
      body: JSON.stringify({ id }),
    });
    const result = await response.json().catch(() => null);
    if (!response.ok || !result || !result.ok) {
      setStatus((result && result.message) || "Could not delete listing.", true);
      return;
    }
    await loadListings();
  }

  imageInput.addEventListener("change", async () => {
    const file = imageInput.files && imageInput.files[0];
    if (!file) return;
    setStatus("Compressing photo...");
    imageDataUrl = await compressImage(file);
    showImage(imageDataUrl);
    setStatus("Photo ready.");
  });
  loadButton.addEventListener("click", loadListings);
  resetForm.addEventListener("click", clearForm);
  form.addEventListener("submit", saveListing);
})();
