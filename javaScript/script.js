document.addEventListener('DOMContentLoaded', () => {
  const menuBtn = document.getElementById('menu-btn');
  const navWrapper = document.getElementById('nav-wrapper');
  const toggleMenu = () => {
    const isOpen = navWrapper.classList.toggle('is-open');
    menuBtn.classList.toggle('is-active');
    menuBtn.setAttribute('aria-expanded', isOpen);
    document.body.style.overflow = isOpen ? 'hidden' : 'auto';
  };
  menuBtn.addEventListener('click', toggleMenu);
  const navLinks = document.querySelectorAll('.nav-link');
  navLinks.forEach(link => {
    link.addEventListener('click', () => {
      if (navWrapper.classList.contains('is-open')) {
        toggleMenu();
      }
    });
  });
});
const SERVER_URL = 'http://localhost:3000';

/**
 * 1. BROWSE: Load the Grid
 */
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
    } catch (e) { console.error("Grid Error:", e); }
}

/**
 * 2. VIEW DETAILS: Open Modal
 */
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
                    <span class="spec-badge">${product.category}</span>
                    <h2 class="detail-title">${product.proName}</h2>
                    <div class="detail-price">$${product.price}</div>
                    <p class="detail-desc">${product.proDescrption}</p>
                    
                    <div id="initial-order-step">
                        <button class="order-btn" onclick="showOrderForm()" style="width:100%">PLACE ORDER</button>
                    </div>

                    <div id="hidden-payment-methods" style="display: none; margin-top: 20px; border-top: 1px solid #eee; padding-top: 15px;">
                        <label>Quantity:</label>
                        <input type="number" id="order-qty" value="1" min="1" style="width:100%; margin-bottom:10px;">
                        <label>Payment Screenshot:</label>
                        <input type="file" id="order-screenshot" accept="image/*" style="margin-bottom:20px;">
                        <button class="order-btn" onclick="buyNow('${product._id || product.id}')" style="width:100%; background:#28a745;">CONFIRM & PAY</button>
                    </div>
                </div>
            </div>
        `;
        detailBox.style.display = 'block';
        overlay.style.display = 'block';
        document.body.style.overflow = 'hidden';
    } catch (e) { console.error("Detail Error:", e); }
}

/**
 * 3. REVEAL: Show Payment Methods
 */
function showOrderForm() {
    document.getElementById('initial-order-step').style.display = 'none';
    document.getElementById('hidden-payment-methods').style.display = 'block';
}

/**
 * 4. ORDER: Confirm & Send to NestJS
 */
async function buyNow(productId) {
    // FIXED: Must match your login script's key
    const token = localStorage.getItem('userToken'); 
    const fileInput = document.getElementById('order-screenshot');
    const qty = document.getElementById('order-qty').value;

    if (!token) return alert("Please login first!");
    if (!fileInput.files[0]) return alert("Screenshot required!");

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
            alert("Order placed successfully!");
            closeModal();
        } else {
            const err = await response.json();
            alert("Error: " + err.message);
        }
    } catch (e) { console.error("Order Error:", e); }
}

function closeModal() {
    document.getElementById('detail-modal').style.display = 'none';
    document.getElementById('modal-overlay').style.display = 'none';
    document.body.style.overflow = 'auto';
}

document.addEventListener('DOMContentLoaded', loadMmarketElectronics);