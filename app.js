(function () {
  var language = (document.documentElement.lang || "en").toLowerCase().slice(0, 2);
  var communityPath = language === "en" ? "/community.html" : "/" + language + "/community.html";

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

  if (/\/(?:zh\/|es\/|ja\/)?community\.html$/.test(window.location.pathname) && !document.querySelector('script[src*="local-community.js"]')) {
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
      navigator.serviceWorker.register("/sw.js").then(function (registration) {
        registration.update().catch(function () {});
        if (registration.waiting) registration.waiting.postMessage({ type: "SKIP_WAITING" });
      }).catch(function () {});
    });
  }
})();
