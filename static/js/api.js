// API Client for Sage Empire
class SageAPI {
    constructor() {
        this.baseURL = '';  // Use relative URLs for same-origin requests
        this.defaultHeaders = {
            'Content-Type': 'application/json',
        };
    }

    async request(endpoint, options = {}) {
        const url = `${this.baseURL}${endpoint}`;
        const config = {
            credentials: 'include', // Include cookies for session management
            headers: { ...this.defaultHeaders, ...options.headers },
            ...options
        };

        try {
            const response = await fetch(url, config);
            
            // Handle different response types
            const contentType = response.headers.get('content-type');
            let data;
            
            if (contentType && contentType.includes('application/json')) {
                data = await response.json();
            } else {
                data = await response.text();
            }

            if (!response.ok) {
                throw new Error(data.error || data || `HTTP ${response.status}`);
            }

            return data;
        } catch (error) {
            console.error('API Request failed:', error);
            throw error;
        }
    }

    // Authentication endpoints
    async register(userData) {
        return this.request('/api/auth/register', {
            method: 'POST',
            body: JSON.stringify(userData)
        });
    }

    async login(credentials) {
        return this.request('/api/auth/login', {
            method: 'POST',
            body: JSON.stringify(credentials)
        });
    }

    async logout() {
        return this.request('/api/auth/logout', {
            method: 'POST'
        });
    }

    async getCurrentUser() {
        return this.request('/api/auth/me');
    }

    async updateProfile(profileData) {
        return this.request('/api/auth/update-profile', {
            method: 'PUT',
            body: JSON.stringify(profileData)
        });
    }

    async changePassword(passwordData) {
        return this.request('/api/auth/change-password', {
            method: 'POST',
            body: JSON.stringify(passwordData)
        });
    }

    // Posts endpoints
    async getPosts(params = {}) {
        const queryString = new URLSearchParams(params).toString();
        return this.request(`/api/posts${queryString ? '?' + queryString : ''}`);
    }

    async getPost(postId) {
        return this.request(`/api/posts/${postId}`);
    }

    async createPost(postData) {
        return this.request('/api/posts', {
            method: 'POST',
            body: JSON.stringify(postData)
        });
    }

    async updatePost(postId, postData) {
        return this.request(`/api/posts/${postId}`, {
            method: 'PUT',
            body: JSON.stringify(postData)
        });
    }

    async deletePost(postId) {
        return this.request(`/api/posts/${postId}`, {
            method: 'DELETE'
        });
    }

    async likePost(postId) {
        return this.request(`/api/posts/${postId}/like`, {
            method: 'POST'
        });
    }

    async unlikePost(postId) {
        return this.request(`/api/posts/${postId}/unlike`, {
            method: 'DELETE'
        });
    }

    async getComments(postId, params = {}) {
        const queryString = new URLSearchParams(params).toString();
        return this.request(`/api/posts/${postId}/comments${queryString ? '?' + queryString : ''}`);
    }

    async createComment(postId, commentData) {
        return this.request(`/api/posts/${postId}/comments`, {
            method: 'POST',
            body: JSON.stringify(commentData)
        });
    }

    // Shop endpoints
    async getProducts(params = {}) {
        const queryString = new URLSearchParams(params).toString();
        return this.request(`/api/shop/products${queryString ? '?' + queryString : ''}`);
    }

    async getProduct(productId) {
        return this.request(`/api/shop/products/${productId}`);
    }

    async getCategories() {
        return this.request('/api/shop/categories');
    }

    async addToCart(productId, quantity = 1) {
        return this.request('/api/shop/cart', {
            method: 'POST',
            body: JSON.stringify({ product_id: productId, quantity })
        });
    }

    async getCart() {
        return this.request('/api/shop/cart');
    }

    async updateCartItem(productId, quantity) {
        return this.request(`/api/shop/cart/${productId}`, {
            method: 'PUT',
            body: JSON.stringify({ quantity })
        });
    }

