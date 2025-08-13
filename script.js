// API integration and helpers
const API_BASE = 'http://localhost:5001/api';
let products = [];

const getImageUrl = (url) => {
	if (!url) return 'images/croshet.jpg';
	if (url.startsWith('http') || url.startsWith('data:') || url.startsWith('images/')) return url;
	if (url.startsWith('/')) return 'http://localhost:5001' + url;
	return url;
};

const fetchJson = async (path, options = {}) => {
	const res = await fetch(`${API_BASE}${path}`, {
		credentials: 'include',
		...options
	});
	if (!res.ok) {
		const message = await res.text().catch(() => 'Request failed');
		throw new Error(message || `HTTP ${res.status}`);
	}
	return res.json();
};

async function loadProductsFromApi(queryString = '') {
	const data = await fetchJson(`/products${queryString}`);
	products = Array.isArray(data) ? data : (data.products || []);
	return products;
}

async function loadFeaturedProductsFromApi() {
	return await fetchJson('/products/featured');
}

async function loadDashboardStats() {
	return await fetchJson('/admin-dashboard/stats');
}

async function loadSiteSettings() {
	try {
		return await fetchJson('/site-settings');
	} catch (e) {
		return null;
	}
}

async function loadTestimonials() {
	try {
		return await fetchJson('/testimonials');
	} catch (e) {
		return [];
	}
}

// Cart functionality
class Cart {
    constructor() {
        this.items = JSON.parse(localStorage.getItem('cart')) || [];
        this.updateCartCount();
    }

    addItem(product) {
        const existingItem = this.items.find(item => item.id === product.id);
        if (existingItem) {
            existingItem.quantity += 1;
        } else {
            this.items.push({ ...product, quantity: 1 });
        }
        this.saveCart();
        this.updateCartCount();
        this.showNotification('Item added to cart!');
    }

    removeItem(productId) {
        this.items = this.items.filter(item => item.id !== productId);
        this.saveCart();
        this.updateCartCount();
        this.updateCartDisplay();
    }

    updateQuantity(productId, quantity) {
        const item = this.items.find(item => item.id === productId);
        if (item) {
            if (quantity <= 0) {
                this.removeItem(productId);
            } else {
                item.quantity = quantity;
                this.saveCart();
                this.updateCartCount();
                this.updateCartDisplay();
            }
        }
    }

    getTotal() {
        return this.items.reduce((total, item) => total + (item.price * item.quantity), 0);
    }

    getShipping() {
        return this.items.length > 0 ? 5.99 : 0;
    }

    getGrandTotal() {
        return this.getTotal() + this.getShipping();
    }

    saveCart() {
        localStorage.setItem('cart', JSON.stringify(this.items));
    }

    updateCartCount() {
        const cartCount = document.querySelector('.cart-count');
        if (cartCount) {
            const totalItems = this.items.reduce((total, item) => total + item.quantity, 0);
            cartCount.textContent = totalItems;
        }
    }

    updateCartDisplay() {
        const cartItems = document.getElementById('cart-items');
        const subtotal = document.getElementById('subtotal');
        const shipping = document.getElementById('shipping');
        const total = document.getElementById('total');

        if (cartItems) {
            if (this.items.length === 0) {
                cartItems.innerHTML = '<p class="empty-cart">Your cart is empty. <a href="shop.html">Continue shopping</a></p>';
            } else {
                cartItems.innerHTML = this.items.map(item => `
                    <div class="cart-item">
                        <div class="cart-item-image">
                            <img src="${item.image}" alt="${item.name}">
                        </div>
                        <div class="cart-item-details">
                            <h4 class="cart-item-name">${item.name}</h4>
                            <p class="cart-item-price">$${item.price.toFixed(2)}</p>
                            <div class="cart-item-quantity">
								<button class="quantity-btn" onclick="cart.updateQuantity('${item.id}', ${item.quantity - 1})">-</button>
                                <span>${item.quantity}</span>
								<button class="quantity-btn" onclick="cart.updateQuantity('${item.id}', ${item.quantity + 1})">+</button>
                            </div>
                        </div>
						<button class="remove-item" onclick="cart.removeItem('${item.id}')">Remove</button>
                    </div>
                `).join('');
            }
        }

        if (subtotal) subtotal.textContent = `$${this.getTotal().toFixed(2)}`;
        if (shipping) shipping.textContent = `$${this.getShipping().toFixed(2)}`;
        if (total) total.textContent = `$${this.getGrandTotal().toFixed(2)}`;
    }

