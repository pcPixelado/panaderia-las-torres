/* script.js — Versión profesional, modular y optimizada
   Mantiene tu funcionalidad original y añade: carrito (localStorage),
   pedidos por WhatsApp, accesibilidad, debounce de scroll, animaciones
*/
(function () {
  'use strict';

  /* ---------- Helpers ---------- */
  const $ = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));
  const qsAll = $$;

  const formatPrice = price => {
    const p = Number(price);
    if (Number.isNaN(p)) return price;
    return p.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' });
  };

  const debounce = (fn, wait = 100) => {
    let t;
    return (...args) => {
      clearTimeout(t);
      t = setTimeout(() => fn.apply(this, args), wait);
    };
  };

  /* ---------- State / Selectors ---------- */
  const state = {
    cart: [], // {id, title, price, qty}
  };

  const dom = {
    navLinks: qsAll('.nav-link'),
    sections: qsAll('.section'),
    filterBtns: qsAll('.filter-btn'),
    productCards: qsAll('.producto-card'),
    productosGrid: $('#productosGrid'),
    overlayBtns: qsAll('.overlay-btn'),
    modal: $('#productModal'),
    modalClose: $('.modal-close'),
    modalImg: $('#modalImg'),
    modalTitle: $('#modalTitle'),
    modalDesc: $('#modalDesc'),
    modalPrice: $('#modalPrice'),
    modalAddCart: null, // assigned when modal opens
    modalWhatsapp: $('#modalWhatsapp'),
    cartToggle: $('#cartToggle'),
    cartDrawer: $('#cartDrawer'),
    cartClose: $('.cart-close'),
    cartItems: $('#cartItems'),
    cartTotal: $('#cartTotal'),
    cartCount: $('#cartCount'),
    addToCartButtons: qsAll('.add-to-cart'),
    contactForm: $('#contactForm'),
    btnSmsOrder: $('#smsOrder'),
    checkoutBtn: $('#checkoutBtn'),
    clearCartBtn: $('#clearCart'),
  };

  /* ---------- Persistence (localStorage) ---------- */
  const CART_KEY = 'panaderia_cart_v1';

  function loadCart() {
    try {
      const raw = localStorage.getItem(CART_KEY);
      state.cart = raw ? JSON.parse(raw) : [];
    } catch (e) {
      state.cart = [];
    }
    renderCart();
  }

  function saveCart() {
    localStorage.setItem(CART_KEY, JSON.stringify(state.cart));
  }

  function cartQuantity() {
    return state.cart.reduce((s, it) => s + it.qty, 0);
  }

  function cartTotal() {
    const total = state.cart.reduce((s, it) => s + Number(it.price) * it.qty, 0);
    return total;
  }

  /* ---------- Cart functions ---------- */
  function addToCart(product) {
    const existing = state.cart.find(i => i.id === product.id);
    if (existing) {
      existing.qty += 1;
    } else {
      state.cart.push({ ...product, qty: 1 });
    }
    saveCart();
    renderCart();
    flashCartCount();
  }

  function removeFromCart(id) {
    state.cart = state.cart.filter(i => i.id !== id);
    saveCart();
    renderCart();
  }

  function clearCart() {
    state.cart = [];
    saveCart();
    renderCart();
  }

  function renderCart() {
    if (!dom.cartItems) return;
    dom.cartItems.innerHTML = '';
    if (state.cart.length === 0) {
      const li = document.createElement('li');
      li.className = 'cart-item';
      li.textContent = 'Tu carrito está vacío';
      dom.cartItems.appendChild(li);
    } else {
      state.cart.forEach(item => {
        const li = document.createElement('li');
        li.className = 'cart-item';
        li.innerHTML = `
          <div>
            <div class="cart-item-title">${escapeHtml(item.title)}</div>
            <div class="cart-item-qty">x${item.qty} · ${formatPrice(item.price)}</div>
          </div>
          <div>
            <button class="btn-small cart-remove" data-id="${item.id}" aria-label="Eliminar ${escapeHtml(item.title)}">Eliminar</button>
          </div>
        `;
        dom.cartItems.appendChild(li);
      });

      // Attach remove handlers
      qsAll('.cart-remove', dom.cartItems).forEach(btn => {
        btn.addEventListener('click', e => {
          const id = btn.dataset.id;
          removeFromCart(id);
        });
      });
    }

    dom.cartTotal.textContent = formatPrice(cartTotal());
    dom.cartCount.textContent = cartQuantity();
    // update aria-expanded on cartToggle if present
    if (dom.cartToggle) dom.cartToggle.setAttribute('aria-expanded', dom.cartDrawer.classList.contains('open'));
  }

  function flashCartCount() {
    if (!dom.cartCount) return;
    dom.cartCount.classList.add('pulse');
    setTimeout(() => dom.cartCount.classList.remove('pulse'), 900);
  }

  /* ---------- Accessibility helpers ---------- */
  function trapFocus(container) {
    const focusable = container.querySelectorAll('a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])');
    if (!focusable.length) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    function handle(e) {
      if (e.key === 'Tab') {
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      } else if (e.key === 'Escape') {
        closeModal();
      }
    }
    container.addEventListener('keydown', handle);
    return () => container.removeEventListener('keydown', handle);
  }

  /* ---------- Modal (product) ---------- */
  let modalTrapOff = null;
  function openModal(data) {
    dom.modal.classList.add('open');
    dom.modal.setAttribute('aria-hidden', 'false');
    dom.modalImg.src = data.img;
    dom.modalImg.alt = `${data.title} - Panadería Las Torres`;
    dom.modalTitle.textContent = data.title;
    dom.modalDesc.textContent = data.desc;
    dom.modalPrice.textContent = formatPrice(data.price);
    // set whatsapp link
    const waText = encodeURIComponent(`Hola! Me gustaría pedir: *${data.title}* - Precio: ${formatPrice(data.price)}. ¿Está disponible?`);
    dom.modalWhatsapp.href = `https://wa.me/34${''}?text=${waText}`; // deja número vacío para que lo pongas
    // set add to cart button
    dom.modalAddCart = dom.modal.querySelector('.btn-add-cart');
    if (dom.modalAddCart) {
      // remove previous listeners
      dom.modalAddCart.onclick = null;
      dom.modalAddCart.addEventListener('click', () => {
        addToCart({ id: data.id, title: data.title, price: data.price });
        closeModal();
      });
    }
    modalTrapOff = trapFocus(dom.modal);
  }

  function closeModal() {
    dom.modal.classList.remove('open');
    dom.modal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = ''; // restore
    if (modalTrapOff) modalTrapOff();
  }

  /* ---------- Product card handlers ---------- */
  function handleOverlayClick(e) {
    const card = e.target.closest('.producto-card');
    if (!card) return;
    const id = card.dataset.id || card.getAttribute('data-id') || (Math.random() + '').slice(2, 8);
    const title = card.querySelector('h3')?.textContent || 'Producto';
    const desc = card.querySelector('.descripcion')?.textContent || '';
    const priceText = card.querySelector('.precio')?.dataset?.price || card.querySelector('.precio')?.textContent || '0';
    const price = parseFloat(priceText) || parseFloat(priceText.replace(/[^\d.,]/g, '').replace(',', '.')) || 0;
    const img = card.querySelector('img')?.src || '';

    openModal({ id, title, desc, price, img });
    document.body.style.overflow = 'hidden';
  }

  /* ---------- Filtering ---------- */
  function applyFilter(filter) {
    dom.filterBtns.forEach(btn => {
      btn.classList.toggle('active', btn.dataset.filter === filter);
      btn.setAttribute('aria-selected', btn.dataset.filter === filter ? 'true' : 'false');
    });
    dom.productCards.forEach(card => {
      const cat = card.dataset.category || '';
      const show = filter === 'all' || cat === filter;
      if (show) {
        card.classList.remove('hidden');
        card.removeAttribute('aria-hidden');
      } else {
        card.classList.add('hidden');
        card.setAttribute('aria-hidden', 'true');
      }
    });
  }

  /* ---------- Scroll spy (debounced) ---------- */
  function onScrollSpy() {
    const scrollPos = window.scrollY || window.pageYOffset;
    let current = '';
    dom.sections.forEach(section => {
      const top = section.offsetTop;
      const height = section.offsetHeight;
      if (scrollPos >= top - 200) current = section.id;
    });
    dom.navLinks.forEach(link => {
      const href = link.getAttribute('href') || '';
      const sectionId = href.replace('#', '');
      link.classList.toggle('active', sectionId === current);
    });
  }
  const onScrollSpyDebounced = debounce(onScrollSpy, 80);

  /* ---------- Event binders ---------- */
  function bindUI() {
    // Hamburger menu
    const hamburger = document.getElementById('hamburgerBtn');
    const nav = document.getElementById('primaryNav');
    if (hamburger && nav) {
      hamburger.addEventListener('click', () => {
        const expanded = hamburger.getAttribute('aria-expanded') === 'true';
        hamburger.setAttribute('aria-expanded', (!expanded).toString());
        nav.classList.toggle('open');
      });
    }

    // Filter buttons
    dom.filterBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const filter = btn.dataset.filter;
        applyFilter(filter);
      });
    });

    // Overlay detail buttons (delegation)
    dom.productosGrid.addEventListener('click', e => {
      if (e.target.matches('.overlay-btn') || e.target.closest('.overlay-btn')) {
        e.preventDefault();
        handleOverlayClick(e);
      } else if (e.target.matches('.add-to-cart') || e.target.closest('.add-to-cart')) {
        // Add to cart
        const btn = e.target.closest('.add-to-cart');
        const card = btn.closest('.producto-card');
        const id = card.dataset.id || (Math.random() + '').slice(2, 8);
        const title = card.querySelector('h3')?.textContent || 'Producto';
        const priceText = card.querySelector('.precio')?.dataset?.price || card.querySelector('.precio')?.textContent || '0';
        const price = parseFloat(priceText) || parseFloat(priceText.replace(/[^\d.,]/g, '').replace(',', '.')) || 0;
        addToCart({ id, title, price });
      } else if (e.target.matches('.whatsapp-order') || e.target.closest('.whatsapp-order')) {
        e.preventDefault();
        const link = e.target.closest('.whatsapp-order');
        const product = link.dataset.product || '';
        const waText = encodeURIComponent(`Hola! Quiero pedir: *${product}*`);
        // Replace XXX with tienda number if you want to auto-fill
        window.open(`https://wa.me/34XXX?text=${waText}`, '_blank', 'noopener');
      }
    });

    // Modal close
    if (dom.modalClose) dom.modalClose.addEventListener('click', closeModal);
    if (dom.modal) {
      dom.modal.addEventListener('click', e => {
        if (e.target === dom.modal) closeModal();
      });
    }

    // Add to cart buttons outside modal
    dom.addToCartButtons.forEach(btn => {
      btn.addEventListener('click', e => {
        const card = btn.closest('.producto-card');
        const id = card.dataset.id || (Math.random() + '').slice(2, 8);
        const title = card.querySelector('h3')?.textContent || 'Producto';
        const priceText = card.querySelector('.precio')?.dataset?.price || card.querySelector('.precio')?.textContent || '0';
        const price = parseFloat(priceText) || parseFloat(priceText.replace(/[^\d.,]/g, '').replace(',', '.')) || 0;
        addToCart({ id, title, price });
      });
    });

    // Cart toggle
    if (dom.cartToggle) {
      dom.cartToggle.addEventListener('click', e => {
        e.preventDefault();
        openCart();
      });
    }
    if (dom.cartClose) dom.cartClose.addEventListener('click', closeCart);
    if (dom.clearCartBtn) dom.clearCartBtn.addEventListener('click', () => clearCart());
    if (dom.checkoutBtn) {
      dom.checkoutBtn.addEventListener('click', () => {
        if (state.cart.length === 0) {
          alert('Tu carrito está vacío.');
          return;
        }
        const items = state.cart.map(i => `${i.qty}x ${i.title} (${formatPrice(i.price)})`).join('%0A');
        const total = formatPrice(cartTotal());
        const text = encodeURIComponent(`Hola! Quiero pedir:%0A${items}%0A%0ATotal: ${total}`);
        // Replace number with actual business whatsapp number without + or spaces
        window.open(`https://wa.me/34XXX?text=${text}`, '_blank', 'noopener');
      });
    }

    // Contact form fallback (if Formspree not configured)
    if (dom.contactForm) {
      dom.contactForm.addEventListener('submit', async e => {
        // If action is formspree and not placeholder, let it post normally
        const action = dom.contactForm.getAttribute('action') || '';
        const isFormspree = action.includes('formspree.io') && !action.includes('your-form-id');
        if (isFormspree) {
          // allow default submit to proceed
          return;
        }
        e.preventDefault();
        const note = $('#formNote');
        const submitBtn = dom.contactForm.querySelector('button[type="submit"]');
        submitBtn.disabled = true;
        submitBtn.textContent = 'Enviando…';
        // Simulate async send
        await new Promise(r => setTimeout(r, 900));
        dom.contactForm.reset();
        submitBtn.disabled = false;
        submitBtn.textContent = 'Enviar Mensaje';
        if (note) note.textContent = 'Mensaje enviado (simulación). Si quieres envío real, configura Formspree y coloca tu action en el form.';
      });
    }

    // SMS / Whatsapp quick order (button near form)
    if (dom.btnSmsOrder) {
      dom.btnSmsOrder.addEventListener('click', () => {
        const wa = 'https://wa.me/34XXX?text=' + encodeURIComponent('Hola, quiero hacer un encargo.');
        window.open(wa, '_blank', 'noopener');
      });
    }

    // Overlay keyboard accessibility: enable Enter on .producto-card to open modal
    dom.productCards.forEach(card => {
      card.setAttribute('tabindex', '0');
      card.addEventListener('keydown', e => {
        if (e.key === 'Enter') {
          // open modal
          const fakeEvent = { target: card.querySelector('.overlay-btn') || card };
          handleOverlayClick({ target: card });
        }
      });
    });

    // Scroll spy
    window.addEventListener('scroll', onScrollSpyDebounced);
    // IntersectionObserver reveal for valor-cards and contacto cards
    const obs = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('animated');
        }
      });
    }, { threshold: 0.12 });
    qsAll('.valor-card, .contacto-card, .producto-card').forEach(el => obs.observe(el));
  }

  /* ---------- Cart UI open/close ---------- */
  function openCart() {
    dom.cartDrawer.classList.add('open');
    dom.cartDrawer.setAttribute('aria-hidden', 'false');
    dom.cartToggle.setAttribute('aria-expanded', 'true');
    // trap focus
    trapFocus(dom.cartDrawer);
  }

  function closeCart() {
    dom.cartDrawer.classList.remove('open');
    dom.cartDrawer.setAttribute('aria-hidden', 'true');
    if (dom.cartToggle) dom.cartToggle.setAttribute('aria-expanded', 'false');
  }

  /* ---------- Escape key global close ---------- */
  window.addEventListener('keydown', e => {
    if (e.key === 'Escape') {
      if (dom.modal.classList.contains('open')) closeModal();
      if (dom.cartDrawer.classList.contains('open')) closeCart();
    }
  });

  /* ---------- Utils ---------- */
  function escapeHtml(unsafe) {
    return String(unsafe)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  /* ---------- Init ---------- */
  function init() {
    // cache dom nodes that may be created later
    dom.productCards = qsAll('.producto-card');
    dom.addToCartButtons = qsAll('.add-to-cart');
    dom.filterBtns = qsAll('.filter-btn');
    dom.productosGrid = $('#productosGrid');

    bindUI();
    loadCart();
    applyFilter('all'); // default
    // set initial nav active for home
    onScrollSpy();
  }

  // Run
  document.addEventListener('DOMContentLoaded', init);
})();
