// Community Management for Sage Empire
class CommunityManager {
    constructor() {
        this.posts = [];
        this.currentFilter = 'all';
        this.currentPage = 1;
        this.isLoading = false;
        this.hasMorePosts = true;
        
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.loadPosts();
    }

    setupEventListeners() {
        // Post creation
        document.getElementById('create-post-btn')?.addEventListener('click', () => {
            this.createPost();
        });

        // Post content textarea
        const postContent = document.getElementById('post-content');
        if (postContent) {
            postContent.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                    this.createPost();
                }
            });
        }

        // Feed filters
        document.querySelectorAll('.feed-filters .filter-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const filter = e.target.dataset.filter;
                this.filterPosts(filter);
            });
        });

        // Infinite scroll
        window.addEventListener('scroll', debounce(() => {
            if (this.shouldLoadMore()) {
                this.loadMorePosts();
            }
        }, 200));
    }

    shouldLoadMore() {
        const scrollPosition = window.innerHeight + window.scrollY;
        const documentHeight = document.documentElement.offsetHeight;
        return scrollPosition >= documentHeight - 1000 && !this.isLoading && this.hasMorePosts;
    }

    async loadPosts(filter = 'all', page = 1) {
        if (this.isLoading) return;
        
        this.isLoading = true;
        const container = document.getElementById('posts-container');
        
        if (page === 1) {
            container.innerHTML = '<div class="loading-spinner"><i class="fas fa-spinner fa-spin"></i><span>Loading wisdom...</span></div>';
        }

        try {
            const params = { page, per_page: 10 };
            
            // Apply filters based on selection
            switch (filter) {
                case 'trending':
                    // Could add trending logic here
                    break;
                case 'following':
                    if (window.authManager?.isAuthenticated) {
                        // Could filter by followed users
                    }
                    break;
                case 'premium':
                    // Could filter premium content
                    break;
            }

            const response = await sageAPI.getPosts(params);
            
            if (page === 1) {
                this.posts = response.posts;
                this.renderPosts();
            } else {
                this.posts = [...this.posts, ...response.posts];
                this.appendPosts(response.posts);
            }

            this.currentPage = page;
            this.hasMorePosts = response.has_next;
            
        } catch (error) {
            handleAPIError(error, 'Failed to load posts');
            if (page === 1) {
                container.innerHTML = '<div class="error-message">Failed to load posts. Please try again.</div>';
            }
        } finally {
            this.isLoading = false;
        }
    }

    async loadMorePosts() {
        if (this.hasMorePosts) {
            await this.loadPosts(this.currentFilter, this.currentPage + 1);
        }
    }

    renderPosts() {
        const container = document.getElementById('posts-container');
        
        if (this.posts.length === 0) {
            container.innerHTML = '<div class="no-posts">No posts found. Be the first to share your wisdom!</div>';
            return;
        }

        container.innerHTML = this.posts.map(post => this.createPostCard(post)).join('');
        this.attachPostEventListeners();
    }

    appendPosts(posts) {
        const container = document.getElementById('posts-container');
        const newPostsHTML = posts.map(post => this.createPostCard(post)).join('');
        container.insertAdjacentHTML('beforeend', newPostsHTML);
        this.attachPostEventListeners();
    }

    createPostCard(post) {
        const isLocked = post.required_tier !== 'free' && 
                        (!window.authManager || !window.authManager.hasSubscriptionAccess(post.required_tier));
        
        const tierBadge = post.required_tier !== 'free' 
            ? `<span class="post-tier-badge">${post.required_tier.charAt(0).toUpperCase() + post.required_tier.slice(1)}</span>`
            : '';

        const contentPreview = isLocked 
            ? `<div class="post-locked">
                 <i class="fas fa-lock"></i>
                 <p>This content requires ${post.required_tier.charAt(0).toUpperCase() + post.required_tier.slice(1)} subscription</p>
                 <button class="btn btn-primary btn-small" onclick="window.location.hash='#tiers'">Upgrade Now</button>
               </div>`
            : `<div class="post-content">${this.formatPostContent(post.content)}</div>`;

        const mediaContent = post.image_url && !isLocked
            ? `<div class="post-media">
                 <img src="${post.image_url}" alt="Post image" class="post-image" loading="lazy">
               </div>`
            : '';

        return `
            <article class="post-card ${isLocked ? 'post-locked' : ''}" data-post-id="${post.id}">
                <div class="post-header">
                    <div class="post-author">
                        <img src="${post.author?.avatar_url || '/assets/icons/default-avatar.png'}" 
                             alt="${post.author?.display_name || post.author?.username}" 
                             class="author-avatar">
                        <div class="author-info">
                            <h4 class="author-name">${post.author?.display_name || post.author?.username}</h4>
                            <span class="post-time">${formatDate(post.created_at)}</span>
                        </div>
                    </div>
                    <div class="post-meta">
                        ${tierBadge}
                        <div class="post-menu">
                            <button class="btn btn-icon post-menu-btn">
                                <i class="fas fa-ellipsis-h"></i>
                            </button>
                        </div>
                    </div>
                </div>
                
                ${contentPreview}
                ${mediaContent}
                
                <div class="post-actions">
                    <button class="post-action-btn like-btn ${post.user_liked ? 'liked' : ''}" 
                            data-post-id="${post.id}" ${isLocked ? 'disabled' : ''}>
                        <i class="fas fa-heart"></i>
                        <span class="action-count">${post.like_count || 0}</span>
                    </button>
                    <button class="post-action-btn comment-btn" 
                            data-post-id="${post.id}" ${isLocked ? 'disabled' : ''}>
                        <i class="fas fa-comment"></i>
                        <span class="action-count">${post.comment_count || 0}</span>
                    </button>
                    <button class="post-action-btn share-btn" 
                            data-post-id="${post.id}" ${isLocked ? 'disabled' : ''}>
                        <i class="fas fa-share"></i>
                        <span class="action-count">${post.share_count || 0}</span>
                    </button>
                </div>
                
                <div class="post-comments" id="comments-${post.id}" style="display: none;">
                    <div class="comments-container"></div>
                    <div class="comment-form" ${isLocked ? 'style="display: none;"' : ''}>
                        <textarea placeholder="Share your thoughts..." class="comment-input" data-post-id="${post.id}"></textarea>
                        <button class="btn btn-primary btn-small comment-submit-btn" data-post-id="${post.id}">
                            Comment
                        </button>
                    </div>
                </div>
            </article>
        `;
    }

    formatPostContent(content) {
        // Basic text formatting
        return content
            .replace(/\n/g, '<br>')
            .replace(/(https?:\/\/[^\s]+)/g, '<a href="$1" target="_blank" rel="noopener">$1</a>')
            .replace(/#(\w+)/g, '<span class="hashtag">#$1</span>');
    }

    attachPostEventListeners() {
        // Like buttons
        document.querySelectorAll('.like-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const postId = parseInt(btn.dataset.postId);
                this.toggleLike(postId, btn);
            });
        });

        // Comment buttons
        document.querySelectorAll('.comment-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const postId = parseInt(btn.dataset.postId);
                this.toggleComments(postId);
            });
        });

        // Share buttons
        document.querySelectorAll('.share-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const postId = parseInt(btn.dataset.postId);
                this.sharePost(postId);
            });
        });

        // Comment submission
        document.querySelectorAll('.comment-submit-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const postId = parseInt(btn.dataset.postId);
                this.submitComment(postId);
            });
        });

        // Comment input enter key
        document.querySelectorAll('.comment-input').forEach(input => {
            input.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                    const postId = parseInt(input.dataset.postId);
                    this.submitComment(postId);
                }
            });
        });
    }

    async createPost() {
        if (!window.authManager?.isAuthenticated) {
            window.authManager.showAuthModal(true);
            showNotification('Please sign in to create posts', 'warning');
            return;
        }

        const contentTextarea = document.getElementById('post-content');
        const content = contentTextarea.value.trim();

        if (!content) {
            showNotification('Please enter some content', 'warning');
            return;
        }

        const createBtn = document.getElementById('create-post-btn');
        setLoading(createBtn, true, 'Sharing...');

        try {
            const postData = {
                content: content,
                // Could add image/video URLs here
            };

            await sageAPI.createPost(postData);
            contentTextarea.value = '';
            showNotification('Wisdom shared successfully!', 'success');
            
            // Reload posts to show the new one
            this.loadPosts(this.currentFilter, 1);
            
        } catch (error) {
            handleAPIError(error, 'Failed to create post');
        } finally {
            setLoading(createBtn, false);
        }
    }

    async toggleLike(postId, button) {
        if (!window.authManager?.isAuthenticated) {
            window.authManager.showAuthModal(true);
            showNotification('Please sign in to like posts', 'warning');
            return;
        }

        const isLiked = button.classList.contains('liked');
        const countSpan = button.querySelector('.action-count');
        const currentCount = parseInt(countSpan.textContent);

        // Optimistic update
        button.classList.toggle('liked');
        countSpan.textContent = isLiked ? currentCount - 1 : currentCount + 1;

        try {
            if (isLiked) {
                await sageAPI.unlikePost(postId);
            } else {
                await sageAPI.likePost(postId);
            }
        } catch (error) {
            // Revert optimistic update
            button.classList.toggle('liked');
            countSpan.textContent = currentCount;
            handleAPIError(error, 'Failed to update like');
        }
    }

    async toggleComments(postId) {
        const commentsSection = document.getElementById(`comments-${postId}`);
        const isVisible = commentsSection.style.display !== 'none';

        if (isVisible) {
            commentsSection.style.display = 'none';
        } else {
            commentsSection.style.display = 'block';
            await this.loadComments(postId);
        }
    }

    async loadComments(postId) {
        const commentsContainer = document.querySelector(`#comments-${postId} .comments-container`);
        commentsContainer.innerHTML = '<div class="loading-spinner"><i class="fas fa-spinner fa-spin"></i></div>';

        try {
            const response = await sageAPI.getComments(postId);
            
            if (response.comments.length === 0) {
                commentsContainer.innerHTML = '<div class="no-comments">No comments yet. Be the first!</div>';
                return;
            }

            commentsContainer.innerHTML = response.comments.map(comment => this.createCommentCard(comment)).join('');
            
        } catch (error) {
            handleAPIError(error, 'Failed to load comments');
            commentsContainer.innerHTML = '<div class="error-message">Failed to load comments</div>';
        }
    }

    createCommentCard(comment) {
        return `
            <div class="comment-card" data-comment-id="${comment.id}">
                <div class="comment-author">
                    <img src="${comment.user?.avatar_url || '/assets/icons/default-avatar.png'}" 
                         alt="${comment.user?.display_name || comment.user?.username}" 
                         class="comment-avatar">
                    <div class="comment-info">
                        <h5 class="comment-author-name">${comment.user?.display_name || comment.user?.username}</h5>
                        <span class="comment-time">${formatDate(comment.created_at)}</span>
                    </div>
                </div>
                <div class="comment-content">${this.formatPostContent(comment.content)}</div>
            </div>
        `;
    }

    async submitComment(postId) {
        if (!window.authManager?.isAuthenticated) {
            window.authManager.showAuthModal(true);
            showNotification('Please sign in to comment', 'warning');
            return;
        }

        const input = document.querySelector(`.comment-input[data-post-id="${postId}"]`);
        const content = input.value.trim();

        if (!content) {
            showNotification('Please enter a comment', 'warning');
            return;
        }

        const submitBtn = document.querySelector(`.comment-submit-btn[data-post-id="${postId}"]`);
        setLoading(submitBtn, true, 'Posting...');

        try {
            await sageAPI.createComment(postId, { content });
            input.value = '';
            showNotification('Comment posted!', 'success');
            
            // Reload comments
            await this.loadComments(postId);
            
            // Update comment count in post
            const commentBtn = document.querySelector(`.comment-btn[data-post-id="${postId}"]`);
            const countSpan = commentBtn.querySelector('.action-count');
            countSpan.textContent = parseInt(countSpan.textContent) + 1;
            
        } catch (error) {
            handleAPIError(error, 'Failed to post comment');
        } finally {
            setLoading(submitBtn, false);
        }
    }

    sharePost(postId) {
        // Simple share functionality
        const url = `${window.location.origin}${window.location.pathname}#post-${postId}`;
        
        if (navigator.share) {
            navigator.share({
                title: 'Sage Empire - Wisdom Shared',
                text: 'Check out this wisdom from the Sage Empire community',
                url: url
            });
        } else {
            // Fallback to clipboard
            navigator.clipboard.writeText(url).then(() => {
                showNotification('Link copied to clipboard!', 'success');
            }).catch(() => {
                showNotification('Failed to copy link', 'error');
            });
        }
    }

    filterPosts(filter) {
        this.currentFilter = filter;
        this.currentPage = 1;
        this.hasMorePosts = true;
        
        // Update filter buttons
        document.querySelectorAll('.feed-filters .filter-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.filter === filter);
        });

        this.loadPosts(filter, 1);
    }
}

// Initialize community manager
document.addEventListener('DOMContentLoaded', () => {
    window.communityManager = new CommunityManager();
});

// Export for use in other modules
window.CommunityManager = CommunityManager;

