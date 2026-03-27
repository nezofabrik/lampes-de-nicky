/* ===========================
   Les Lampes de Nicky — JS
=========================== */

// ── LAMP DATA ─────────────────────────────────────────

const DEFAULT_LAMPS = [
  { id:'p1', name:'Lin Gris Anthracite', category:'suspension', price:164, badge:'Pièce rare', badgeNew:false,
    desc:"Suspension en lin gris anthracite avec ficelle de chanvre. Bois réutilisé, fibre naturelle. Taille M : 65×22 cm. Ampoule non fournie.",
    images:['images/lin-gris-1.jpg','images/lin-gris-2.jpg','images/lin-gris-3.jpg','images/lin-gris-4.jpg','images/lin-gris-5.jpg'], image:null },
  { id:'p2', name:'Lin Beige & Blanc', category:'suspension', price:164, badge:'Pièce rare', badgeNew:false,
    desc:"Suspension en lin extérieur beige et intérieur blanc, ficelle de chanvre. Bois réutilisé, fibre naturelle. Taille M : 62×26 cm. Ampoule non fournie.",
    images:['images/lin-beige-1.jpg','images/lin-beige-2.jpg','images/lin-beige-3.jpg','images/lin-beige-4.jpg','images/lin-beige-5.jpg'], image:null },
];

const LAMP_SVG = {
  suspension:`<svg fill="none" stroke="currentColor" stroke-width="1.2" viewBox="0 0 60 80"><line x1="30" y1="0" x2="30" y2="14" stroke-dasharray="3 3"/><path d="M8 48 L18 16 L42 16 L52 48 Z"/><ellipse cx="30" cy="49" rx="22" ry="6" opacity=".5"/><ellipse cx="30" cy="52" rx="14" ry="4" fill="currentColor" opacity=".3"/></svg>`,
  table:`<svg fill="none" stroke="currentColor" stroke-width="1.2" viewBox="0 0 60 80"><path d="M15 42 L22 20 L38 20 L45 42 Z"/><rect x="28" y="42" width="4" height="22" rx="1"/><ellipse cx="30" cy="65" rx="14" ry="4"/><ellipse cx="30" cy="44" rx="15" ry="4" opacity=".4"/></svg>`,
  applique:`<svg fill="none" stroke="currentColor" stroke-width="1.2" viewBox="0 0 60 80"><rect x="4" y="32" width="10" height="18" rx="1"/><rect x="13" y="37" width="18" height="3" rx="1"/><path d="M28 24 L38 42 L50 46 L42 20 Z"/><ellipse cx="40" cy="28" rx="6" ry="10" opacity=".3" transform="rotate(20 40 28)"/></svg>`,
};

function catLabel(c) { return {suspension:'Suspension',table:'Lampe de table',applique:'Applique murale'}[c] || c; }

// ── IndexedDB helpers ─────────────────────────────────
const _DB_NAME = 'nickyDB', _DB_VER = 1, _STORE = 'lamps';
let _db = null;

function _openDB(cb) {
  if (_db) { cb(_db); return; }
  const req = indexedDB.open(_DB_NAME, _DB_VER);
  req.onupgradeneeded = e => {
    const d = e.target.result;
    if (!d.objectStoreNames.contains(_STORE)) d.createObjectStore(_STORE, { keyPath: 'id' });
  };
  req.onsuccess = e => { _db = e.target.result; cb(_db); };
  req.onerror   = () => cb(null);
}

function getLampsAsync(cb) {
  _openDB(function(d) {
    if (!d) {
      try {
        const s = JSON.parse(localStorage.getItem('nicky_lamps'));
        cb(s && s.length ? s : DEFAULT_LAMPS);
      } catch { cb(DEFAULT_LAMPS); }
      return;
    }
    const req = d.transaction(_STORE, 'readonly').objectStore(_STORE).getAll();
    req.onsuccess = e => {
      const arr = e.target.result;
      if (!arr || !arr.length) {
        try {
          const s = JSON.parse(localStorage.getItem('nicky_lamps'));
          cb(s && s.length ? s : DEFAULT_LAMPS);
        } catch { cb(DEFAULT_LAMPS); }
      } else { cb(arr); }
    };
    req.onerror = () => cb(DEFAULT_LAMPS);
  });
}

// ── CARD RENDERING ────────────────────────────────────

