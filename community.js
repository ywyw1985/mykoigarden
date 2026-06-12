(function () {
  function ready(callback) {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", callback, { once: true });
    } else {
      callback();
    }
  }

  ready(function () {
    const state = document.querySelector("[data-community-status]");
    const list = document.querySelector("[data-approved-comments]");

    function setStatus(message, tone) {
      if (!state) return;
      state.textContent = message;
      state.dataset.tone = tone || "neutral";
    }

    function lang() {
      return document.documentElement.lang || "en";
    }

    function successMessage() {
      return {
        zh: "提交成功，问题已进入审核队列。审核后才会公开显示。",
        es: "Enviado. La pregunta queda pendiente de revision antes de publicarse.",
        ja: "送信しました。公開前に確認されます。",
      }[lang()] || "Thank you. Your question is waiting for review before it appears publicly.";
    }

    function sendingMessage() {
      return {
        zh: "正在提交，请稍等...",
        es: "Enviando...",
        ja: "送信中...",
      }[lang()] || "Submitting your question for review...";
    }

    function errorMessage() {
      return {
        zh: "提交没有成功。请检查问题内容是否足够详细，或稍后再试。",
        es: "No se pudo enviar. Revisa el contenido o intenta mas tarde.",
        ja: "送信できませんでした。内容を確認して、後でもう一度お試しください。",
      }[lang()] || "The question could not be submitted. Please check the details and try again.";
    }

    async function submitComment(form, submitter) {
      const payload = Object.fromEntries(new FormData(form).entries());
      payload.page = "community";
      payload.lang = lang();

      if (!payload.message || payload.message.trim().length < 20) {
        setStatus(errorMessage(), "error");
        return;
      }

      if (submitter) submitter.disabled = true;
      setStatus(sendingMessage(), "neutral");

      try {
        const response = await fetch("/api/comments", {
          method: "POST",
          cache: "no-store",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const result = await response.json().catch(() => ({ ok: false }));

        if (!response.ok || !result.ok) {
          setStatus(result.message || errorMessage(), "error");
          return;
        }

        form.reset();
        setStatus(result.message || successMessage(), "success");
      } catch (error) {
        setStatus(errorMessage(), "error");
      } finally {
        if (submitter) submitter.disabled = false;
      }
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
      const response = await fetch(`/api/comments?page=community&lang=${encodeURIComponent(lang())}`, { cache: "no-store" });
      if (!response.ok) return;
      const result = await response.json().catch(() => null);
      if (!result || !result.ok || !result.comments || result.comments.length === 0) return;
      list.replaceChildren(...result.comments.map(commentCard));
    }

    document.addEventListener("submit", function (event) {
      const form = event.target;
      if (!(form instanceof HTMLFormElement) || !form.matches("[data-comment-form]")) return;
      event.preventDefault();
      submitComment(form, event.submitter || form.querySelector("button[type='submit']"));
    }, true);

    document.addEventListener("click", function (event) {
      const button = event.target.closest("[data-comment-form] button[type='submit']");
      if (!button) return;
      const form = button.closest("[data-comment-form]");
      if (form && typeof form.requestSubmit === "function") {
        event.preventDefault();
        form.requestSubmit(button);
      }
    });

    loadComments();
  });
})();
