(() => {
  const panel = document.querySelector("[data-pond-log]");
  if (!panel) return;

  const form = panel.querySelector("form");
  const dateField = form.elements.when;
  const noteField = form.elements.note;
  const checks = [...form.querySelectorAll('[type="checkbox"]')];
  const results = panel.querySelector("[data-entries]");
  const empty = panel.querySelector("[data-empty]");
  const status = panel.querySelector('[role="status"]');
  const printButton = panel.querySelector("[data-print]");
  const prefix = "mykoigarden.pond-observation.v1.";
  const entries = new Map();
  const copy = panel.dataset;

  function defaultTime() {
    const now = new Date();
    const local = new Date(now.getTime() - now.getTimezoneOffset() * 60000);
    dateField.value = local.toISOString().slice(0, 16);
  }

  function readEntry(key, value) {
    if (!value) {
      entries.delete(key);
      return;
    }
    try {
      const entry = JSON.parse(value);
      if (typeof entry.when === "string" && typeof entry.note === "string" && Array.isArray(entry.checks)) {
        entries.set(key, entry);
      }
    } catch {
      // Ignore incomplete records without touching other saved observations.
    }
  }

  function render() {
    results.replaceChildren();
    empty.hidden = entries.size > 0;
    printButton.hidden = entries.size === 0;
    const sorted = [...entries].sort((a, b) => b[1].when.localeCompare(a[1].when) || b[0].localeCompare(a[0]));
    for (const [key, entry] of sorted) {
      const item = document.createElement("li");
      const date = document.createElement("time");
      date.dateTime = entry.when;
      date.textContent = entry.when.replace("T", " ");
      const topics = checks.filter(check => entry.checks.includes(check.value))
        .map(check => check.labels[0].textContent.trim());
      const summary = document.createElement("div");
      summary.className = "pond-log-topics";
      summary.textContent = topics.join(" · ");
      const note = document.createElement("div");
      note.className = "pond-log-note";
      note.textContent = entry.note;
      const remove = document.createElement("button");
      remove.type = "button";
      remove.className = "pond-log-delete";
      remove.textContent = copy.remove;
      remove.setAttribute("aria-label", copy.remove + " (" + date.textContent + ")");
      remove.addEventListener("click", () => {
        if (!window.confirm(copy.confirm)) return;
        try {
          localStorage.removeItem(key);
        } catch {
          if (!entry.temporary) {
            status.textContent = copy.deleteFailed;
            return;
          }
        }
        entries.delete(key);
        render();
        status.textContent = copy.removed;
        dateField.focus();
      });
      item.append(date, summary, note, remove);
      results.appendChild(item);
    }
  }

  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(prefix)) readEntry(key, localStorage.getItem(key));
    }
  } catch {
    status.textContent = copy.temporary;
  }

  window.addEventListener("storage", event => {
    if (!event.key) {
      for (const [key, entry] of entries) if (!entry.temporary) entries.delete(key);
    } else if (event.key.startsWith(prefix)) {
      readEntry(event.key, event.newValue);
    } else {
      return;
    }
    render();
  });

  form.addEventListener("submit", event => {
    event.preventDefault();
    if (!noteField.value.trim()) {
      noteField.setCustomValidity(copy.required);
      noteField.reportValidity();
      return;
    }
    const entry = {
      when: dateField.value,
      checks: checks.filter(check => check.checked).map(check => check.value),
      note: noteField.value.trim()
    };
    const key = prefix + Date.now() + "." + Math.random().toString(36).slice(2);
    try {
      localStorage.setItem(key, JSON.stringify(entry));
      status.textContent = copy.saved;
    } catch {
      entry.temporary = true;
      status.textContent = copy.temporary;
    }
    entries.set(key, entry);
    render();
    form.reset();
    defaultTime();
  });

  noteField.addEventListener("input", () => noteField.setCustomValidity(""));
  printButton.addEventListener("click", () => window.print());
  form.hidden = false;
  defaultTime();
  render();
})();
