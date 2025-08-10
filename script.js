// Product data - Replace with your actual products
const products = [
    {
        id: 1,
        name: "Cozy Winter Scarf",
        price: 35.00,
        category: "scarf",
        color: "blue",
        image: "images/baby.jpg",
        description: "A warm and soft handmade scarf perfect for cold weather.",
        sales: 15
    },
    {
        id: 2,
        name: "Chunky Knit Hat",
        price: 28.00,
        category: "hat",
        color: "pink",
        image: "images/chunky.jpg",
        description: "A comfortable and stylish hat made with premium yarn.",
        sales: 12
    },
    {
        id: 3,
        name: "Soft Baby Blanket",
        price: 45.00,
        category: "accessory",
        color: "yellow",
        image: "images/scarf.jpg",
        description: "A gentle and warm blanket perfect for little ones.",
        sales: 8
    },
    {
        id: 4,
        name: "Cozy Cardigan",
        price: 85.00,
        category: "sweater",
        color: "green",
        image: "images/cardigan.jpg",
        description: "A beautiful handcrafted cardigan for any occasion.",
        sales: 6
    },
    {
        id: 5,
        name: "Summer Shawl",
        price: 32.00,
        category: "accessory",
        color: "purple",
        image: "images/summer.jpg",
        description: "A lightweight and elegant shawl for summer evenings.",
        sales: 10
    },
    {
        id: 6,
        name: "Warm Mittens",
        price: 25.00,
        category: "accessory",
        color: "white",
        image: "images/warm.jpg",
        description: "Soft and warm mittens to keep your hands cozy.",
        sales: 18
    }
];

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
                                <button class="quantity-btn" onclick="cart.updateQuantity(${item.id}, ${item.quantity - 1})">-</button>
                                <span>${item.quantity}</span>
                                <button class="quantity-btn" onclick="cart.updateQuantity(${item.id}, ${item.quantity + 1})">+</button>
                            </div>
                        </div>
                        <button class="remove-item" onclick="cart.removeItem(${item.id})">Remove</button>
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
        this.loadProducts();
    }

    loadProducts() {
        // Load products from localStorage if available
        const savedProducts = localStorage.getItem('adminProducts');
        if (savedProducts) {
            products.length = 0;
            products.push(...JSON.parse(savedProducts));
        }
    }

    saveProducts() {
        localStorage.setItem('adminProducts', JSON.stringify(products));
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

    login(username, password) {
        // Simple login validation (replace with actual backend validation)
        if (username === 'admin' && password === 'admin123') {
            this.isLoggedIn = true;
            this.closeLoginModal();
            window.location.href = 'admin.html';
            return true;
        } else {
            alert('Invalid credentials. Use admin/admin123');
            return false;
        }
    }

    addProduct(productData) {
        const newProduct = {
            id: products.length + 1,
            name: productData.name,
            price: parseFloat(productData.price),
            category: productData.category,
            color: productData.color || '',
            image: productData.image,
            description: productData.description,
            sales: 0
        };
        
        products.push(newProduct);
        this.saveProducts();
        this.displayProductsTable();
        return newProduct;
    }

    removeProduct(productId) {
        const index = products.findIndex(product => product.id === productId);
        if (index > -1) {
            products.splice(index, 1);
            this.saveProducts();
            this.displayProductsTable();
        }
    }

    displayProductsTable() {
        const tableBody = document.getElementById('productsTableBody');
        if (tableBody) {
            tableBody.innerHTML = products.map(product => `
                <tr>
                    <td><img src="${product.image}" alt="${product.name}"></td>
                    <td>${product.name}</td>
                    <td>$${product.price.toFixed(2)}</td>
                    <td>${product.category}</td>
                    <td>${product.sales || 0}</td>
                    <td>
                        <button class="action-btn" onclick="admin.removeProduct(${product.id})">Remove</button>
                    </td>
                </tr>
            `).join('');
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

    container.innerHTML = productsToShow.map(product => `
        <div class="product-card">
            <div class="product-image">
                <img src="${product.image}" alt="${product.name}">
            </div>
            <div class="product-info">
                <h3 class="product-name">${product.name}</h3>
                <p class="product-price">$${product.price.toFixed(2)}</p>
                <button class="add-to-cart" onclick="cart.addItem(${JSON.stringify(product).replace(/"/g, '&quot;')})">
                    Add to Cart
                </button>
            </div>
        </div>
    `).join('');
}

function displayFeaturedProducts() {
    const featuredProducts = products.slice(0, 3); // Show first 3 products as featured
    displayProducts(featuredProducts, 'featured-products');
}

// Search and filter functionality
function filterProducts() {
    const searchTerm = document.getElementById('search-input')?.value.toLowerCase() || '';
    const categoryFilter = document.getElementById('category-filter')?.value || '';
    const priceFilter = document.getElementById('price-filter')?.value || '';
    const colorFilter = document.getElementById('color-filter')?.value || '';

    let filteredProducts = products.filter(product => {
        const matchesSearch = product.name.toLowerCase().includes(searchTerm) || 
                            product.description.toLowerCase().includes(searchTerm);
        const matchesCategory = !categoryFilter || product.category === categoryFilter;
        const matchesColor = !colorFilter || product.color === colorFilter;
        
        let matchesPrice = true;
        if (priceFilter) {
            const [min, max] = priceFilter.split('-').map(Number);
            if (max) {
                matchesPrice = product.price >= min && product.price < max;
            } else {
                matchesPrice = product.price >= min;
            }
        }

        return matchesSearch && matchesCategory && matchesColor && matchesPrice;
    });

    displayProducts(filteredProducts);
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
function handleContactForm(event) {
    event.preventDefault();
    const formData = new FormData(event.target);
    const data = Object.fromEntries(formData);
    
    // Here you would typically send the data to your server
    console.log('Contact form submitted:', data);
    
    // Show success message
    alert('Thank you for your message! We\'ll get back to you soon.');
    event.target.reset();
}

// Smooth scrolling for navigation links
function smoothScrollTo(elementId) {
    const element = document.getElementById(elementId);
    if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
    }
}

// Initialize page-specific functionality
document.addEventListener('DOMContentLoaded', function() {
    // Update cart display if on cart page
    if (window.location.pathname.includes('cart.html')) {
        cart.updateCartDisplay();
    }

    // Display featured products on homepage
    if (window.location.pathname.includes('index.html') || window.location.pathname === '/') {
        displayFeaturedProducts();
    }

    // Display all products on shop page
    if (window.location.pathname.includes('shop.html')) {
        displayProducts();
        
        // Add event listeners for search and filters
        const searchInput = document.getElementById('search-input');
        const categoryFilter = document.getElementById('category-filter');
        const priceFilter = document.getElementById('price-filter');
        const colorFilter = document.getElementById('color-filter');

        if (searchInput) searchInput.addEventListener('input', filterProducts);
        if (categoryFilter) categoryFilter.addEventListener('change', filterProducts);
        if (priceFilter) priceFilter.addEventListener('change', filterProducts);
        if (colorFilter) colorFilter.addEventListener('change', filterProducts);
    }

    // Admin dashboard functionality
    if (window.location.pathname.includes('admin.html')) {
        admin.displayProductsTable();
        
        // Handle add product form
        const addProductForm = document.getElementById('addProductForm');
        if (addProductForm) {
            addProductForm.addEventListener('submit', function(event) {
                event.preventDefault();
                const formData = new FormData(event.target);
                const productData = Object.fromEntries(formData);
                
                admin.addProduct(productData);
                event.target.reset();
                alert('Product added successfully!');
            });
        }
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