// ── Helpers ───────────────────────────────────────────────────────────────────
function getToken() {
  return localStorage.getItem('userToken') || '';
}
function authHeaders() {
  const token = getToken();
  return token ? { 'Authorization': 'Bearer ' + token } : {};
}

function setStatus(id, type, msg) {
  const el = document.getElementById(id);
  if (!el) return;
  el.className = 'status-msg show ' + type;
  el.style.display = 'flex';
  el.innerHTML = type === 'loading'
    ? `<div class="spinner"></div> ${msg}`
    : msg;
  // Auto-hide success after 4 seconds
  if (type === 'success') {
    setTimeout(() => hideStatus(id), 4000);
  }
}

function hideStatus(id) {
  const el = document.getElementById(id);
  if (!el) return;
  el.className = 'status-msg';
  el.style.display = 'none';
}

function formatBytes(b) {
  if (b < 1024) return b + ' B';
  if (b < 1048576) return (b / 1024).toFixed(1) + ' KB';
  return (b / 1048576).toFixed(1) + ' MB';
}

function showToast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 2500);
}

function escHtml(str) {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// ── Navigation ────────────────────────────────────────────────────────────────
function showPage(name, link) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  document.getElementById('page-' + name).classList.add('active');
  if (link) link.classList.add('active');
  if (name === 'products') loadProducts();
  if (name === 'orders') loadOrders();
  // Close sidebar on mobile after nav click
  closeSidebar();
  return false;
}

// ── MOBILE SIDEBAR ────────────────────────────────────────────────────────────
function toggleSidebar() {
  const sidebar = document.getElementById('sidebar');
  const overlay = document.getElementById('sidebarOverlay');
  const btn = document.getElementById('hamburgerBtn');
  const isOpen = sidebar.classList.toggle('is-open');
  overlay.classList.toggle('is-open', isOpen);
  if (btn) btn.classList.toggle('open', isOpen);
  document.body.style.overflow = isOpen ? 'hidden' : '';
}

function closeSidebar() {
  const sidebar = document.getElementById('sidebar');
  const overlay = document.getElementById('sidebarOverlay');
  const btn = document.getElementById('hamburgerBtn');
  sidebar.classList.remove('is-open');
  overlay.classList.remove('is-open');
  if (btn) btn.classList.remove('open');
  document.body.style.overflow = '';
}

// ── GET ALL PRODUCTS ──────────────────────────────────────────────────────────
let allProducts = [];

async function loadProducts() {
  setStatus('productsStatus', 'loading', 'Loading products…');
  document.getElementById('tableWrap').style.display = 'none';
  document.getElementById('emptyState').style.display = 'none';
  document.getElementById('statsBar').style.display = 'none';
  document.getElementById('searchBarWrap').style.display = 'none';

  try {
    const res = await fetch('http://localhost:3000/products/get-all-products', {
      headers: authHeaders()
    });
    const data = await res.json();

    if (!res.ok) {
      setStatus('productsStatus', 'error', '✕ ' + (data.message || 'Failed to load products.'));
      return;
    }

    allProducts = data;
    hideStatus('productsStatus');
    renderProducts(allProducts);
    renderStats(allProducts);

  } catch (err) {
    setStatus('productsStatus', 'error', '✕ Network error — is the server running on port 3000?');
  }
}

function renderStats(products) {
  const total = products.length;
  const categories = new Set(products.map(p => p.category)).size;
  const stock = products.reduce((sum, p) => sum + (Number(p.stock) || 0), 0);

  document.getElementById('statTotal').textContent = total;
  document.getElementById('statCategories').textContent = categories;
  document.getElementById('statStock').textContent = stock;
  document.getElementById('statsBar').style.display = 'flex';
}

