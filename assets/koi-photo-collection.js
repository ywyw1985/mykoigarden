(() => {
  const section = document.getElementById('koi-photo-collection');
  if (!section) return;
  const grid = section.querySelector('.kpc-grid');
  if (!grid) return;
  const cards = Array.from(grid.querySelectorAll('.kpc-card'));
  if (!cards.length) return;

  const groups = Array.from(grid.querySelectorAll('.kpc-group'));
  const languages = {
    en: {
      groups: 'Jump to a group', all: n => `All ${n} photographs`, previous: 'Previous', next: 'Next',
      close: 'Close', enlarge: 'View photo', variety: 'Explore this variety'
    },
    zh: {
      groups: '跳至分组', all: n => `全部 ${n} 张照片`, previous: '上一张', next: '下一张',
      close: '关闭', enlarge: '放大照片', variety: '了解这个品种'
    },
    ja: {
      groups: 'グループを選ぶ', all: n => `すべての写真（${n}枚）`, previous: '前の写真', next: '次の写真',
      close: '閉じる', enlarge: '写真を拡大', variety: 'この品種を詳しく見る'
    },
    es: {
      groups: 'Ir a un grupo', all: n => `Las ${n} fotografías`, previous: 'Anterior', next: 'Siguiente',
      close: 'Cerrar', enlarge: 'Ampliar foto', variety: 'Conocer esta variedad'
    }
  };
  const text = languages[document.documentElement.lang.toLowerCase().split('-')[0]] || languages.en;

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
  function materialize(template) {
    template.replaceWith(template.content.cloneNode(true));
  }
  const templates = grid.querySelectorAll('template.kpc-thumb');
  for (const template of templates) {
    const alt = template.content.querySelector('img')?.alt;
    if (alt) template.parentElement.setAttribute('aria-label', alt);
  }
  if ('IntersectionObserver' in window) {
    const approaching = new IntersectionObserver(entries => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        const template = entry.target.querySelector('template.kpc-thumb');
        if (template) materialize(template);
        approaching.unobserve(entry.target);
      }
    }, {rootMargin: '450px 0px'});
    for (const template of templates) approaching.observe(template.parentElement);
  } else {
    // Native lazy loading still applies in browsers without the observer.
    templates.forEach(materialize);
  }

  if (groups.length) {
    const tools = element('div', 'kpc-tools');
    const label = element('label', 'kpc-jump-label', text.groups);
    const picker = element('select', 'kpc-jump');
    picker.id = 'kpc-jump';
    label.htmlFor = picker.id;
    picker.add(new Option(text.all(cards.length), 'all-koi-photos'));
    for (const group of groups) {
      const groupName = group.querySelector('h3').textContent.trim();
      const total = group.querySelectorAll('.kpc-card').length;
      picker.add(new Option(`${groupName} (${total})`, group.id));
    }
    tools.append(label, picker);
    const schoolLink = section.querySelector('.kpc-schools-link');
    if (schoolLink) tools.append(schoolLink);
    grid.before(tools);

    function syncPicker() {
      const target = document.getElementById(location.hash.slice(1));
      picker.value = target?.closest('.kpc-group')?.id || 'all-koi-photos';
    }
    picker.addEventListener('change', () => {
      const target = document.getElementById(picker.value);
      if (!target) return;
      if (location.hash !== '#' + target.id) location.hash = target.id;
      else target.scrollIntoView();
    });
    window.addEventListener('hashchange', syncPicker);
    syncPicker();

    const siteHeader = document.querySelector('.site-header');
    function measureNavigation() {
      section.style.setProperty('--kpc-header-height', `${siteHeader?.offsetHeight || 0}px`);
      section.style.setProperty('--kpc-tools-height', `${tools.offsetHeight}px`);
    }
    measureNavigation();
    if ('ResizeObserver' in window) {
      const resize = new ResizeObserver(measureNavigation);
      resize.observe(tools);
      if (siteHeader) resize.observe(siteHeader);
    } else {
      window.addEventListener('resize', measureNavigation);
    }
  }

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

  let matching = cards;
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
    const group = anchor.closest('.kpc-group') || grid;
    matching = Array.from(group.querySelectorAll('.kpc-card'));
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
