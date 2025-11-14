// ========================================
// SOCIAL MEDIA UI - JAVASCRIPT
// ========================================

// DOM ELEMENTS
const themeToggleInput = document.getElementById('theme-toggle-input');
const body = document.body;
const createPostModal = document.getElementById('create-post-modal');
const createPostBtn = document.getElementById('create-post-btn');
const createPostInput = document.getElementById('create-post-input');
const closeCreateModalBtn = document.getElementById('close-create-modal');
const cancelModalBtn = document.getElementById('cancel-modal');
const submitPostModalBtn = document.getElementById('submit-post-modal');
const postsFeed = document.getElementById('posts-feed');

// ========================================
// THEME TOGGLE - DARK/LIGHT MODE
// ========================================

// Initialize theme from localStorage
function initializeTheme() {
    const savedTheme = localStorage.getItem('theme') || 'dark';
    
    if (savedTheme === 'light') {
        body.classList.add('light-mode');
        themeToggleInput.checked = true;
    } else {
        body.classList.remove('light-mode');
        themeToggleInput.checked = false;
    }
}

// Toggle theme
themeToggleInput.addEventListener('change', () => {
    if (themeToggleInput.checked) {
        body.classList.add('light-mode');
        localStorage.setItem('theme', 'light');
    } else {
        body.classList.remove('light-mode');
        localStorage.setItem('theme', 'dark');
    }
});

// Initialize theme on page load
initializeTheme();

// ========================================
// MODAL HANDLING
// ========================================

// Open create post modal
createPostBtn.addEventListener('click', () => {
    createPostModal.classList.add('active');
    document.body.style.overflow = 'hidden';
    document.getElementById('modal-post-textarea').focus();
});

// Close modal
function closeModal() {
    createPostModal.classList.remove('active');
    document.body.style.overflow = 'auto';
    document.getElementById('modal-post-textarea').value = '';
}

// Close modal buttons
closeCreateModalBtn.addEventListener('click', closeModal);
cancelModalBtn.addEventListener('click', closeModal);

// Close modal when clicking outside
createPostModal.addEventListener('click', (e) => {
    if (e.target === createPostModal) {
        closeModal();
    }
});

// Close modal with Escape key
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && createPostModal.classList.contains('active')) {
        closeModal();
    }
});

// ========================================
// CREATE POST FUNCTIONALITY
// ========================================

// Open modal from input
createPostInput.addEventListener('click', () => {
    createPostModal.classList.add('active');
    document.body.style.overflow = 'hidden';
    document.getElementById('modal-post-textarea').focus();
});

// Submit post from modal (requires login)
submitPostModalBtn.addEventListener('click', () => {
    const postContent = document.getElementById('modal-post-textarea').value.trim();
    
    if (!postContent) {
        alert('សូមសរសេរអ្វីមួយមុនការផ្សព្វផ្សាយ!');
        return;
    }

    // Check if user is logged in
    if (!firebaseAuth || !firebaseAuth.currentUser) {
        alert('សូមចូលប្រើប្រាស់ដូច្ចក មុនពេលផ្សព្វផ្សាយ');
        return;
    }
    
    createNewPostFirebase(postContent);
    closeModal();
});

// Allow Enter key to submit in create post input
createPostInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && e.ctrlKey) {
        const modalContent = document.getElementById('modal-post-textarea').value.trim();
        if (modalContent) {
            if (!firebaseAuth || !firebaseAuth.currentUser) {
                alert('សូមចូលប្រើប្រាស់ដូច្ចក មុនពេលផ្សព្វផ្សាយ');
                return;
            }
            createNewPostFirebase(modalContent);
            closeModal();
        }
    }
});

// ========================================
// POST CREATION (FIREBASE)
// ========================================

// Save post to Firebase
function createNewPostFirebase(content) {
    const user = firebaseAuth?.currentUser;

    if (!user || !firebaseDatabase) {
        alert('សូមចូលប្រើប្រាស់ដូច្ចក');
        return;
    }

    const postId = 'post-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
    const postData = {
        id: postId,
        uid: user.uid,
        displayName: user.displayName || user.email || 'User',
        photoURL: user.photoURL || `https://i.pravatar.cc/48?u=${encodeURIComponent(user.uid)}`,
        content: content,
        timestamp: Date.now(),
        likes: {},
        likeCount: 0
    };

    // Save to Firebase
    firebaseDatabase.ref('/posts/' + postId).set(postData).then(() => {
        showNotification('ផ្សព្វផ្សាយបានដោជោគជ័យ! 🎉');
        // No need to call loadPostsFromFirebase() here, the 'on' listener will handle it automatically.
    }).catch(err => {
        console.error('Error creating post:', err);
        alert('ការផ្សព្វផ្សាយបរាជ័យ: ' + err.message);
    });
}

