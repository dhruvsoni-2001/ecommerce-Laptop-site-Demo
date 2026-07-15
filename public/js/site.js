const cartKey = 'eadcStoreCart';

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
  try {
    return JSON.parse(localStorage.getItem(cartKey)) || [];
  } catch (error) {
    return [];
  }
}

function saveCart(cart) {
  localStorage.setItem(cartKey, JSON.stringify(cart));
  updateCartCount();
}

function updateCartCount() {
  const cart = getCart();
  const count = cart.reduce((sum, item) => sum + item.quantity, 0);
  document.querySelectorAll('.cart-count').forEach((element) => {
    element.textContent = count;
  });
}

function formatMoney(value) {
  return value.toLocaleString('en-US', { style: 'currency', currency: 'USD' });
}

function findCartItem(cart, productId) {
  return cart.find((item) => item.id === Number(productId));
}

function addToCart(product, quantity = 1) {
  const cart = getCart();
  const existing = findCartItem(cart, product.id);
  if (existing) {
    existing.quantity += quantity;
  } else {
    cart.push({ id: product.id, name: product.name, price: product.price, image: product.image, quantity });
  }
  saveCart(cart);
}

function renderProductCard(product) {
  return `
    <div class="col-md-6 col-lg-4">
      <div class="card product-card h-100 shadow-sm">
        <img src="${product.image}" class="card-img-top" alt="${product.name}" />
        <div class="card-body d-flex flex-column">
          <span class="badge bg-primary mb-2">${product.category}</span>
          <h5 class="card-title">${product.name}</h5>
          <p class="card-text text-muted mb-3">${product.shortDescription}</p>
          <div class="mt-auto">
            <div class="d-flex justify-content-between align-items-center mb-3">
              <span class="price">${formatMoney(product.price)}</span>
              <span class="text-warning"><i class="fa-solid fa-star"></i> ${product.rating}</span>
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
  container.innerHTML = featured.map(renderProductCard).join('');
}

function renderShopProducts(products) {
  const container = document.getElementById('productGrid');
  if (!container) return;
  container.innerHTML = products.map(renderProductCard).join('');
}

function attachAddToCartListeners() {
  document.querySelectorAll('.add-cart-btn').forEach((button) => {
    button.addEventListener('click', async (event) => {
      const id = event.currentTarget.dataset.productId;
      try {
        const product = await fetchProduct(id);
        addToCart(product, 1);
      } catch (error) {
        alert('Unable to add product to cart.');
      }
    });
  });
}

async function initHomePage() {
  try {
    const products = await fetchProducts();
    renderFeaturedProducts(products);
    attachAddToCartListeners();
  } catch (error) {
    console.error(error);
  }
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
        const filtered = products.filter((product) => {
          return (
            product.name.toLowerCase().includes(query) ||
            product.category.toLowerCase().includes(query) ||
            product.shortDescription.toLowerCase().includes(query)
          );
        });
        renderShopProducts(filtered);
        attachAddToCartListeners();
      });
    }
  } catch (error) {
    console.error(error);
  }
}

async function initProductPage() {
  const detailContainer = document.getElementById('productDetail');
  if (!detailContainer) return;
  const params = new URLSearchParams(window.location.search);
  const id = params.get('id');
  if (!id) {
    detailContainer.innerHTML = '<div class="alert alert-warning">Product not found.</div>';
    return;
  }

  try {
    const product = await fetchProduct(id);
    detailContainer.innerHTML = `
      <div class="row gy-4">
        <div class="col-lg-5">
          <div class="card product-detail-card p-4">
            <img src="${product.image}" alt="${product.name}" class="img-fluid product-detail-image" />
          </div>
        </div>
        <div class="col-lg-7">
          <div class="card product-detail-card p-4">
            <div class="card-body">
              <span class="badge bg-primary mb-3">${product.category}</span>
              <h1 class="h3">${product.name}</h1>
              <p class="text-muted">${product.description}</p>
              <div class="d-flex align-items-center gap-3 mb-4">
                <span class="h3 mb-0">${formatMoney(product.price)}</span>
                <span class="badge bg-warning text-dark"><i class="fa-solid fa-star"></i> ${product.rating}</span>
              </div>
              <h5>Key features</h5>
              <ul class="list-unstyled mb-4">
                ${product.features.map((feature) => `<li class="mb-2">• ${feature}</li>`).join('')}
              </ul>
              <div class="d-flex flex-column flex-sm-row gap-2">
                <input id="productQuantity" type="number" class="form-control w-100 w-sm-auto" min="1" value="1" />
                <button id="addToCartDetail" class="btn btn-primary">Add to cart</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
    document.getElementById('addToCartDetail').addEventListener('click', () => {
      const quantity = Number(document.getElementById('productQuantity').value) || 1;
      addToCart(product, quantity);
    });
  } catch (error) {
    detailContainer.innerHTML = '<div class="alert alert-danger">Unable to load product details.</div>';
    console.error(error);
  }
}

