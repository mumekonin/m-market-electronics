const SERVER_URL = 'https://m-market-2.onrender.com/';
function renderAuthGroup() {
  const authGroup = document.getElementById('auth-group');
  const token = localStorage.getItem('userToken');

  if (token) {
    authGroup.innerHTML = `
      <div class="profile-wrapper">
        <button class="profile-btn" id="profile-toggle-btn">
          👤 Profile
        </button>
        <div class="profile-dropdown" id="profile-dropdown" style="display:none;">
          <a href="myOrder.html" class="dropdown-orders-link">📦 My Orders</a>
          <button class="logout-btn" id="logout-btn">🚪 Log Out</button>
        </div>
      </div>
    `;

    // Toggle dropdown
    document.getElementById('profile-toggle-btn').addEventListener('click', (e) => {
      e.stopPropagation();
      const dropdown = document.getElementById('profile-dropdown');
      dropdown.style.display = dropdown.style.display === 'none' ? 'block' : 'none';
    });

    // Close dropdown when clicking outside
    document.addEventListener('click', () => {
      const dropdown = document.getElementById('profile-dropdown');
      if (dropdown) dropdown.style.display = 'none';
    });

    // Logout
    document.getElementById('logout-btn').addEventListener('click', () => {
      localStorage.removeItem('userToken');
      window.location.reload();
    });

  } else {
    authGroup.innerHTML = `
      <a href="login.html" class="login-link">Log In</a>
      <a href="registration.html" class="signup-btn">Sign Up</a>
    `;
  }
}


// HAMBURGER MENU

document.addEventListener('DOMContentLoaded', () => {
  renderAuthGroup();

  const menuBtn = document.getElementById('menu-btn');
  const navWrapper = document.getElementById('nav-wrapper');

  const toggleMenu = () => {
    const isOpen = navWrapper.classList.toggle('is-open');
    menuBtn.classList.toggle('is-active');
    menuBtn.setAttribute('aria-expanded', isOpen);
    document.body.style.overflow = isOpen ? 'hidden' : 'auto';
  };

  menuBtn.addEventListener('click', toggleMenu);

  document.querySelectorAll('.nav-link').forEach(link => {
    link.addEventListener('click', () => {
      if (navWrapper.classList.contains('is-open')) toggleMenu();
    });
  });
});
// FEATURED PRODUCTS GRID
async function loadMmarketElectronics() {
  const grid = document.getElementById('product-list-grid');
  if (!grid) return;

  try {
    const response = await fetch(`${SERVER_URL}/products/get-all-products`);
    const products = await response.json();

    grid.innerHTML = products.slice(0, 9).map(p => `
      <div class="product-card">
        <img src="${SERVER_URL}/${p.imageUrl?.replace(/\\/g, '/')}" alt="${p.proName}">
        <h3>${p.proName}</h3>
        <div class="product-price">$${p.price}</div>
        <button class="order-btn" onclick="showProductDetails('${p._id || p.id}')">View Details</button>
      </div>
    `).join('');
  } catch (e) {
    console.error('Grid Error:', e);
  }
}

document.addEventListener('DOMContentLoaded', loadMmarketElectronics);

//  4. PRODUCT DETAIL MODAL
async function showProductDetails(targetId) {
  const detailBox = document.getElementById('detail-modal');
  const overlay = document.getElementById('modal-overlay');

  try {
    const response = await fetch(`${SERVER_URL}/products/get-product-detail/${targetId}`);
    const product = await response.json();
    const cleanPath = product.imageUrl?.replace(/\\/g, '/');

    detailBox.innerHTML = `
      <button class="close-modal-btn" onclick="closeModal()">&times;</button>
      <div class="modal-body">
        <div class="modal-image-side">
          <img src="${SERVER_URL}/${cleanPath}" alt="${product.proName}">
        </div>
        <div class="modal-info-side">
          <span class="spec-badge">Category: ${product.category}</span>
          <h2 class="detail-title">${product.proName}</h2>
          <div class="detail-price">$${product.price}</div>
          <p class="detail-desc">${product.proDescrption}</p>
          <p class="detail-desc">Color: ${product.color}</p>
          <p class="detail-desc">Storage: ${product.storage}</p>
          <div id="initial-order-step">
            <button class="order-btn" onclick="showOrderForm()" style="width:100%">PLACE ORDER</button>
          </div>
          <div id="hidden-payment-methods">
            <label>Quantity:</label>
            <input type="number" id="order-qty" value="1" min="1">
            <label>Payment Screenshot:</label>
            <input type="file" id="order-screenshot" accept="image/*">
            <button class="order-btn" onclick="buyNow('${product._id || product.id}')" style="width:100%">CONFIRM & PAY</button>
          </div>
        </div>
      </div>
    `;

    detailBox.style.display = 'block';
    overlay.style.display = 'block';
    document.body.style.overflow = 'hidden';
  } catch (e) {
    console.error('Detail Error:', e);
  }
}

