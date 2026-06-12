(function () {
  function onReady(callback) {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", callback, { once: true });
    } else {
      callback();
    }
  }

  onReady(function () {
    var state = document.querySelector("[data-community-status]");
    var form = document.querySelector("[data-comment-form]");
    var list = document.querySelector("[data-approved-comments]");
    var inFlight = false;

    function lang() {
      return document.documentElement.lang || "en";
    }

    function text(key) {
      var dictionary = {
        sending: {
          zh: "\u6b63\u5728\u63d0\u4ea4\uff0c\u8bf7\u7a0d\u7b49...",
          es: "Enviando...",
          ja: "Submitting...",
          en: "Submitting your question..."
        },
        success: {
          zh: "\u63d0\u4ea4\u6210\u529f\uff0c\u95ee\u9898\u5df2\u8fdb\u5165\u5ba1\u6838\u961f\u5217\u3002",
          es: "Enviado. La pregunta queda pendiente de revision.",
          ja: "Submitted. Your question is waiting for review.",
          en: "Thank you. Your question is waiting for review."
        },
        short: {
          zh: "\u8bf7\u5148\u586b\u5199\u95ee\u9898\u5185\u5bb9\u3002",
          es: "Escribe tu pregunta primero.",
          ja: "Please write your question first.",
          en: "Please write your question first."
        },
        error: {
          zh: "\u63d0\u4ea4\u6ca1\u6709\u6210\u529f\u3002\u8bf7\u5237\u65b0\u540e\u518d\u8bd5\uff0c\u6216\u7a0d\u540e\u518d\u8bd5\u3002",
          es: "No se pudo enviar. Intenta de nuevo.",
          ja: "The question could not be submitted. Please try again.",
          en: "The question could not be submitted. Please try again."
        }
      };
      return (dictionary[key] && (dictionary[key][lang()] || dictionary[key].en)) || key;
    }

    function ensureInlineStatus() {
      if (!form) return null;
      var inline = form.querySelector("[data-inline-status]");
      if (inline) return inline;
      inline = document.createElement("p");
      inline.setAttribute("data-inline-status", "");
      inline.className = "form-status";
      var button = form.querySelector("button[type='submit']");
      if (button && button.parentNode) button.insertAdjacentElement("afterend", inline);
      else form.appendChild(inline);
      return inline;
    }

    function setStatus(message, tone) {
      if (state) {
        state.textContent = message;
        state.dataset.tone = tone || "neutral";
      }
      var inline = ensureInlineStatus();
      if (inline) {
        inline.textContent = message;
        inline.dataset.tone = tone || "neutral";
      }
    }

    async function submitQuestion(submitter) {
      if (!form || inFlight) return;
      var payload = Object.fromEntries(new FormData(form).entries());
      payload.page = "community";
      payload.lang = lang();

      if (!payload.message || payload.message.trim().length < 2) {
        setStatus(text("short"), "error");
        return;
      }

      inFlight = true;
      if (submitter) submitter.disabled = true;
      setStatus(text("sending"), "neutral");

      try {
        var response = await fetch("/api/comments", {
          method: "POST",
          cache: "no-store",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });
        var result = await response.json().catch(function () { return { ok: false }; });
        if (!response.ok || !result.ok) {
          setStatus(result.message || text("error"), "error");
          return;
        }
        form.reset();
        setStatus(text("success"), "success");
      } catch (error) {
        setStatus(text("error"), "error");
      } finally {
        inFlight = false;
        if (submitter) submitter.disabled = false;
      }
    }

    function commentCard(item) {
      var article = document.createElement("article");
      article.className = "qa-card community-approved-card";
      article.innerHTML = '<p class="tag"></p><h3></h3><p class="community-message"></p><div class="owner-reply" hidden><strong>My Koi Garden reply</strong><p></p></div>';
      article.querySelector(".tag").textContent = (item.pinned ? "Pinned | " : "") + (item.topic || "Community question");
      article.querySelector("h3").textContent = item.name ? "Question from " + item.name : "Community question";
      article.querySelector(".community-message").textContent = item.message || "";
      var reply = article.querySelector(".owner-reply");
      if (item.owner_reply) {
        reply.hidden = false;
        reply.querySelector("p").textContent = item.owner_reply;
      }
      return article;
    }

    async function loadComments() {
      if (!list) return;
      var response = await fetch("/api/comments?page=community&lang=" + encodeURIComponent(lang()), { cache: "no-store" });
      if (!response.ok) return;
      var result = await response.json().catch(function () { return null; });
      if (!result || !result.ok || !result.comments || result.comments.length === 0) return;
      list.replaceChildren.apply(list, result.comments.map(commentCard));
    }

    if (form) {
      ensureInlineStatus();
      form.addEventListener("submit", function (event) {
        event.preventDefault();
        submitQuestion(event.submitter || form.querySelector("button[type='submit']"));
      });
      var button = form.querySelector("button[type='submit']");
      if (button) {
        button.addEventListener("click", function (event) {
          event.preventDefault();
          submitQuestion(button);
        });
      }
    }

    loadComments();
  });
})();