    showNotification(message) {
        const notification = document.createElement('div');
        notification.className = 'notification';
        notification.textContent = message;
        notification.style.cssText = `
            position: fixed;
            top: 100px;
            right: 20px;
            background: #8b5cf6;
            color: white;
            padding: 1rem 2rem;
            border-radius: 8px;
            box-shadow: 0 4px 15px rgba(0,0,0,0.2);
            z-index: 1000;
            animation: slideIn 0.3s ease;
        `;
        document.body.appendChild(notification);
        setTimeout(() => {
            notification.remove();
        }, 3000);
    }
}

// Initialize cart
const cart = new Cart();

// Admin functionality
class Admin {
    constructor() {
        this.isLoggedIn = false;
    }

    openLoginModal() {
        const modal = document.getElementById('adminModal');
        if (modal) {
            modal.style.display = 'block';
        }
    }

    closeLoginModal() {
        const modal = document.getElementById('adminModal');
        if (modal) {
            modal.style.display = 'none';
        }
    }

	async login(username, password) {
		try {
			const res = await fetch(`${API_BASE}/admin/login`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				credentials: 'include',
				body: JSON.stringify({ username, password })
			});
			if (!res.ok) {
				const msg = await res.text();
				throw new Error(msg || 'Login failed');
			}
            this.isLoggedIn = true;
            this.closeLoginModal();
            window.location.href = 'admin.html';
            return true;
		} catch (e) {
			alert('Login failed: ' + e.message);
            return false;
        }
    }

	async displayProductsTable() {
        const tableBody = document.getElementById('productsTableBody');
		if (!tableBody) return;
		try {
			const list = await loadProductsFromApi('');
			tableBody.innerHTML = list.map(product => `
				<tr>
					<td><img src="${getImageUrl((product.images && product.images[0] && product.images[0].url) || product.image)}" alt="${product.name}"></td>
                    <td>${product.name}</td>
					<td>$${Number(product.price).toFixed(2)}</td>
					<td>${product.category || ''}</td>
                    <td>${product.sales || 0}</td>
                    <td>
						<button class="action-btn" onclick="admin.removeProduct('${product._id || product.id}')">Remove</button>
                    </td>
                </tr>
            `).join('');
		} catch (e) {
			tableBody.innerHTML = `<tr><td colspan="6">Failed to load products</td></tr>`;
		}
	}

	async addProduct(formData) {
		try {
			const res = await fetch(`${API_BASE}/products`, {
				method: 'POST',
				credentials: 'include',
				body: formData
			});
			if (!res.ok) {
				const msg = await res.text();
				throw new Error(msg || 'Failed to add product');
			}
			await this.displayProductsTable();
			return await res.json();
		} catch (e) {
			alert('Error adding product: ' + e.message);
			throw e;
		}
	}

	async removeProduct(productId) {
		try {
			const res = await fetch(`${API_BASE}/products/${productId}`, {
				method: 'DELETE',
				credentials: 'include'
			});
			if (!res.ok) {
				const msg = await res.text();
				throw new Error(msg || 'Failed to remove product');
			}
			await this.displayProductsTable();
		} catch (e) {
			alert('Error removing product: ' + e.message);
        }
    }
}

// Initialize admin
const admin = new Admin();

// Product display functions
function displayProducts(productsToShow = products, containerId = 'products-grid') {
    const container = document.getElementById(containerId);
    if (!container) return;

    if (productsToShow.length === 0) {
        container.innerHTML = '<p class="no-products">No products found.</p>';
        return;
    }

	container.innerHTML = productsToShow.map(product => {
		const imgUrl = getImageUrl((product.images && product.images[0] && product.images[0].url) || product.image);
		const clientProduct = {
			id: product._id || product.id,
			name: product.name,
			price: Number(product.price),
			image: imgUrl,
			description: product.description || ''
		};
		return `
        <div class="product-card">
            <div class="product-image">
					<img src="${imgUrl}" alt="${product.name}">
            </div>
            <div class="product-info">
                <h3 class="product-name">${product.name}</h3>
					<p class="product-price">$${Number(product.price).toFixed(2)}</p>
					<button class="add-to-cart" onclick="cart.addItem(${JSON.stringify(clientProduct).replace(/\"/g, '\\&quot;').replace(/"/g, '&quot;')})">
                    Add to Cart
                </button>
            </div>
        </div>
		`;
	}).join('');
}

async function displayFeaturedProducts() {
	try {
		const featured = await loadFeaturedProductsFromApi();
		displayProducts(featured, 'featured-products');
	} catch (e) {
		const container = document.getElementById('featured-products');
		if (container) container.innerHTML = '<p class="no-products">Failed to load featured products.</p>';
	}
}

