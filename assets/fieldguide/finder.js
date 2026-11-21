(() => {
  const filters = document.querySelector('[data-finder-filters]');
  if (!filters) return;
  const selects = Array.from(filters.querySelectorAll('select'));
  const status = document.querySelector('[data-match-count]');
  const empty = document.querySelector('[data-no-matches]');
  const guides = Array.from(document.querySelectorAll('[data-profiles]'), card => ({
    card,
    profiles: card.dataset.profiles.split(';').map(profile =>
      profile.split('/').map(dimension => dimension.split(',')))
  }));

  function update() {
    let count = 0;
    const choices = selects.map(select => select.value);
    for (const {card, profiles} of guides) {
      const matches = profiles.some(profile => choices.every((choice, index) =>
        !choice || profile[index].includes(choice)));
      card.hidden = !matches;
      if (matches) count++;
    }
    empty.hidden = count !== 0;
    status.textContent = (count === 1 ? status.dataset.one : status.dataset.many)
      .replace('{n}', String(count));
  }
  filters.addEventListener('change', update);
  filters.addEventListener('reset', () => requestAnimationFrame(update));
  empty.querySelector('button').addEventListener('click', () => {
    filters.reset();
    selects[0].focus();
  });
  filters.hidden = false;
  update();
  window.addEventListener('pageshow', update);
})();