function renderCard(lamp) {
  const firstImg = (lamp.images && lamp.images.length) ? lamp.images[0] : lamp.image;
  const cat = lamp.category || 'suspension';
  const ph = firstImg
    ? `<img src="${firstImg}" alt="${lamp.name}" class="product-photo" data-cat="${cat}" style="width:100%;height:100%;object-fit:cover">`
    : `<div class="img-placeholder ph-${cat}">${LAMP_SVG[cat] || ''}</div>`;
  return `
  <div class="product-card reveal" data-id="${lamp.id}" data-name="${lamp.name.replace(/"/g, '&quot;')}" data-price="${lamp.price}" data-category="${lamp.category}">
    <div class="product-image">
      ${ph}
      ${lamp.badge ? `<span class="product-badge${lamp.badgeNew ? ' new' : ''}">${lamp.badge}</span>` : ''}
    </div>
    <div class="product-info">
      <div class="product-category">${catLabel(lamp.category)}</div>
      <div class="product-name">${lamp.name}</div>
      <div class="product-desc">${lamp.desc}</div>
      ${lamp.comment ? `<div class="product-comment">"${lamp.comment}"</div>` : ''}
      <div class="product-footer">
        <span class="product-price" data-target="${lamp.price}">0 CHF</span>
        <button class="add-to-cart">Ajouter</button>
      </div>
    </div>
  </div>`;
}

function renderGrid(containerId, filter) {
  const el = document.getElementById(containerId);
  if (!el) return;
  getLampsAsync(function(lamps) {
    const list = (!filter || filter === 'all') ? lamps : lamps.filter(l => l.category === filter);
    el.innerHTML = list.map(renderCard).join('');
    el.querySelectorAll('.product-card').forEach((c, i) => { c.style.transitionDelay = `${i * 0.07}s`; });
    initAddToCartButtons();
    initScrollReveal();
    initPriceCounters();
  });
}

function renderFeatured(containerId) {
  const el = document.getElementById(containerId);
  if (!el) return;
  getLampsAsync(function(lamps) {
    el.innerHTML = lamps.slice(0, 3).map(renderCard).join('');
    el.querySelectorAll('.product-card').forEach((c, i) => { c.style.transitionDelay = `${i * 0.1}s`; });
    initAddToCartButtons();
    initScrollReveal();
    initPriceCounters();
  });
}

// ── CART ──────────────────────────────────────────────

const CART_KEY = 'nicky_cart';

function getCart() {
  try { return JSON.parse(localStorage.getItem(CART_KEY)) || []; }
  catch { return []; }
}

function saveCart(cart) {
  localStorage.setItem(CART_KEY, JSON.stringify(cart));
}

function addToCart(id, name, price, category) {
  const cart = getCart();
  const existing = cart.find(i => i.id === id);
  if (existing) {
    existing.qty += 1;
  } else {
    cart.push({ id, name, price, category, qty: 1 });
  }
  saveCart(cart);
  updateCartCount();
  showToast(`"${name}" ajoutée au panier`);
}

function removeFromCart(id) {
  const cart = getCart().filter(i => i.id !== id);
  saveCart(cart);
  updateCartCount();
  renderCart();
}

function updateQty(id, delta) {
  const cart = getCart();
  const item = cart.find(i => i.id === id);
  if (!item) return;
  item.qty = Math.max(1, item.qty + delta);
  saveCart(cart);
  updateCartCount();
  renderCart();
}

function updateCartCount() {
  const total = getCart().reduce((s, i) => s + i.qty, 0);
  document.querySelectorAll('.cart-count').forEach(el => {
    el.textContent = total;
    el.style.display = total > 0 ? 'flex' : 'none';
  });
}

function cartTotal() {
  return getCart().reduce((s, i) => s + i.price * i.qty, 0);
}

// ── TOAST ─────────────────────────────────────────────

function showToast(msg) {
  let toast = document.querySelector('.toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.className = 'toast';
    document.body.appendChild(toast);
  }
  toast.innerHTML = `
    <svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
      <polyline points="20 6 9 17 4 12"/>
    </svg>
    ${msg}
  `;
  toast.classList.add('show');
  clearTimeout(toast._timer);
  toast._timer = setTimeout(() => toast.classList.remove('show'), 3000);
}

// ── CART PAGE ─────────────────────────────────────────

