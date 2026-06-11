(function () {
  const secret = document.getElementById("adminSecret");
  const load = document.getElementById("loadSubmissions");
  const status = document.getElementById("status");
  const comments = document.getElementById("pendingComments");
  const uploads = document.getElementById("pendingUploads");

  function setStatus(message, isError) {
    status.textContent = message;
    status.style.color = isError ? "#8a1111" : "#17221d";
  }

  function authHeaders() {
    return {
      Authorization: `Bearer ${secret.value.trim()}`,
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
      empty(comments, "No pending questions.");
      return;
    }
    items.forEach((item) => {
      const card = document.createElement("article");
      card.className = "field-card moderation-card";
      card.innerHTML = `
        <div class="field-meta"><span></span><span></span><span></span></div>
        <h3></h3>
        <p class="moderation-body"></p>
        <p class="moderation-body pond-info"></p>
        <label>Public reply
          <textarea rows="4" placeholder="Optional answer to publish with this question"></textarea>
        </label>
        <div class="moderation-actions">
          <button class="primary approve" type="button">Approve</button>
          <button class="reject" type="button">Reject</button>
        </div>
      `;
      const meta = card.querySelectorAll(".field-meta span");
      meta[0].textContent = item.topic || "Question";
      meta[1].textContent = item.lang || "en";
      meta[2].textContent = item.created_at || "";
      card.querySelector("h3").textContent = `${item.name || "Koi keeper"} ${item.email ? `<${item.email}>` : ""}`;
      card.querySelector(".moderation-body").textContent = item.message || "";
      card.querySelector(".pond-info").textContent = item.pond_info ? `Pond details: ${item.pond_info}` : "";
      card.querySelector(".approve").addEventListener("click", () => moderate("comment", item.id, "approve", card.querySelector("textarea").value));
      card.querySelector(".reject").addEventListener("click", () => moderate("comment", item.id, "reject"));
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
      uploads.appendChild(card);
    });
  }

  async function loadSubmissions() {
    setStatus("Loading pending submissions...");
    const response = await fetch("/api/admin/submissions", { headers: authHeaders() });
    const result = await response.json().catch(() => null);
    if (!response.ok || !result || !result.ok) {
      setStatus((result && result.message) || "Could not load submissions.", true);
      return;
    }
    renderComments(result.comments || []);
    renderUploads(result.uploads || []);
    setStatus("Pending submissions loaded.");
  }

  async function moderate(type, id, action, reply) {
    setStatus(`${action === "approve" ? "Approving" : "Rejecting"} item...`);
    const response = await fetch("/api/admin/moderate", {
      method: "POST",
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
