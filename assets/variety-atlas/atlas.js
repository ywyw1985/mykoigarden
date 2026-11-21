(() => {
  const form = document.querySelector('.atlas [data-filters]');
  if (!form) return;

  const search = form.elements.q;
  const topic = form.elements.topic;
  const kind = form.elements.kind;
  const status = document.querySelector('.at-status');
  const empty = document.querySelector('.at-empty');
  const params = new URLSearchParams(location.search);

  function normalize(text) {
    return text.toLowerCase().normalize('NFKD').replace(/\p{M}+/gu, '').replace(/[^\p{L}\p{N}]+/gu, ' ').trim();
  }

  const groups = Array.from(document.querySelectorAll('[data-topic]'), section => ({
    section,
    jump: document.querySelector('[data-topic-link="' + section.dataset.topic + '"]'),
    entries: Array.from(section.querySelectorAll('[data-entry]'), card => {
      const words = normalize(card.dataset.search + ' ' + card.querySelector('.at-cue').textContent);
      return {card, words, joined: words.replaceAll(' ', '')};
    })
  }));

  function update(syncUrl) {
    const terms = normalize(search.value).split(/\s+/).filter(Boolean);
    let total = 0;
    for (const {section, entries, jump} of groups) {
      const correctTopic = !topic.value || section.dataset.topic === topic.value;
      let count = 0;
      for (const {card, words, joined} of entries) {
        const match = correctTopic && (!kind.value || kind.value === card.dataset.kind) &&
          terms.every(term => words.includes(term) || joined.includes(term));
        card.hidden = !match;
        if (match) count++;
      }
      section.hidden = jump.hidden = count === 0;
      total += count;
    }
    status.textContent = status.dataset.template.replace('{n}', total).replace('{total}', status.dataset.total);
    empty.hidden = total > 0;
    if (!syncUrl) return;
    const current = new URL(location.href);
    for (const control of [search, topic, kind]) {
      if (control.value) current.searchParams.set(control.name, control.value);
      else current.searchParams.delete(control.name);
    }
    const anchored = document.getElementById(current.hash.slice(1));
    if (anchored && anchored.closest('[hidden]')) current.hash = '';
    history.replaceState(null, '', current);
  }

  for (const control of [search, topic, kind]) control.value = (params.get(control.name) || '').slice(0,100);
  form.hidden = false;
  update(false);
  search.addEventListener('input', () => update(true));
  topic.addEventListener('change', () => update(true));
  kind.addEventListener('change', () => update(true));
  form.addEventListener('submit', event => { event.preventDefault(); update(true); });
  form.addEventListener('reset', event => {
    event.preventDefault();
    search.value = '';
    topic.value = '';
    kind.value = '';
    update(true);
  });
  empty.querySelector('[data-reset]').addEventListener('click', () => { form.reset(); search.focus(); });

  // A specimen link above the filters can point to a currently filtered-out card.
  function revealAnchor() {
    const target = document.getElementById(location.hash.slice(1));
    if (!target || !target.closest('[data-topic]') || !target.closest('[hidden]')) return;
    search.value = topic.value = kind.value = '';
    update(true);
    target.scrollIntoView();
  }
  window.addEventListener('hashchange', revealAnchor);
  revealAnchor();
})();
