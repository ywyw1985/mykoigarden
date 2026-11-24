(() => {
  const section = document.getElementById('koi-photo-collection');
  if (!section) return;
  const grid = section.querySelector('.kpc-grid');
  if (!grid) return;
  const cards = Array.from(grid.querySelectorAll('.kpc-card'));
  if (!cards.length) return;

  const languages = {
    en: {
      all: 'All photos', portraits: 'Variety portraits', pond: 'In the pond', detail: 'Close-ups',
      more: 'Show more', showAll: n => `View all ${n} photos`, filter: 'Filter photos', previous: 'Previous', next: 'Next',
      close: 'Close', enlarge: 'View photo', variety: 'Explore this variety',
      count: (shown, total) => `Showing ${shown} of ${total} photos`
    },
    zh: {
      all: '全部照片', portraits: '品种肖像', pond: '池中锦鲤', detail: '花纹特写',
      more: '显示更多', showAll: n => `查看全部 ${n} 张`, filter: '筛选照片', previous: '上一张', next: '下一张',
      close: '关闭', enlarge: '放大照片', variety: '了解这个品种',
      count: (shown, total) => `已显示 ${shown} 张，共 ${total} 张`
    },
    ja: {
      all: 'すべての写真', portraits: '品種別の写真', pond: '池を泳ぐ錦鯉', detail: 'クローズアップ',
      more: 'もっと見る', showAll: n => `全${n}枚を見る`, filter: '写真を絞り込む', previous: '前の写真', next: '次の写真',
      close: '閉じる', enlarge: '写真を拡大', variety: 'この品種を詳しく見る',
      count: (shown, total) => `全${total}枚中${shown}枚を表示`
    },
    es: {
      all: 'Todas', portraits: 'Variedades', pond: 'Estanque', detail: 'Primeros planos',
      more: 'Ver más', showAll: n => `Ver las ${n} fotos`, filter: 'Filtrar las fotos', previous: 'Anterior', next: 'Siguiente',
      close: 'Cerrar', enlarge: 'Ampliar foto', variety: 'Conocer esta variedad',
      count: (shown, total) => `Mostrando ${shown} de ${total} fotos`
    }
  };
  const text = languages[document.documentElement.lang.toLowerCase().split('-')[0]] || languages.en;
  const pageSize = 30;
  let matching = cards;
  let limit = pageSize;
  let displayCategory = 'all';

  function element(tag, className, label) {
    const node = document.createElement(tag);
    node.className = className;
    if (label) node.textContent = label;
    return node;
  }
  function button(className, label) {
    const node = element('button', className, label);
    node.type = 'button';
    return node;
  }
  function materialize(card) {
    const template = card.querySelector('template.kpc-thumb');
    if (template) template.replaceWith(template.content.cloneNode(true));
  }

  const tools = element('div', 'kpc-tools');
  const filters = element('div', 'kpc-filters');
  filters.setAttribute('role', 'group');
  filters.setAttribute('aria-label', text.filter);
  const count = element('span', 'kpc-count');
  count.setAttribute('role', 'status');
  const overview = element('div', 'kpc-overview');
  const showAllTop = button('kpc-show-all', '');
  overview.append(count, showAllTop);
  tools.append(filters, overview);
  grid.before(tools);
  const pagination = element('div', 'kpc-pagination');
  const more = button('kpc-more', text.more);
  const showAll = button('kpc-show-all', '');
  pagination.append(more, showAll);
  grid.after(pagination);

  function render() {
    const display = matching.slice(0, limit);
    const visible = new Set(display);
    for (const card of cards) {
      card.hidden = !visible.has(card);
      if (!card.hidden) materialize(card);
    }
    for (const item of filters.children) {
      item.setAttribute('aria-pressed', String(item.dataset.category === displayCategory));
    }
    count.textContent = text.count(display.length, matching.length);
    pagination.hidden = display.length >= matching.length;
    showAllTop.hidden = pagination.hidden;
    showAllTop.textContent = showAll.textContent = text.showAll(matching.length);
    showAll.hidden = matching.length - display.length <= pageSize;
  }

  function matches(card, category) {
    return (card.dataset.category || '').split(/\s+/).includes(category);
  }
  function selectCategory(category) {
    displayCategory = category;
    matching = category === 'all' ? cards : cards.filter(card => matches(card, category));
    limit = pageSize;
    render();
  }
  for (const category of ['all', 'portraits', 'pond', 'detail']) {
    if (category !== 'all' && !cards.some(card => matches(card, category))) continue;
    const filter = button('kpc-filter', text[category]);
    filter.dataset.category = category;
    filter.addEventListener('click', () => {
      selectCategory(category);
      if (['#all-koi-photos', '#pond-photo-gallery', '#koi-photo-gallery'].includes(location.hash)) {
        const anchors = {pond: '#pond-photo-gallery', all: '#koi-photo-gallery'};
        history.replaceState(history.state, '', location.pathname + location.search + (anchors[category] || ''));
      }
    });
    filters.append(filter);
  }

  function reveal(newLimit) {
    const firstNewCard = matching[limit];
    limit = newLimit;
    render();
    firstNewCard?.querySelector('.kpc-image')?.focus();
  }
  more.addEventListener('click', () => reveal(limit + pageSize));
  function shareAllPhotos() {
    if (displayCategory === 'all' && location.hash !== '#all-koi-photos') {
      history.pushState(history.state, '', '#all-koi-photos');
    }
  }
  showAll.addEventListener('click', () => {
    shareAllPhotos();
    reveal(matching.length);
  });
  showAllTop.addEventListener('click', () => {
    shareAllPhotos();
    limit = matching.length;
    render();
    filters.querySelector('[aria-pressed="true"]').focus({preventScroll: true});
  });

  function applyPhotoAnchor(hash) {
    if (hash === '#pond-photo-gallery') selectCategory('pond');
    if (hash === '#koi-photo-gallery') selectCategory('all');
    if (hash === '#all-koi-photos') {
      displayCategory = 'all';
      matching = cards;
      limit = cards.length;
      render();
    }
  }
  window.addEventListener('hashchange', event => {
    if (!location.hash && new URL(event.oldURL).hash === '#all-koi-photos') selectCategory('all');
    else applyPhotoAnchor(location.hash);
  });
  document.addEventListener('click', event => {
    if (event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
    const anchor = event.target.closest('a[href^="#"]');
    if (anchor && location.hash === anchor.hash) applyPhotoAnchor(anchor.hash);
  });
  if (['#all-koi-photos', '#pond-photo-gallery'].includes(location.hash)) applyPhotoAnchor(location.hash);
  else render();

  const dialog = element('dialog', 'kpc-dialog');
  if (typeof dialog.showModal !== 'function') return;
  const toolbar = element('div', 'kpc-dialog-bar');
  const title = element('h3', 'kpc-dialog-title');
  title.id = 'kpc-dialog-title';
  dialog.setAttribute('aria-labelledby', title.id);
  const close = button('kpc-dialog-button', text.close);
  close.autofocus = true;
  toolbar.append(title, close);
  const canvas = element('div', 'kpc-canvas');
  const photo = element('img', 'kpc-large-photo');
  photo.decoding = 'async';
  canvas.append(photo);
  const controls = element('div', 'kpc-dialog-controls');
  const previous = button('kpc-dialog-button', text.previous);
  const next = button('kpc-dialog-button', text.next);
  const position = element('span', 'kpc-position');
  position.setAttribute('aria-live', 'polite');
  controls.append(previous, position, next);
  const footer = element('div', 'kpc-dialog-footer');
  const credit = element('div', 'kpc-dialog-credit');
  const variety = element('a', 'kpc-dialog-variety', text.variety);
  footer.append(credit, variety);
  dialog.append(toolbar, canvas, controls, footer);
  document.body.append(dialog);

  let index = 0;
  let opener = null;
  function displayPhoto() {
    const card = matching[index];
    const anchor = card.querySelector('.kpc-image');
    const template = card.querySelector('template.kpc-thumb');
    const thumb = anchor.querySelector('img') || template?.content.querySelector('img');
    title.textContent = card.querySelector('.kpc-title')?.textContent || text.enlarge;
    photo.alt = thumb?.alt || title.textContent;
    photo.src = anchor.href;
    position.textContent = `${index + 1} / ${matching.length}`;
    credit.replaceChildren();
    const attribution = card.querySelector('.kpc-credit');
    if (attribution) credit.append(attribution.cloneNode(true));
    const guide = card.dataset.varietyUrl;
    variety.hidden = !guide;
    if (guide) variety.href = guide;
    previous.disabled = matching.length < 2;
    next.disabled = matching.length < 2;
  }
  function advance(step) {
    index = (index + step + matching.length) % matching.length;
    displayPhoto();
  }
  previous.addEventListener('click', () => advance(-1));
  next.addEventListener('click', () => advance(1));
  close.addEventListener('click', () => dialog.close());
  dialog.addEventListener('click', event => {
    if (event.target !== dialog) return;
    const bounds = dialog.getBoundingClientRect();
    if (event.clientX < bounds.left || event.clientX > bounds.right ||
        event.clientY < bounds.top || event.clientY > bounds.bottom) dialog.close();
  });
  dialog.addEventListener('keydown', event => {
    if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
    event.preventDefault();
    advance(event.key === 'ArrowLeft' ? -1 : 1);
  });
  dialog.addEventListener('close', () => {
    document.documentElement.classList.remove('kpc-dialog-open');
    photo.removeAttribute('src');
    opener?.focus({preventScroll: true});
  });
  grid.addEventListener('click', event => {
    const anchor = event.target.closest('a.kpc-image');
    if (!anchor || event.defaultPrevented || event.button !== 0 || event.altKey ||
        event.ctrlKey || event.metaKey || event.shiftKey) return;
    const targetIndex = matching.indexOf(anchor.closest('.kpc-card'));
    if (targetIndex < 0) return;
    event.preventDefault();
    opener = anchor;
    index = targetIndex;
    displayPhoto();
    dialog.showModal();
    document.documentElement.classList.add('kpc-dialog-open');
  });
})();
