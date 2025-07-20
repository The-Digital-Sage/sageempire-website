// Shop Management for Sage Empire
class ShopManager {
    constructor() {
        this.products = [];
        this.categories = [];
        this.cart = [];
        this.currentCategory = 'all';
        this.currentPage = 1;
        this.isLoading = false;
        
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.loadCategories();
        this.loadProducts();
        this.updateCartCount();
    }

    setupEventListeners() {
        // Category filters
        const categoryFilters = document.querySelectorAll('.shop-filters .filter-btn');
        categoryFilters.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const category = e.target.dataset.category;
                this.filterByCategory(category);
            });
        });

        // Cart icon
        document.getElementById('cart-icon')?.addEventListener('click', () => {
            this.showCartModal();
        });

        // Cart modal
        document.getElementById('cart-modal-close')?.addEventListener('click', () => {
            this.hideCartModal();
        });

        document.getElementById('cart-modal')?.addEventListener('click', (e) => {
            if (e.target.id === 'cart-modal') {
                this.hideCartModal();
            }
        });

        document.getElementById('continue-shopping')?.addEventListener('click', () => {
            this.hideCartModal();
        });

        document.getElementById('checkout-btn')?.addEventListener('click', () => {
            this.handleCheckout();
        });

        // Subscription tier buttons
        const tierButtons = document.querySelectorAll('.btn-tier');
        tierButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const tier = e.target.dataset.tier;
                this.handleSubscription(tier);
            });
        });
    }

    async loadCategories() {
        try {
            const response = await sageAPI.getCategories();
            this.categories = response.categories;
        } catch (error) {
            console.error('Failed to load categories:', error);
        }
    }

    async loadProducts(category = 'all', page = 1) {
        if (this.isLoading) return;
        
        this.isLoading = true;
        const container = document.getElementById('products-grid');
        
        if (page === 1) {
            container.innerHTML = '<div class="loading-spinner"><i class="fas fa-spinner fa-spin"></i><span>Loading treasures...</span></div>';
        }

        try {
            const params = { page, per_page: 12 };
            if (category !== 'all') {
                params.category = category;
            }

            const response = await sageAPI.getProducts(params);
            
            if (page === 1) {
                this.products = response.products;
                this.renderProducts();
            } else {
                this.products = [...this.products, ...response.products];
                this.appendProducts(response.products);
            }

            this.currentPage = page;
            
        } catch (error) {
            handleAPIError(error, 'Failed to load products');
            container.innerHTML = '<div class="error-message">Failed to load products. Please try again.</div>';
        } finally {
            this.isLoading = false;
        }
    }

    renderProducts() {
        const container = document.getElementById('products-grid');
        
        if (this.products.length === 0) {
            container.innerHTML = '<div class="no-products">No products found in this category.</div>';
            return;
        }

        container.innerHTML = this.products.map(product => this.createProductCard(product)).join('');
        this.attachProductEventListeners();
    }

    appendProducts(products) {
        const container = document.getElementById('products-grid');
        const newProductsHTML = products.map(product => this.createProductCard(product)).join('');
        container.insertAdjacentHTML('beforeend', newProductsHTML);
        this.attachProductEventListeners();
    }

    createProductCard(product) {
        const tierBadge = product.required_tier !== 'free' 
            ? `<div class="product-tier-badge">${product.required_tier.charAt(0).toUpperCase() + product.required_tier.slice(1)}</div>`
            : '';

        const hasAccess = !window.authManager || window.authManager.hasSubscriptionAccess(product.required_tier);
        const lockOverlay = !hasAccess ? '<div class="product-lock-overlay"><i class="fas fa-lock"></i></div>' : '';

        return `
            <div class="product-card ${!hasAccess ? 'product-locked' : ''}" data-product-id="${product.id}">
                <div class="product-image">
                    <img src="${product.image_url || '/assets/products/placeholder.jpg'}" alt="${product.name}" loading="lazy">
                    ${tierBadge}
                    ${lockOverlay}
                </div>
                <div class="product-info">
                    <h3 class="product-name">${product.name}</h3>
                    <p class="product-description">${product.description}</p>
                    <div class="product-price">${formatCurrency(product.price)}</div>
                    <div class="product-actions">
                        ${hasAccess 
                            ? `<button class="btn btn-primary add-to-cart-btn" data-product-id="${product.id}">
                                 <i class="fas fa-cart-plus"></i> Add to Cart
                               </button>`
                            : `<button class="btn btn-secondary" onclick="window.location.hash='#tiers'">
                                 <i class="fas fa-lock"></i> Upgrade Required
                               </button>`
                        }
                        <button class="btn btn-secondary view-product-btn" data-product-id="${product.id}">
                            <i class="fas fa-eye"></i> View
                        </button>
                    </div>
                </div>
            </div>
        `;
    }

    attachProductEventListeners() {
        // Add to cart buttons
        document.querySelectorAll('.add-to-cart-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const productId = parseInt(btn.dataset.productId);
                this.addToCart(productId);
            });
        });

        // View product buttons
        document.querySelectorAll('.view-product-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const productId = parseInt(btn.dataset.productId);
                this.viewProduct(productId);
            });
        });

        // Product card clicks
        document.querySelectorAll('.product-card').forEach(card => {
            card.addEventListener('click', () => {
                const productId = parseInt(card.dataset.productId);
                this.viewProduct(productId);
            });
        });
    }

    filterByCategory(category) {
        this.currentCategory = category;
        this.currentPage = 1;
        
        // Update filter buttons
        document.querySelectorAll('.shop-filters .filter-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.category === category);
        });

        this.loadProducts(category, 1);
    }

    async addToCart(productId, quantity = 1) {
        if (!window.authManager?.isAuthenticated) {
            window.authManager.showAuthModal(true);
            showNotification('Please sign in to add items to cart', 'warning');
            return;
        }

        const btn = document.querySelector(`[data-product-id="${productId}"].add-to-cart-btn`);
        if (btn) setLoading(btn, true, 'Adding...');

        try {
            await sageAPI.addToCart(productId, quantity);
            showNotification('Item added to cart!', 'success');
            this.updateCartCount();
        } catch (error) {
            handleAPIError(error, 'Failed to add item to cart');
        } finally {
            if (btn) setLoading(btn, false);
        }
    }

    async viewProduct(productId) {
        try {
            const response = await sageAPI.getProduct(productId);
            this.showProductModal(response.product);
        } catch (error) {
            handleAPIError(error, 'Failed to load product details');
        }
    }

    showProductModal(product) {
        // Create and show product detail modal
        const modal = document.createElement('div');
        modal.className = 'modal active';
        modal.id = 'product-modal';
        
        const hasAccess = !window.authManager || window.authManager.hasSubscriptionAccess(product.required_tier);
        
        modal.innerHTML = `
            <div class="modal-content modal-large">
                <div class="modal-header">
                    <h3>${product.name}</h3>
                    <button class="modal-close">&times;</button>
                </div>
                <div class="modal-body">
                    <div class="product-detail-grid">
                        <div class="product-detail-image">
                            <img src="${product.image_url || '/assets/products/placeholder.jpg'}" alt="${product.name}">
                        </div>
                        <div class="product-detail-info">
                            <p class="product-detail-description">${product.description}</p>
                            <div class="product-detail-price">${formatCurrency(product.price)}</div>
                            ${product.required_tier !== 'free' 
                                ? `<div class="product-tier-requirement">Requires: ${product.required_tier.charAt(0).toUpperCase() + product.required_tier.slice(1)} Tier</div>`
                                : ''
                            }
                            <div class="product-detail-actions">
                                ${hasAccess 
                                    ? `<button class="btn btn-primary btn-large" onclick="shopManager.addToCart(${product.id})">
                                         <i class="fas fa-cart-plus"></i> Add to Cart
                                       </button>`
                                    : `<button class="btn btn-secondary btn-large" onclick="window.location.hash='#tiers'">
                                         <i class="fas fa-lock"></i> Upgrade to Access
                                       </button>`
                                }
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(modal);
        document.body.style.overflow = 'hidden';

        // Close modal
        modal.querySelector('.modal-close').addEventListener('click', () => {
            modal.remove();
            document.body.style.overflow = '';
        });

        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.remove();
                document.body.style.overflow = '';
            }
        });
    }

    async updateCartCount() {
        if (!window.authManager?.isAuthenticated) {
            document.getElementById('cart-count').textContent = '0';
            return;
        }

        try {
            const response = await sageAPI.getCart();
            const count = response.cart_items.reduce((sum, item) => sum + item.quantity, 0);
            document.getElementById('cart-count').textContent = count.toString();
        } catch (error) {
            console.error('Failed to update cart count:', error);
        }
    }

    async showCartModal() {
        if (!window.authManager?.isAuthenticated) {
            window.authManager.showAuthModal(true);
            showNotification('Please sign in to view cart', 'warning');
            return;
        }

        const modal = document.getElementById('cart-modal');
        const cartItems = document.getElementById('cart-items');
        const cartTotal = document.getElementById('cart-total');

        modal.classList.add('active');
        document.body.style.overflow = 'hidden';

        cartItems.innerHTML = '<div class="loading-spinner"><i class="fas fa-spinner fa-spin"></i><span>Loading cart...</span></div>';

        try {
            const response = await sageAPI.getCart();
            
            if (response.cart_items.length === 0) {
                cartItems.innerHTML = '<div class="empty-cart">Your cart is empty</div>';
                cartTotal.textContent = '$0.00';
                return;
            }

            cartItems.innerHTML = response.cart_items.map(item => this.createCartItem(item)).join('');
            cartTotal.textContent = formatCurrency(response.total_amount);
            
            this.attachCartEventListeners();

        } catch (error) {
            handleAPIError(error, 'Failed to load cart');
            cartItems.innerHTML = '<div class="error-message">Failed to load cart</div>';
        }
    }

    createCartItem(item) {
        return `
            <div class="cart-item" data-product-id="${item.product.id}">
                <div class="cart-item-image">
                    <img src="${item.product.image_url || '/assets/products/placeholder.jpg'}" alt="${item.product.name}">
                </div>
                <div class="cart-item-info">
                    <h4 class="cart-item-name">${item.product.name}</h4>
                    <p class="cart-item-price">${formatCurrency(item.product.price)}</p>
                </div>
                <div class="cart-item-quantity">
                    <button class="quantity-btn quantity-decrease" data-product-id="${item.product.id}">-</button>
                    <span class="quantity-value">${item.quantity}</span>
                    <button class="quantity-btn quantity-increase" data-product-id="${item.product.id}">+</button>
                </div>
                <div class="cart-item-total">
                    ${formatCurrency(item.item_total)}
                </div>
                <button class="cart-item-remove" data-product-id="${item.product.id}">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        `;
    }

    attachCartEventListeners() {
        // Quantity controls
        document.querySelectorAll('.quantity-decrease').forEach(btn => {
            btn.addEventListener('click', () => {
                const productId = parseInt(btn.dataset.productId);
                const currentQty = parseInt(btn.nextElementSibling.textContent);
                if (currentQty > 1) {
                    this.updateCartQuantity(productId, currentQty - 1);
                }
            });
        });

        document.querySelectorAll('.quantity-increase').forEach(btn => {
            btn.addEventListener('click', () => {
                const productId = parseInt(btn.dataset.productId);
                const currentQty = parseInt(btn.previousElementSibling.textContent);
                this.updateCartQuantity(productId, currentQty + 1);
            });
        });

        // Remove items
        document.querySelectorAll('.cart-item-remove').forEach(btn => {
            btn.addEventListener('click', () => {
                const productId = parseInt(btn.dataset.productId);
                this.removeFromCart(productId);
            });
        });
    }

    async updateCartQuantity(productId, quantity) {
        try {
            await sageAPI.updateCartItem(productId, quantity);
            this.showCartModal(); // Refresh cart display
            this.updateCartCount();
        } catch (error) {
            handleAPIError(error, 'Failed to update cart');
        }
    }

    async removeFromCart(productId) {
        try {
            await sageAPI.removeFromCart(productId);
            this.showCartModal(); // Refresh cart display
            this.updateCartCount();
            showNotification('Item removed from cart', 'success');
        } catch (error) {
            handleAPIError(error, 'Failed to remove item');
        }
    }

    hideCartModal() {
        document.getElementById('cart-modal').classList.remove('active');
        document.body.style.overflow = '';
    }

    async handleCheckout() {
        if (!window.authManager?.isAuthenticated) {
            window.authManager.showAuthModal(true);
            return;
        }

        const checkoutBtn = document.getElementById('checkout-btn');
        setLoading(checkoutBtn, true, 'Processing...');

        try {
            const response = await sageAPI.createOrder();
            showNotification('Order created successfully!', 'success');
            this.hideCartModal();
            this.updateCartCount();
            
            // Could redirect to order confirmation page
            showNotification(`Order #${response.order.id} has been placed`, 'success');
            
        } catch (error) {
            handleAPIError(error, 'Checkout failed');
        } finally {
            setLoading(checkoutBtn, false);
        }
    }

    handleSubscription(tier) {
        if (!window.authManager?.isAuthenticated) {
            window.authManager.showAuthModal(false);
            showNotification('Please create an account to subscribe', 'warning');
            return;
        }

        // For now, show a message about subscription
        // In a real implementation, this would integrate with Stripe
        showNotification(`${tier.charAt(0).toUpperCase() + tier.slice(1)} subscription coming soon!`, 'info');
    }
}

// Initialize shop manager
document.addEventListener('DOMContentLoaded', () => {
    window.shopManager = new ShopManager();
});

// Export for use in other modules
window.ShopManager = ShopManager;

