document.addEventListener("DOMContentLoaded", () => {
  // Set up theme toggle
  setupThemeToggle();
  
  // Set up login form
  const loginForm = document.getElementById("login-form");
  if (loginForm) {
    console.log("Login form found, adding event listener");
    loginForm.onsubmit = async (e) => {
      e.preventDefault();
      const email = document.getElementById("email").value;
      const password = document.getElementById("password").value;
      const errorMessage = document.querySelector(".form-error");
      const btn = e.target.querySelector("button[type='submit']");
      if (!btn.dataset.originalText) btn.dataset.originalText = btn.textContent;

      if (!email || !password) {
        animateMessage(errorMessage, "Please enter both email and password");
        return;
      }
      showLoadingButton(btn, true);
      // Use localStorage for authentication
      const users = JSON.parse(localStorage.getItem("users")) || [];
      const user = users.find(u => u.email === email && u.password === password);
      if (user) {
        const userData = {
          id: user.id,
          username: user.username,
          fullname: user.fullname,
          email: user.email
        };
        localStorage.setItem("currentUser", JSON.stringify(userData));
        animateMessage(errorMessage, "Login successful! Redirecting...", false);
        setTimeout(() => {
          window.location.href = "profile.html";
        }, 800);
      } else {
        animateMessage(errorMessage, "Invalid email or password");
      }
      showLoadingButton(btn, false);
    };
  }
  
  // Set up register form
  const registerForm = document.getElementById("register-form");
  if (registerForm) {
    console.log("Register form found, adding event listener");
    registerForm.addEventListener("submit", handleRegister);
    
    // Set up password strength meter
    const passwordInput = document.getElementById("password");
    if (passwordInput) {
      passwordInput.addEventListener("input", updatePasswordStrength);
    }
    
    // Check password confirmation match
    const confirmPasswordInput = document.getElementById("confirm");
    if (confirmPasswordInput) {
      confirmPasswordInput.addEventListener("input", checkPasswordMatch);
    }
  }
  
  // Set up social login buttons
  const socialButtons = document.querySelectorAll(".social-btn");
  socialButtons.forEach(button => {
    button.addEventListener("click", handleSocialLogin);
  });
  
  // Check if user is already logged in
  checkLoginStatus();
  
  // Check for authentication errors
  const urlParams = new URLSearchParams(window.location.search);
  const error = urlParams.get('error');
  
  if (error) {
    const errorMessage = document.getElementById("error-message");
    if (errorMessage) {
      if (error === 'google_auth_failed') {
        errorMessage.textContent = "Google authentication failed. Please try again.";
      } else if (error === 'google_user_info_failed') {
        errorMessage.textContent = "Failed to get user information from Google. Please try again.";
      }
    }
  }

  // Setup password toggles
  setupPasswordToggles();
});

function setupThemeToggle() {
  const themeToggle = document.getElementById('theme-toggle');
  if (!themeToggle) return;
  
  // Check for saved theme preference
  const savedTheme = localStorage.getItem('theme');
  if (savedTheme === 'light') {
    document.body.classList.add('light-theme');
    themeToggle.textContent = '☀️';
  }
  
  // Theme toggle button event listener
  themeToggle.addEventListener('click', () => {
    document.body.classList.toggle('light-theme');
    
    if (document.body.classList.contains('light-theme')) {
      localStorage.setItem('theme', 'light');
      themeToggle.textContent = '☀️';
    } else {
      localStorage.setItem('theme', 'dark');
      themeToggle.textContent = '🌙';
    }
  });
}

function showLoadingButton(btn, loading = true) {
  if (!btn) return;
  if (loading) {
    btn.disabled = true;
    btn.innerHTML = '<span class="spinner"></span> Loading...';
  } else {
    btn.disabled = false;
    btn.innerHTML = btn.dataset.originalText || 'Submit';
  }
}

function animateMessage(element, message, isError = true) {
  if (!element) return;
  element.textContent = message;
  element.style.opacity = 0;
  element.style.transition = 'opacity 0.4s';
  element.style.color = isError ? '#ff4d4d' : '#28a745';
  setTimeout(() => { element.style.opacity = 1; }, 50);
  setTimeout(() => { element.style.opacity = 0; }, 3000);
}

