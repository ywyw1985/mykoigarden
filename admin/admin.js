(function () {
  const owner = "ywyw1985";
  const repo = "mykoigarden";
  const pages = [
    ["Home", "index.html"],
    ["Chinese Home", "zh/index.html"],
    ["Spanish Home", "es/index.html"],
    ["Japanese Home", "ja/index.html"],
    ["Koi Care", "koi-care/index.html"],
    ["Koi Food Guide", "koi-care/koi-food-guide.html"],
    ["Koi Health", "koi-health/index.html"],
    ["Koi Biosecurity & Quarantine", "koi-health/biosecurity-quarantine.html"],
    ["Koi Varieties", "koi-varieties/index.html"],
    ["Kohaku", "koi-varieties/kohaku.html"],
    ["Sanke", "koi-varieties/sanke.html"],
    ["Showa", "koi-varieties/showa.html"],
    ["Butterfly / Longfin Koi", "koi-varieties/longfin.html"],
    ["Choose Koi", "choose-koi/index.html"],
    ["Pond Guide", "pond-guide/index.html"],
    ["Koi History", "koi-history.html"],
    ["Koi Q&A", "koi-qa.html"],
    ["Local Koi For Sale", "local-koi-for-sale.html"]
  ];

  const editableSelector = [
    "title",
    "meta[name='description']",
    "h1",
    "h2",
    "h3",
    "p",
    "li",
    "td",
    "th",
    "figcaption",
    "a.button",
    ".topic-card strong",
    ".topic-card span",
    ".section-kicker",
    ".article-meta",
    ".eyebrow"
  ].join(",");

  const state = {
    html: "",
    doc: null,
    sha: "",
    path: "",
    fields: []
  };

  const el = {
    token: document.getElementById("token"),
    rememberToken: document.getElementById("rememberToken"),
    branch: document.getElementById("branch"),
    pageSelect: document.getElementById("pageSelect"),
    customPath: document.getElementById("customPath"),
    loadPage: document.getElementById("loadPage"),
    savePage: document.getElementById("savePage"),
    status: document.getElementById("status"),
    fields: document.getElementById("fields")
  };

  function setStatus(message, isError) {
    el.status.textContent = message;
    el.status.style.color = isError ? "#8a1111" : "#17221d";
  }

  function token() {
    return el.token.value.trim();
  }

  function branch() {
    return el.branch.value.trim() || "main";
  }

  function githubHeaders() {
    return {
      Authorization: `Bearer ${token()}`,
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28"
    };
  }

  function encodeBase64Unicode(text) {
    const bytes = new TextEncoder().encode(text);
    let binary = "";
    bytes.forEach((byte) => {
      binary += String.fromCharCode(byte);
    });
    return btoa(binary);
  }

  function decodeBase64Unicode(base64) {
    const binary = atob(base64.replace(/\n/g, ""));
    const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
    return new TextDecoder().decode(bytes);
  }

  function cleanPath(path) {
    return path.replace(/^\/+/, "").trim();
  }

  function isSimpleTextElement(node) {
    if (node.tagName === "TITLE") return true;
    if (node.tagName === "META") return true;
    if (node.matches("a.button")) return true;
    if (node.children.length === 0) return true;
    if (node.matches(".topic-card strong, .topic-card span")) return true;
    return false;
  }

  function textFor(node) {
    if (node.tagName === "META") return node.getAttribute("content") || "";
    return node.textContent.trim();
  }

  function setText(node, value) {
    if (node.tagName === "META") {
      node.setAttribute("content", value);
    } else {
      node.textContent = value;
    }
  }

  function labelFor(node, index) {
    if (node.tagName === "META") return "Meta description";
    if (node.tagName === "TITLE") return "Browser title";
    const tag = node.tagName.toLowerCase();
    const text = textFor(node).slice(0, 46);
    return `${tag.toUpperCase()} ${index + 1}${text ? " - " + text : ""}`;
  }

  function extractFields() {
    const nodes = Array.from(state.doc.querySelectorAll(editableSelector));
    state.fields = [];
    nodes.forEach((node) => {
      if (!isSimpleTextElement(node)) return;
      const value = textFor(node);
      if (!value) return;
      const id = state.fields.length;
      node.setAttribute("data-admin-edit-id", String(id));
      state.fields.push({
        id,
        label: labelFor(node, id),
        tag: node.tagName.toLowerCase(),
        value
      });
    });
  }

  function renderFields() {
    if (!state.fields.length) {
      el.fields.className = "fields empty-state";
      el.fields.textContent = "No simple editable text fields found on this page.";
      el.savePage.disabled = true;
      return;
    }
    el.fields.className = "fields";
    el.fields.innerHTML = "";
    state.fields.forEach((field) => {
      const card = document.createElement("div");
      card.className = "field-card";

      const meta = document.createElement("div");
      meta.className = "field-meta";
      meta.innerHTML = `<span class="tag">${field.tag}</span><span>${field.label}</span>`;

      const input = document.createElement(field.value.length > 90 ? "textarea" : "input");
      if (input.tagName === "INPUT") input.type = "text";
      input.value = field.value;
      input.dataset.fieldId = String(field.id);

      card.append(meta, input);
      el.fields.append(card);
    });
    el.savePage.disabled = false;
  }

  async function loadPage() {
    if (!token()) {
      setStatus("Paste a GitHub token first.", true);
      return;
    }
    const selected = el.customPath.value.trim() || el.pageSelect.value;
    state.path = cleanPath(selected);
    if (!state.path.endsWith(".html")) {
      setStatus("Choose or enter an HTML file path.", true);
      return;
    }
    setStatus(`Loading ${state.path}...`);
    const url = `https://api.github.com/repos/${owner}/${repo}/contents/${encodeURIComponent(state.path).replace(/%2F/g, "/")}?ref=${encodeURIComponent(branch())}`;
    const response = await fetch(url, { headers: githubHeaders() });
    const data = await response.json();
    if (!response.ok) {
      setStatus(data.message || "Could not load file from GitHub.", true);
      return;
    }
    state.sha = data.sha;
    state.html = decodeBase64Unicode(data.content);
    state.doc = new DOMParser().parseFromString(state.html, "text/html");
    extractFields();
    renderFields();
    setStatus(`Loaded ${state.fields.length} editable text fields from ${state.path}.`);
  }

  async function savePage() {
    if (!state.doc || !state.path || !state.sha) {
      setStatus("Load a page before saving.", true);
      return;
    }
    Array.from(el.fields.querySelectorAll("[data-field-id]")).forEach((input) => {
      const id = input.dataset.fieldId;
      const node = state.doc.querySelector(`[data-admin-edit-id="${id}"]`);
      if (node) setText(node, input.value);
    });
    state.doc.querySelectorAll("[data-admin-edit-id]").forEach((node) => {
      node.removeAttribute("data-admin-edit-id");
    });
    const nextHtml = "<!doctype html>\n" + state.doc.documentElement.outerHTML + "\n";
    setStatus(`Saving ${state.path} to GitHub...`);
    const url = `https://api.github.com/repos/${owner}/${repo}/contents/${encodeURIComponent(state.path).replace(/%2F/g, "/")}`;
    const response = await fetch(url, {
      method: "PUT",
      headers: {
        ...githubHeaders(),
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        message: `Edit ${state.path} from site admin`,
        content: encodeBase64Unicode(nextHtml),
        sha: state.sha,
        branch: branch()
      })
    });
    const data = await response.json();
    if (!response.ok) {
      setStatus(data.message || "Could not save file to GitHub.", true);
      return;
    }
    state.sha = data.content.sha;
    setStatus("Saved to GitHub. Cloudflare should redeploy shortly, usually in 1-3 minutes.");
  }

  function init() {
    pages.forEach(([label, path]) => {
      const option = document.createElement("option");
      option.value = path;
      option.textContent = `${label} - ${path}`;
      el.pageSelect.append(option);
    });
    const remembered = localStorage.getItem("mkg_admin_token");
    if (remembered) {
      el.token.value = remembered;
      el.rememberToken.checked = true;
    }
    el.rememberToken.addEventListener("change", () => {
      if (el.rememberToken.checked && token()) {
        localStorage.setItem("mkg_admin_token", token());
      } else {
        localStorage.removeItem("mkg_admin_token");
      }
    });
    el.token.addEventListener("change", () => {
      if (el.rememberToken.checked) localStorage.setItem("mkg_admin_token", token());
    });
    el.loadPage.addEventListener("click", () => {
      loadPage().catch((error) => setStatus(error.message, true));
    });
    el.savePage.addEventListener("click", () => {
      savePage().catch((error) => setStatus(error.message, true));
    });
  }

  init();
})();
