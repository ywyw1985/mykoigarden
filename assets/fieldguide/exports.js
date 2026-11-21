document.querySelectorAll('[data-export-explorer]').forEach(function (section) {
  const controls = section.querySelector('fieldset');
  const radios = Array.from(controls.querySelectorAll('input[type=radio]'));
  const panels = section.querySelectorAll('[data-export-view]');

  function show(value) {
    panels.forEach(panel => { panel.hidden = panel.dataset.exportView !== value; });
  }

  radios.forEach(radio => {
    radio.addEventListener('change', function () {
      if (!radio.checked) return;
      show(radio.value);
      if (typeof window.gtag === 'function') {
        window.gtag('event', 'koi_exports_view', {
          view_group: radio.name,
          selection: radio.value,
          page_language: document.documentElement.lang
        });
      }
    });
  });

  show(radios.find(radio => radio.checked).value);
  controls.hidden = false;
});