function renderCartTable(cart) {
  const container = document.getElementById('cartContent');
  if (!container) return;
  if (!cart.length) {
    container.innerHTML = `
      <div class="text-center py-5">
        <h3>Your cart is empty</h3>
        <p class="text-muted">Browse our shop and add items to your cart.</p>
        <a href="shop.html" class="btn btn-primary">Shop now</a>
      </div>
    `;
    return;
  }

  const subtotal = cart.reduce((total, item) => total + item.price * item.quantity, 0);
  container.innerHTML = `
    <div class="table-responsive">
      <table class="table cart-table align-middle">
        <thead class="table-light">
          <tr>
            <th scope="col">Product</th>
            <th scope="col">Price</th>
            <th scope="col">Quantity</th>
            <th scope="col">Total</th>
            <th scope="col"></th>
          </tr>
        </thead>
        <tbody>
          ${cart
            .map(
              (item) => `
            <tr data-item-id="${item.id}">
              <td class="d-flex align-items-center gap-3">
                <img src="${item.image}" alt="${item.name}" class="rounded" width="80" />
                <div>
                  <strong>${item.name}</strong>
                </div>
              </td>
              <td>${formatMoney(item.price)}</td>
              <td><input type="number" class="form-control cart-quantity" min="1" value="${item.quantity}" data-item-id="${item.id}" /></td>
              <td>${formatMoney(item.price * item.quantity)}</td>
              <td><button class="btn btn-outline-danger btn-sm remove-item-btn" data-item-id="${item.id}">Remove</button></td>
            </tr>
          `
            )
            .join('')}
        </tbody>
      </table>
    </div>
    <div class="d-flex flex-column flex-md-row justify-content-between align-items-center gap-3">
      <div>
        <p class="mb-1 text-muted">Subtotal</p>
        <h3>${formatMoney(subtotal)}</h3>
      </div>
      <button id="checkoutButton" class="btn btn-success btn-lg">Checkout</button>
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
      <div class="text-center py-5">
        <h3>Order confirmed</h3>
        <p class="text-muted">Your order <strong>${data.orderId}</strong> has been placed successfully.</p>
        <a href="shop.html" class="btn btn-primary">Continue shopping</a>
      </div>
    `;
  } catch (error) {
    alert(error.message || 'Checkout failed.');
  }
}

function initCartPage() {
  renderCartTable(getCart());
}

function initPage() {
  updateCartCount();
  if (document.getElementById('featuredProducts')) {
    initHomePage();
  }
  if (document.getElementById('productGrid')) {
    initShopPage();
  }
  if (document.getElementById('productDetail')) {
    initProductPage();
  }
  if (document.getElementById('cartContent')) {
    initCartPage();
  }
}

window.addEventListener('DOMContentLoaded', initPage);
window.addEventListener('storage', updateCartCount);