// Search and filter functionality
async function filterProducts() {
    const searchTerm = document.getElementById('search-input')?.value.toLowerCase() || '';
    const categoryFilter = document.getElementById('category-filter')?.value || '';
    const priceFilter = document.getElementById('price-filter')?.value || '';
    const colorFilter = document.getElementById('color-filter')?.value || '';

	let query = new URLSearchParams();
	if (searchTerm) query.set('search', searchTerm);
	if (categoryFilter) query.set('category', categoryFilter);
	if (colorFilter) query.set('color', colorFilter);
        if (priceFilter) {
		if (priceFilter.includes('+')) {
			const min = priceFilter.replace('+', '');
			query.set('minPrice', min);
		} else if (priceFilter.includes('-')) {
			const [min, max] = priceFilter.split('-');
			if (min) query.set('minPrice', min);
			if (max) query.set('maxPrice', max);
		}
	}
	try {
		const list = await loadProductsFromApi('?' + query.toString());
		displayProducts(list);
	} catch (e) {
		const container = document.getElementById('products-grid');
		if (container) container.innerHTML = '<p class="no-products">Failed to load products.</p>';
	}
}

// Admin modal functions
function openAdminLogin() {
    admin.openLoginModal();
}

function closeAdminLogin() {
    admin.closeLoginModal();
}

// Mobile menu functionality
function toggleMobileMenu() {
    const navMenu = document.querySelector('.nav-menu');
    const hamburger = document.querySelector('.hamburger');

    if (navMenu && hamburger) {
        navMenu.classList.toggle('active');
        hamburger.classList.toggle('active');
    }
}

// Contact form functionality
async function handleContactForm(event) {
    event.preventDefault();
	const form = event.target;
	const formData = new FormData(form);
	const name = formData.get('name')?.toString().trim();
	const email = formData.get('email')?.toString().trim();
	const phone = formData.get('phone')?.toString().trim();
	const country = formData.get('country')?.toString().trim();
	if (!name || !phone || !country) {
		alert('Please provide name, phone, and country.');
		return;
	}
	try {
		const res = await fetch(`${API_BASE}/chat-users`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			credentials: 'include',
			body: JSON.stringify({ username: name, phone, country, email })
		});
		if (!res.ok) {
			const msg = await res.text();
			throw new Error(msg || 'Failed to submit');
		}
		const data = await res.json();
		alert(data.message || 'Thank you! We will contact you soon.');
		form.reset();
	} catch (e) {
		alert('Submission failed: ' + e.message);
	}
}

// Smooth scrolling for navigation links
function smoothScrollTo(elementId) {
    const element = document.getElementById(elementId);
    if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
    }
}

async function applySiteSettings() {
	const settings = await loadSiteSettings();
	if (!settings) return;
	const email = settings.email || settings.contactEmail;
	const phone = settings.phone || settings.contactPhone;
	const location = settings.location || settings.address;
	const instagram = settings.instagram;
	const facebook = settings.facebook;
	const pinterest = settings.pinterest;

	const footerEmail = document.getElementById('footerEmail');
	const footerPhone = document.getElementById('footerPhone');
	if (footerEmail) footerEmail.textContent = email || '';
	if (footerPhone) footerPhone.textContent = phone || '';

	const contactEmail = document.getElementById('contactEmail');
	const contactPhone = document.getElementById('contactPhone');
	const contactLocation = document.getElementById('contactLocation');
	if (contactEmail) contactEmail.textContent = email || '';
	if (contactPhone) contactPhone.textContent = phone || '';
	if (contactLocation) contactLocation.textContent = location || '';

	const igLinks = document.querySelectorAll('[data-social="instagram"]');
	igLinks.forEach(a => { if (instagram) a.setAttribute('href', instagram); });
	const fbLinks = document.querySelectorAll('[data-social="facebook"]');
	fbLinks.forEach(a => { if (facebook) a.setAttribute('href', facebook); });
	const pinLinks = document.querySelectorAll('[data-social="pinterest"]');
	pinLinks.forEach(a => { if (pinterest) a.setAttribute('href', pinterest); });
}

async function renderTestimonials() {
	const grid = document.getElementById('testimonials-grid');
	if (!grid) return;
	const items = await loadTestimonials();
	if (!items || items.length === 0) {
		const section = grid.closest('.testimonials');
		if (section) section.style.display = 'none';
		return;
	}
	grid.innerHTML = items.map(t => {
		const text = t.text || t.content || t.message || '';
		const author = t.author || t.username || 'Customer';
		return `
			<div class="testimonial-card">
				<div class="testimonial-content">
					<p>"${text}"</p>
				</div>
				<div class="testimonial-author">
					<h4>${author}</h4>
					<span>Verified Customer</span>
				</div>
			</div>
		`;
	}).join('');
}