// Load posts from Firebase
let postsListener = null; // Variable to hold the listener
function loadPostsFromFirebase() {
    if (!firebaseDatabase) return;

    // Detach any existing listener to avoid duplicates
    if (postsListener) {
        postsListener.off();
    }

    const postsRef = firebaseDatabase.ref('/posts').orderByChild('timestamp').limitToLast(50);
    
    // Use .on() instead of .once() for real-time updates
    postsListener = postsRef.on('value', snapshot => {
        const postsContainer = document.getElementById('posts-feed');
        const createPostCard = postsContainer.querySelector('.create-post-card');
        
        // Remove existing posts (keep create-post card)
        postsContainer.querySelectorAll('.post-card').forEach(el => el.remove());

        if (snapshot.exists()) {
            const posts = [];
            snapshot.forEach(childSnapshot => {
                posts.unshift(childSnapshot.val()); // Reverse order (newest first)
            });

            // Display posts
            posts.forEach(post => {
                const postElement = createPostElement(post);
                createPostCard.insertAdjacentElement('afterend', postElement);
            });
        }
    }, error => {
        console.error('Error with real-time post listener:', error);
    });
}

// Create post element from data
function createPostElement(post) {
    const newPost = document.createElement('article');
    newPost.className = 'post-card';
    newPost.setAttribute('data-post-id', post.id);
    
    const now = new Date();
    const postTime = new Date(post.timestamp);
    const timeString = getTimeAgo(post.timestamp);
    
    const isLiked = post.likes && post.likes[firebaseAuth.currentUser?.uid] ? 'active' : '';
    const likeIcon = isLiked ? 'fas' : 'far';
    const likeText = isLiked ? 'Liked' : 'Like';
    
    newPost.innerHTML = `
        <div class="post-header">
            <div class="post-author">
                <img src="${post.photoURL}" alt="Author" class="author-avatar">
                <div class="author-info">
                    <h3 class="author-name">${escapeHtml(post.displayName)}</h3>
                    <span class="post-time">${timeString}</span>
                </div>
            </div>
            <button class="post-menu-btn">
                <i class="fas fa-ellipsis-h"></i>
            </button>
        </div>

        <div class="post-content">
            <p>${escapeHtml(post.content)}</p>
        </div>

        <div class="post-stats">
            <span><i class="fas fa-heart"></i> <span class="like-count">${post.likeCount || 0}</span> Likes</span>
            <span><i class="fas fa-comment"></i> 0 Comments</span>
        </div>

        <div class="post-interactions">
            <button class="interaction-btn like-btn ${isLiked}" data-post-id="${post.id}">
                <i class="${likeIcon} fa-heart"></i>
                <span>${likeText}</span>
            </button>
            <button class="interaction-btn">
                <i class="far fa-comment"></i>
                <span>Comment</span>
            </button>
            <button class="interaction-btn">
                <i class="fas fa-share"></i>
                <span>Share</span>
            </button>
        </div>
    `;

    // Attach listener directly to the new button
    const likeBtn = newPost.querySelector('.like-btn');
    if (likeBtn) {
        attachLikeListener(likeBtn);
    }
    
    return newPost;
}

// Helper: time ago
function getTimeAgo(timestamp) {
    const now = Date.now();
    const diff = now - timestamp;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    
    if (minutes < 1) return 'just now';
    if (minutes < 60) return minutes + ' min ago';
    if (hours < 24) return hours + ' hours ago';
    return days + ' days ago';
}

// ========================================
// LIKE FUNCTIONALITY
// ========================================

const likedPosts = new Set();

// Attach like listeners to all like buttons
function attachLikeListener(button) {
    button.addEventListener('click', handleLike);
}

