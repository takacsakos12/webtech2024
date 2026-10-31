'use strict';
(() => {
  const page = document.body.dataset.page;
  const money = (value) =>
    new Intl.NumberFormat('hu-HU', {
      style: 'currency',
      currency: 'HUF',
      maximumFractionDigits: 0,
    }).format(value);
  const el = (tag, className, content) => {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (content != null) node.textContent = content;
    return node;
  };
  let session,
    products = [],
    timer;
  function notify(message, error = false) {
    const box = document.querySelector('#notification');
    clearTimeout(timer);
    box.textContent = message;
    box.classList.toggle('error', error);
    box.hidden = false;
    timer = setTimeout(
      () => {
        box.hidden = true;
      },
      error ? 12000 : 5000
    );
  }
  const loginUrl = () =>
    '/login.html?next=' +
    encodeURIComponent(window.location.pathname + window.location.search);
  function destination() {
    const target = new URLSearchParams(window.location.search).get('next');
    try {
      const url = new URL(target || '/webshop.html', window.location.origin);
      if (
        url.origin === window.location.origin &&
        ['/webshop.html', '/cart.html'].includes(url.pathname)
      )
        return url.pathname + url.search;
    } catch {}
    return '/webshop.html';
  }
  async function api(url, options = {}) {
    const headers = { ...options.headers };
    if (options.body) headers['Content-Type'] = 'application/json';
    if (options.method && options.method !== 'GET')
      headers['X-CSRF-Token'] = session?.csrfToken || '';
    const response = await fetch(url, {
      ...options,
      headers,
      credentials: 'same-origin',
    });
    const data = await response.json();
    if (!response.ok) {
      if (response.status === 401 && !['login', 'register'].includes(page))
        window.location.assign(loginUrl());
      throw new Error(data.message || 'A kérés nem sikerült.');
    }
    return data;
  }
  function image(product) {
    const img = el('img');
    img.alt = product.termek_nev;
    img.loading = 'lazy';
    img.referrerPolicy = 'no-referrer';
    try {
      img.src =
        new URL(product.img).protocol === 'https:'
          ? product.img
          : '/placeholder.svg';
    } catch {
      img.src = '/placeholder.svg';
    }
    img.addEventListener(
      'error',
      () => {
        img.src = '/placeholder.svg';
      },
      { once: true }
    );
    return img;
  }
  async function busy(button, action) {
    button.disabled = true;
    try {
      await action();
    } catch (error) {
      notify(error.message, true);
    } finally {
      button.disabled = false;
    }
  }
  function updateCount(cart) {
    document.querySelector('#cart-count').textContent = cart.items.reduce(
      (sum, item) => sum + item.quantity,
      0
    );
  }
  function bindAuth() {
    const next = new URLSearchParams(window.location.search).get('next');
    if (next) {
      document.querySelectorAll('.form-card a').forEach((link) => {
        link.search = new URLSearchParams({ next }).toString();
      });
    }
    const form = document.querySelector('#auth-form');
    form.addEventListener('submit', async (event) => {
      event.preventDefault();
      const errorBox = document.querySelector('#form-error');
      errorBox.textContent = '';
      const button = form.querySelector('button');
      button.disabled = true;
      try {
        session = await api(page === 'login' ? '/login' : '/register', {
          method: 'POST',
          body: JSON.stringify(Object.fromEntries(new FormData(form))),
        });
        window.location.assign(destination());
      } catch (error) {
        errorBox.textContent = error.message;
        button.disabled = false;
      }
    });
  }
  function renderProducts() {
    const query = document
      .querySelector('#search')
      .value.trim()
      .toLocaleLowerCase('hu');
    const category = document.querySelector('#category').value;
    const sort = document.querySelector('#sort').value;
    const items = products.filter(
      (item) =>
        (!category || item.kategoria === category) &&
        `${item.termek_nev} ${item.gyarto || ''} ${item.leiras}`
          .toLocaleLowerCase('hu')
          .includes(query)
    );
    if (sort === 'price-asc') items.sort((a, b) => a.ar - b.ar);
    if (sort === 'price-desc') items.sort((a, b) => b.ar - a.ar);
    if (sort === 'name')
      items.sort((a, b) => a.termek_nev.localeCompare(b.termek_nev, 'hu'));
    document.querySelector('#result-count').textContent =
      `${items.length} felszerelés`;
    const grid = document.querySelector('#items-container');
    grid.replaceChildren();
    grid.setAttribute('aria-busy', 'false');
    if (!items.length)
      grid.append(
        el(
          'p',
          'empty-state',
          'Nincs találat. Próbálj más keresést vagy sportágat.'
        )
      );
    for (const item of items) {
      const card = el('article', 'product-card');
      const visual = el('div', 'product-image');
      visual.append(image(item));
      const content = el('div', 'product-content');
      content.append(
        el('p', 'product-category', item.kategoria || 'Felszerelés'),
        el('h3', '', item.termek_nev),
        el('p', 'product-description', item.leiras)
      );
      const bottom = el('div', 'product-bottom');
      const button = el('button', '', 'Kosárba +');
      button.setAttribute('aria-label', `${item.termek_nev} kosárba helyezése`);
      button.addEventListener('click', () =>
        busy(button, async () => {
          if (!session.user) {
            window.location.assign(loginUrl());
            return;
          }
          const cart = await api('/api/cart/add', {
            method: 'POST',
            body: JSON.stringify({ itemId: item._id }),
          });
          updateCount(cart);
          notify(`${item.termek_nev} a kosárba került.`);
        })
      );
      bottom.append(el('strong', 'price', money(item.ar)), button);
      content.append(bottom);
      card.append(visual, content);
      grid.append(card);
    }
  }
  async function loadShop() {
    products = await api('/api/items');
    const select = document.querySelector('#category');
    const selected =
      select.value ||
      new URLSearchParams(window.location.search).get('category');
    select.replaceChildren(new Option('Összes sportág', ''));
    [...new Set(products.map((item) => item.kategoria).filter(Boolean))]
      .sort((a, b) => a.localeCompare(b, 'hu'))
      .forEach((value) => select.add(new Option(value, value)));
    select.value = [...select.options].some(
      (option) => option.value === selected
    )
      ? selected
      : '';
    renderProducts();
  }
  function bindShop() {
    ['search', 'category', 'sort'].forEach((id) =>
      document
        .getElementById(id)
        .addEventListener(id === 'search' ? 'input' : 'change', renderProducts)
    );
    if (session.user?.role === 'admin') {
      document.querySelector('#admin-panel').hidden = false;
      const form = document.querySelector('#product-form');
      form.addEventListener('submit', (event) => {
        event.preventDefault();
        busy(form.querySelector('button'), async () => {
          const body = Object.fromEntries(new FormData(form));
          body.ar = Number(body.ar);
          await api('/api/items/add', {
            method: 'POST',
            body: JSON.stringify(body),
          });
          form.reset();
          await loadShop();
          notify('Az új termék bekerült a katalógusba.');
        });
      });
    }
  }
  async function loadCart() {
    const cart = await api('/api/cart');
    updateCount(cart);
    const container = document.querySelector('#cart-items');
    container.replaceChildren();
    container.setAttribute('aria-busy', 'false');
    document.querySelector('#total-cost').textContent = money(cart.total);
    document.querySelector('#order-submit').disabled = !cart.items.length;
    if (!cart.items.length) {
      const empty = el(
        'div',
        'empty-state',
        'A kosarad még üres. Találd meg a következő edzésed felszerelését.'
      );
      const link = el('a', 'button', 'Irány a webshop →');
      link.href = '/webshop.html';
      empty.append(el('br'), el('br'), link);
      container.append(empty);
    }
    for (const item of cart.items) {
      const row = el('article', 'cart-row');
      const info = el('div');
      info.append(
        el('h3', '', item.termek_nev),
        el('strong', '', money(item.subtotal)),
        el('p', 'muted', `${money(item.ar)} / db`)
      );
      const controls = el('div', 'cart-controls');
      const input = el('input');
      input.type = 'number';
      input.min = '1';
      input.max = '99';
      input.step = '1';
      input.value = item.quantity;
      input.id = `quantity-${item._id}`;
      const label = el('label', '', 'Darab');
      label.htmlFor = input.id;
      const save = el('button', '', 'Frissítés');
      const remove = el('button', 'remove-button', 'Eltávolítás');
      save.addEventListener('click', () =>
        busy(save, async () => {
          if (!input.reportValidity()) return;
          await api(`/api/cart/${item._id}`, {
            method: 'PATCH',
            body: JSON.stringify({ quantity: Number(input.value) }),
          });
          await loadCart();
        })
      );
      remove.addEventListener('click', () =>
        busy(remove, async () => {
          await api(`/api/cart/remove/${item._id}`, { method: 'DELETE' });
          await loadCart();
        })
      );
      controls.append(label, input, save, remove);
      info.append(controls);
      row.append(image(item), info);
      container.append(row);
    }
  }
  async function loadOrders() {
    const orders = await api('/api/orders');
    const container = document.querySelector('#orders');
    container.replaceChildren();
    if (!orders.length)
      container.append(
        el('p', 'muted', 'Itt jelennek majd meg a bemutató rendeléseid.')
      );
    for (const order of orders) {
      const card = el('article', 'order');
      card.append(
        el('h3', '', `Rendelés: ${order.id.slice(0, 8).toUpperCase()}`),
        el(
          'p',
          'muted',
          `${new Date(order.createdAt).toLocaleString('hu-HU')} · Rögzítve · Utánvét (bemutató)`
        )
      );
      const list = el('ul');
      order.items.forEach((item) =>
        list.append(
          el(
            'li',
            '',
            `${item.quantity} × ${item.termek_nev} – ${money(item.ar * item.quantity)}`
          )
        )
      );
      card.append(list, el('strong', '', `Összesen: ${money(order.total)}`));
      container.append(card);
    }
  }
  function bindOrder() {
    const form = document.querySelector('#order-form');
    form.addEventListener('submit', async (event) => {
      event.preventDefault();
      const button = document.querySelector('#order-submit');
      button.disabled = true;
      const errorBox = document.querySelector('#form-error');
      errorBox.textContent = '';
      try {
        const order = await api('/api/orders', {
          method: 'POST',
          body: JSON.stringify(Object.fromEntries(new FormData(form))),
        });
        form.reset();
        notify(
          `Bemutató rendelésedet rögzítettük: ${order.id.slice(0, 8).toUpperCase()}`
        );
        await Promise.all([loadCart(), loadOrders()]);
      } catch (error) {
        errorBox.textContent = error.message;
        button.disabled = false;
      }
    });
  }
  async function init() {
    session = await api('/api/session');
    document.querySelectorAll('[data-auth]').forEach((node) => {
      node.hidden = !session.user;
    });
    document.querySelectorAll('[data-guest]').forEach((node) => {
      node.hidden = !!session.user;
    });
    if (session.user) {
      document.querySelector('#username').textContent = session.user.username;
      document.querySelector('#logout').addEventListener('click', (event) =>
        busy(event.target, async () => {
          await api('/api/logout', { method: 'POST' });
          window.location.assign('/');
        })
      );
      if (page !== 'cart') updateCount(await api('/api/cart'));
    }
    if (['login', 'register'].includes(page)) bindAuth();
    if (page === 'cart' && !session.user) {
      window.location.assign(loginUrl());
      return;
    }
    if (page === 'shop') {
      bindShop();
      await loadShop();
    }
    if (page === 'cart') {
      bindOrder();
      await Promise.all([loadCart(), loadOrders()]);
    }
  }
  init().catch((error) => {
    notify(`Nem sikerült betölteni az oldalt. ${error.message}`, true);
    document
      .querySelectorAll('[aria-busy]')
      .forEach((node) => node.setAttribute('aria-busy', 'false'));
    if (page === 'shop')
      document.querySelector('#result-count').textContent =
        'Betöltési hiba. Frissítsd az oldalt az újrapróbáláshoz.';
  });
})();
