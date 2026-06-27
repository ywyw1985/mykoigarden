(function () {
  const root = document.querySelector("[data-variety-poll]");
  if (!root) return;

  const lang = (document.documentElement.lang || "en").toLowerCase();
  const pollId = root.dataset.pollId || "mainstream-variety-2026";
  const storageVoteKey = `mkg-variety-poll-vote:${pollId}`;
  const storageVoterKey = "mkg-variety-poll-voter";
  const options = [
    { id: "kohaku", en: "Kohaku", zh: "红白", es: "Kohaku", ja: "紅白", image: "/assets/award-winning-koi/all-japan-55-2025-awards-017.jpg" },
    { id: "sanke", en: "Taisho Sanke", zh: "大正三色", es: "Taisho Sanke", ja: "大正三色", image: "/assets/award-winning-koi/all-japan-55-2025-awards-001.jpg" },
    { id: "showa", en: "Showa Sanshoku", zh: "昭和三色", es: "Showa Sanshoku", ja: "昭和三色", image: "/assets/award-winning-koi/all-japan-55-2025-awards-010.jpg" },
    { id: "tancho", en: "Tancho", zh: "丹顶", es: "Tancho", ja: "丹頂", image: "/assets/award-winning-koi/all-japan-55-2025-awards-088.jpg" },
    { id: "utsuri", en: "Utsurimono", zh: "写类", es: "Utsurimono", ja: "写りもの", image: "/assets/award-winning-koi/all-japan-55-2025-awards-098.jpg" },
    { id: "ogon", en: "Ogon", zh: "黄金", es: "Ogon", ja: "黄金", image: "/assets/award-winning-koi/all-japan-55-2025-awards-089.jpg" },
    { id: "asagi", en: "Asagi", zh: "浅黄", es: "Asagi", ja: "浅黄", image: "/assets/award-winning-koi/all-japan-55-2025-awards-091.jpg" },
    { id: "longfin", en: "Longfin / Butterfly Koi", zh: "蝴蝶鲤", es: "Longfin / Koi mariposa", ja: "ヒレ長・バタフライ鯉", image: "/assets/butterfly-koi-white-longfin/kunfish-butterfly-koi-06.jpg" }
  ];
  const copy = lang.startsWith("zh")
    ? { vote: "投票", voted: "已投票", total: "总票数", loading: "正在读取投票结果...", error: "投票暂时无法加载，请稍后再试。", changed: "你的投票已更新。", lead: "当前领先" }
    : lang.startsWith("ja")
      ? { vote: "投票", voted: "投票済み", total: "総投票数", loading: "投票結果を読み込んでいます...", error: "投票を読み込めませんでした。時間をおいて再度お試しください。", changed: "投票を更新しました。", lead: "現在のトップ" }
      : lang.startsWith("es")
        ? { vote: "Votar", voted: "Votado", total: "Votos totales", loading: "Cargando resultados...", error: "La encuesta no se pudo cargar. Intente de nuevo mas tarde.", changed: "Su voto se actualizo.", lead: "Favorito actual" }
        : { vote: "Vote", voted: "Voted", total: "Total votes", loading: "Loading poll results...", error: "The poll could not be loaded. Please try again later.", changed: "Your vote has been updated.", lead: "Current favorite" };

  function optionLabel(option) {
    if (lang.startsWith("zh")) return option.zh;
    if (lang.startsWith("ja")) return option.ja;
    if (lang.startsWith("es")) return option.es;
    return option.en;
  }

  function getVoterId() {
    let value = localStorage.getItem(storageVoterKey);
    if (!value) {
      value = crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(16).slice(2)}`;
      localStorage.setItem(storageVoterKey, value);
    }
    return value;
  }

  function render(data) {
    const counts = data.counts || {};
    const total = Number(data.total || 0);
    const selected = localStorage.getItem(storageVoteKey) || "";
    const leader = options.reduce((best, option) => (Number(counts[option.id] || 0) > Number(counts[best.id] || 0) ? option : best), options[0]);
    root.innerHTML = `
      <div class="poll-summary">
        <p>${copy.total}: <strong>${total}</strong></p>
        <p>${copy.lead}: <strong>${optionLabel(leader)}</strong></p>
      </div>
      <div class="poll-options"></div>
      <p class="poll-status" aria-live="polite"></p>
    `;
    const list = root.querySelector(".poll-options");
    for (const option of options) {
      const count = Number(counts[option.id] || 0);
      const percent = total > 0 ? Math.round((count / total) * 100) : 0;
      const button = document.createElement("button");
      button.type = "button";
      button.className = `poll-option${selected === option.id ? " is-selected" : ""}`;
      button.dataset.option = option.id;
      button.innerHTML = `
        <span class="poll-thumb"><img src="${option.image}" alt="" loading="lazy" decoding="async"></span>
        <span class="poll-option-body">
          <span class="poll-option-top"><strong>${optionLabel(option)}</strong><em>${count} · ${percent}%</em></span>
          <span class="poll-bar" aria-hidden="true"><span style="width:${percent}%"></span></span>
        </span>
        <span class="poll-vote-label">${selected === option.id ? copy.voted : copy.vote}</span>
      `;
      button.addEventListener("click", () => vote(option.id));
      list.appendChild(button);
    }
  }

  function setStatus(message) {
    const status = root.querySelector(".poll-status");
    if (status) status.textContent = message;
  }

  async function load() {
    root.innerHTML = `<p class="poll-status">${copy.loading}</p>`;
    try {
      const response = await fetch(`/api/variety-poll?poll=${encodeURIComponent(pollId)}`, { cache: "no-store" });
      const data = await response.json();
      if (!response.ok || !data.ok) throw new Error(data.message || "Poll unavailable");
      render(data);
    } catch (error) {
      root.innerHTML = `<p class="poll-status">${copy.error}</p>`;
    }
  }

  async function vote(optionId) {
    try {
      const response = await fetch("/api/variety-poll", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pollId, optionId, voterId: getVoterId(), lang: lang.slice(0, 12) })
      });
      const data = await response.json();
      if (!response.ok || !data.ok) throw new Error(data.message || "Vote unavailable");
      localStorage.setItem(storageVoteKey, optionId);
      render(data);
      setStatus(copy.changed);
    } catch (error) {
      setStatus(copy.error);
    }
  }

  load();
})();