function renderProducts(products) {
  const tbody = document.getElementById('productsTableBody');
  tbody.innerHTML = '';

  if (!products || products.length === 0) {
    document.getElementById('tableWrap').style.display = 'none';
    document.getElementById('emptyState').style.display = 'block';
    return;
  }

  products.forEach(p => {
    const stock = Number(p.stock) || 0;
    const stockClass = stock === 0 ? 'no-stock' : stock <= 5 ? 'low-stock' : 'in-stock';
    const stockDot = stock === 0 ? '✕' : stock <= 5 ? '⚠' : '✓';
    const imgSrc = p.imageUrl
      ? `http://localhost:3000/${p.imageUrl.replace(/\\/g, '/')}`
      : null;

    const imgCell = imgSrc
      ? `<img class="product-img" src="${imgSrc}" alt="${escHtml(p.proName)}"
           onerror="this.outerHTML='<div class=\\'img-placeholder\\'><svg width=\\'16\\' height=\\'16\\' fill=\\'none\\' stroke=\\'currentColor\\' stroke-width=\\'2\\' viewBox=\\'0 0 24 24\\'><rect x=\\'3\\' y=\\'3\\' width=\\'18\\' height=\\'18\\' rx=\\'2\\'/><circle cx=\\'8.5\\' cy=\\'8.5\\' r=\\'1.5\\'/><polyline points=\\'21 15 16 10 5 21\\'/></svg></div>'">`
      : `<div class="img-placeholder"><svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg></div>`;

    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${imgCell}</td>
      <td>
        <div class="product-name">${escHtml(p.proName)}</div>
        <div class="product-desc">${escHtml(p.proDescrption || '')}</div>
      </td>
      <td><span class="cat-badge">${escHtml(p.category || '—')}</span></td>
      <td class="price">$${Number(p.price || 0).toFixed(2)}</td>
      <td><span class="stock-badge ${stockClass}">${stockDot} ${stock}</span></td>
      <td>
        <div class="id-cell">
          <span class="id-text" title="${escHtml(p.id)}">${escHtml(p.id)}</span>
          <button class="copy-btn" onclick="copyId('${escHtml(p.id)}', this)">
            <svg width="11" height="11" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
              <rect x="9" y="9" width="13" height="13" rx="2"/>
              <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/>
            </svg>
            Copy
          </button>
        </div>
      </td>
    `;
    tbody.appendChild(tr);
  });

  document.getElementById('tableWrap').style.display = 'block';
  document.getElementById('emptyState').style.display = 'none';
  document.getElementById('searchBarWrap').style.display = 'flex';
}

function filterProducts() {
  const q = document.getElementById('searchInput').value.toLowerCase();
  const filtered = allProducts.filter(p =>
    (p.proName || '').toLowerCase().includes(q) ||
    (p.category || '').toLowerCase().includes(q)
  );
  renderProducts(filtered);
  document.getElementById('statsBar').style.display = 'flex';
  document.getElementById('searchBarWrap').style.display = 'flex';
}

function copyId(id, btn) {
  navigator.clipboard.writeText(id).then(() => {
    btn.classList.add('copied');
    btn.innerHTML = `<svg width="11" height="11" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg> Copied`;
    showToast('ID copied to clipboard!');
    setTimeout(() => {
      btn.classList.remove('copied');
      btn.innerHTML = `<svg width="11" height="11" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></svg> Copy`;
    }, 2000);
  });
}

// ── FILE UPLOAD ───────────────────────────────────────────────────────────────
document.getElementById('imageFile').addEventListener('change', function () {
  if (this.files[0]) handleFile(this.files[0]);
});

const uploadZone = document.getElementById('uploadZone');
uploadZone.addEventListener('dragover', e => { e.preventDefault(); uploadZone.style.borderColor = '#2563eb'; });
uploadZone.addEventListener('dragleave', () => { uploadZone.style.borderColor = ''; });
uploadZone.addEventListener('drop', e => {
  e.preventDefault();
  uploadZone.style.borderColor = '';
  if (e.dataTransfer.files[0]) handleFile(e.dataTransfer.files[0]);
});

function handleFile(file) {
  const reader = new FileReader();
  reader.onload = e => { document.getElementById('previewImg').src = e.target.result; };
  reader.readAsDataURL(file);
  document.getElementById('fileName').textContent = file.name;
  document.getElementById('fileSize').textContent = formatBytes(file.size);
  document.getElementById('filePreview').classList.add('show');
  document.getElementById('uploadZone').style.display = 'none';
}

function removeFile() {
  document.getElementById('imageFile').value = '';
  document.getElementById('filePreview').classList.remove('show');
  document.getElementById('uploadZone').style.display = '';
}

// ── UPLOAD SUBMIT ─────────────────────────────────────────────────────────────
async function submitUpload() {
  const proName = document.getElementById('proName').value.trim();
  const proDescrption = document.getElementById('proDescrption').value.trim();
  const price = document.getElementById('price').value;
  const stock = document.getElementById('stock').value;
  const category = document.getElementById('category').value;
  const color = document.getElementById('color').value.trim();
  const storage = document.getElementById('storage').value.trim();
  const file = document.getElementById('imageFile').files[0];

  if (!proName || !proDescrption || !price || !stock || !category) {
    return setStatus('uploadStatus', 'error', '✕ Please fill in all required fields.');
  }
  if (!file) {
    return setStatus('uploadStatus', 'error', '✕ Product image is required.');
  }

  const formData = new FormData();
  formData.append('proName', proName);
  formData.append('proDescrption', proDescrption);
  formData.append('price', price);
  formData.append('stock', stock);
  formData.append('category', category);
  if (color) formData.append('color', color);
  if (storage) formData.append('storage', storage);
  formData.append('image', file);

  const btn = document.getElementById('uploadBtn');
  btn.disabled = true;
  setStatus('uploadStatus', 'loading', 'Uploading product…');

  try {
    const res = await fetch('http://localhost:3000/products/upload', {
      method: 'POST',
      headers: authHeaders(),
      body: formData
    });
    const data = await res.json();

    if (res.ok) {
      // ✅ SUCCESS
      setStatus('uploadStatus', 'success', '✓ Product uploaded successfully! — ' + (data.proName || proName));
      showToast('Product uploaded!');
      resetUpload();
    } else {
      // ❌ ERROR
      setStatus('uploadStatus', 'error', '✕ ' + (data.message || 'Upload failed. Error ' + res.status));
    }
  } catch (err) {
    setStatus('uploadStatus', 'error', '✕ Network error — is the server running on port 3000?');
  } finally {
    btn.disabled = false;
  }
}

function resetUpload() {
  ['proName', 'proDescrption', 'price', 'stock', 'color', 'storage'].forEach(id => {
    document.getElementById(id).value = '';
  });
  document.getElementById('category').selectedIndex = 0;
  removeFile();
  hideStatus('uploadStatus');
}

// ── DELETE ────────────────────────────────────────────────────────────────────
async function pasteFromClipboard() {
  try {
    const text = await navigator.clipboard.readText();
    document.getElementById('deleteId').value = text.trim();
  } catch {
    document.getElementById('deleteId').focus();
  }
}

function openConfirm() {
  const id = document.getElementById('deleteId').value.trim();
  if (!id) return setStatus('deleteStatus', 'error', '✕ Please enter a Product ID.');
  document.getElementById('confirmIdText').textContent = id;
  document.getElementById('confirmModal').classList.add('show');
}

function closeModal() {
  document.getElementById('confirmModal').classList.remove('show');
}

async function confirmDelete() {
  closeModal();
  const id = document.getElementById('deleteId').value.trim();
  setStatus('deleteStatus', 'loading', 'Deleting product…');

  try {
    const res = await fetch(`http://localhost:3000/products/delete/${id}`, {
      method: 'DELETE',
      headers: authHeaders()
    });
    const data = await res.json();

    if (res.ok) {
      // ✅ SUCCESS
      setStatus('deleteStatus', 'success', '✓ ' + (data.message || 'Product deleted successfully.'));
      showToast('Product deleted!');
      document.getElementById('deleteId').value = '';
    } else {
      // ❌ ERROR
      setStatus('deleteStatus', 'error', '✕ ' + (data.message || 'Delete failed. Error ' + res.status));
    }
  } catch (err) {
    setStatus('deleteStatus', 'error', '✕ Network error — is the server running on port 3000?');
  }
}