function renderCart() {
  const listEl    = document.getElementById('cart-list');
  const emptyEl   = document.getElementById('cart-empty');
  const summaryEl = document.getElementById('order-summary');
  if (!listEl) return;

  const cart = getCart();

  if (cart.length === 0) {
    listEl.innerHTML = '';
    if (emptyEl)   emptyEl.style.display = 'block';
    if (summaryEl) summaryEl.style.display = 'none';
    updateSummary(0);
    return;
  }

  if (emptyEl)   emptyEl.style.display = 'none';
  if (summaryEl) summaryEl.style.display = '';

  listEl.innerHTML = cart.map(item => `
    <div class="cart-item">
      <div class="cart-item-thumb ph-${item.category || 'table'}">
        <svg width="28" height="28" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24" style="opacity:0.4">
          <path d="M9 2L5 9h14L15 2H9z"/><line x1="12" y1="9" x2="12" y2="16"/>
          <ellipse cx="12" cy="18" rx="5" ry="2"/>
        </svg>
      </div>
      <div class="cart-item-details">
        <div class="cart-item-name">${item.name}</div>
        <div class="cart-item-cat">${formatCat(item.category)}</div>
        <div class="cart-item-qty">
          <button class="qty-btn" onclick="updateQty('${item.id}', -1)">−</button>
          <span class="qty-display">${item.qty}</span>
          <button class="qty-btn" onclick="updateQty('${item.id}', 1)">+</button>
        </div>
      </div>
      <div class="cart-item-price">${(item.price * item.qty).toFixed(0)} CHF</div>
      <button class="cart-item-remove" onclick="removeFromCart('${item.id}')" title="Retirer">✕</button>
    </div>
  `).join('');

  updateSummary(cartTotal());
}

function formatCat(cat) {
  const map = { suspension: 'Suspension', table: 'Lampe de table', applique: 'Applique murale' };
  return map[cat] || cat;
}

function updateSummary(total) {
  const shipping = total >= 80 ? 0 : 8.9;
  const tva = total * 0.2;

  const set = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };
  set('summary-subtotal', total.toFixed(2) + ' CHF');
  set('summary-shipping', shipping === 0 ? 'Offerts' : shipping.toFixed(2) + ' CHF');
  set('summary-tva', tva.toFixed(2) + ' CHF');
  set('summary-total', (total + shipping).toFixed(2) + ' CHF');
}

// ── ANIMATIONS ────────────────────────────────────────

// Price counter
function initPriceCounters() {
  const els = document.querySelectorAll('.product-price[data-target]');
  if (!els.length) return;
  const obs = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (!e.isIntersecting) return;
      const el = e.target, target = parseInt(el.dataset.target), dur = 700, t0 = performance.now();
      (function step(now) {
        const p = Math.min((now - t0) / dur, 1), ease = 1 - Math.pow(1 - p, 3);
        el.textContent = Math.round(ease * target) + ' CHF';
        if (p < 1) requestAnimationFrame(step);
      })(t0);
      obs.unobserve(el);
    });
  }, { threshold: 0.5 });
  els.forEach(el => obs.observe(el));
}

// Mouse parallax on hero lamp
function initParallax() {
  const lamp = document.querySelector('.hero-lamp-svg');
  if (!lamp) return;
  let ticking = false;
  document.addEventListener('mousemove', e => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      const x = (e.clientX / window.innerWidth - 0.5) * 20;
      const y = (e.clientY / window.innerHeight - 0.5) * 14;
      lamp.style.transform = `translateY(${y}px) translateX(${x}px)`;
      ticking = false;
    });
  });
}

// Cursor spotlight in dark mode
function initCursorGlow() {
  const glow = document.createElement('div');
  glow.id = 'cursor-glow';
  glow.style.cssText = 'position:fixed;pointer-events:none;z-index:9998;width:320px;height:320px;border-radius:50%;transform:translate(-50%,-50%);background:radial-gradient(circle,rgba(255,203,154,0.07) 0%,transparent 70%);transition:opacity 0.4s;opacity:0;';
  document.body.appendChild(glow);

  document.addEventListener('mousemove', e => {
    glow.style.left = e.clientX + 'px';
    glow.style.top = e.clientY + 'px';
    glow.style.opacity = document.documentElement.getAttribute('data-theme') === 'dark' ? '1' : '0';
  });
}

// Floating warm particles (canvas)
function initParticles() {
  const canvas = document.createElement('canvas');
  canvas.id = 'particles-canvas';
  canvas.style.cssText = 'position:fixed;inset:0;pointer-events:none;z-index:9997;';
  document.body.appendChild(canvas);
  const ctx = canvas.getContext('2d');

  function resize() { canvas.width = window.innerWidth; canvas.height = window.innerHeight; }
  resize();
  window.addEventListener('resize', resize);

  const pts = Array.from({ length: 12 }, () => ({
    x:  Math.random() * window.innerWidth,
    y:  Math.random() * window.innerHeight,
    r:  Math.random() * 1.5 + 0.5,
    vy: -(Math.random() * 0.2 + 0.05),
    vx: (Math.random() - 0.5) * 0.1,
    a:  Math.random() * 0.12 + 0.04,
    color: `rgba(255,${190 + Math.floor(Math.random() * 30)},90,`,
  }));

  let raf;
  (function loop() {
    raf = requestAnimationFrame(loop);
    const dark = document.documentElement.getAttribute('data-theme') === 'dark';
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    if (!dark) return;
    pts.forEach(p => {
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = p.color + p.a + ')';
      ctx.fill();
      p.y += p.vy; p.x += p.vx;
      if (p.y < -4) { p.y = canvas.height + 4; p.x = Math.random() * canvas.width; }
      if (p.x < 0 || p.x > canvas.width) p.vx *= -1;
    });
  })();
}

