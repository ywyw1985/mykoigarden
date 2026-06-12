(function () {
  function ready(callback) {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", callback, { once: true });
    } else {
      callback();
    }
  }

  ready(function () {
    const secret = document.getElementById("adminSecret");
    const loadButton = document.getElementById("loadListings");
    const status = document.getElementById("status");
    const form = document.getElementById("saleForm");
    const listingList = document.getElementById("listingList");
    const imageInput = document.getElementById("saleImage");
    const imagePreview = document.getElementById("imagePreview");
    const resetForm = document.getElementById("resetForm");
    const idInput = document.getElementById("listingId");
    let imageDataUrls = [];
    let listings = [];

    const savedSecret = localStorage.getItem("mkgAdminSecret");
    if (savedSecret) secret.value = savedSecret;

    function setStatus(message, isError) {
      status.textContent = message;
      status.style.color = isError ? "#8a1111" : "#17221d";
    }

    function authSecret() {
      const value = secret.value.trim();
      if (value) localStorage.setItem("mkgAdminSecret", value);
      return value;
    }

    function headers() {
      return {
        Authorization: `Bearer ${authSecret()}`,
        "Content-Type": "application/json",
      };
    }

    function requireSecret() {
      if (!authSecret()) {
        setStatus("Please enter the admin secret first.", true);
        secret.focus();
        return false;
      }
      return true;
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

    function parseImages(value) {
      if (!value) return [];
      if (Array.isArray(value)) return value.filter(Boolean).slice(0, 9);
      if (typeof value === "string" && value.startsWith("data:image/")) return [value];
      if (typeof value === "string" && value.startsWith("/api/sale-image?key=")) return [value];
      if (typeof value === "string" && value.trim().startsWith("[")) {
        try {
          return JSON.parse(value).filter((item) => typeof item === "string" && (item.startsWith("data:image/") || item.startsWith("/api/sale-image?key="))).slice(0, 9);
        } catch (error) {
          return [];
        }
      }
      return [];
    }

    function encodeImages(images) {
      const clean = parseImages(images);
      if (clean.length === 0) return "";
      if (clean.length === 1) return clean[0];
      return JSON.stringify(clean);
    }

    function dataUrlToBlob(dataUrl) {
      const parts = dataUrl.split(",");
      const mime = (parts[0].match(/data:([^;]+)/) || [])[1] || "image/jpeg";
      const binary = atob(parts[1] || "");
      const bytes = new Uint8Array(binary.length);
      for (let index = 0; index < binary.length; index += 1) bytes[index] = binary.charCodeAt(index);
      return new Blob([bytes], { type: mime });
    }

    async function uploadSaleImages(images) {
      const dataImages = parseImages(images).filter((image) => image.startsWith("data:image/"));
      if (!dataImages.length) return parseImages(images);
      const formData = new FormData();
      dataImages.forEach((image, index) => {
        formData.append("images", dataUrlToBlob(image), `koi-sale-${index + 1}.jpg`);
      });
      const response = await fetch("/api/admin/sale-images", {
        method: "POST",
        cache: "no-store",
        headers: { Authorization: `Bearer ${authSecret()}` },
        body: formData,
      });
      const result = await response.json().catch(() => null);
      if (!response.ok || !result || !result.ok) {
        throw new Error((result && result.message) || "Could not upload photos.");
      }
      return result.urls || [];
    }

    function showImages(images) {
      const clean = parseImages(images);
      if (!clean.length) {
        imagePreview.className = "sale-admin-preview-grid empty-state";
        imagePreview.textContent = "No images selected.";
        return;
      }
      imagePreview.className = "sale-admin-preview-grid";
      imagePreview.replaceChildren(...clean.map((dataUrl, index) => {
        const figure = document.createElement("figure");
        figure.innerHTML = `<img src="${dataUrl}" alt="Selected koi photo ${index + 1}"><figcaption>Photo ${index + 1}</figcaption>`;
        return figure;
      }));
    }

    function formData() {
      const data = Object.fromEntries(new FormData(form).entries());
      data.id = idInput.value;
      data.imageDataUrl = encodeImages(imageDataUrls);
      return data;
    }

    function clearForm() {
      form.reset();
      idInput.value = "";
      imageDataUrls = [];
      form.elements.status.value = "draft";
      form.elements.locationNote.value = "Local pickup near ZIP code 33331.";
      showImages([]);
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
      imageDataUrls = [];
      showImages(parseImages(item.image_data_url));
      setStatus("Listing loaded for editing. Change details, then tap Save listing.");
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
      const firstImage = parseImages(item.image_data_url)[0];
      article.querySelector(".sale-listing-thumb").innerHTML = firstImage ? `<img src="${firstImage}" alt="">` : "No photo";
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
      if (!requireSecret()) return;
      setStatus("Loading listings...");
      const response = await fetch("/api/admin/sale-listings?all=1", {
        cache: "no-store",
        headers: headers(),
      });
      const result = await response.json().catch(() => null);
      if (!response.ok || !result || !result.ok) {
        setStatus((result && result.message) || "Could not load listings. Check the admin secret.", true);
        return;
      }
      listings = result.listings || [];
      render();
      setStatus("Listings loaded.");
    }

    async function saveListing(event) {
      event.preventDefault();
      if (!requireSecret()) return;
      if (!form.elements.title.value.trim()) {
        setStatus("Please enter a title before saving.", true);
        form.elements.title.focus();
        return;
      }
      const submitter = event.submitter || form.querySelector("button[type='submit']");
      if (submitter) submitter.disabled = true;
      setStatus("Saving listing...");
      try {
        let data = formData();
        if (parseImages(imageDataUrls).some((image) => image.startsWith("data:image/"))) {
          setStatus("Uploading photos...");
          const uploadedUrls = await uploadSaleImages(imageDataUrls);
          imageDataUrls = uploadedUrls;
          data = formData();
        }
        const response = await fetch("/api/admin/sale-listings", {
          method: "POST",
          cache: "no-store",
          headers: headers(),
          body: JSON.stringify(data),
        });
        const result = await response.json().catch(() => null);
        if (!response.ok || !result || !result.ok) {
          setStatus((result && result.message) || "Could not save listing. Check the admin secret and listing details.", true);
          return;
        }
        setStatus(result.message || "Listing saved.");
        clearForm();
        await loadListings();
      } catch (error) {
        setStatus("Could not save listing. Please try again.", true);
      } finally {
        if (submitter) submitter.disabled = false;
      }
    }

    async function deleteListing(id) {
      if (!requireSecret()) return;
      if (!confirm("Delete this listing?")) return;
      setStatus("Deleting listing...");
      const response = await fetch("/api/admin/sale-listings/delete", {
        method: "POST",
        cache: "no-store",
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
      const files = Array.from(imageInput.files || []).slice(0, 9);
      if (!files.length) return;
      if ((imageInput.files || []).length > 9) setStatus("Only the first 9 photos will be used.");
      else setStatus("Compressing photos...");
      try {
        imageDataUrls = [];
        for (const file of files) {
          imageDataUrls.push(await compressImage(file));
        }
        showImages(imageDataUrls);
        setStatus(`${imageDataUrls.length} photo${imageDataUrls.length === 1 ? "" : "s"} ready. Tap Save listing to publish or save as draft.`);
      } catch (error) {
        setStatus("Could not read these photos. Please choose another set.", true);
      }
    });

    loadButton.addEventListener("click", loadListings);
    resetForm.addEventListener("click", clearForm);
    form.addEventListener("submit", saveListing, true);

    document.addEventListener("click", function (event) {
      const button = event.target.closest("#saleForm button[type='submit']");
      if (!button) return;
      event.preventDefault();
      form.requestSubmit(button);
    });
  });
})();