document.getElementById('confirmModal').addEventListener('click', function (e) {
  if (e.target === this) closeModal();
});

window.addEventListener('DOMContentLoaded', () => loadProducts());

// ── UPDATE PRODUCT ────────────────────────────────────────────────────────────
document.getElementById('updImageFile').addEventListener('change', function () {
  if (this.files[0]) handleUpdateFile(this.files[0]);
});

const updUploadZone = document.getElementById('updUploadZone');
updUploadZone.addEventListener('dragover', e => { e.preventDefault(); updUploadZone.style.borderColor = '#f59e0b'; });
updUploadZone.addEventListener('dragleave', () => { updUploadZone.style.borderColor = ''; });
updUploadZone.addEventListener('drop', e => {
  e.preventDefault();
  updUploadZone.style.borderColor = '';
  if (e.dataTransfer.files[0]) handleUpdateFile(e.dataTransfer.files[0]);
});

function handleUpdateFile(file) {
  const reader = new FileReader();
  reader.onload = e => { document.getElementById('updPreviewImg').src = e.target.result; };
  reader.readAsDataURL(file);
  document.getElementById('updFileName').textContent = file.name;
  document.getElementById('updFileSize').textContent = formatBytes(file.size);
  document.getElementById('updFilePreview').classList.add('show');
  document.getElementById('updUploadZone').style.display = 'none';
}

function removeUpdateFile() {
  document.getElementById('updImageFile').value = '';
  document.getElementById('updFilePreview').classList.remove('show');
  document.getElementById('updUploadZone').style.display = '';
}

