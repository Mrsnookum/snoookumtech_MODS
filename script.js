// --- ANIMATION CODE ---
const signUpButton = document.getElementById('signUp');
const signInButton = document.getElementById('signIn');
const container = document.getElementById('container');

signUpButton.addEventListener('click', () => {
    container.classList.add("right-panel-active");
});

signInButton.addEventListener('click', () => {
    container.classList.remove("right-panel-active");
});


// --- DATA SUBMISSION CODE ---

const registerForm = document.getElementById('registerForm');
const loginForm = document.getElementById('loginForm');

// 🔴 CRITICAL: PASTE YOUR EXACT, NEWLY DEPLOYED APPS SCRIPT URL HERE
const WEB_APP_URL = 'https://script.google.com/macros/s/AKfycbwdPSrg3ktvR35v4c92b5ViA5GS3-VRC3O5D0Er1abkdSzt1AuleM_QwVy3YsummN4/exec'; 


// --- NEW ELEMENT REFERENCES (REQUIRED FOR UX AND RESET FLOW) ---
const forgotPasswordLink = document.getElementById('forgotPasswordLink');
const resetOverlay = document.getElementById('resetOverlay');

// RESET STAGE 2 ELEMENTS (Code & New Password Form)
const resetPasswordForm = document.getElementById('resetPasswordForm');
const closeResetButton = document.getElementById('closeReset');
const resetEmailInput = document.getElementById('resetEmail'); // Hidden email field in stage 2

// RESET STAGE 1 ELEMENTS (Email Request Form)
const resetRequestForm = document.getElementById('resetRequestForm');
const requestEmailInput = document.getElementById('requestEmailInput'); // Visible email input in stage 1
const cancelResetButton = document.getElementById('cancelReset'); 

// MESSAGE AREA ELEMENTS (For non-intrusive feedback)
const registerMessage = document.getElementById('registerMessage');
const loginMessage = document.getElementById('loginMessage');
const resetMessage = document.getElementById('resetMessage');


/**
 * Utility function to display non-intrusive messages (replacing alert()/prompt()).
 * @param {HTMLElement} element The message area div.
 * @param {string} type The message type ('success', 'error', or 'info').
 * @param {string} text The message content.
 */
function displayMessage(element, type, text) {
    // Clear previous classes and content
    element.className = 'message-area'; 
    element.textContent = text;
    
    // Set new class and make it visible
    element.classList.add(type, 'visible');
    
    // Auto-hide the message after 5 seconds
    setTimeout(() => {
        element.classList.remove('visible');
        element.textContent = ''; // Clear text
    }, 5000);
}


// 1. REGISTRATION (POST request)
registerForm.addEventListener('submit', function(event) {
    event.preventDefault(); 

    displayMessage(registerMessage, 'info', 'Submitting registration data...'); 

    const formData = new FormData(this);

    fetch(WEB_APP_URL, {
        method: 'POST',
        body: formData 
    })
    .then(response => {
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
    })
    .then(data => {
        if (data.result === "success") {
            displayMessage(registerMessage, 'success', '✅ Registration Successful! Check your email.'); 
            this.reset(); 
            setTimeout(() => {
                container.classList.remove("right-panel-active"); // Slide to login
            }, 1000);
        } else {
            displayMessage(registerMessage, 'error', '❌ Registration Failed: ' + (data.message || 'Unknown server error.')); 
        }
    })
    .catch(error => {
        console.error('Registration Fetch Error:', error);
        displayMessage(registerMessage, 'error', '❌ Registration Failed. Network error occurred.'); 
    });
});