function showOrderForm() {
  document.getElementById('initial-order-step').style.display = 'none';
  document.getElementById('hidden-payment-methods').style.display = 'block';
}

async function buyNow(productId) {
  const token = localStorage.getItem('userToken');
  const fileInput = document.getElementById('order-screenshot');
  const qty = document.getElementById('order-qty').value;

  if (!token) return alert('Please login first!');
  if (!fileInput.files[0]) return alert('Screenshot required!');

  const formData = new FormData();
  formData.append('productId', productId);
  formData.append('quantity', qty);
  formData.append('image', fileInput.files[0]);

  try {
    const response = await fetch(`${SERVER_URL}/orders/create-order`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` },
      body: formData
    });

    if (response.ok) {
      alert('Order placed successfully!');
      closeModal();
    } else {
      const err = await response.json();
      alert('Error: ' + err.message);
    }
  } catch (e) {
    console.error('Order Error:', e);
  }
}

function closeModal() {
  document.getElementById('detail-modal').style.display = 'none';
  document.getElementById('modal-overlay').style.display = 'none';
  document.body.style.overflow = 'auto';
}

// SEARCH
(function () {
  async function executeSearch() {
    const input = document.getElementById('is-query-input');
    const grid = document.getElementById('independent-search-results');
    const key = input.value.trim();
    if (!key) { grid.innerHTML = ''; return; }

    try {
      grid.innerHTML = '<p style="text-align:center; grid-column:1/-1;">Searching...</p>';
      const response = await fetch(`${SERVER_URL}/products/search-products?key=${encodeURIComponent(key)}`);
      const data = await response.json();

      if (!response.ok) {
        grid.innerHTML = `<p style="text-align:center; grid-column:1/-1; color:#856404; background:#fff3cd; padding:20px; border-radius:8px;">${data.message}</p>`;
        return;
      }

      grid.innerHTML = data.map(item => `
        <div class="product-card">
          <img src="${SERVER_URL}/${item.imageUrl?.replace(/\\/g, '/')}" alt="${item.proName}">
          <p style="font-size:11px; color:#007bff; font-weight:bold;">RESULT</p>
          <h3>${item.proName}</h3>
          <div class="product-price">$${item.price}</div>
          <button class="order-btn" onclick="showProductDetails('${item.id || item._id}')">View Details</button>
        </div>
      `).join('');
    } catch (err) {
      grid.innerHTML = '<p style="text-align:center; grid-column:1/-1; color:red;">Connection Error.</p>';
    }
  }

  document.addEventListener('DOMContentLoaded', () => {
    const input = document.getElementById('is-query-input');
    const btn = document.getElementById('is-search-action');

    if (btn) btn.onclick = executeSearch;
    if (input) {
      input.addEventListener('input', () => {
        if (input.value.trim() === '') document.getElementById('independent-search-results').innerHTML = '';
      });
      input.addEventListener('keypress', (e) => { if (e.key === 'Enter') executeSearch(); });
    }
  });
})();

// CATEGORY FILTER
window.runCategoryFilter = async function (cat) {
  const catGrid = document.getElementById('category-results-grid');
  if (!catGrid) return;

  try {
    catGrid.innerHTML = `<p style="text-align:center; grid-column:1/-1;">Loading ${cat}s...</p>`;
    const response = await fetch(`${SERVER_URL}/products/search-products?key=${encodeURIComponent(cat)}`);
    const data = await response.json();

    if (!response.ok) {
      catGrid.innerHTML = `<p style="text-align:center; grid-column:1/-1; color:#856404; background:#fff3cd; padding:20px; border-radius:8px;">${data.message}</p>`;
      return;
    }

    catGrid.innerHTML = data.map(item => `
      <div class="product-card">
        <img src="${SERVER_URL}/${item.imageUrl?.replace(/\\/g, '/')}" alt="${item.proName}">
        <p style="font-size:11px; color:#007bff; font-weight:700;">${item.category}</p>
        <h3>${item.proName}</h3>
        <div class="product-price">$${item.price}</div>
        <button class="order-btn" onclick="showProductDetails('${item.id || item._id}')">View Details</button>
      </div>
    `).join('');
  } catch (err) {
    catGrid.innerHTML = '<p style="text-align:center; grid-column:1/-1; color:red;">Connection Failed.</p>';
  }
};

window.resetCategorySection = function () {
  document.getElementById('category-results-grid').innerHTML = '';
};