async function pasteUpdateId() {
  try {
    const text = await navigator.clipboard.readText();
    document.getElementById('updateId').value = text.trim();
  } catch {
    document.getElementById('updateId').focus();
  }
}

async function submitUpdate() {
  const id = document.getElementById('updateId').value.trim();
  if (!id) return setStatus('updateStatus', 'error', '✕ Product ID is required.');

  const formData = new FormData();
  const fields = {
    proName: document.getElementById('upd_proName').value.trim(),
    proDescrption: document.getElementById('upd_proDescrption').value.trim(),
    price: document.getElementById('upd_price').value,
    stock: document.getElementById('upd_stock').value,
    color: document.getElementById('upd_color').value.trim(),
    storage: document.getElementById('upd_storage').value.trim(),
    category: document.getElementById('upd_category').value,
  };

  let hasField = false;
  Object.entries(fields).forEach(([key, val]) => {
    if (val) { formData.append(key, val); hasField = true; }
  });

  const file = document.getElementById('updImageFile').files[0];
  if (file) { formData.append('image', file); hasField = true; }

  if (!hasField) {
    return setStatus('updateStatus', 'error', '✕ Please fill in at least one field to update.');
  }

  const btn = document.getElementById('updateBtn');
  btn.disabled = true;
  setStatus('updateStatus', 'loading', 'Saving changes…');

  try {
    const res = await fetch(`http://localhost:3000/products/update/${id}`, {
      method: 'PATCH',
      headers: authHeaders(),
      body: formData
    });
    const data = await res.json();

    if (res.ok) {
      // ✅ SUCCESS
      setStatus('updateStatus', 'success',
        `✓ Product updated successfully!${data.proName ? ' — ' + data.proName : ''}`
      );
      showToast('Product updated!');
    } else {
      // ❌ ERROR
      setStatus('updateStatus', 'error', '✕ ' + (data.message || 'Update failed. Error ' + res.status));
    }
  } catch (err) {
    setStatus('updateStatus', 'error', '✕ Network error — is the server running on port 3000?');
  } finally {
    btn.disabled = false;
  }
}

function resetUpdate() {
  ['updateId', 'upd_proName', 'upd_proDescrption', 'upd_price', 'upd_stock', 'upd_color', 'upd_storage'].forEach(id => {
    document.getElementById(id).value = '';
  });
  document.getElementById('upd_category').selectedIndex = 0;
  removeUpdateFile();
  hideStatus('updateStatus');
}

// ── ALL ORDERS ────────────────────────────────────────────────────────────────
let allOrders = [];

async function loadOrders() {
  setStatus('ordersStatus', 'loading', 'Loading orders…');
  document.getElementById('ordersTableWrap').style.display = 'none';
  document.getElementById('ordersEmptyState').style.display = 'none';
  document.getElementById('ordersStatsBar').style.display = 'none';
  document.getElementById('ordersSearchWrap').style.display = 'none';

  try {
    const res = await fetch('http://localhost:3000/orders/allOrders', {
      headers: authHeaders()
    });
    const data = await res.json();

    if (!res.ok) {
      setStatus('ordersStatus', 'error', '✕ ' + (data.message || 'Failed to load orders.'));
      return;
    }

    allOrders = Array.isArray(data) ? data : [];
    hideStatus('ordersStatus');
    renderOrderStats(allOrders);
    renderOrders(allOrders);

  } catch (err) {
    setStatus('ordersStatus', 'error', '✕ Network error — is the server running on port 3000?');
  }
}

function renderOrderStats(orders) {
  const total = orders.length;
  const pending = orders.filter(o => (o.status || '').toLowerCase() === 'pending').length;
  const completed = orders.filter(o => ['paid', 'completed'].includes((o.status || '').toLowerCase())).length;
  const revenue = orders.reduce((sum, o) => sum + ((o.productId?.price || 0) * (o.quantity || 1)), 0);

  document.getElementById('oStatTotal').textContent = total;
  document.getElementById('oStatPending').textContent = pending;
  document.getElementById('oStatCompleted').textContent = completed;
  document.getElementById('oStatRevenue').textContent = '$' + revenue.toFixed(2);
  document.getElementById('ordersStatsBar').style.display = 'flex';
}