async function handleRegister(e) {
  e.preventDefault();
  let btn = null;
  try {
    // Get form elements
    const emailInput = document.getElementById("email");
    const passwordInput = document.getElementById("password");
    const confirmInput = document.getElementById("confirm");
    const errorMessage = document.querySelector(".form-error");
    btn = e.target.querySelector("button[type='submit']");

    // Check if required elements exist
    if (!emailInput || !passwordInput || !confirmInput || !errorMessage || !btn) {
      console.error("Required form elements not found");
      return;
    }

    const email = emailInput.value;
    const password = passwordInput.value;
    const confirmPassword = confirmInput.value;

    if (!btn.dataset.originalText) {
      btn.dataset.originalText = btn.textContent;
    }

    // Validation
    if (!email || !password) {
      animateMessage(errorMessage, "Please fill in all fields");
      return;
    }
    if (password !== confirmPassword) {
      animateMessage(errorMessage, "Passwords do not match");
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      animateMessage(errorMessage, "Please enter a valid email address");
      return;
    }
    if (getPasswordStrength(password) < 2) {
      animateMessage(errorMessage, "Password is too weak. Please use a stronger password");
      return;
    }

    showLoadingButton(btn, true);

    // Get existing users
    const users = JSON.parse(localStorage.getItem("users")) || [];
    if (users.some(user => user.email === email)) {
      animateMessage(errorMessage, "Email already exists");
      showLoadingButton(btn, false);
      return;
    }

    // Create new user
    const newUser = {
      id: Date.now().toString(),
      email,
      username: email.split('@')[0], // Generate username from email
      fullname: email.split('@')[0], // Use email username as fullname initially
      password,
      createdAt: new Date().toISOString()
    };

    // Save user data
    users.push(newUser);
    localStorage.setItem("users", JSON.stringify(users));

    // Set current user
    const userData = {
      id: newUser.id,
      username: newUser.username,
      fullname: newUser.fullname,
      email: newUser.email
    };
    localStorage.setItem("currentUser", JSON.stringify(userData));

    // Show success message
    animateMessage(errorMessage, "Registration successful! Redirecting...", false);

    // Wait for message to be shown before redirecting
    await new Promise(resolve => setTimeout(resolve, 800));
    window.location.href = "profile.html";

  } catch (error) {
    console.error("Registration error:", error);
    const errorMessage = document.querySelector(".form-error");
    if (errorMessage) {
      animateMessage(errorMessage, "An error occurred during registration. Please try again.");
    }
    if (btn) {
      showLoadingButton(btn, false);
    }
  }
}

// Google OAuth configuration
const googleConfig = {
  client_id: '123456789012-abcdefghijklmnopqrstuvwxyz123456.apps.googleusercontent.com', // Replace with your actual client ID
  redirect_uri: window.location.origin + '/google-callback.html',
  scope: 'email profile',
  response_type: 'token'
};

function handleSocialLogin(e) {
  e.preventDefault();
  const provider = e.currentTarget.classList.contains('google') ? 'google' : 'facebook';
  
  if (provider === 'google') {
    // Initiate Google OAuth flow
    initiateGoogleLogin();
  } else {
    // Facebook login not implemented
    const errorMessage = document.getElementById("error-message");
    errorMessage.textContent = "Facebook login is not implemented in this demo";
  }
}

function initiateGoogleLogin() {
  // Build the OAuth URL
  const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
    `client_id=${encodeURIComponent(googleConfig.client_id)}` +
    `&redirect_uri=${encodeURIComponent(googleConfig.redirect_uri)}` +
    `&scope=${encodeURIComponent(googleConfig.scope)}` +
    `&response_type=${encodeURIComponent(googleConfig.response_type)}` +
    `&prompt=select_account`;
  
  // Open the OAuth window
  window.location.href = authUrl;
}

function handleGoogleCallback() {
  // Check if we're on the callback page
  if (window.location.pathname.includes('google-callback.html')) {
    // Parse the access token from the URL hash
    const hash = window.location.hash.substring(1);
    const params = new URLSearchParams(hash);
    const accessToken = params.get('access_token');
    
    if (accessToken) {
      // Fetch user info from Google
      fetchGoogleUserInfo(accessToken);
    } else {
      // Handle error
      console.error('No access token received from Google');
      window.location.href = 'login.html?error=google_auth_failed';
    }
  }
}

function fetchGoogleUserInfo(accessToken) {
  fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
    headers: {
      'Authorization': `Bearer ${accessToken}`
    }
  })
  .then(response => response.json())
  .then(data => {
    // Create or update user in our system
    handleGoogleUser(data);
  })
  .catch(error => {
    console.error('Error fetching Google user info:', error);
    window.location.href = 'login.html?error=google_user_info_failed';
  });
}

function handleGoogleUser(googleUser) {
  // Get users from localStorage
  const users = JSON.parse(localStorage.getItem("users")) || [];
  
  // Check if user already exists
  let user = users.find(u => u.email === googleUser.email);
  
  if (!user) {
    // Create new user
    user = {
      id: Date.now().toString(),
      fullname: googleUser.name,
      email: googleUser.email,
      username: googleUser.email.split('@')[0],
      googleId: googleUser.id,
      picture: googleUser.picture,
      createdAt: new Date().toISOString()
    };
    
    // Add user to localStorage
    users.push(user);
    localStorage.setItem("users", JSON.stringify(users));
  }
  
  // Login successful
  const userData = {
    id: user.id,
    username: user.username,
    fullname: user.fullname,
    email: user.email,
    picture: user.picture
  };
  
  // Store user data in localStorage
  localStorage.setItem("currentUser", JSON.stringify(userData));
  
  // Redirect to home page
  window.location.href = "profile.html";
}