    async removeFromCart(productId) {
        return this.request(`/api/shop/cart/${productId}`, {
            method: 'DELETE'
        });
    }

    async createOrder() {
        return this.request('/api/shop/orders', {
            method: 'POST'
        });
    }

    async getOrders(params = {}) {
        const queryString = new URLSearchParams(params).toString();
        return this.request(`/api/shop/orders${queryString ? '?' + queryString : ''}`);
    }

    async getOrder(orderId) {
        return this.request(`/api/shop/orders/${orderId}`);
    }

    // User endpoints
    async getUsers(params = {}) {
        const queryString = new URLSearchParams(params).toString();
        return this.request(`/api/users${queryString ? '?' + queryString : ''}`);
    }

    async getUser(userId) {
        return this.request(`/api/users/${userId}`);
    }

    // Health check
    async healthCheck() {
        return this.request('/api/health');
    }
}

// Create global API instance
window.sageAPI = new SageAPI();

// Utility functions for API responses
window.handleAPIError = function(error, fallbackMessage = 'An error occurred') {
    console.error('API Error:', error);
    
    let message = fallbackMessage;
    if (typeof error === 'string') {
        message = error;
    } else if (error.message) {
        message = error.message;
    }
    
    // Show error notification
    showNotification(message, 'error');
    return message;
};

window.showNotification = function(message, type = 'info', duration = 5000) {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
        <div class="notification-content">
            <span class="notification-message">${message}</span>
            <button class="notification-close">&times;</button>
        </div>
    `;
    
    // Add to page
    document.body.appendChild(notification);
    
    // Add styles if not already present
    if (!document.querySelector('#notification-styles')) {
        const styles = document.createElement('style');
        styles.id = 'notification-styles';
        styles.textContent = `
            .notification {
                position: fixed;
                top: 20px;
                right: 20px;
                z-index: 10000;
                max-width: 400px;
                padding: 16px;
                border-radius: 8px;
                box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
                transform: translateX(100%);
                transition: transform 0.3s ease-in-out;
            }
            .notification.show {
                transform: translateX(0);
            }
            .notification-info {
                background: #3B82F6;
                color: white;
            }
            .notification-success {
                background: #10B981;
                color: white;
            }
            .notification-error {
                background: #EF4444;
                color: white;
            }
            .notification-warning {
                background: #F59E0B;
                color: white;
            }
            .notification-content {
                display: flex;
                justify-content: space-between;
                align-items: center;
                gap: 12px;
            }
            .notification-close {
                background: none;
                border: none;
                color: inherit;
                font-size: 18px;
                cursor: pointer;
                padding: 0;
                width: 24px;
                height: 24px;
                display: flex;
                align-items: center;
                justify-content: center;
                border-radius: 50%;
                transition: background-color 0.2s;
            }
            .notification-close:hover {
                background: rgba(255, 255, 255, 0.2);
            }
        `;
        document.head.appendChild(styles);
    }
    
    // Show notification
    setTimeout(() => notification.classList.add('show'), 100);
    
    // Auto-hide
    const hideTimeout = setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => notification.remove(), 300);
    }, duration);
    
    // Manual close
    notification.querySelector('.notification-close').addEventListener('click', () => {
        clearTimeout(hideTimeout);
        notification.classList.remove('show');
        setTimeout(() => notification.remove(), 300);
    });
};

// Loading state management
window.setLoading = function(element, isLoading, loadingText = 'Loading...') {
    if (isLoading) {
        element.disabled = true;
        element.dataset.originalText = element.textContent;
        element.innerHTML = `<i class="fas fa-spinner fa-spin"></i> ${loadingText}`;
    } else {
        element.disabled = false;
        element.textContent = element.dataset.originalText || element.textContent;
    }
};

// Format currency
window.formatCurrency = function(amount) {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD'
    }).format(amount);
};

// Format date
window.formatDate = function(dateString) {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    }).format(date);
};

// Debounce function for search
window.debounce = function(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
};

