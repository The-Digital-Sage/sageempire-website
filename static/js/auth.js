// Authentication Management for Sage Empire
class AuthManager {
    constructor() {
        this.currentUser = null;
        this.isAuthenticated = false;
        this.authModal = null;
        this.isLoginMode = true;
        
        this.init();
    }

    init() {
        this.setupAuthModal();
        this.setupEventListeners();
        this.checkAuthStatus();
    }

    setupAuthModal() {
        this.authModal = document.getElementById('auth-modal');
        this.authForm = document.getElementById('auth-form');
        this.authModalTitle = document.getElementById('auth-modal-title');
        this.authSubmitBtn = document.getElementById('auth-submit');
        this.authSwitchBtn = document.getElementById('auth-switch-btn');
        this.authSwitchText = document.getElementById('auth-switch-text');
        this.authModalClose = document.getElementById('auth-modal-close');
    }

    setupEventListeners() {
        // Modal triggers
        document.getElementById('login-btn')?.addEventListener('click', () => {
            this.showAuthModal(true); // Login mode
        });

        document.getElementById('register-btn')?.addEventListener('click', () => {
            this.showAuthModal(false); // Register mode
        });

        document.getElementById('hero-join-btn')?.addEventListener('click', () => {
            this.showAuthModal(false); // Register mode
        });

        // Modal close
        this.authModalClose?.addEventListener('click', () => {
            this.hideAuthModal();
        });

        this.authModal?.addEventListener('click', (e) => {
            if (e.target === this.authModal) {
                this.hideAuthModal();
            }
        });

        // Form submission
        this.authForm?.addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleAuthSubmit();
        });

        // Switch between login/register
        this.authSwitchBtn?.addEventListener('click', () => {
            this.toggleAuthMode();
        });

        // Logout
        document.getElementById('logout-btn')?.addEventListener('click', (e) => {
            e.preventDefault();
            this.logout();
        });

        // User menu toggle
        const userAvatar = document.getElementById('user-avatar');
        if (userAvatar) {
            userAvatar.addEventListener('click', () => {
                const dropdown = document.getElementById('user-dropdown');
                dropdown.style.opacity = dropdown.style.opacity === '1' ? '0' : '1';
                dropdown.style.visibility = dropdown.style.visibility === 'visible' ? 'hidden' : 'visible';
            });
        }
    }

    async checkAuthStatus() {
        try {
            const response = await sageAPI.getCurrentUser();
            this.setUser(response.user);
        } catch (error) {
            this.setUser(null);
        }
    }

    setUser(user) {
        this.currentUser = user;
        this.isAuthenticated = !!user;
        this.updateUI();
    }

    updateUI() {
        const loginBtn = document.getElementById('login-btn');
        const registerBtn = document.getElementById('register-btn');
        const userMenu = document.getElementById('user-menu');
        const userAvatar = document.getElementById('user-avatar');

        if (this.isAuthenticated) {
            // Hide auth buttons
            loginBtn?.classList.add('hidden');
            registerBtn?.classList.add('hidden');
            
            // Show user menu
            userMenu?.classList.remove('hidden');
            
            // Update avatar
            if (userAvatar && this.currentUser.avatar_url) {
                userAvatar.src = this.currentUser.avatar_url;
            }

            // Update any user-specific content
            this.updateUserContent();
        } else {
            // Show auth buttons
            loginBtn?.classList.remove('hidden');
            registerBtn?.classList.remove('hidden');
            
            // Hide user menu
            userMenu?.classList.add('hidden');
        }
    }

    updateUserContent() {
        // Update any elements that show user information
        const userElements = document.querySelectorAll('[data-user-field]');
        userElements.forEach(element => {
            const field = element.dataset.userField;
            if (this.currentUser && this.currentUser[field]) {
                element.textContent = this.currentUser[field];
            }
        });

        // Update subscription tier indicators
        const tierElements = document.querySelectorAll('[data-tier-access]');
        tierElements.forEach(element => {
            const requiredTier = element.dataset.tierAccess;
            const hasAccess = this.hasSubscriptionAccess(requiredTier);
            element.classList.toggle('tier-locked', !hasAccess);
        });
    }

    hasSubscriptionAccess(requiredTier) {
        if (!this.currentUser) return false;
        
        const tierHierarchy = {
            'free': 0,
            'seeker': 1,
            'mystic': 2,
            'sage': 3,
            'oracle': 4
        };
        
        const userLevel = tierHierarchy[this.currentUser.subscription_tier] || 0;
        const requiredLevel = tierHierarchy[requiredTier] || 0;
        
        return userLevel >= requiredLevel;
    }

    showAuthModal(isLogin = true) {
        this.isLoginMode = isLogin;
        this.updateAuthModal();
        this.authModal.classList.add('active');
        document.body.style.overflow = 'hidden';
    }

    hideAuthModal() {
        this.authModal.classList.remove('active');
        document.body.style.overflow = '';
        this.authForm.reset();
    }

    updateAuthModal() {
        const emailField = document.getElementById('auth-email');
        const emailGroup = emailField?.parentElement;

        if (this.isLoginMode) {
            this.authModalTitle.textContent = 'Welcome Back';
            this.authSubmitBtn.textContent = 'Sign In';
            this.authSwitchText.textContent = 'New to the Empire?';
            this.authSwitchBtn.textContent = 'Join Now';
            emailGroup?.classList.add('hidden');
        } else {
            this.authModalTitle.textContent = 'Join the Empire';
            this.authSubmitBtn.textContent = 'Create Account';
            this.authSwitchText.textContent = 'Already a member?';
            this.authSwitchBtn.textContent = 'Sign In';
            emailGroup?.classList.remove('hidden');
        }
    }

    toggleAuthMode() {
        this.isLoginMode = !this.isLoginMode;
        this.updateAuthModal();
        this.authForm.reset();
    }

    async handleAuthSubmit() {
        const formData = new FormData(this.authForm);
        const data = Object.fromEntries(formData);

        // Validate form
        if (!data.username || !data.password) {
            showNotification('Please fill in all required fields', 'error');
            return;
        }

        if (!this.isLoginMode && !data.email) {
            showNotification('Email is required for registration', 'error');
            return;
        }

        setLoading(this.authSubmitBtn, true, this.isLoginMode ? 'Signing In...' : 'Creating Account...');

        try {
            let response;
            if (this.isLoginMode) {
                response = await sageAPI.login({
                    username: data.username,
                    password: data.password
                });
            } else {
                response = await sageAPI.register({
                    username: data.username,
                    email: data.email,
                    password: data.password
                });
            }

            this.setUser(response.user);
            this.hideAuthModal();
            showNotification(response.message || 'Welcome to the Empire!', 'success');

            // Refresh page content that might be user-specific
            this.refreshUserContent();

        } catch (error) {
            handleAPIError(error, this.isLoginMode ? 'Login failed' : 'Registration failed');
        } finally {
            setLoading(this.authSubmitBtn, false);
        }
    }

    async logout() {
        try {
            await sageAPI.logout();
            this.setUser(null);
            showNotification('Logged out successfully', 'success');
            
            // Redirect to home or refresh
            window.location.hash = '#home';
            this.refreshUserContent();
            
        } catch (error) {
            handleAPIError(error, 'Logout failed');
        }
    }

    refreshUserContent() {
        // Refresh any content that depends on authentication status
        if (window.communityManager) {
            window.communityManager.loadPosts();
        }
        if (window.shopManager) {
            window.shopManager.loadProducts();
            window.shopManager.updateCartCount();
        }
    }

    // Profile management methods
    async updateProfile(profileData) {
        try {
            const response = await sageAPI.updateProfile(profileData);
            this.setUser(response.user);
            showNotification('Profile updated successfully', 'success');
            return response;
        } catch (error) {
            handleAPIError(error, 'Failed to update profile');
            throw error;
        }
    }

    async changePassword(passwordData) {
        try {
            const response = await sageAPI.changePassword(passwordData);
            showNotification('Password changed successfully', 'success');
            return response;
        } catch (error) {
            handleAPIError(error, 'Failed to change password');
            throw error;
        }
    }

    // Subscription helpers
    getSubscriptionTier() {
        return this.currentUser?.subscription_tier || 'free';
    }

    isSubscriber() {
        return this.getSubscriptionTier() !== 'free';
    }

    canAccessTier(tier) {
        return this.hasSubscriptionAccess(tier);
    }

    // Utility methods
    requireAuth(callback) {
        if (this.isAuthenticated) {
            callback();
        } else {
            this.showAuthModal(true);
            showNotification('Please sign in to continue', 'warning');
        }
    }

    requireSubscription(tier, callback) {
        if (!this.isAuthenticated) {
            this.showAuthModal(true);
            showNotification('Please sign in to continue', 'warning');
            return;
        }

        if (this.hasSubscriptionAccess(tier)) {
            callback();
        } else {
            showNotification(`${tier.charAt(0).toUpperCase() + tier.slice(1)} subscription required`, 'warning');
            // Could redirect to subscription page
            window.location.hash = '#tiers';
        }
    }
}

// Initialize authentication manager
document.addEventListener('DOMContentLoaded', () => {
    window.authManager = new AuthManager();
});

// Export for use in other modules
window.AuthManager = AuthManager;

