(() => {
  const controls = document.querySelector('.jas-search');
  if (!controls) return;
  const input = controls.querySelector('input');
  const clear = controls.querySelector('button');
  const status = controls.querySelector('[data-jas-status]');
  const empty = document.querySelector('.jas-empty');

  // Preserve the dakuten in Japanese names while folding Latin romanization and separators.
  function normalize(value) {
    return value.normalize('NFKC').toLowerCase()
      .replace(/[āáàâä]/g, 'a').replace(/[ēéèêë]/g, 'e').replace(/[īíìîï]/g, 'i')
      .replace(/[ōóòôö]/g, 'o').replace(/[ūúùûü]/g, 'u')
      .replace(/[\s'’–—・/()\-]/g, '');
  }

  const rows = Array.from(document.querySelectorAll('[data-jas-entry]'), row => ({
    row,
    entry: normalize(row.dataset.jasEntry),
    details: row.querySelector('details'),
    names: Array.from(row.querySelectorAll('[data-jas-name]'), element => ({
      element, label: normalize(element.dataset.jasName)
    }))
  }));

  function update() {
    const query = normalize(input.value);
    let visible = 0;
    for (const {row, entry, details, names} of rows) {
      const entryMatches = entry.includes(query);
      let labelMatches = false;
      for (const {element, label} of names) {
        const matches = label.includes(query);
        element.hidden = !(entryMatches || matches);
        if (matches) labelMatches = true;
      }
      row.hidden = !(entryMatches || labelMatches);
      if (!row.hidden) visible++;
      if (details) details.open = Boolean(query && !row.hidden);
    }
    empty.hidden = visible > 0;
    status.textContent = status.dataset.jasStatus.replace('{n}', String(visible));
  }
  input.addEventListener('input', update);
  clear.addEventListener('click', () => {
    input.value = '';
    update();
    input.focus();
  });
  update();
  controls.hidden = false;
})();