function handleLike(e) {
    const button = e.currentTarget;
    const postId = button.getAttribute('data-post-id');
    
    if (!postId) return;
    
    const user = firebaseAuth?.currentUser;
    if (!user) {
        alert('សូមចូលប្រើប្រាស់ដូច្ចក មុនពេលគាស់ចូលចិត្ត');
        return;
    }

    const uid = user.uid;
    const postLikesRef = firebaseDatabase.ref(`/posts/${postId}/likes/${uid}`);
    const postLikeCountRef = firebaseDatabase.ref(`/posts/${postId}/likeCount`);

    // Use a transaction for atomic updates to prevent race conditions
    postLikeCountRef.transaction(currentLikeCount => {
        const isCurrentlyLiked = button.classList.contains('active');
        if (isCurrentlyLiked) {
            // User is unliking the post
            postLikesRef.remove(); // Remove user's like
            return (currentLikeCount || 1) - 1;
        } else {
            // User is liking the post
            postLikesRef.set(true); // Add user's like
            return (currentLikeCount || 0) + 1;
        }
    }).catch(err => {
        console.error('Error updating like:', err);
    });
}

// ========================================
// NAVIGATION
// ========================================

const navItems = document.querySelectorAll('.nav-item');

navItems.forEach(item => {
    item.addEventListener('click', () => {
        // Remove active class from all items
        navItems.forEach(nav => nav.classList.remove('active'));
        
        // Add active class to clicked item
        item.classList.add('active');
        
        const navName = item.getAttribute('data-nav');
        console.log(`Navigating to: ${navName}`);
    });
});

// ========================================
// HEADER BUTTONS
// ========================================

// Notifications button
document.getElementById('notifications-btn').addEventListener('click', () => {
    showNotification('Notifications feature coming soon! 📬');
});

// Messages button
document.getElementById('messages-btn').addEventListener('click', () => {
    showNotification('Messages feature coming soon! 💬');
});

// Firebase SDK and config (replace with your config)
const firebaseConfig = {
    apiKey: "AIzaSyByB1O95PodUZ9_S4WSIQTGu2kwM5-HaVQ",
    authDomain: "social-media-v11.firebaseapp.com",
    databaseURL: "https://social-media-v11-default-rtdb.firebaseio.com",
    projectId: "social-media-v11",
    storageBucket: "social-media-v11.firebasestorage.app",
    messagingSenderId: "160460298649",
    appId: "1:160460298649:web:2862fc29a1b05777681b08"
};

let firebaseApp = null;
let firebaseAuth = null;
let firebaseDatabase = null;

function initFirebase() {
    try {
        firebaseApp = firebase.initializeApp(firebaseConfig);
        firebaseAuth = firebase.auth();
        firebaseDatabase = firebase.database();

        // Check auth state on page load
        firebaseAuth.onAuthStateChanged(user => {
            if (!user) {
                // If no user, redirect to login page
                window.location.href = 'login.html';
            }
        });
        // Listen to auth state changes
        firebaseAuth.onAuthStateChanged(user => {
            if (user) {
                // Load profile from Realtime Database if available
                const uid = user.uid;
                firebaseDatabase.ref('/profiles/' + uid).once('value').then(snapshot => {
                    const profile = snapshot.val() || {};
                    const displayName = profile.displayName || user.displayName || user.email || 'User';
                    updateAuthUILoggedIn(displayName, user);
                }).catch(err => {
                    console.error('Error reading profile:', err);
                    const displayName = user.displayName || user.email || 'User';
                    updateAuthUILoggedIn(displayName, user);
                });
            } else {
                // If user logs out, redirect to login page
                window.location.href = 'login.html';
            }
        });
    } catch (err) {
        console.error('Firebase initialization error:', err);
    }
}

// DOM elements for auth UI
const headerUsernameSpan = document.getElementById('header-username');
const userMenuBtn = document.getElementById('user-menu-btn');
const userAvatarImg = userMenuBtn ? userMenuBtn.querySelector('img') : null;
const createPostAvatarImg = document.getElementById('create-post-avatar');

function updateAuthUILoggedIn(displayName, user) {
    if (headerUsernameSpan) headerUsernameSpan.textContent = displayName;
    const avatarUrl = user.photoURL || `https://i.pravatar.cc/48?u=${encodeURIComponent(user.uid)}`;
    if (userAvatarImg) userAvatarImg.src = avatarUrl.replace('/48?', '/40?'); // Ensure correct size for header
    if (createPostAvatarImg) createPostAvatarImg.src = avatarUrl;
    
    // Show create post card when logged in
    const createPostCard = document.querySelector('.create-post-card');
    if (createPostCard) {
        createPostCard.style.display = 'block';
    }
    
    // Load posts from Firebase
    loadPostsFromFirebase();
    
    showNotification(`Welcome, ${displayName}!`);
}

