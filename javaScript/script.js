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
async function loadMmarketElectronics() {
    const grid = document.getElementById('product-list-grid');
    if (!grid) {
        console.error("Missing #product-list-grid in HTML");
        return;
    }

    try {
        const response = await fetch(`${SERVER_URL}/products/get-all-products`);
        const products = await response.json();
        
        grid.innerHTML = products.slice(0, 9).map(p => {
            const cleanPath = p.imageUrl ? p.imageUrl.replace(/\\/g, '/') : '';
            const productId = p._id || p.id;

            return `
                <div class="product-card">
                    <img src="${SERVER_URL}/${cleanPath}" alt="${p.proName}">
                    <h3>${p.proName}</h3>
                    <div class="product-price">$${p.price}</div>
                    <button class="order-btn" onclick="showProductDetails('${productId}')">View Details</button>
                </div>
            `;
        }).join('');
    } catch (e) {
        console.error("Load Error:", e);
    }
}

async function showProductDetails(targetId) {
    const detailBox = document.getElementById('detail-modal');
    const overlay = document.getElementById('modal-overlay');

    // Safety check: Prevents "Cannot set properties of null" error
    if (!detailBox || !overlay) {
        console.error("Modal elements not found in HTML!");
        return;
    }

    try {
        const response = await fetch(`${SERVER_URL}/products/get-product-detail/${targetId}`);
        const product = await response.json();

        const cleanPath = product.imageUrl ? product.imageUrl.replace(/\\/g, '/') : '';
        
        detailBox.innerHTML = `
            <button class="close-modal-btn" onclick="closeModal()">&times;</button>
            <div class="modal-body">
                <div class="modal-info-side">
                    <span class="spec-badge">${product.category}</span>
                    <h2 class="detail-title">${product.proName}</h2>
                    <div class="detail-price">$${product.price}</div>
                    <p class="detail-desc">${product.proDescrption}</p>
                    <button class="order-btn" style="width:100%">Add to Cart</button>
                </div>
            </div>
        `;
        
        detailBox.style.display = 'block';
        overlay.style.display = 'block';
        document.body.style.overflow = 'hidden';
    } catch (error) {
        console.error("Fetch Error:", error);
    }
}

function closeModal() {
    document.getElementById('detail-modal').style.display = 'none';
    document.getElementById('modal-overlay').style.display = 'none';
    document.body.style.overflow = 'auto';
}

document.addEventListener('DOMContentLoaded', loadMmarketElectronics);