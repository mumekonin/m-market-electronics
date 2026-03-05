const SERVER_URL = 'https://m-market-2.onrender.com';

/*  Helpers  */
function statusClass(s) {
  const map = {
    pending:   'badge-pending',
    paid:      'badge-paid',
    shipped:   'badge-shipped',
    cancelled: 'badge-cancelled'
  };
  return map[s?.toLowerCase()] || 'badge-default';
}

function fmtDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-US', {
    year: 'numeric', month: 'short', day: 'numeric'
  });
}

function fmtId(id) {
  const s = (id || '').toString();
  return s.length > 16 ? `${s.slice(0, 8)}…${s.slice(-5)}` : s;
}

/*  Render  */
function renderOrders(orders) {
  const el = document.getElementById('ordersContent');

  if (!orders || orders.length === 0) {
    el.innerHTML = `
      <div class="state-box">
        <div class="state-icon">📦</div>
        <div class="state-title">No orders yet</div>
        <div class="state-desc">Your orders will appear here once you make a purchase</div>
        <a href="index.html" class="state-btn">Start Shopping</a>
      </div>`;
    return;
  }

  /*  Side stats  */
  const sideStats = document.getElementById('sideStats');
  sideStats.style.display = 'grid';

  const pending = orders.filter(o => o.status?.toLowerCase() === 'pending').length;
  const shipped = orders.filter(o => o.status?.toLowerCase() === 'shipped').length;
  const spent   = orders.reduce((sum, o) =>
    sum + ((o.productId?.price || 0) * (o.quantity || 1)), 0);

  document.getElementById('ss-total').textContent   = orders.length;
  document.getElementById('ss-pending').textContent = pending;
  document.getElementById('ss-shipped').textContent = shipped;
  document.getElementById('ss-spent').textContent   = '$' + spent.toFixed(2);

  /*  Cards  */
  el.innerHTML = `
    <div class="orders-list">
      ${orders.map((order, i) => {
        const p     = order.productId || {};
        const img   = p.imageUrl
          ? `${SERVER_URL}/${p.imageUrl.replace(/\\/g, '/')}`
          : null;
        const qty   = order.quantity || 1;
        const total = ((p.price || 0) * qty).toFixed(2);
        const st    = order.status || 'unknown';

        return `
          <div class="order-card" style="animation-delay:${i * 60}ms">

            <div class="card-head">
              <div class="card-head-left">
                <span class="card-id-lbl">Order</span>
                <span class="card-id-val">#${fmtId(order._id || order.id)}</span>
              </div>
              <div style="display:flex; align-items:center; gap:12px; flex-wrap:wrap;">
                <span class="card-date">${fmtDate(order.createdAt)}</span>
                <span class="status-badge ${statusClass(st)}">${st}</span>
              </div>
            </div>

            <div class="card-body">
              <div class="card-img">
                ${img
                  ? `<img src="${img}" alt="${p.proName || 'Product'}"
                       onerror="this.parentElement.innerHTML='<div class=\\'card-img-placeholder\\'>📦</div>'">`
                  : `<div class="card-img-placeholder">📦</div>`}
              </div>

              <div class="card-info">
                <div class="card-product-name">${p.proName || 'Product Unavailable'}</div>
                <div class="card-meta">
                  ${p.category ? `<div class="meta-tag">Category: <b>${p.category}</b></div>` : ''}
                  ${p.color    ? `<div class="meta-tag">Color: <b>${p.color}</b></div>`       : ''}
                  ${p.storage  ? `<div class="meta-tag">Storage: <b>${p.storage}</b></div>`   : ''}
                  <div class="meta-tag">Unit: <b>$${p.price || 0}</b></div>
                </div>
              </div>

              <div class="card-price-block">
                <div class="card-price-lbl">Total</div>
                <div class="card-price-val">$${total}</div>
                <div class="card-qty">Qty: ${qty}</div>
              </div>
            </div>

          </div>`;
      }).join('')}
    </div>`;
}

/*  Load  */
async function loadMyOrders() {
  const token = localStorage.getItem('userToken');
  const el    = document.getElementById('ordersContent');

  /* Not logged in */
  if (!token) {
    el.innerHTML = `
      <div class="state-box">
        <div class="state-icon">🔒</div>
        <div class="state-title">You're not logged in</div>
        <div class="state-desc">Please log in to view your orders</div>
        <a href="login.html" class="state-btn">Log In</a>
      </div>`;
    return;
  }

  /* Loading */
  el.innerHTML = `
    <div class="state-box">
      <div class="state-spinner"></div>
      <div class="state-title">Loading your orders…</div>
    </div>`;

  try {
    const res = await fetch(`${SERVER_URL}/orders/myOrder`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    /* Session expired */
    if (res.status === 401) {
      localStorage.removeItem('userToken');
      el.innerHTML = `
        <div class="state-box">
          <div class="state-icon">⏱</div>
          <div class="state-title">Session expired</div>
          <div class="state-desc">Please log in again to continue</div>
          <a href="login.html" class="state-btn">Log In</a>
        </div>`;
      return;
    }

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || `Server error ${res.status}`);
    }

    const orders = await res.json();
    renderOrders(orders);

  } catch (err) {
    el.innerHTML = `
      <div class="error-banner">⚠ ${err.message}</div>
      <div class="state-box">
        <div class="state-desc">Check your connection and try again</div>
        <button class="state-btn" onclick="loadMyOrders()">Retry</button>
      </div>`;
  }
}

/*  Init  */
document.addEventListener('DOMContentLoaded', loadMyOrders);