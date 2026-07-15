const cartKey = 'eadcStoreCart';
const themeKey = 'eadcTheme';

function getTheme() {
  try { return localStorage.getItem(themeKey) || 'light'; }
  catch (_) { return 'light'; }
}

function setTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  try { localStorage.setItem(themeKey, theme); } catch (_) { }
  const btn = document.getElementById('themeToggleBtn');
  if (btn) {
    btn.innerHTML = theme === 'dark' ? '<i class="fa-solid fa-sun"></i>' : '<i class="fa-solid fa-moon"></i>';
    btn.setAttribute('aria-label', theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode');
  }
}

function toggleTheme() {
  setTheme(getTheme() === 'dark' ? 'light' : 'dark');
}

function initTheme() {
  setTheme(getTheme());
}

function showToast(message, type) {
  const toast = document.createElement('div');
  toast.className = 'toast-notification';
  const icon = type === 'success' ? 'fa-check-circle' : type === 'error' ? 'fa-exclamation-circle' : 'fa-info-circle';
  toast.innerHTML = `<i class="fa-solid ${icon}"></i> ${message}`;
  Object.assign(toast.style, {
    position: 'fixed', bottom: '24px', right: '24px', zIndex: '99999',
    background: 'var(--glass-bg)', backdropFilter: 'blur(20px)',
    WebkitBackdropFilter: 'blur(20px)', border: '1px solid var(--glass-border)',
    borderRadius: '16px', padding: '1rem 1.5rem', boxShadow: 'var(--glass-shadow)',
    fontFamily: 'var(--font-body)', fontSize: '0.9rem', color: 'var(--text)',
    display: 'flex', alignItems: 'center', gap: '0.75rem',
    transform: 'translateY(20px)', opacity: '0',
    transition: 'all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)',
    maxWidth: '380px', borderLeft: '3px solid ' + (type === 'success' ? '#c9952e' : '#dc3545')
  });
  document.body.appendChild(toast);
  requestAnimationFrame(() => {
    toast.style.transform = 'translateY(0)';
    toast.style.opacity = '1';
  });
  setTimeout(() => {
    toast.style.transform = 'translateY(20px)';
    toast.style.opacity = '0';
    setTimeout(() => toast.remove(), 400);
  }, 3000);
}

async function fetchProducts() {
  const res = await fetch('/api/products');
  if (!res.ok) throw new Error('Unable to load products');
  return res.json();
}

async function fetchProduct(id) {
  const res = await fetch(`/api/products/${id}`);
  if (!res.ok) throw new Error('Product not found');
  return res.json();
}

function getCart() {
  try { return JSON.parse(localStorage.getItem(cartKey)) || []; }
  catch (_) { return []; }
}

function saveCart(cart) {
  localStorage.setItem(cartKey, JSON.stringify(cart));
  updateCartCount();
}

function updateCartCount() {
  const cart = getCart();
  const count = cart.reduce((sum, item) => sum + item.quantity, 0);
  document.querySelectorAll('.cart-count').forEach((el) => { el.textContent = count; });
}

function formatMoney(value) {
  return value.toLocaleString('en-US', { style: 'currency', currency: 'USD' });
}

function findCartItem(cart, productId) {
  return cart.find((item) => item.id === Number(productId));
}

function addToCart(product, quantity) {
  const cart = getCart();
  const existing = findCartItem(cart, product.id);
  if (existing) {
    existing.quantity += quantity;
  } else {
    cart.push({ id: product.id, name: product.name, price: product.price, image: product.image, quantity });
  }
  saveCart(cart);
  showToast(`${product.name} added to cart`, 'success');
}