// Add-to-cart burst particles
function burstCart(btn) {
  const rect = btn.getBoundingClientRect();
  const cx = rect.left + rect.width / 2, cy = rect.top + rect.height / 2;
  for (let i = 0; i < 10; i++) {
    const dot = document.createElement('div');
    const angle = (i / 10) * Math.PI * 2;
    const d = 28 + Math.random() * 20;
    dot.style.cssText = `position:fixed;pointer-events:none;z-index:9999;width:6px;height:6px;border-radius:50%;background:var(--peach);left:${cx}px;top:${cy}px;transform:translate(-50%,-50%);animation:burst-dot 0.6s ease-out forwards;--tx:${Math.cos(angle) * d}px;--ty:${Math.sin(angle) * d}px;`;
    document.body.appendChild(dot);
    setTimeout(() => dot.remove(), 650);
  }
}

// Grain overlay
function initGrain() {
  const g = document.createElement('div');
  g.className = 'grain-overlay';
  document.body.appendChild(g);
}

// Hero text word-by-word reveal
function initHeroText() {
  const h1 = document.querySelector('.hero h1');
  if (!h1) return;
  h1.classList.add('hero-title-anim');
}

// ── FILTERS ───────────────────────────────────────────

function initFilters() {
  const btns = document.querySelectorAll('.filter-btn');
  if (!btns.length) return;

  // Update counts dynamically from lamp data
  getLampsAsync(function(lamps) {
    btns.forEach(btn => {
      const f = btn.dataset.filter;
      const count = f === 'all' ? lamps.length : lamps.filter(l => l.category === f).length;
      // Replace label text (keep everything before the first "(")
      const label = btn.textContent.replace(/\s*\(\d+\)/, '');
      btn.textContent = label + ' (' + count + ')';
    });
  });

  btns.forEach(btn => {
    btn.addEventListener('click', () => {
      btns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      renderGrid('products-grid', btn.dataset.filter);
    });
  });
}

// ── ADD-TO-CART BUTTONS ───────────────────────────────

function initAddToCartButtons() {
  document.querySelectorAll('.add-to-cart').forEach(btn => {
    btn.addEventListener('click', () => {
      const card = btn.closest('[data-id]');
      if (!card) return;
      const id       = card.dataset.id;
      const name     = card.dataset.name;
      const price    = parseFloat(card.dataset.price);
      const category = card.dataset.category || '';
      addToCart(id, name, price, category);
      burstCart(btn);
      btn.textContent = '✓ Ajoutée';
      btn.classList.add('added');
      setTimeout(() => {
        btn.textContent = 'Ajouter';
        btn.classList.remove('added');
      }, 2000);
    });
  });
}

// ── CARD INPUT VISUAL ─────────────────────────────────

function initCardInputs() {
  const numInput  = document.getElementById('card-number');
  const expInput  = document.getElementById('card-exp');
  const nameInput = document.getElementById('card-name');

  if (numInput) {
    numInput.addEventListener('input', e => {
      let v = e.target.value.replace(/\D/g, '').slice(0, 16);
      e.target.value = v.replace(/(.{4})/g, '$1 ').trim();
      const display = document.getElementById('card-number-display');
      if (display) display.textContent = (v + '0000000000000000').slice(0, 16).replace(/(.{4})/g, '$1 ').trim();
    });
  }

  if (expInput) {
    expInput.addEventListener('input', e => {
      let v = e.target.value.replace(/\D/g, '').slice(0, 4);
      if (v.length >= 3) v = v.slice(0, 2) + '/' + v.slice(2);
      e.target.value = v;
      const display = document.getElementById('card-exp-display');
      if (display) display.textContent = v || 'MM/AA';
    });
  }

  if (nameInput) {
    nameInput.addEventListener('input', e => {
      const display = document.getElementById('card-name-display');
      if (display) display.textContent = e.target.value.toUpperCase() || 'VOTRE NOM';
    });
  }
}

// ── PAYMENT METHOD TABS ───────────────────────────────

function initPaymentTabs() {
  document.querySelectorAll('.pay-method').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.pay-method').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const method = btn.dataset.method;
      document.querySelectorAll('[data-payment-form]').forEach(f => {
        f.style.display = f.dataset.paymentForm === method ? '' : 'none';
      });
    });
  });
}

// ── CHECKOUT FORM ─────────────────────────────────────

