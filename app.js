(function () {
  var language = (document.documentElement.lang || "en").toLowerCase().slice(0, 2);
  var communityPath = language === "en" ? "/community" : "/" + language + "/community";

  function setupMobileNavigation() {
    var labels = {
      en: { menu: "Menu", close: "Close menu" },
      zh: { menu: "菜单", close: "关闭菜单" },
      es: { menu: "Menú", close: "Cerrar menú" },
      ja: { menu: "メニュー", close: "メニューを閉じる" }
    };
    var copy = labels[language] || labels.en;
    var mobileQuery = window.matchMedia("(max-width: 860px)");

    document.querySelectorAll(".site-header").forEach(function (header, index) {
      var nav = header.querySelector(".nav");
      if (!nav || header.querySelector(".nav-toggle")) return;

      if (!nav.id) nav.id = index === 0 ? "site-navigation" : "site-navigation-" + (index + 1);

      var button = document.createElement("button");
      button.type = "button";
      button.className = "nav-toggle";
      button.setAttribute("aria-expanded", "false");
      button.setAttribute("aria-controls", nav.id);
      button.setAttribute("aria-label", copy.menu);

      var symbol = document.createElement("span");
      symbol.className = "nav-toggle-symbol";
      symbol.setAttribute("aria-hidden", "true");
      symbol.textContent = "☰";

      var label = document.createElement("span");
      label.className = "nav-toggle-label";
      label.textContent = copy.menu;

      button.appendChild(symbol);
      button.appendChild(label);
      header.insertBefore(button, nav);
      header.classList.add("nav-ready");

      function setOpen(open, returnFocus) {
        header.classList.toggle("nav-open", open);
        button.setAttribute("aria-expanded", String(open));
        button.setAttribute("aria-label", open ? copy.close : copy.menu);
        symbol.textContent = open ? "×" : "☰";
        label.textContent = open ? copy.close : copy.menu;
        if (!open && returnFocus) button.focus();
      }

      button.addEventListener("click", function () {
        setOpen(!header.classList.contains("nav-open"), false);
      });

      nav.addEventListener("click", function (event) {
        if (mobileQuery.matches && event.target.closest("a")) setOpen(false, false);
      });

      document.addEventListener("click", function (event) {
        if (mobileQuery.matches && header.classList.contains("nav-open") && !header.contains(event.target)) {
          setOpen(false, false);
        }
      });

      document.addEventListener("keydown", function (event) {
        if (event.key === "Escape" && header.classList.contains("nav-open")) setOpen(false, true);
      });

      function handleViewportChange(event) {
        if (!event.matches) setOpen(false, false);
      }

      if (mobileQuery.addEventListener) mobileQuery.addEventListener("change", handleViewportChange);
      else mobileQuery.addListener(handleViewportChange);
    });
  }

  setupMobileNavigation();

  document.querySelectorAll('a[href*="local-koi-for-sale"]').forEach(function (link) {
    if (link.closest(".nav")) {
      link.remove();
      return;
    }
    link.href = communityPath + "?view=listings";
  });

  document.querySelectorAll("[data-variety-stats]").forEach(function (stats) {
    var page = stats.closest("main") || document;
    var traitBranch = page.querySelector('[data-taxonomy-kind="trait"]');
    var traitCount = traitBranch ? traitBranch.querySelectorAll(".taxonomy-leaf").length : 0;
    var totalCount = page.querySelectorAll(".taxonomy-leaf").length;
    var varietyCount = Math.max(0, totalCount - traitCount);
    var varietyOutput = stats.querySelector("[data-variety-count]");
    var traitOutput = stats.querySelector("[data-trait-count]");

    if (varietyOutput) varietyOutput.textContent = varietyCount;
    if (traitOutput) traitOutput.textContent = traitCount;
  });

  if (/\/(?:zh\/|es\/|ja\/)?community(?:\.html)?$/.test(window.location.pathname) && !document.querySelector('script[src*="local-community.js"]')) {
    var communityScript = document.createElement("script");
    communityScript.src = "/local-community.js?v=20260811a";
    document.body.appendChild(communityScript);
  }

  document.addEventListener("click", function (event) {
    var link = event.target.closest && event.target.closest('a[href*="amazon.com"]');
    if (!link) return;

    try {
      var url = new URL(link.href, window.location.href);
      if (url.hostname !== "amazon.com" && !url.hostname.endsWith(".amazon.com")) return;
      if (typeof window.gtag === "function") {
        window.gtag("event", "affiliate_click", {
          affiliate_name: "Amazon",
          link_url: url.href,
          link_text: (link.textContent || "").trim().slice(0, 100),
          transport_type: "beacon"
        });
      }
    } catch (error) {}
  });

  if ("serviceWorker" in navigator) {
    window.addEventListener("load", function () {
      navigator.serviceWorker.register("/sw.js?v=20260927a").then(function (registration) {
        registration.update().catch(function () {});
        if (registration.waiting) registration.waiting.postMessage({ type: "SKIP_WAITING" });
      }).catch(function () {});
    });
  }
})();