function updatePasswordStrength() {
  const password = document.getElementById("password").value;
  const strengthBar = document.querySelector(".strength-bar");
  const strengthText = document.querySelector(".strength-text");
  
  if (!strengthBar || !strengthText) return;
  
  const strength = getPasswordStrength(password);
  
  // Update strength bar width
  strengthBar.style.width = `${(strength / 4) * 100}%`;
  
  // Update strength bar color and text
  if (strength === 0) {
    strengthBar.style.backgroundColor = "#dc3545";
    strengthText.textContent = "Very weak";
  } else if (strength === 1) {
    strengthBar.style.backgroundColor = "#ffc107";
    strengthText.textContent = "Weak";
  } else if (strength === 2) {
    strengthBar.style.backgroundColor = "#fd7e14";
    strengthText.textContent = "Medium";
  } else if (strength === 3) {
    strengthBar.style.backgroundColor = "#20c997";
    strengthText.textContent = "Strong";
  } else {
    strengthBar.style.backgroundColor = "#28a745";
    strengthText.textContent = "Very strong";
  }
}

function getPasswordStrength(password) {
  let strength = 0;
  
  // Length check
  if (password.length >= 8) strength += 1;
  
  // Contains lowercase and uppercase
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength += 1;
  
  // Contains numbers
  if (/\d/.test(password)) strength += 1;
  
  // Contains special characters
  if (/[^a-zA-Z0-9]/.test(password)) strength += 1;
  
  return strength;
}

function checkPasswordMatch() {
  const password = document.getElementById("password").value;
  const confirmPassword = document.getElementById("confirm").value;
  const errorMessage = document.getElementById("error-message");
  
  if (confirmPassword && password !== confirmPassword) {
    errorMessage.textContent = "Passwords do not match";
  } else {
    errorMessage.textContent = "";
  }
}

function checkLoginStatus() {
  // Check if user is logged in
  const currentUser = JSON.parse(localStorage.getItem("currentUser")) || JSON.parse(sessionStorage.getItem("currentUser"));
  
  // Update login/logout link in all pages
  const loginLink = document.getElementById("login-link");
  if (loginLink) {
    if (currentUser) {
      // Create user profile display
      const nav = loginLink.parentElement;
      
      // Create profile container
      const profileContainer = document.createElement("div");
      profileContainer.className = "user-profile";
      
      // Add profile picture if available, otherwise use first letter of name
      if (currentUser.picture) {
        profileContainer.innerHTML = `
          <img src="${currentUser.picture}" alt="${currentUser.fullname}" class="profile-pic">
          <span>${currentUser.fullname}</span>
          <a href="#" id="logout-btn">Logout</a>
        `;
      } else {
        const initials = currentUser.fullname.charAt(0).toUpperCase();
        profileContainer.innerHTML = `
          <div class="profile-initial">${initials}</div>
          <span>${currentUser.fullname}</span>
          <a href="#" id="logout-btn">Logout</a>
        `;
      }
      
      // Replace login link with profile and profile link
      const profileLink = document.createElement("a");
      profileLink.href = "profile.html";
      profileLink.textContent = "Profile";
      profileLink.id = "profile-link";
      nav.replaceChild(profileContainer, loginLink);
      nav.insertBefore(profileLink, profileContainer);
      
      // Add logout event listener
      document.getElementById("logout-btn").addEventListener("click", (e) => {
        e.preventDefault();
        logout();
      });
    } else {
      loginLink.textContent = "Login";
      loginLink.href = "login.html";
    }
  }
}

function logout() {
  // Clear user data from storage
  localStorage.removeItem("currentUser");
  sessionStorage.removeItem("currentUser");
  
  // Redirect to home page
  window.location.href = "index.html";
}

// Check if we're on the callback page
if (window.location.pathname.includes('google-callback.html')) {
  handleGoogleCallback();
}

// Sign up
async function signUp(email, password) {
  const { data, error } = await supabase.auth.signUp({ email, password });
  if (error) alert(error.message);
  return data;
}

// Sign in
async function signIn(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) alert(error.message);
  return data;
}

// Get current user
async function getCurrentUser() {
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

// Add spinner CSS
if (!document.getElementById('auth-spinner-style')) {
  const style = document.createElement('style');
  style.id = 'auth-spinner-style';
  style.innerHTML = `.spinner { display: inline-block; width: 20px; height: 20px; border: 3px solid #fff; border-radius: 50%; border-top: 3px solid #e50914; animation: spin 1s linear infinite; vertical-align: middle; margin-right: 8px; } @keyframes spin { to { transform: rotate(360deg); } }`;
  document.head.appendChild(style);
}

// Helper: Validate email format
function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// Helper: Validate password strength
function isStrongPassword(password) {
  return password.length >= 8 && /[A-Za-z]/.test(password) && /[0-9]/.test(password);
}

// Show/hide password toggle
function setupPasswordToggles() {
  document.querySelectorAll('.password-toggle').forEach(toggle => {
    toggle.onclick = function() {
      const input = this.previousElementSibling;
      if (input.type === 'password') {
        input.type = 'text';
        this.textContent = '🙈';
      } else {
        input.type = 'password';
        this.textContent = '👁️';
      }
    };
  });
}




