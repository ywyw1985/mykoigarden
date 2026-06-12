(function () {
  const secret = document.getElementById("adminSecret");
  const load = document.getElementById("loadSubmissions");
  const status = document.getElementById("status");
  const comments = document.getElementById("pendingComments");
  const uploads = document.getElementById("pendingUploads");

  const savedSecret = localStorage.getItem("mkgAdminSecret");
  if (savedSecret) secret.value = savedSecret;

  function setStatus(message, isError) {
    status.textContent = message;
    status.style.color = isError ? "#8a1111" : "#17221d";
  }

  function adminSecret() {
    const value = secret.value.trim();
    if (value) localStorage.setItem("mkgAdminSecret", value);
    return value;
  }

  function authHeaders() {
    return {
      Authorization: `Bearer ${adminSecret()}`,
      "Content-Type": "application/json",
    };
  }

  function empty(container, message) {
    container.className = "fields empty-state";
    container.textContent = message;
  }

  function renderComments(items) {
    comments.className = "fields";
    comments.replaceChildren();
    if (!items.length) {
      empty(comments, "No questions.");
      return;
    }
    items.forEach((item) => {
      const card = document.createElement("article");
      card.className = "field-card moderation-card";
      card.innerHTML = `
        <div class="field-meta"><span></span><span></span><span></span><span></span><span></span></div>
        <h3></h3>
        <p class="moderation-body"></p>
        <p class="moderation-body pond-info"></p>
        <label>Public reply
          <textarea rows="4" placeholder="Optional answer to publish with this question"></textarea>
        </label>
        <div class="moderation-actions">
          <button class="primary approve" type="button">Approve / update reply</button>
          <button class="pin" type="button"></button>
          <button class="reject" type="button">Reject</button>
          <button class="danger delete" type="button">Delete</button>
        </div>
      `;
      const meta = card.querySelectorAll(".field-meta span");
      meta[0].textContent = item.status || "pending";
      meta[1].textContent = item.pinned ? "Pinned" : "Not pinned";
      meta[2].textContent = item.topic || "Question";
      meta[3].textContent = item.lang || "en";
      const dateSpan = meta[4];
      dateSpan.textContent = item.created_at || "";
      card.querySelector("h3").textContent = `${item.name || "Koi keeper"} ${item.email ? `<${item.email}>` : ""}`;
      card.querySelector(".moderation-body").textContent = item.message || "";
      card.querySelector(".pond-info").textContent = item.pond_info ? `Pond details: ${item.pond_info}` : "";
      card.querySelector("textarea").value = item.owner_reply || "";
      card.querySelector(".approve").addEventListener("click", () => moderate("comment", item.id, "approve", card.querySelector("textarea").value));
      const pinButton = card.querySelector(".pin");
      pinButton.textContent = item.pinned ? "Unpin" : "Pin";
      pinButton.addEventListener("click", () => moderate("comment", item.id, item.pinned ? "unpin" : "pin"));
      card.querySelector(".reject").addEventListener("click", () => moderate("comment", item.id, "reject"));
      card.querySelector(".delete").addEventListener("click", () => {
        if (confirm("Delete this question from the moderation list and public page?")) moderate("comment", item.id, "delete");
      });
      comments.appendChild(card);
    });
  }

  function renderUploads(items) {
    uploads.className = "fields";
    uploads.replaceChildren();
    if (!items.length) {
      empty(uploads, "No pending images.");
      return;
    }
    items.forEach((item) => {
      const card = document.createElement("article");
      card.className = "field-card moderation-card";
      card.innerHTML = `
        <div class="field-meta"><span></span><span></span><span></span></div>
        <h3></h3>
        <p class="moderation-body"></p>
        <p class="help"></p>
        <div class="moderation-actions">
          <button class="primary approve" type="button">Approve</button>
          <button class="reject" type="button">Reject</button>
          <button class="danger delete" type="button">Delete</button>
        </div>
      `;
      const meta = card.querySelectorAll(".field-meta span");
      meta[0].textContent = item.lang || "en";
      meta[1].textContent = item.created_at || "";
      meta[2].textContent = item.status || "pending";
      card.querySelector("h3").textContent = `${item.name || "Koi keeper"} ${item.email ? `<${item.email}>` : ""}`;
      card.querySelector(".moderation-body").textContent = item.caption || "No caption.";
      card.querySelector(".help").textContent = `R2 key: ${item.r2_key}`;
      card.querySelector(".approve").addEventListener("click", () => moderate("upload", item.id, "approve"));
      card.querySelector(".reject").addEventListener("click", () => moderate("upload", item.id, "reject"));
      card.querySelector(".delete").addEventListener("click", () => {
        if (confirm("Delete this image submission?")) moderate("upload", item.id, "delete");
      });
      uploads.appendChild(card);
    });
  }

  async function loadSubmissions() {
    if (!adminSecret()) {
      setStatus("Enter the admin secret first.", true);
      secret.focus();
      return;
    }
    setStatus("Loading questions...");
    const response = await fetch("/api/admin/submissions", { cache: "no-store", headers: authHeaders() });
    const result = await response.json().catch(() => null);
    if (!response.ok || !result || !result.ok) {
      setStatus((result && result.message) || "Could not load submissions.", true);
      return;
    }
    renderComments(result.comments || []);
    renderUploads(result.uploads || []);
    setStatus("Questions loaded.");
  }

  async function moderate(type, id, action, reply) {
    setStatus(`${action} item...`);
    const response = await fetch("/api/admin/moderate", {
      method: "POST",
      cache: "no-store",
      headers: authHeaders(),
      body: JSON.stringify({ type, id, action, reply: reply || "" }),
    });
    const result = await response.json().catch(() => null);
    if (!response.ok || !result || !result.ok) {
      setStatus((result && result.message) || "Moderation failed.", true);
      return;
    }
    await loadSubmissions();
  }

  load.addEventListener("click", loadSubmissions);
})();