function initShopFilters() {
        const searchInput = document.getElementById('search-input');
        const categoryFilter = document.getElementById('category-filter');
        const priceFilter = document.getElementById('price-filter');
        const colorFilter = document.getElementById('color-filter');

        if (searchInput) searchInput.addEventListener('input', filterProducts);
        if (categoryFilter) categoryFilter.addEventListener('change', filterProducts);
        if (priceFilter) priceFilter.addEventListener('change', filterProducts);
        if (colorFilter) colorFilter.addEventListener('change', filterProducts);
}

async function requireAdminAuthOrRedirect() {
	try {
		await fetchJson('/admin/profile');
		return true;
	} catch (e) {
		window.location.href = 'index.html';
		return false;
	}
}

// Initialize page-specific functionality
document.addEventListener('DOMContentLoaded', function() {
	// Update cart display if on cart page
	if (window.location.pathname.includes('cart.html')) {
		cart.updateCartDisplay();
	}

	// Load site settings across all pages
	// applySiteSettings();

	// Display featured products on homepage and testimonials
	if (window.location.pathname.includes('index.html') || window.location.pathname === '/' || window.location.pathname === '/index.html') {
		displayFeaturedProducts();
		// renderTestimonials();
	}

	// Display all products on shop page
	if (window.location.pathname.includes('shop.html')) {
		initShopFilters();
		filterProducts();
    }

    // Admin dashboard functionality
    if (window.location.pathname.includes('admin.html')) {
		requireAdminAuthOrRedirect().then(async (ok) => {
			if (!ok) return;
        admin.displayProductsTable();
			try {
				const stats = await loadDashboardStats();
				const totalValueEl = document.getElementById('totalValue');
				const totalProductsEl = document.getElementById('totalProducts');
				const totalChatUsersEl = document.getElementById('totalChatUsers');
				if (totalValueEl) totalValueEl.textContent = `$${Number(stats.totalValue || 0).toFixed(2)}`;
				if (totalProductsEl) totalProductsEl.textContent = String(stats.totalProducts || 0);
				if (totalChatUsersEl) totalChatUsersEl.textContent = String(stats.totalChatUsers || 0);
			} catch (e) {
				// leave defaults
			}

        // Handle add product form
        const addProductForm = document.getElementById('addProductForm');
        if (addProductForm) {
				addProductForm.addEventListener('submit', async function(event) {
                event.preventDefault();
                const formData = new FormData(event.target);
					// Map optional fields to backend expected keys
					const color = formData.get('color');
					if (color) formData.set('colors', String(color));
					formData.delete('color');
					try {
						await admin.addProduct(formData);
                event.target.reset();
                alert('Product added successfully!');
					} catch {}
            });
        }
		});
    }

    // Admin login functionality
    const adminLoginForm = document.getElementById('adminLoginForm');
    if (adminLoginForm) {
        adminLoginForm.addEventListener('submit', function(event) {
            event.preventDefault();
            const formData = new FormData(event.target);
            const data = Object.fromEntries(formData);
            admin.login(data.username, data.password);
        });
    }

    // Mobile menu toggle
    const hamburger = document.querySelector('.hamburger');
    if (hamburger) {
        hamburger.addEventListener('click', toggleMobileMenu);
    }

    // Contact form submission
    const contactForm = document.getElementById('contact-form');
    if (contactForm) {
        contactForm.addEventListener('submit', handleContactForm);
    }

    // Checkout button functionality
    const checkoutBtn = document.getElementById('checkout-btn');
    if (checkoutBtn) {
        checkoutBtn.addEventListener('click', function() {
            if (cart.items.length === 0) {
                alert('Your cart is empty!');
                return;
            }
            alert('Thank you for your order! This is a demo site, so no actual payment will be processed.');
            cart.items = [];
            cart.saveCart();
            cart.updateCartCount();
            cart.updateCartDisplay();
        });
    }

    // Add smooth scrolling to all internal links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const targetId = this.getAttribute('href').substring(1);
            smoothScrollTo(targetId);
        });
    });
});

// Add CSS for notifications
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }

    .empty-cart {
        text-align: center;
        color: #666;
        padding: 2rem;
    }

    .empty-cart a {
        color: #8b5cf6;
        text-decoration: none;
        font-weight: 600;
    }

    .no-products {
        text-align: center;
        color: #666;
        padding: 2rem;
        grid-column: 1 / -1;
    }
`;
document.head.appendChild(style);
