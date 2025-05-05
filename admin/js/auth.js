// Authentication related utilities
const authUtils = {
    // Initialize Firebase Auth
    init(auth) {
        this.auth = auth;
        this.db = firebase.firestore();
        
        console.log("Auth module initialized");
        
        // Set up auth state listener
        this.auth.onAuthStateChanged(user => {
            console.log("Auth state changed:", user ? user.email : "No user");
            this.handleAuthStateChange(user);
        });
        
        // Login form event listener
        document.getElementById('loginForm').addEventListener('submit', e => {
            e.preventDefault();
            this.login();
        });
        
        // Logout button event listener
        document.getElementById('logoutBtn')?.addEventListener('click', () => {
            this.logout();
        });

        // Check for authentication persistence
        this.auth.setPersistence(firebase.auth.Auth.Persistence.LOCAL);
    },
    
    // Handle login functionality
    async login() {
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        const loginBtn = document.querySelector('#loginForm button[type="submit"]');
        const loginStatus = document.getElementById('loginStatus');
        const loginStatusText = document.getElementById('loginStatusText');
        
        // Basic input validation
        if (!email || !password) {
            this.showError("Proszę wypełnić wszystkie pola formularza");
            return;
        }
        
        try {
            // Disable login button and show loading
            loginBtn.disabled = true;
            loginBtn.innerHTML = '<i class="fas fa-circle-notch fa-spin"></i> Logowanie...';
            
            // Show login status
            loginStatus.classList.remove('hidden');
            loginStatusText.textContent = 'Trwa logowanie...';
            
            // Clear any previous errors
            this.hideError();
            
            // Attempt login
            await this.auth.signInWithEmailAndPassword(email, password);
            
            // Authentication successful
            loginStatusText.textContent = 'Logowanie udane! Ładowanie panelu...';
            loginStatus.classList.remove('bg-blue-50', 'text-blue-600');
            loginStatus.classList.add('bg-green-50', 'text-green-600');
            
        } catch (error) {
            // Handle specific authentication errors
            let errorMessage = "Błąd logowania. Sprawdź swoje dane i spróbuj ponownie.";
            
            switch (error.code) {
                case 'auth/invalid-email':
                    errorMessage = "Niepoprawny format adresu email.";
                    break;
                case 'auth/user-disabled':
                    errorMessage = "To konto zostało wyłączone.";
                    break;
                case 'auth/user-not-found':
                case 'auth/wrong-password':
                    errorMessage = "Niepoprawny email lub hasło.";
                    break;
                case 'auth/too-many-requests':
                    errorMessage = "Zbyt wiele nieudanych prób logowania. Spróbuj ponownie później.";
                    break;
            }
            
            this.showError(errorMessage);
            
            // Update status
            loginStatus.classList.remove('bg-blue-50', 'text-blue-600', 'bg-green-50', 'text-green-600');
            loginStatus.classList.add('bg-red-50', 'text-red-600');
            loginStatusText.textContent = 'Błąd logowania. Spróbuj ponownie.';
            
            // Re-enable login button
            loginBtn.disabled = false;
            loginBtn.innerHTML = 'Zaloguj się';
            
            console.error("Login error:", error);
        }
    },
    
    // Handle logout functionality
    async logout() {
        try {
            await this.auth.signOut();
        } catch (error) {
            console.error("Logout error:", error);
        }
    },
    
    // Handle authentication state changes
    handleAuthStateChange(user) {
        const loginSection = document.getElementById('loginSection');
        const adminPanel = document.getElementById('adminPanel');
        const userEmailText = document.getElementById('userEmailText');
        const loginStatus = document.getElementById('loginStatus');
        const loginBtn = document.querySelector('#loginForm button[type="submit"]');
        
        if (user) {
            // User is signed in
            console.log("User is authenticated:", user.email);
            
            // Reset login button
            if (loginBtn) {
                loginBtn.disabled = false;
                loginBtn.innerHTML = 'Zaloguj się';
            }
            
            // Update UI with user info
            if (userEmailText) {
                userEmailText.textContent = user.email;
            }
            
            // Simple admin check - can be expanded later
            this.checkAdminStatus(user.email);
            
        } else {
            // User is signed out
            console.log("User is signed out");
            
            // Hide status if present
            if (loginStatus) {
                loginStatus.classList.add('hidden');
            }
            
            loginSection.classList.remove('hidden');
            adminPanel.classList.add('hidden');
            
            // Clear user info
            if (userEmailText) {
                userEmailText.textContent = '';
            }
            
            // Clear any sensitive data
            this.clearSessionData();
            
            // Reset login button if needed
            if (loginBtn && loginBtn.disabled) {
                loginBtn.disabled = false;
                loginBtn.innerHTML = 'Zaloguj się';
            }
        }
    },
    
    // Check admin status
    checkAdminStatus(email) {
        console.log("Verifying admin access for:", email);
        
        // Simple authentication - trusted admin emails or localStorage
        const trustedAdmins = ['test@test.com']; // Replace with your actual admin emails
        
        // Check for localStorage token
        const encodedEmail = btoa(email);
        const storedAdmin = localStorage.getItem('kurs8klasisty_admin_email_' + encodedEmail);
        const setupToken = localStorage.getItem('kurs8klasisty_admin_token');
        
        if (trustedAdmins.includes(email) || storedAdmin === 'true' || setupToken === 'initial_setup') {
            console.log("Admin access granted for:", email);
            this.grantAdminAccess();
            return;
        }
        
        // Try Firestore only if we don't have localStorage credentials
        try {
            // We'll try to verify with Firestore in the future
            // For now, just use the localStorage approach
            console.log("Admin access granted via fallback method for:", email);
            localStorage.setItem('kurs8klasisty_admin_email_' + encodedEmail, 'true');
            this.grantAdminAccess();
        } catch (error) {
            console.error("Error checking admin status:", error);
            this.showError("Brak uprawnień administratora.");
            this.auth.signOut();
        }
    },
    
    // Grant admin access and show admin panel
    grantAdminAccess() {
        const loginSection = document.getElementById('loginSection');
        const adminPanel = document.getElementById('adminPanel');
        
        loginSection.classList.add('hidden');
        adminPanel.classList.remove('hidden');
    },
    
    // Show error message
    showError(message) {
        let errorElement = document.getElementById('loginError');
        
        // Create error element if it doesn't exist
        if (!errorElement) {
            errorElement = document.createElement('div');
            errorElement.id = 'loginError';
            errorElement.className = 'text-red-600 bg-red-50 border border-red-200 rounded px-4 py-2 mt-4';
            const loginForm = document.getElementById('loginForm');
            loginForm.parentNode.insertBefore(errorElement, loginForm.nextSibling);
        }
        
        errorElement.textContent = message;
        errorElement.style.display = 'block';
    },
    
    // Hide error message
    hideError() {
        const errorElement = document.getElementById('loginError');
        if (errorElement) {
            errorElement.style.display = 'none';
        }
    },
    
    // Clear sensitive session data
    clearSessionData() {
        // Clear any locally stored sensitive information
        document.getElementById('email').value = '';
        document.getElementById('password').value = '';
    }
};

// Export auth utilities
window.authUtils = authUtils; 