function renderProductCard(product, index) {
  return `
    <div class="col-md-6 col-lg-4">
      <div class="card product-card glass-card h-100" style="animation-delay: ${index * 0.1}s">
        <img src="${product.image}" class="card-img-top" alt="${product.name}" />
        <div class="card-body d-flex flex-column">
          <span class="badge bg-primary mb-2">${product.category}</span>
          <h5 class="card-title">${product.name}</h5>
          <p class="card-text text-muted mb-3 flex-grow-1">${product.shortDescription}</p>
          <div class="mt-auto">
            <div class="d-flex justify-content-between align-items-center mb-3">
              <span class="price">${formatMoney(product.price)}</span>
              <span class="star-rating"><i class="fa-solid fa-star"></i> ${product.rating}</span>
            </div>
            <div class="d-grid gap-2">
              <a href="product.html?id=${product.id}" class="btn btn-outline-primary">View details</a>
              <button type="button" class="btn btn-primary add-cart-btn" data-product-id="${product.id}">Add to cart</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;
}

function renderFeaturedProducts(products) {
  const featured = products.slice(0, 4);
  const container = document.getElementById('featuredProducts');
  if (!container) return;
  container.innerHTML = featured.map((p, i) => renderProductCard(p, i)).join('');
}

function renderShopProducts(products) {
  const container = document.getElementById('productGrid');
  if (!container) return;
  container.innerHTML = products.map((p, i) => renderProductCard(p, i)).join('');
}

function attachAddToCartListeners() {
  document.querySelectorAll('.add-cart-btn').forEach((button) => {
    button.addEventListener('click', async (event) => {
      const id = event.currentTarget.dataset.productId;
      try {
        const product = await fetchProduct(id);
        addToCart(product, 1);
      } catch (_) {
        showToast('Unable to add product to cart.', 'error');
      }
    });
  });
}

async function initHomePage() {
  try {
    const products = await fetchProducts();
    renderFeaturedProducts(products);
    attachAddToCartListeners();
  } catch (err) { console.error(err); }
}

async function initShopPage() {
  try {
    const products = await fetchProducts();
    renderShopProducts(products);
    attachAddToCartListeners();
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
      searchInput.addEventListener('input', (event) => {
        const query = event.target.value.toLowerCase();
        const filtered = products.filter((p) =>
          p.name.toLowerCase().includes(query) ||
          p.category.toLowerCase().includes(query) ||
          p.shortDescription.toLowerCase().includes(query)
        );
        renderShopProducts(filtered);
        attachAddToCartListeners();
      });
    }
  } catch (err) { console.error(err); }
}

async function initProductPage() {
  const detail = document.getElementById('productDetail');
  if (!detail) return;
  const params = new URLSearchParams(window.location.search);
  const id = params.get('id');
  if (!id) {
    detail.innerHTML = '<div class="alert alert-warning">Product not found.</div>';
    return;
  }
  try {
    const product = await fetchProduct(id);
    detail.innerHTML = `
      <div class="row gy-5">
        <div class="col-lg-5">
          <div class="card product-detail-card glass-card p-4">
            <img src="${product.image}" alt="${product.name}" class="img-fluid product-detail-image" />
          </div>
        </div>
        <div class="col-lg-7">
          <div class="card product-detail-card glass-card p-4">
            <div class="card-body">
              <span class="badge bg-primary mb-3">${product.category}</span>
              <h1 class="h2">${product.name}</h1>
              <p class="text-muted fs-5">${product.description}</p>
              <div class="d-flex align-items-center gap-3 mb-4">
                <span class="price">${formatMoney(product.price)}</span>
                <span class="badge bg-warning"><i class="fa-solid fa-star"></i> ${product.rating}</span>
              </div>
              <h5 class="h6 text-muted text-uppercase mb-3" style="letter-spacing:0.06em;font-family:var(--font-body)">Key features</h5>
              <ul class="list-unstyled mb-4">
                ${product.features.map((f) => `<li class="mb-2"><i class="fa-solid fa-check me-2"></i>${f}</li>`).join('')}
              </ul>
              <div class="d-flex flex-column flex-sm-row gap-3">
                <input id="productQuantity" type="number" class="form-control glass-input" style="max-width:100px" min="1" value="1" />
                <button id="addToCartDetail" class="btn btn-primary btn-lg flex-grow-1">Add to cart</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
    document.getElementById('addToCartDetail').addEventListener('click', () => {
      const qty = Math.max(1, Number(document.getElementById('productQuantity').value) || 1);
      addToCart(product, qty);
    });
  } catch (_) {
    detail.innerHTML = '<div class="alert alert-danger">Unable to load product details.</div>';
  }
}