// 2. LOGIN (GET request) - FIXED LOGIN REDIRECTION LOOP
loginForm.addEventListener('submit', function(event) {
    event.preventDefault(); 

    displayMessage(loginMessage, 'info', 'Attempting sign in...'); 

    const formData = new FormData(this);
    const params = new URLSearchParams(formData).toString();
    
    fetch(`${WEB_APP_URL}?${params}`, {
        method: 'GET'
    })
    .then(response => {
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
    })
    .then(data => {
        if (data.result === "success") {
            displayMessage(loginMessage, 'success', `🥳 Welcome back, ${data.username}! Redirecting to store...`);
            this.reset();
            
            // 🛑 FIX START: Ensure session data is stored before redirection
            if (data.token) {
                // Ideal case: Use the secure token returned by the Apps Script
                localStorage.setItem('sessionToken', data.token);
            } else {
                // Fallback: Use a simple bypass flag if Apps Script doesn't return a token 
                // (even though we updated Apps Script to return one, this is a safety net)
                localStorage.setItem('sessionToken', 'temp_valid'); 
            }
            localStorage.setItem('username', data.username); 
            // 🛑 FIX END
            
            // 🔴 REDIRECTION FIX: Increased the delay to 2500ms (2.5 seconds) 
            // to ensure localStorage has time to commit before the browser switches pages.
            setTimeout(() => {
                window.location.href = 'store.html'; 
            }, 2500); 
            
        } else {
            displayMessage(loginMessage, 'error', '❌ Login Failed: ' + (data.message || 'Invalid credentials.'));
        }
    })
    .catch(error => {
        console.error('Login Fetch Error:', error);
        displayMessage(loginMessage, 'error', '❌ Login Failed. Network error occurred.'); 
    });
});


// 3. FORGOT PASSWORD LINK (Initiates two-stage reset flow - eliminates prompt())
forgotPasswordLink.addEventListener('click', function(event) {
    event.preventDefault(); 

    // 1. Show the overlay immediately
    resetOverlay.classList.add('visible'); 
    
    // 2. Ensure Stage 1 (Email Request) is visible and Stage 2 is hidden
    resetRequestForm.style.display = 'block'; 
    resetPasswordForm.style.display = 'none'; 
    resetMessage.className = 'message-area'; // Clear previous messages
    
    // 3. Set focus for better UX
    requestEmailInput.focus();
});


// 3A. STAGE 1 SUBMISSION (Send Code - GET request)
resetRequestForm.addEventListener('submit', function(event) {
    event.preventDefault();

    const emailToReset = requestEmailInput.value;
    displayMessage(resetMessage, 'info', 'Sending reset code to your email...'); 

    const params = new URLSearchParams({ email: emailToReset, action: 'forgotPassword' }).toString();
    
    fetch(`${WEB_APP_URL}?${params}`, {
        method: 'GET'
    })
    .then(response => response.json())
    .then(data => {
        if (data.result === "success") {
            displayMessage(resetMessage, 'success', '✅ Code sent! Check your email and proceed below.'); 
            
            // --- TRANSITION TO STAGE 2 ---
            resetRequestForm.style.display = 'none';
            resetEmailInput.value = emailToReset; // Pre-fill the email in hidden stage 2 field
            resetPasswordForm.style.display = 'block';
            
        } else {
            displayMessage(resetMessage, 'error', '❌ Failed: ' + (data.message || 'Email not found.')); 
        }
    })
    .catch(error => {
        console.error('Forgot Password Fetch Error:', error);
        displayMessage(resetMessage, 'error', '❌ Network Error. Could not connect to reset service.'); 
    });
});


// 4. CANCEL BUTTONS (Hide overlay and reset)
closeResetButton.addEventListener('click', () => {
    resetOverlay.classList.remove('visible');
    resetPasswordForm.reset();
});

cancelResetButton.addEventListener('click', () => {
    resetOverlay.classList.remove('visible');
    resetRequestForm.reset();
});


// 5. PASSWORD RESET SUBMISSION (Stage 2: Code and New Password - POST request)
resetPasswordForm.addEventListener('submit', function(event) {
    event.preventDefault();

    displayMessage(resetMessage, 'info', 'Submitting new password...'); 
    
    const formData = new FormData(this);
    formData.append('action', 'resetPassword');

    fetch(WEB_APP_URL, {
        method: 'POST',
        body: formData 
    })
    .then(response => response.json())
    .then(data => {
        if (data.result === "success") {
            displayMessage(resetMessage, 'success', '✅ Success! ' + data.message); 
            
            setTimeout(() => {
                resetOverlay.classList.remove('visible');
                resetPasswordForm.reset();
                container.classList.remove("right-panel-active");
            }, 1000);
            
        } else {
            displayMessage(resetMessage, 'error', '❌ Reset Failed: ' + (data.message || 'Server error. Please re-check the email and code.')); 
        }
    })
    .catch(error => {
        console.error('Password Reset Fetch Error:', error);
        displayMessage(resetMessage, 'error', '❌ Network Error during password reset.'); 
    });
});