function updateAuthUILoggedOut() {
    // This function is now handled by redirecting to login.html
    console.log('User logged out, redirecting...');
    window.location.href = 'login.html';
}

// Logout
function logoutFirebase() {
    if (!firebaseAuth) return Promise.resolve();
    return firebaseAuth.signOut().then(() => {
        showNotification('បានចេញពីប្រព័ន្ធ');
        // The onAuthStateChanged listener will handle the redirect
    });
}

// Handle logout when clicking user profile button (if logged in)
userMenuBtn.addEventListener('click', () => {
    if (firebaseAuth && firebaseAuth.currentUser) {
        if (confirm('តើអ្នកពិតជាចង់ចេញពីប្រព័ន្ធមែនទេ?')) {
            logoutFirebase();
            // Detach the listener when logging out to prevent errors
            if (postsListener) {
                postsListener.off();
                postsListener = null;
                console.log('Detached Firebase post listener.');
            }
        }
    }
});

// ========================================
// INTERACTION BUTTONS
// ========================================

// Comment buttons
document.addEventListener('click', (e) => {
    if (e.target.closest('.post-card .interaction-btn:nth-child(2)')) {
        const post = e.target.closest('.post-card');
        showNotification('Comments feature coming soon! 💭');
    }
});

// Share buttons
document.addEventListener('click', (e) => {
    if (e.target.closest('.post-card .interaction-btn:nth-child(3)')) {
        showNotification('Post shared successfully! 🔗');
    }
});

// Follow buttons
document.querySelectorAll('.btn-follow').forEach(btn => {
    btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const button = e.target;
        if (button.textContent === 'Follow') {
            button.textContent = 'Following';
            button.style.background = 'var(--bg-tertiary)';
            button.style.color = 'var(--text-secondary)';
            button.style.borderColor = 'var(--border-color)';
            showNotification('Following user! ✨');
        } else {
            button.textContent = 'Follow';
            button.style.background = 'var(--primary-color)';
            button.style.color = 'white';
        }
    });
});

// ========================================
// UTILITY FUNCTIONS
// ========================================