function initCheckoutForm() {
  const form = document.getElementById('checkout-form');
  if (!form) return;
  form.addEventListener('submit', e => {
    e.preventDefault();
    const cart = getCart();
    if (!cart.length) { showToast('Votre panier est vide !'); return; }

    const btn = form.querySelector('[type="submit"]');
    btn.textContent = 'Traitement en cours…';
    btn.disabled = true;

    setTimeout(() => {
      saveCart([]);
      updateCartCount();
      document.getElementById('checkout-success').style.display = 'block';
      document.getElementById('checkout-form-wrapper').style.display = 'none';
      document.getElementById('cart-block').style.display = 'none';
    }, 1800);
  });
}

// ── CONTACT FORM ──────────────────────────────────────

function initContactForm() {
  const form = document.getElementById('contact-form');
  if (!form) return;
  form.addEventListener('submit', e => {
    e.preventDefault();
    showToast('Message envoyé ! Je vous réponds bientôt.');
    form.reset();
  });
}

// ── SCROLL REVEAL ─────────────────────────────────────

function initScrollReveal() {
  const els = document.querySelectorAll('.reveal');
  if (!('IntersectionObserver' in window)) {
    els.forEach(el => el.classList.add('visible'));
    return;
  }
  const obs = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        obs.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12 });
  els.forEach(el => obs.observe(el));
}

// ── ACTIVE NAV ────────────────────────────────────────

function setActiveNav() {
  const path = window.location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('nav a').forEach(a => {
    const href = a.getAttribute('href');
    if (href === path || (path === '' && href === 'index.html')) {
      a.classList.add('active');
    }
  });
}

// ── THEME TOGGLE ──────────────────────────────────────

function initThemeToggle() {
  const btn = document.getElementById('theme-toggle');
  if (!btn) return;
  btn.addEventListener('click', () => {
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    if (isDark) {
      document.documentElement.removeAttribute('data-theme');
      localStorage.setItem('nicky_theme', 'light');
      removeFireflies();
    } else {
      document.documentElement.setAttribute('data-theme', 'dark');
      localStorage.setItem('nicky_theme', 'dark');
      // Relancer l'animation de la lampe (re-trigger CSS animations)
      const lamp = document.querySelector('.hero-lamp-svg');
      if (lamp) {
        lamp.querySelectorAll('.lamp-bulb,.lamp-inner-glow,.lamp-cone,.lamp-floor,.lamp-ray').forEach(el => {
          el.style.animation = 'none';
          el.offsetHeight; // reflow
          el.style.animation = '';
        });
      }
      setTimeout(initFireflies, 1200);
      hideDarkTeaser();
    }
  });
}

// ── LUCIOLES ─────────────────────────────────────────
function initFireflies() {
  removeFireflies();
  if (document.documentElement.getAttribute('data-theme') !== 'dark') return;
  const count = 16;
  for (let i = 0; i < count; i++) {
    const ff = document.createElement('div');
    ff.className = 'nicky-firefly';
    const size = 3 + Math.random() * 5;
    const dur  = 7 + Math.random() * 9;
    const del  = Math.random() * 8;
    const op   = 0.35 + Math.random() * 0.5;
    const dx   = (Math.random() - 0.5) * 100;
    const dy   = -(60 + Math.random() * 120);
    const dx2  = (Math.random() - 0.5) * 80;
    const dy2  = -(140 + Math.random() * 100);
    ff.style.cssText = `
      left:${5 + Math.random() * 90}%;
      top:${15 + Math.random() * 75}%;
      width:${size}px; height:${size}px;
      background:radial-gradient(circle,#FFDE9A 0%,#FFCB9A 40%,transparent 75%);
      --ff-dur:${dur}s; --ff-delay:${del}s; --ff-op:${op};
      --ff-dx:${dx}px;  --ff-dy:${dy}px;
      --ff-dx2:${dx2}px; --ff-dy2:${dy2}px;
    `;
    document.body.appendChild(ff);
  }
}

function removeFireflies() {
  document.querySelectorAll('.nicky-firefly').forEach(f => f.remove());
}

// ── TEASER MODE SOMBRE ───────────────────────────────
function initDarkTeaser() {
  const teaser = document.getElementById('dark-teaser');
  if (!teaser) return;
  // Ne montrer que si le mode sombre n'a jamais été activé
  if (localStorage.getItem('nicky_theme') === 'dark') return;
  if (localStorage.getItem('nicky_teaser_seen')) return;
  if (document.documentElement.getAttribute('data-theme') === 'dark') return;

  setTimeout(() => { teaser.classList.add('visible'); }, 2000);
  setTimeout(() => { hideDarkTeaser(); }, 14000);
}

function hideDarkTeaser() {
  const teaser = document.getElementById('dark-teaser');
  if (!teaser) return;
  teaser.classList.remove('visible');
  teaser.classList.add('hiding');
  localStorage.setItem('nicky_teaser_seen', '1');
  setTimeout(() => teaser.remove(), 400);
}