function renderOrders(orders) {
  const tbody = document.getElementById('ordersTableBody');
  tbody.innerHTML = '';

  if (!orders || orders.length === 0) {
    document.getElementById('ordersTableWrap').style.display = 'none';
    document.getElementById('ordersEmptyState').style.display = 'block';
    return;
  }

  orders.forEach(order => {
    const user = order.userId || {};
    const product = order.productId || {};
    const status = (order.status || 'pending').toLowerCase();
    const qty = order.quantity || 1;
    const price = product.price || 0;
    const total = (price * qty).toFixed(2);
    const date = order.createdAt
      ? new Date(order.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
      : '—';
    const orderId = (order._id || '').toString();

    const statusClass = {
      pending: 'status-pending',
      processing: 'status-processing',
      completed: 'status-completed',
      paid: 'status-paid',
      cancelled: 'status-cancelled',
      shipped: 'status-shipped',
    }[status] || 'status-pending';

    const statusLabel = status.charAt(0).toUpperCase() + status.slice(1);

    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>
        <div class="id-cell">
          <span class="id-text" title="${escHtml(orderId)}">${escHtml(orderId)}</span>
          <button class="copy-btn" onclick="copyId('${escHtml(orderId)}', this)">
            <svg width="11" height="11" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
              <rect x="9" y="9" width="13" height="13" rx="2"/>
              <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/>
            </svg>
            Copy
          </button>
        </div>
      </td>
      <td>
        <div class="customer-name">${escHtml(user.fullName || 'Unknown')}</div>
        <div class="customer-email">${escHtml(user.email || '—')}</div>
      </td>
      <td>
        <div class="order-product-name">${escHtml(product.proName || '—')}</div>
        <div class="order-product-cat">${escHtml(product.category || '—')}</div>
      </td>
      <td class="order-qty">${qty}</td>
      <td class="order-total">$${total}</td>
      <td><span class="order-status ${statusClass}">${statusLabel}</span></td>
      <td class="order-date">${date}</td>
    `;
    tbody.appendChild(tr);
  });

  document.getElementById('ordersTableWrap').style.display = 'block';
  document.getElementById('ordersEmptyState').style.display = 'none';
  document.getElementById('ordersSearchWrap').style.display = 'flex';
}

function filterOrders() {
  const q = document.getElementById('ordersSearchInput').value.toLowerCase();
  const filtered = allOrders.filter(o => {
    const name = (o.userId?.name || o.userId?.fullName || '').toLowerCase();
    const email = (o.userId?.email || '').toLowerCase();
    const product = (o.productId?.proName || '').toLowerCase();
    return name.includes(q) || email.includes(q) || product.includes(q);
  });
  renderOrders(filtered);
  document.getElementById('ordersStatsBar').style.display = 'flex';
  document.getElementById('ordersSearchWrap').style.display = 'flex';
}

//  UPDATE ORDER STATUS 
document.querySelectorAll('.status-card').forEach(card => {
  card.addEventListener('click', () => {
    document.querySelectorAll('.status-card').forEach(c => c.classList.remove('selected'));
    card.classList.add('selected');
    card.querySelector('input[type="radio"]').checked = true;
  });
});

async function pasteOrderId() {
  try {
    const text = await navigator.clipboard.readText();
    document.getElementById('orderStatusId').value = text.trim();
  } catch {
    document.getElementById('orderStatusId').focus();
  }
}

async function submitOrderStatus() {
  const id = document.getElementById('orderStatusId').value.trim();
  if (!id) return setStatus('orderStatusMsg', 'error', '✕ Please enter an Order ID.');

  const selected = document.querySelector('input[name="orderStatus"]:checked');
  if (!selected) return setStatus('orderStatusMsg', 'error', '✕ Please select a status.');

  const status = selected.value;
  const btn = document.getElementById('orderStatusBtn');
  btn.disabled = true;
  setStatus('orderStatusMsg', 'loading', 'Updating order status…');

  try {
    const res = await fetch(`http://localhost:3000/orders/${id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        ...authHeaders()
      },
      body: JSON.stringify({ status })
    });
    const data = await res.json();

    if (res.ok) {
      // SUCCESS
      const newStatus = data.order?.status || status;
      setStatus('orderStatusMsg', 'success',
        `✓ ${data.message || 'Status updated!'} — Order is now <strong>${newStatus}</strong>`
      );
      showToast('Order status updated!');
    } else {
      //  ERROR
      setStatus('orderStatusMsg', 'error', '✕ ' + (data.message || 'Update failed. Error ' + res.status));
    }
  } catch (err) {
    setStatus('orderStatusMsg', 'error', '✕ Network error — is the server running on port 3000?');
  } finally {
    btn.disabled = false;
  }
}

function resetOrderStatus() {
  document.getElementById('orderStatusId').value = '';
  document.querySelectorAll('.status-card').forEach(c => c.classList.remove('selected'));
  document.querySelectorAll('input[name="orderStatus"]').forEach(r => r.checked = false);
  hideStatus('orderStatusMsg');
}