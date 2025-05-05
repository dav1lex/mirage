/**
 * Admin Setup Script
 * Simple script to set up admin access for the blog.
 */

// Function to set up admin user
async function setupAdminUser() {
    console.log("Starting admin setup...");
    
    try {
        // Get current user
        const user = firebase.auth().currentUser;
        
        if (!user) {
            alert('⚠️ Musisz być zalogowany, aby skonfigurować administratora.');
            return false;
        }
        
        console.log(`Setting up admin access for: ${user.email}`);
        
        // First try to save to Firestore if we have access
        try {
            const db = firebase.firestore();
            await db.collection('users').doc(user.uid).set({
                email: user.email,
                isAdmin: true,
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
            }, { merge: true });
            console.log('✅ Admin entry created in Firestore database!');
        } catch (dbError) {
            console.warn("Could not save to Firestore:", dbError.message);
        }
        
        // Always set up localStorage fallback for simpler access
        const encodedEmail = btoa(user.email);
        localStorage.setItem('kurs8klasisty_admin_email_' + encodedEmail, 'true');
        localStorage.setItem('kurs8klasisty_admin_token', 'initial_setup');
        
        console.log('✅ Admin access set up successfully!');
        
        alert(`
✅ Gotowe! Uprawnienia administratora zostały skonfigurowane.

Email: ${user.email}

Odśwież stronę, jeśli nie widzisz panelu administratora.`);
        
        return true;
    } catch (error) {
        console.error('Error setting up admin:', error);
        alert(`❌ Błąd konfiguracji: ${error.message}`);
        return false;
    }
}

// Expose the function globally
window.setupAdminUser = setupAdminUser;

// Show instructions in console
console.log(`
===== ADMIN SETUP SCRIPT =====

This script will create the necessary Firestore documents for admin access.
To use this script:

1. Log in with your admin account credentials
2. Click the "Setup Admin User" button at the bottom right
3. Update your Firebase security rules to match the recommended rules

Or run the function manually with: setupAdminUser()
`); 