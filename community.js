(function () {
  const state = document.querySelector("[data-community-status]");
  const commentForm = document.querySelector("[data-comment-form]");
  const uploadForm = document.querySelector("[data-upload-form]");
  const list = document.querySelector("[data-approved-comments]");

  function setStatus(message, tone) {
    if (!state) return;
    state.textContent = message;
    state.dataset.tone = tone || "neutral";
  }

  function lang() {
    return document.documentElement.lang || "en";
  }

  async function submitComment(event) {
    event.preventDefault();
    const form = event.currentTarget;
    const payload = Object.fromEntries(new FormData(form).entries());
    payload.page = "community";
    payload.lang = lang();

    setStatus("Submitting your question for review...", "neutral");
    const response = await fetch("/api/comments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const result = await response.json().catch(() => ({ ok: false, message: "The server did not return a readable response." }));

    if (!result.ok) {
      setStatus(result.message || "The question could not be submitted yet.", "error");
      return;
    }

    form.reset();
    setStatus(result.message || "Thank you. Your question is waiting for review.", "success");
  }

  async function submitUpload(event) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    data.set("page", "community");
    data.set("lang", lang());

    setStatus("Uploading image for review...", "neutral");
    const response = await fetch("/api/uploads", {
      method: "POST",
      body: data,
    });
    const result = await response.json().catch(() => ({ ok: false, message: "The server did not return a readable response." }));

    if (!result.ok) {
      setStatus(result.message || "The image could not be uploaded yet.", "error");
      return;
    }

    form.reset();
    setStatus(result.message || "Image received and waiting for review.", "success");
  }

  function commentCard(item) {
    const article = document.createElement("article");
    article.className = "qa-card community-approved-card";
    article.innerHTML = `
      <p class="tag"></p>
      <h3></h3>
      <p class="community-message"></p>
      <div class="owner-reply" hidden>
        <strong>My Koi Garden reply</strong>
        <p></p>
      </div>
    `;
    article.querySelector(".tag").textContent = item.topic || "Community question";
    article.querySelector("h3").textContent = item.name ? `Question from ${item.name}` : "Community question";
    article.querySelector(".community-message").textContent = item.message || "";
    const reply = article.querySelector(".owner-reply");
    if (item.owner_reply) {
      reply.hidden = false;
      reply.querySelector("p").textContent = item.owner_reply;
    }
    return article;
  }

  async function loadComments() {
    if (!list) return;
    const response = await fetch(`/api/comments?page=community&lang=${encodeURIComponent(lang())}`);
    if (!response.ok) return;
    const result = await response.json().catch(() => null);
    if (!result || !result.ok || !result.comments || result.comments.length === 0) return;
    list.replaceChildren(...result.comments.map(commentCard));
  }

  if (commentForm) commentForm.addEventListener("submit", submitComment);
  if (uploadForm) uploadForm.addEventListener("submit", submitUpload);
  loadComments();
})();
