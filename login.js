// ========================================
// LOGIN PAGE SCRIPT
// ========================================

document.addEventListener('DOMContentLoaded', () => {
    // Firebase Config (should be the same as in script.js)
    const firebaseConfig = {
        apiKey: "AIzaSyByB1O95PodUZ9_S4WSIQTGu2kwM5-HaVQ",
        authDomain: "social-media-v11.firebaseapp.com",
        databaseURL: "https://social-media-v11-default-rtdb.firebaseio.com",
        projectId: "social-media-v11",
        storageBucket: "social-media-v11.firebasestorage.app",
        messagingSenderId: "160460298649",
        appId: "1:160460298649:web:2862fc29a1b05777681b08"
    };

    // Initialize Firebase
    const app = firebase.initializeApp(firebaseConfig);
    const auth = firebase.auth();
    const database = firebase.database();

    // DOM Elements
    const emailInput = document.getElementById('auth-email-input');
    const passwordInput = document.getElementById('auth-password-input');
    const usernameInput = document.getElementById('auth-username-input');
    const loginBtn = document.getElementById('auth-login-btn');
    const registerBtn = document.getElementById('auth-register-btn');
    const forgotBtn = document.getElementById('auth-forgot-btn');

    // Redirect if already logged in
    auth.onAuthStateChanged(user => {
        if (user) {
            console.log('User is already logged in. Redirecting to index.html');
            window.location.href = 'index.html';
        }
    });

    function setButtonsDisabled(disabled) {
        loginBtn.disabled = disabled;
        registerBtn.disabled = disabled;
        forgotBtn.disabled = disabled;
        loginBtn.style.cursor = disabled ? 'not-allowed' : 'pointer';
        registerBtn.style.cursor = disabled ? 'not-allowed' : 'pointer';
    }
    // Login Handler
    loginBtn.addEventListener('click', () => {
        const email = emailInput.value.trim();
        const password = passwordInput.value;

        if (!email || !password) {
            showNotification('សូមបញ្ចូលអ៊ីម៉ែល និងពាក្យសម្ងាត់', 'error');
            return;
        }

        setButtonsDisabled(true);
        auth.signInWithEmailAndPassword(email, password)
            .then(userCredential => {
                showNotification('ការចូលបានជោគជ័យ! កំពុងបញ្ជូន...', 'success');
                setTimeout(() => {
                    window.location.href = 'index.html';
                }, 1500);
                // Buttons will remain disabled until page redirects
            })
            .catch(error => {
                console.error("Login Error:", error);
                showNotification(`ការចូលបរាជ័យ: ${error.message}`, 'error');
                setButtonsDisabled(false);
            });
    });

    // Register Handler
    registerBtn.addEventListener('click', () => {
        const email = emailInput.value.trim();
        const password = passwordInput.value;
        const displayName = usernameInput.value.trim();

        if (!email || !password) {
            showNotification('សូមបញ្ចូលអ៊ីម៉ែល និងពាក្យសម្ងាត់', 'error');
            return;
        }

        setButtonsDisabled(true);
        auth.createUserWithEmailAndPassword(email, password)
            .then(userCredential => {
                const user = userCredential.user;
                const profileUpdates = [];

                if (displayName) {
                    profileUpdates.push(user.updateProfile({ displayName: displayName }));
                }

                // Save profile to database
                const profileData = {
                    displayName: displayName || user.email,
                    email: user.email,
                    createdAt: Date.now()
                };
                profileUpdates.push(database.ref('profiles/' + user.uid).set(profileData));

                return Promise.all(profileUpdates).then(() => {
                    showNotification('ការចុះឈ្មោះបានជោគជ័យ! កំពុងបញ្ជូន...', 'success');
                    setTimeout(() => {
                        window.location.href = 'index.html';
                    }, 1500);
                    // Buttons will remain disabled until page redirects
                });
            })
            .catch(error => {
                console.error("Register Error:", error);
                showNotification(`ការចុះឈ្មោះបរាជ័យ: ${error.message}`, 'error');
                setButtonsDisabled(false);
            });
    });

    // Forgot Password Handler
    forgotBtn.addEventListener('click', () => {
        const email = emailInput.value.trim();
        if (!email) {
            showNotification('សូមបញ្ចូលអ៊ីម៉ែលរបស់អ្នកដើម្បីកំណត់ពាក្យសម្ងាត់ឡើងវិញ', 'error');
            return;
        }

        setButtonsDisabled(true);
        auth.sendPasswordResetEmail(email)
            .then(() => {
                showNotification('យើងបានផ្ញើអ៊ីម៉ែលសម្រាប់ប្តូរពាក្យសម្ងាត់ទៅកាន់អ្នក។');
            })
            .catch(error => {
                console.error("Password Reset Error:", error);
                showNotification(`ការកំណត់ពាក្យសម្ងាត់ឡើងវិញបរាជ័យ: ${error.message}`, 'error');
            })
            .finally(() => {
                setButtonsDisabled(false);
            });
    });

    // Simple Notification Function
    function showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        const container = document.getElementById('notification-container') || document.body;
        notification.textContent = message;
        notification.className = 'notification';

        if (type === 'error') {
            notification.style.backgroundColor = 'var(--danger-color, #ef4444)';
        } else if (type === 'success') {
            notification.style.backgroundColor = 'var(--success-color, #22c55e)';
        } else {
            notification.style.backgroundColor = 'var(--primary-color, #6366f1)';
        }

        container.appendChild(notification);

        setTimeout(() => {
            notification.classList.add('hide');
            notification.addEventListener('transitionend', () => {
                notification.remove();
            });
        }, 3000);
    }
});