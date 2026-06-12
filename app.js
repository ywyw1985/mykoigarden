(function () {
  if ("serviceWorker" in navigator) {
    window.addEventListener("load", function () {
      navigator.serviceWorker.register("/sw.js").then(function (registration) {
        registration.update().catch(function () {});
        if (registration.waiting) registration.waiting.postMessage({ type: "SKIP_WAITING" });
      }).catch(function () {});
    });
  }
})();