function renderCartTable(cart) {
  const container = document.getElementById('cartContent');
  if (!container) return;
  if (!cart.length) {
    container.innerHTML = `
      <div class="text-center py-5 glass-card p-5">
        <div class="display-1 mb-4" style="opacity:0.3">🛒</div>
        <h3>Your cart is empty</h3>
        <p class="text-muted mb-4">Browse our curated collection and add items you love.</p>
        <a href="shop.html" class="btn btn-primary btn-lg">Explore shop</a>
      </div>
    `;
    return;
  }

  const subtotal = cart.reduce((total, item) => total + item.price * item.quantity, 0);
  container.innerHTML = `
    <div class="table-responsive glass-card p-4">
      <table class="table cart-table align-middle mb-0">
        <thead>
          <tr>
            <th scope="col">Product</th>
            <th scope="col">Price</th>
            <th scope="col">Quantity</th>
            <th scope="col">Total</th>
            <th scope="col"></th>
          </tr>
        </thead>
        <tbody>
          ${cart.map((item) => `
            <tr data-item-id="${item.id}">
              <td><div class="d-flex align-items-center gap-3"><img src="${item.image}" alt="${item.name}" width="72" /><strong>${item.name}</strong></div></td>
              <td>${formatMoney(item.price)}</td>
              <td><input type="number" class="form-control cart-quantity glass-input" style="width:70px" min="1" value="${item.quantity}" data-item-id="${item.id}" /></td>
              <td><strong>${formatMoney(item.price * item.quantity)}</strong></td>
              <td><button class="btn btn-outline-danger btn-sm remove-item-btn" data-item-id="${item.id}">Remove</button></td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
    <div class="d-flex flex-column flex-md-row justify-content-between align-items-center gap-4 mt-4">
      <div>
        <p class="text-muted mb-1 small text-uppercase" style="letter-spacing:0.06em">Subtotal</p>
        <h2 class="price mb-0">${formatMoney(subtotal)}</h2>
      </div>
      <button id="checkoutButton" class="btn btn-success btn-lg px-5">Checkout</button>
    </div>
  `;

  document.querySelectorAll('.remove-item-btn').forEach((button) => {
    button.addEventListener('click', (event) => {
      const id = Number(event.currentTarget.dataset.itemId);
      const updatedCart = getCart().filter((item) => item.id !== id);
      saveCart(updatedCart);
      renderCartTable(updatedCart);
    });
  });

  document.querySelectorAll('.cart-quantity').forEach((input) => {
    input.addEventListener('change', (event) => {
      const id = Number(event.currentTarget.dataset.itemId);
      const value = Math.max(1, Number(event.currentTarget.value) || 1);
      const cart = getCart();
      const item = cart.find((row) => row.id === id);
      if (item) {
        item.quantity = value;
        saveCart(cart);
        renderCartTable(cart);
      }
    });
  });

  document.getElementById('checkoutButton').addEventListener('click', handleCheckout);
}

async function handleCheckout() {
  const cart = getCart();
  if (!cart.length) return;
  try {
    const response = await fetch('/api/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ cart })
    });
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Checkout failed');
    }
    const data = await response.json();
    localStorage.removeItem(cartKey);
    updateCartCount();
    document.getElementById('cartContent').innerHTML = `
      <div class="text-center py-5 glass-card p-5">
        <div class="display-1 mb-4">✨</div>
        <h2>Order confirmed</h2>
        <p class="text-muted mb-1">Your order has been placed successfully.</p>
        <p class="text-muted mb-4">Reference: <strong style="color:var(--gold)">${data.orderId}</strong></p>
        <a href="shop.html" class="btn btn-primary btn-lg">Continue shopping</a>
      </div>
    `;
  } catch (err) {
    showToast(err.message || 'Checkout failed.', 'error');
  }
}

function initCartPage() {
  renderCartTable(getCart());
}

async function initContactPage() {
  const btn = document.getElementById('contactSendBtn');
  if (!btn) return;
  btn.addEventListener('click', async () => {
    const name = document.getElementById('contactName').value.trim();
    const email = document.getElementById('contactEmail').value.trim();
    const message = document.getElementById('contactMessage').value.trim();
    if (!name || !email || !message) {
      showToast('Please fill in all fields.', 'error');
      return;
    }
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, message })
      });
      if (!res.ok) throw new Error('Failed to send message');
      document.getElementById('contactName').value = '';
      document.getElementById('contactEmail').value = '';
      document.getElementById('contactMessage').value = '';
      showToast('Message sent! We will be in touch shortly.', 'success');
    } catch (_) {
      showToast('Could not send message. Please try again later.', 'error');
    }
  });
}

function initPage() {
  initTheme();
  updateCartCount();
  if (document.getElementById('featuredProducts')) initHomePage();
  if (document.getElementById('productGrid')) initShopPage();
  if (document.getElementById('productDetail')) initProductPage();
  if (document.getElementById('cartContent')) initCartPage();
  if (document.getElementById('contactSendBtn')) initContactPage();
}

window.addEventListener('DOMContentLoaded', initPage);
window.addEventListener('storage', updateCartCount);
