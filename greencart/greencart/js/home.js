/* Home page: category filters, search, sale filter, sorting, layout toggle.
   Reads its data from js/products.js. */
(function () {
  const CATEGORIES = window.GREENCART_CATEGORIES;
  const PRODUCTS = window.GREENCART_PRODUCTS;
  const $ = (id) => document.getElementById(id);

  const money = new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP', maximumFractionDigits: 0 });
  const categoryLabel = Object.fromEntries(CATEGORIES.map((c) => [c.id, c.label]));

  // Everything the page is currently showing is decided by this one object.
  const state = { category: null, query: '', saleOnly: false, sort: 'featured', layout: 'grid' };

  const el = {
    search: $('search'), cats: $('cats'), grid: $('products-grid'),
    title: $('results-title'), count: $('results-count'), empty: $('empty'),
    saleChip: $('sale-chip'), sort: $('sort'), vGrid: $('v-grid'), vList: $('v-list'),
    navLinks: document.querySelectorAll('[data-nav]')
  };

  /* ---------- helpers ---------- */
  function esc(text) {
    return String(text).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  }

  function hasFilters() {
    return !!(state.category || state.query.trim() || state.saleOnly);
  }

  function resetFilters() {
    state.category = null;
    state.query = '';
    state.saleOnly = false;
    state.sort = 'featured';
    el.search.value = '';
    el.sort.value = 'featured';
  }

  function scrollTo(id) {
    $(id).scrollIntoView({ block: 'start' });
  }

  /* ---------- filtering + sorting ---------- */
  function getVisibleProducts() {
    const q = state.query.trim().toLowerCase();

    const list = PRODUCTS.filter((p) => {
      if (state.category && p.category !== state.category) return false;
      if (state.saleOnly && !p.oldPrice) return false;
      if (q && !(p.name.toLowerCase().includes(q) || categoryLabel[p.category].toLowerCase().includes(q))) return false;
      return true;
    });

    if (state.sort === 'price-asc') list.sort((a, b) => a.price - b.price);
    if (state.sort === 'price-desc') list.sort((a, b) => b.price - a.price);
    if (state.sort === 'name') list.sort((a, b) => a.name.localeCompare(b.name));
    return list;
  }

  /* ---------- rendering ---------- */
  function productCard(p) {
    const off = p.oldPrice ? Math.round((1 - p.price / p.oldPrice) * 100) : 0;
    return `
      <article class="product" data-cat="${esc(p.category)}">
        <div class="thumb">
          <img src="assets/products/${String(PRODUCTS.indexOf(p)).padStart(2, '0')}.webp" alt="${esc(p.name)}" style="position:absolute;inset:0;width:100%;height:100%;object-fit:contain" loading="lazy">
          ${p.organic ? '<span class="tag organic">Organic</span>' : ''}
          ${off ? `<span class="tag sale" aria-label="${off} percent off">-${off}%</span>` : ''}
        </div>
        <div class="info">
          <h4>${esc(p.name)}</h4>
          <p class="unit">${esc(p.unit)}</p>
          <p class="price"><strong>${money.format(p.price)}</strong>${p.oldPrice ? `<s>${money.format(p.oldPrice)}</s>` : ''}</p>
        </div>
      </article>`;
  }

  function renderCategories() {
    el.cats.innerHTML = CATEGORIES.map((c) => {
      const n = PRODUCTS.filter((p) => p.category === c.id).length;
      return `
        <button class="cat" data-category="${c.id}" aria-pressed="false">
          <svg aria-hidden="true"><use href="#${c.icon}"/></svg>
          ${esc(c.label)}
          <small>${n} items</small>
        </button>`;
    }).join('');
  }

  function renderProducts() {
    const list = getVisibleProducts();

    el.grid.innerHTML = list.map(productCard).join('');
    el.grid.classList.toggle('list', state.layout === 'list');
    el.grid.hidden = list.length === 0;
    el.empty.hidden = list.length !== 0;

    // heading + count
    let title = state.category ? categoryLabel[state.category] : 'All products';
    if (state.saleOnly) title = 'On sale: ' + title.toLowerCase();
    if (state.query.trim()) title += ` matching “${state.query.trim()}”`;
    el.title.textContent = title;
    el.count.textContent = list.length === 1 ? '1 item' : `${list.length} items`;
  }

  function renderControls() {
    el.cats.querySelectorAll('.cat').forEach((btn) => {
      btn.setAttribute('aria-pressed', String(btn.dataset.category === state.category));
    });
    el.saleChip.setAttribute('aria-pressed', String(state.saleOnly));
    el.vGrid.setAttribute('aria-pressed', String(state.layout === 'grid'));
    el.vList.setAttribute('aria-pressed', String(state.layout === 'list'));

    // which top-nav link is "current"
    const current = state.saleOnly ? 'sale' : hasFilters() ? 'shop' : 'home';
    el.navLinks.forEach((a) => {
      if (a.dataset.nav === current) a.setAttribute('aria-current', 'page');
      else a.removeAttribute('aria-current');
    });
  }

  function render() {
    renderProducts();
    renderControls();
  }

  /* ---------- events ---------- */
  // category tiles: click to filter, click again to clear
  el.cats.addEventListener('click', (e) => {
    const btn = e.target.closest('.cat');
    if (!btn) return;
    state.category = state.category === btn.dataset.category ? null : btn.dataset.category;
    render();
    if (state.category) scrollTo('products');
  });

  el.search.addEventListener('input', () => { state.query = el.search.value; render(); });
  el.saleChip.addEventListener('click', () => { state.saleOnly = !state.saleOnly; render(); });
  el.sort.addEventListener('change', () => { state.sort = el.sort.value; render(); });
  el.vGrid.addEventListener('click', () => { state.layout = 'grid'; render(); });
  el.vList.addEventListener('click', () => { state.layout = 'list'; render(); });
  $('clear-empty').addEventListener('click', () => { resetFilters(); render(); });

  // top navigation
  el.navLinks.forEach((a) => {
    a.addEventListener('click', (e) => {
      e.preventDefault();
      const target = a.dataset.nav;
      resetFilters();
      if (target === 'sale') state.saleOnly = true;
      render();
      scrollTo(target === 'home' ? 'top' : 'products');
    });
  });

  $('shop-now').addEventListener('click', () => { resetFilters(); render(); scrollTo('products'); });
  $('signout').addEventListener('click', () => { location.href = 'index.html'; });

  /* ---------- start ---------- */
  renderCategories();
  render();
})();