// Escape HTML to prevent XSS
function escapeHtml(text) {
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    };
    return text.replace(/[&<>"']/g, m => map[m]);
}

// Generate unique post ID
function generatePostId() {
    return 'post-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
}

// Show notification
function showNotification(message) {
    // Create notification element
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        bottom: 2rem;
        right: 2rem;
        background: linear-gradient(135deg, var(--primary-color) 0%, var(--primary-dark) 100%);
        color: white;
        padding: 1rem 1.5rem;
        border-radius: 8px;
        box-shadow: 0 8px 32px rgba(99, 102, 241, 0.3);
        z-index: 3000;
        animation: slideInRight 0.3s ease-out;
        font-weight: 500;
        max-width: 300px;
        backdrop-filter: blur(10px);
    `;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    // Add slide in animation
    const style = document.createElement('style');
    if (!document.querySelector('style[data-notification]')) {
        style.setAttribute('data-notification', 'true');
        style.textContent = `
            @keyframes slideInRight {
                from {
                    opacity: 0;
                    transform: translateX(30px);
                }
                to {
                    opacity: 1;
                    transform: translateX(0);
                }
            }
            @keyframes slideOutRight {
                from {
                    opacity: 1;
                    transform: translateX(0);
                }
                to {
                    opacity: 0;
                    transform: translateX(30px);
                }
            }
        `;
        document.head.appendChild(style);
    }
    
    // Remove after 3 seconds
    setTimeout(() => {
        notification.style.animation = 'slideOutRight 0.3s ease-out';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// ========================================
// ADVANCED INTERACTIONS
// ========================================

// Add hover effects to posts
document.addEventListener('mouseover', (e) => {
    const post = e.target.closest('.post-card');
    if (post) {
        const buttons = post.querySelectorAll('.interaction-btn');
        buttons.forEach(btn => {
            btn.style.transform = 'scale(1)';
        });
    }
});

// Search functionality (placeholder)
const searchInput = document.querySelector('.search-bar input');
searchInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
        const searchTerm = searchInput.value.trim();
        if (searchTerm) {
            showNotification(`Searching for: "${searchTerm}" 🔍`);
            // Add actual search functionality here
        }
    }
});

// ========================================
// RESPONSIVE ADJUSTMENTS
// ========================================

// Handle window resize for responsive behavior
let resizeTimer;
window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
        // Adjust layout if needed
        console.log('Window resized');
    }, 250);
});

// ========================================
// PAGE INITIALIZATION
// ========================================

document.addEventListener('DOMContentLoaded', () => {
    console.log('SocialHub loaded successfully! 🚀');
    
    // Initial setup
    initializeTheme();
    // Initialize local UI auth first, then init Firebase which will update UI based on real auth (Removed call to undefined initializeAuth)
    
    // Initially hide create post card (will be shown when user logs in)
    const createPostCard = document.querySelector('.create-post-card');
    if (createPostCard) {
        createPostCard.style.display = 'none';
    }
    
    // Initialize Firebase which triggers auth state change listener
    initFirebase();
    
    // Set active nav item to Feed
    const feedNav = document.querySelector('[data-nav="feed"]');
    if (feedNav) {
        feedNav.classList.add('active');
    }
});

// ========================================
// ADDITIONAL FEATURES
// ========================================

// Trending item click handler
document.querySelectorAll('.trend-item').forEach(item => {
    item.addEventListener('click', () => {
        const trendName = item.querySelector('h4').textContent;
        showNotification(`Exploring ${trendName} 📈`);
    });
});

// Suggestion item click handler
document.querySelectorAll('.suggestion-item').forEach(item => {
    const userName = item.querySelector('h4').textContent;
    item.addEventListener('click', (e) => {
        // Don't trigger if clicking the follow button
        if (!e.target.closest('.btn-follow')) {
            showNotification(`Visiting ${userName}'s profile 👤`);
        }
    });
});

// Create post action buttons
document.querySelectorAll('.create-action-btn:not(.post-btn)').forEach(btn => {
    btn.addEventListener('click', () => {
        const action = btn.textContent.trim();
        showNotification(`${action} feature coming soon! 📸`);
    });
});

// Modal action buttons
document.querySelectorAll('.modal-action-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        const action = btn.textContent.trim();
        showNotification(`${action} added! ✅`);
    });
});

// ========================================
// KEYBOARD SHORTCUTS
// ========================================

document.addEventListener('keydown', (e) => {
    // Ctrl/Cmd + K for search
    if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        searchInput.focus();
    }
    
    // Ctrl/Cmd + N for new post
    if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
        e.preventDefault();
        createPostBtn.click();
    }
    
    // Ctrl/Cmd + T for theme toggle
    if ((e.ctrlKey || e.metaKey) && e.key === 't') {
        e.preventDefault();
        themeToggleInput.click();
    }
});

// ========================================
// ANIMATION & PERFORMANCE OPTIMIZATION
// ========================================

// Lazy load images
if ('IntersectionObserver' in window) {
    const imageObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const img = entry.target;
                if (img.dataset.src) {
                    img.src = img.dataset.src;
                    img.removeAttribute('data-src');
                    observer.unobserve(img);
                }
            }
        });
    });
    
    document.querySelectorAll('img[data-src]').forEach(img => {
        imageObserver.observe(img);
    });
}

// Prevent default on post menu buttons
document.querySelectorAll('.post-menu-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
        e.preventDefault();
        showNotification('Post options coming soon! ⚙️');
    });
});

// ========================================
// ACCESSIBILITY IMPROVEMENTS
// ========================================

// Add ARIA labels for screen readers
document.querySelectorAll('.icon-btn').forEach(btn => {
    if (!btn.getAttribute('aria-label')) {
        const icon = btn.querySelector('i');
        if (icon) {
            const iconClass = icon.className;
            btn.setAttribute('aria-label', iconClass);
        }
    }
});

// Focus management
document.addEventListener('keydown', (e) => {
    if (e.key === 'Tab') {
        document.body.classList.add('keyboard-nav');
    }
});

document.addEventListener('mousedown', () => {
    document.body.classList.remove('keyboard-nav');
});

console.log('All JavaScript features loaded! 🎉');