// ── PRODUCT DETAIL MODAL ──────────────────────────────

(function() {
  'use strict';

  // ── State ────────────────────────────────────────────
  let _overlay = null, _lightbox = null;
  let _currentImages = [], _currentIdx = 0;
  let _currentLamp = null;

  // ── Build DOM (once) ─────────────────────────────────
  function _buildModal() {
    if (_overlay) return;

    _overlay = document.createElement('div');
    _overlay.className = 'pdm-overlay';
    _overlay.setAttribute('role', 'dialog');
    _overlay.setAttribute('aria-modal', 'true');
    _overlay.innerHTML = `
      <div class="pdm-dialog" id="pdm-dialog">
        <button class="pdm-close" id="pdm-close" aria-label="Fermer">✕</button>

        <!-- Gallery -->
        <div class="pdm-gallery" id="pdm-gallery">
          <div class="pdm-main-wrap" id="pdm-main-wrap">
            <button class="pdm-arrow pdm-arrow-prev" id="pdm-prev" aria-label="Photo précédente">&#8592;</button>
            <button class="pdm-arrow pdm-arrow-next" id="pdm-next" aria-label="Photo suivante">&#8594;</button>
          </div>
          <div class="pdm-thumbs" id="pdm-thumbs"></div>
        </div>

        <!-- Info -->
        <div class="pdm-info" id="pdm-info">
          <div class="pdm-category" id="pdm-cat"></div>
          <h2 class="pdm-name" id="pdm-name"></h2>
          <div class="pdm-badge" id="pdm-badge" style="display:none"></div>
          <p class="pdm-desc" id="pdm-desc"></p>
          <p class="pdm-comment" id="pdm-comment" style="display:none"></p>
          <div class="pdm-price-row">
            <span class="pdm-price" id="pdm-price"></span>
            <span class="pdm-price-currency">CHF</span>
          </div>
          <div class="pdm-actions">
            <button class="pdm-btn-cart" id="pdm-btn-cart">
              <svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/>
                <path d="M16 10a4 4 0 01-8 0"/>
              </svg>
              Ajouter au panier
            </button>
            <button class="pdm-btn-question" id="pdm-btn-question">Poser une question</button>

            <form class="pdm-question-form" id="pdm-qform" novalidate>
              <label for="pdm-qname">Votre prénom</label>
              <input type="text" id="pdm-qname" placeholder="Marie" required>
              <label for="pdm-qemail">Email</label>
              <input type="email" id="pdm-qemail" placeholder="marie@email.com" required>
              <label for="pdm-qmsg">Message</label>
              <textarea id="pdm-qmsg" required></textarea>
              <button type="submit" class="pdm-btn-send">Envoyer le message</button>
            </form>
            <div class="pdm-sent-msg" id="pdm-sent">Message envoyé !</div>
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(_overlay);

    // Lightbox
    _lightbox = document.createElement('div');
    _lightbox.className = 'pdm-lightbox';
    _lightbox.innerHTML = `
      <button class="pdm-lightbox-close" aria-label="Fermer le zoom">✕</button>
      <img id="pdm-lb-img" src="" alt="">
    `;
    document.body.appendChild(_lightbox);

    _bindEvents();
  }

  // ── Helpers ──────────────────────────────────────────
  function _catLabel(c) { return {suspension:'Suspension',table:'Lampe de table',applique:'Applique murale'}[c] || c; }

  function _getImages(lamp) {
    if (lamp.images && lamp.images.length) return lamp.images;
    if (lamp.image) return [lamp.image];
    return [];
  }

  // ── Render gallery ───────────────────────────────────
  function _renderGallery(images, idx, category) {
    const wrap = document.getElementById('pdm-main-wrap');
    const thumbsEl = document.getElementById('pdm-thumbs');

    // Main display
    // keep buttons, replace content node
    const existing = wrap.querySelector('.pdm-main-img, .pdm-main-ph');
    if (existing) existing.remove();

    if (images.length > 0) {
      const img = document.createElement('img');
      img.className = 'pdm-main-img';
      img.src = images[idx];
      img.alt = _currentLamp ? _currentLamp.name : '';
      wrap.appendChild(img);
    } else {
      const ph = document.createElement('div');
      ph.className = `pdm-main-ph ph-${category}`;
      ph.innerHTML = LAMP_SVG[category] || '';
      wrap.appendChild(ph);
    }

    // Arrows
    const prev = document.getElementById('pdm-prev');
    const next = document.getElementById('pdm-next');
    if (images.length <= 1) {
      prev.style.display = 'none';
      next.style.display = 'none';
    } else {
      prev.style.display = '';
      next.style.display = '';
      prev.disabled = false;
      next.disabled = false;
    }

    // Thumbnails
    if (images.length <= 1) {
      thumbsEl.innerHTML = '';
    } else {
      thumbsEl.innerHTML = images.map((src, i) =>
        `<div class="pdm-thumb${i === idx ? ' active' : ''}" data-idx="${i}">
          <img src="${src}" alt="">
        </div>`
      ).join('');
    }
  }

  function _goToPhoto(idx) {
    _currentIdx = Math.max(0, Math.min(idx, _currentImages.length - 1));
    _renderGallery(_currentImages, _currentIdx, _currentLamp ? _currentLamp.category : 'suspension');
  }

  // ── Open modal ───────────────────────────────────────
  function openProductModal(lamp) {
    _buildModal();
    _currentLamp = lamp;
    _currentImages = _getImages(lamp);
    _currentIdx = 0;

    // Populate info
    document.getElementById('pdm-cat').textContent = _catLabel(lamp.category);
    document.getElementById('pdm-name').textContent = lamp.name;

    const badgeEl = document.getElementById('pdm-badge');
    if (lamp.badge) {
      badgeEl.textContent = lamp.badge;
      badgeEl.className = 'pdm-badge' + (lamp.badgeNew ? ' new' : '');
      badgeEl.style.display = '';
    } else {
      badgeEl.style.display = 'none';
    }

    document.getElementById('pdm-desc').textContent = lamp.desc || '';

    const commentEl = document.getElementById('pdm-comment');
    if (lamp.comment) {
      commentEl.textContent = '\u201c' + lamp.comment + '\u201d';
      commentEl.style.display = '';
    } else {
      commentEl.style.display = 'none';
    }

    document.getElementById('pdm-price').textContent = lamp.price;

    // Reset cart button
    const cartBtn = document.getElementById('pdm-btn-cart');
    cartBtn.textContent = '';
    cartBtn.innerHTML = `<svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 01-8 0"/></svg> Ajouter au panier`;
    cartBtn.classList.remove('added');
    cartBtn.dataset.id = lamp.id;
    cartBtn.dataset.name = lamp.name;
    cartBtn.dataset.price = lamp.price;
    cartBtn.dataset.category = lamp.category;

    // Reset question form
    const qform = document.getElementById('pdm-qform');
    qform.classList.remove('open');
    qform.reset();
    document.getElementById('pdm-sent').classList.remove('visible');
    document.getElementById('pdm-btn-question').textContent = 'Poser une question';
    document.getElementById('pdm-qmsg').value = `Bonjour, j\u2019ai une question sur la lampe \u00ab\u00a0${lamp.name}\u00a0\u00bb.`;

    // Render gallery
    _renderGallery(_currentImages, 0, lamp.category);

    // Open
    _overlay.classList.add('pdm-open');
    document.body.style.overflow = 'hidden';
  }

  // ── Close modal ──────────────────────────────────────
  function closeProductModal() {
    if (!_overlay) return;
    _overlay.classList.remove('pdm-open');
    document.body.style.overflow = '';
    closeLightbox();
  }

  // ── Lightbox ─────────────────────────────────────────
  function openLightbox(src) {
    if (!src || !_lightbox) return;
    document.getElementById('pdm-lb-img').src = src;
    _lightbox.classList.add('open');
  }

  function closeLightbox() {
    if (!_lightbox) return;
    _lightbox.classList.remove('open');
  }

  // ── Event binding ────────────────────────────────────
  function _bindEvents() {
    // Close button
    document.getElementById('pdm-close').addEventListener('click', closeProductModal);

    // Overlay click outside dialog
    _overlay.addEventListener('click', function(e) {
      if (e.target === _overlay) closeProductModal();
    });

    // Keyboard
    document.addEventListener('keydown', function(e) {
      if (!_overlay || !_overlay.classList.contains('pdm-open')) return;
      if (e.key === 'Escape') {
        if (_lightbox && _lightbox.classList.contains('open')) {
          closeLightbox();
        } else {
          closeProductModal();
        }
      }
      if (e.key === 'ArrowLeft' && _currentImages.length > 1) _goToPhoto(_currentIdx - 1);
      if (e.key === 'ArrowRight' && _currentImages.length > 1) _goToPhoto(_currentIdx + 1);
    });

    // Arrow buttons
    document.getElementById('pdm-prev').addEventListener('click', function(e) {
      e.stopPropagation();
      _goToPhoto(_currentIdx - 1);
    });
    document.getElementById('pdm-next').addEventListener('click', function(e) {
      e.stopPropagation();
      _goToPhoto(_currentIdx + 1);
    });

    // Thumbnail clicks (delegated)
    document.getElementById('pdm-thumbs').addEventListener('click', function(e) {
      const thumb = e.target.closest('.pdm-thumb');
      if (!thumb) return;
      _goToPhoto(parseInt(thumb.dataset.idx));
    });

    // Main image zoom click
    document.getElementById('pdm-main-wrap').addEventListener('click', function(e) {
      if (e.target.closest('.pdm-arrow')) return;
      const src = _currentImages[_currentIdx];
      if (src) openLightbox(src);
    });

    // Lightbox close
    _lightbox.querySelector('.pdm-lightbox-close').addEventListener('click', closeLightbox);
    _lightbox.addEventListener('click', function(e) {
      if (e.target === _lightbox || e.target === _lightbox.querySelector('img')) closeLightbox();
    });

    // Add to cart
    document.getElementById('pdm-btn-cart').addEventListener('click', function() {
      const btn = this;
      const id       = btn.dataset.id;
      const name     = btn.dataset.name;
      const price    = parseFloat(btn.dataset.price);
      const category = btn.dataset.category || '';
      addToCart(id, name, price, category);
      burstCart(btn);
      btn.innerHTML = '&#10003; Ajoutée au panier';
      btn.classList.add('added');
      setTimeout(() => {
        btn.innerHTML = `<svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 01-8 0"/></svg> Ajouter au panier`;
        btn.classList.remove('added');
      }, 2500);
    });

    // Toggle question form
    document.getElementById('pdm-btn-question').addEventListener('click', function() {
      const qform = document.getElementById('pdm-qform');
      const isOpen = qform.classList.toggle('open');
      this.textContent = isOpen ? 'Annuler' : 'Poser une question';
      if (isOpen) {
        const sentMsg = document.getElementById('pdm-sent');
        sentMsg.classList.remove('visible');
      }
    });

    // Submit question form
    document.getElementById('pdm-qform').addEventListener('submit', function(e) {
      e.preventDefault();
      const name    = document.getElementById('pdm-qname').value.trim();
      const email   = document.getElementById('pdm-qemail').value.trim();
      const message = document.getElementById('pdm-qmsg').value.trim();
      if (!name || !email || !message) return;

      const subject = encodeURIComponent('Question sur : ' + (_currentLamp ? _currentLamp.name : ''));
      const body    = encodeURIComponent(`Nom : ${name}\nEmail : ${email}\n\n${message}`);
      const mailto  = `mailto:nicky@lampes-de-nicky.ch?subject=${subject}&body=${body}`;

      // Try to open mailto, then show confirmation
      const a = document.createElement('a');
      a.href = mailto;
      a.style.display = 'none';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);

      this.classList.remove('open');
      document.getElementById('pdm-btn-question').textContent = 'Poser une question';
      document.getElementById('pdm-sent').classList.add('visible');
    });
  }

  // ── Init card click handlers ─────────────────────────
  function initProductCardClicks() {
    document.addEventListener('click', function(e) {
      const card = e.target.closest('.product-card[data-id]');
      if (!card) return;

      // Let add-to-cart button work normally without opening modal
      if (e.target.closest('.add-to-cart')) return;

      const id = card.dataset.id;
      getLampsAsync(function(lamps) {
        const lamp = lamps.find(l => String(l.id) === String(id));
        if (lamp) openProductModal(lamp);
      });
    });
  }

  // ── Expose & auto-init ───────────────────────────────
  window.openProductModal  = openProductModal;
  window.closeProductModal = closeProductModal;

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initProductCardClicks);
  } else {
    initProductCardClicks();
  }

})();

// ── INIT ──────────────────────────────────────────────

// Fix images cassées → fallback SVG placeholder
document.addEventListener('error', function(e) {
  if (e.target.tagName === 'IMG' && e.target.classList.contains('product-photo')) {
    const cat = e.target.dataset.cat || 'suspension';
    e.target.parentElement.innerHTML = `<div class="img-placeholder ph-${cat}">${LAMP_SVG[cat] || ''}</div>`;
  }
}, true);

document.addEventListener('DOMContentLoaded', () => {
  initGrain();
  initCursorGlow();
  initParticles();
  updateCartCount();
  setActiveNav();

  // Render dynamic grids if containers exist
  renderGrid('products-grid');
  renderFeatured('featured-grid');

  initFilters();
  initAddToCartButtons();
  renderCart();
  initCardInputs();
  initPaymentTabs();
  initCheckoutForm();
  initContactForm();
  initScrollReveal();
  initThemeToggle();
  initParallax();
  initHeroText();
  initDarkTeaser();

  // Lucioles si déjà en mode sombre au chargement
  if (document.documentElement.getAttribute('data-theme') === 'dark') {
    setTimeout(initFireflies, 800);
  }
});
