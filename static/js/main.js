// Main Application Logic for Sage Empire
class SageEmpireApp {
    constructor() {
        this.currentSection = 'home';
        this.isNavOpen = false;
        
        this.init();
    }

    init() {
        this.setupNavigation();
        this.setupScrollEffects();
        this.setupAnimations();
        this.handleInitialRoute();
        this.setupMobileMenu();
    }

    setupNavigation() {
        // Smooth scrolling for navigation links
        document.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const targetId = link.getAttribute('href').substring(1);
                this.navigateToSection(targetId);
            });
        });

        // Handle hash changes
        window.addEventListener('hashchange', () => {
            this.handleRouteChange();
        });

        // Hero explore button
        document.getElementById('hero-explore-btn')?.addEventListener('click', () => {
            this.navigateToSection('community');
        });

        // Scroll indicator
        document.querySelector('.hero-scroll-indicator')?.addEventListener('click', () => {
            this.navigateToSection('tiers');
        });
    }

    setupScrollEffects() {
        // Navbar background on scroll
        window.addEventListener('scroll', () => {
            const navbar = document.getElementById('navbar');
            if (window.scrollY > 100) {
                navbar.style.background = 'rgba(49, 46, 129, 0.98)';
                navbar.style.backdropFilter = 'blur(20px)';
            } else {
                navbar.style.background = 'rgba(49, 46, 129, 0.95)';
                navbar.style.backdropFilter = 'blur(10px)';
            }
        });

        // Intersection Observer for section highlighting
        const sections = document.querySelectorAll('section[id]');
        const navLinks = document.querySelectorAll('.nav-link');

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const sectionId = entry.target.id;
                    this.updateActiveNavLink(sectionId);
                }
            });
        }, {
            threshold: 0.3,
            rootMargin: '-100px 0px -100px 0px'
        });

        sections.forEach(section => observer.observe(section));
    }

    setupAnimations() {
        // Animate elements on scroll
        const animateOnScroll = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('animate-in');
                }
            });
        }, {
            threshold: 0.1,
            rootMargin: '0px 0px -50px 0px'
        });

        // Add animation classes to elements
        document.querySelectorAll('.tier-card, .product-card, .post-card').forEach(el => {
            el.classList.add('animate-on-scroll');
            animateOnScroll.observe(el);
        });

        // Add CSS for animations
        this.addAnimationStyles();
    }

    addAnimationStyles() {
        if (document.getElementById('animation-styles')) return;

        const styles = document.createElement('style');
        styles.id = 'animation-styles';
        styles.textContent = `
            .animate-on-scroll {
                opacity: 0;
                transform: translateY(30px);
                transition: opacity 0.6s ease-out, transform 0.6s ease-out;
            }
            
            .animate-on-scroll.animate-in {
                opacity: 1;
                transform: translateY(0);
            }
            
            .tier-card.animate-on-scroll {
                transition-delay: 0.1s;
            }
            
            .tier-card:nth-child(2).animate-on-scroll {
                transition-delay: 0.2s;
            }
            
            .tier-card:nth-child(3).animate-on-scroll {
                transition-delay: 0.3s;
            }
            
            .tier-card:nth-child(4).animate-on-scroll {
                transition-delay: 0.4s;
            }
            
            .product-card.animate-on-scroll {
                transition-delay: calc(var(--index, 0) * 0.1s);
            }
            
            @media (prefers-reduced-motion: reduce) {
                .animate-on-scroll {
                    opacity: 1;
                    transform: none;
                    transition: none;
                }
            }
        `;
        document.head.appendChild(styles);
    }

    setupMobileMenu() {
        const navToggle = document.getElementById('nav-toggle');
        const navMenu = document.getElementById('nav-menu');

        navToggle?.addEventListener('click', () => {
            this.toggleMobileMenu();
        });

        // Close mobile menu when clicking outside
        document.addEventListener('click', (e) => {
            if (this.isNavOpen && !navToggle.contains(e.target) && !navMenu.contains(e.target)) {
                this.closeMobileMenu();
            }
        });

        // Close mobile menu when clicking nav links
        document.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', () => {
                this.closeMobileMenu();
            });
        });
    }

    toggleMobileMenu() {
        const navMenu = document.getElementById('nav-menu');
        const navToggle = document.getElementById('nav-toggle');
        
        this.isNavOpen = !this.isNavOpen;
        
        if (this.isNavOpen) {
            navMenu.style.display = 'flex';
            navMenu.style.position = 'fixed';
            navMenu.style.top = '80px';
            navMenu.style.left = '0';
            navMenu.style.right = '0';
            navMenu.style.background = 'rgba(49, 46, 129, 0.98)';
            navMenu.style.flexDirection = 'column';
            navMenu.style.padding = '2rem';
            navMenu.style.zIndex = '999';
            navToggle.classList.add('active');
        } else {
            this.closeMobileMenu();
        }
    }

    closeMobileMenu() {
        const navMenu = document.getElementById('nav-menu');
        const navToggle = document.getElementById('nav-toggle');
        
        this.isNavOpen = false;
        navMenu.style.display = '';
        navMenu.style.position = '';
        navMenu.style.top = '';
        navMenu.style.left = '';
        navMenu.style.right = '';
        navMenu.style.background = '';
        navMenu.style.flexDirection = '';
        navMenu.style.padding = '';
        navMenu.style.zIndex = '';
        navToggle.classList.remove('active');
    }

    navigateToSection(sectionId) {
        const section = document.getElementById(sectionId);
        if (!section) return;

        // Update URL hash
        history.pushState(null, null, `#${sectionId}`);
        
        // Smooth scroll to section
        const offsetTop = section.offsetTop - 80; // Account for fixed navbar
        window.scrollTo({
            top: offsetTop,
            behavior: 'smooth'
        });

        this.currentSection = sectionId;
        this.updateActiveNavLink(sectionId);
    }

    updateActiveNavLink(sectionId) {
        document.querySelectorAll('.nav-link').forEach(link => {
            const href = link.getAttribute('href');
            if (href === `#${sectionId}`) {
                link.classList.add('active');
            } else {
                link.classList.remove('active');
            }
        });
    }

    handleInitialRoute() {
        const hash = window.location.hash.substring(1);
        if (hash) {
            setTimeout(() => {
                this.navigateToSection(hash);
            }, 100);
        }
    }

    handleRouteChange() {
        const hash = window.location.hash.substring(1);
        if (hash && hash !== this.currentSection) {
            this.navigateToSection(hash);
        }
    }

    // Utility methods
    showLoading(message = 'Loading...') {
        const loading = document.createElement('div');
        loading.id = 'global-loading';
        loading.className = 'global-loading';
        loading.innerHTML = `
            <div class="loading-content">
                <div class="loading-spinner">
                    <i class="fas fa-spinner fa-spin"></i>
                </div>
                <p>${message}</p>
            </div>
        `;

        document.body.appendChild(loading);
        
        // Add styles if not present
        if (!document.getElementById('global-loading-styles')) {
            const styles = document.createElement('style');
            styles.id = 'global-loading-styles';
            styles.textContent = `
                .global-loading {
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    background: rgba(49, 46, 129, 0.9);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    z-index: 10000;
                    backdrop-filter: blur(5px);
                }
                
                .loading-content {
                    text-align: center;
                    color: white;
                }
                
                .loading-content .loading-spinner {
                    font-size: 3rem;
                    color: var(--sacred-gold);
                    margin-bottom: 1rem;
                }
                
                .loading-content p {
                    font-size: 1.2rem;
                    margin: 0;
                }
            `;
            document.head.appendChild(styles);
        }
    }

    hideLoading() {
        const loading = document.getElementById('global-loading');
        if (loading) {
            loading.remove();
        }
    }

    // Error handling
    handleGlobalError(error) {
        console.error('Global error:', error);
        showNotification('An unexpected error occurred. Please try again.', 'error');
    }

    // Performance monitoring
    trackPageView(section) {
        // Could integrate with analytics here
        console.log(`Page view: ${section}`);
    }

    // Accessibility helpers
    setupAccessibility() {
        // Skip to content link
        const skipLink = document.createElement('a');
        skipLink.href = '#main-content';
        skipLink.textContent = 'Skip to main content';
        skipLink.className = 'skip-link';
        skipLink.style.cssText = `
            position: absolute;
            top: -40px;
            left: 6px;
            background: var(--sacred-gold);
            color: var(--deep-indigo);
            padding: 8px;
            text-decoration: none;
            border-radius: 4px;
            z-index: 10001;
            transition: top 0.3s;
        `;
        
        skipLink.addEventListener('focus', () => {
            skipLink.style.top = '6px';
        });
        
        skipLink.addEventListener('blur', () => {
            skipLink.style.top = '-40px';
        });
        
        document.body.insertBefore(skipLink, document.body.firstChild);

        // Keyboard navigation for modals
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                // Close any open modals
                document.querySelectorAll('.modal.active').forEach(modal => {
                    modal.classList.remove('active');
                    document.body.style.overflow = '';
                });
            }
        });
    }
}

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.sageApp = new SageEmpireApp();
    window.sageApp.setupAccessibility();
});

// Global error handler
window.addEventListener('error', (e) => {
    if (window.sageApp) {
        window.sageApp.handleGlobalError(e.error);
    }
});

// Handle unhandled promise rejections
window.addEventListener('unhandledrejection', (e) => {
    if (window.sageApp) {
        window.sageApp.handleGlobalError(e.reason);
    }
});

// Service Worker registration (for future PWA features)
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        // Could register service worker here for offline functionality
        console.log('Service Worker support detected');
    });
}

// Export for use in other modules
window.SageEmpireApp = SageEmpireApp;

