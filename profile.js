const API_KEY = "8ddfd56d"; // Same API key as other pages

document.addEventListener("DOMContentLoaded", () => {
  // Check if user is logged in
  const currentUser = JSON.parse(localStorage.getItem("currentUser")) || JSON.parse(sessionStorage.getItem("currentUser"));
  
  if (!currentUser) {
    // Redirect to login page if not logged in
    window.location.href = "login.html";
    return;
  }
  
  // Set up theme toggle
  setupThemeToggle();
  
  // Load user data
  loadUserProfile(currentUser);
  
  // Set up tab navigation
  setupTabs();
  
  // Set up form submission
  document.getElementById("profile-form").addEventListener("submit", updateProfile);
  
  // Set up password strength meter
  const newPasswordInput = document.getElementById("new-password");
  if (newPasswordInput) {
    newPasswordInput.addEventListener("input", updatePasswordStrength);
  }
  
  // Set up password confirmation match
  const confirmPasswordInput = document.getElementById("confirm-password");
  if (confirmPasswordInput) {
    confirmPasswordInput.addEventListener("input", checkPasswordMatch);
  }
  
  // Set up profile picture change
  document.getElementById("change-picture-btn").addEventListener("click", () => {
    document.getElementById("picture-upload").click();
  });
  
  document.getElementById("picture-upload").addEventListener("change", handleProfilePictureUpload);
  
  // Set up preferences save
  document.getElementById("save-preferences").addEventListener("click", savePreferences);
  
  // Load user activity
  loadRecentlyViewed();
  loadUserRatings();
  loadUserComments();
  
  // Load user preferences
  loadUserPreferences();
  
  // Add logout button logic with debugging
  const logoutBtn = document.getElementById("logout-btn");
  if (logoutBtn) {
    console.log("Logout button found");
    logoutBtn.addEventListener("click", () => {
      console.log("Logout button clicked");
      try {
        // Clear all user-related data
        localStorage.removeItem("currentUser");
        sessionStorage.removeItem("currentUser");
        localStorage.removeItem("watchlist");
        sessionStorage.removeItem("watchlist");
        
        // Clear any other user-related data
        const keysToRemove = [];
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key.startsWith("user_") || key.includes("user")) {
            keysToRemove.push(key);
          }
        }
        keysToRemove.forEach(key => localStorage.removeItem(key));
        
        console.log("User data cleared successfully");
        
        // Force reload to clear any cached data
        window.location.href = "login.html";
      } catch (error) {
        console.error("Error during logout:", error);
        alert("There was an error logging out. Please try again.");
      }
    });
  } else {
    console.error("Logout button not found in the DOM");
  }
});

function setupThemeToggle() {
  const themeToggle = document.getElementById('theme-toggle');
  
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

function setupTabs() {
  const tabButtons = document.querySelectorAll(".tab-btn");
  const tabContents = document.querySelectorAll(".tab-content");
  
  tabButtons.forEach(button => {
    button.addEventListener("click", () => {
      tabButtons.forEach(btn => btn.classList.remove("active"));
      tabContents.forEach(content => {
        content.classList.remove("active");
        content.style.opacity = 0;
      });
      button.classList.add("active");
      const tabId = button.getAttribute("data-tab");
      const tab = document.getElementById(`${tabId}-tab`);
      tab.classList.add("active");
      setTimeout(() => { tab.style.opacity = 1; }, 50);
    });
  });
}

function loadUserProfile(user) {
  // Get full user data from localStorage
  const users = JSON.parse(localStorage.getItem("users")) || [];
  const fullUserData = users.find(u => u.id === user.id) || user;
  
  // Set profile picture or initials
  const profilePicture = document.getElementById("profile-picture");
  if (user.picture) {
    profilePicture.innerHTML = `<img src="${user.picture}" alt="${user.fullname}">`;
  } else {
    const initials = user.fullname.charAt(0).toUpperCase();
    profilePicture.innerHTML = `<div class="profile-initial">${initials}</div>`;
  }
  
  // Set profile info
  document.getElementById("profile-name").textContent = user.fullname;
  document.getElementById("profile-email").textContent = user.email;
  
  // Format joined date
  const joinedDate = fullUserData.createdAt ? new Date(fullUserData.createdAt) : new Date();
  document.getElementById("profile-joined").textContent = `Member since: ${joinedDate.toLocaleDateString()}`;
  
  // Fill form fields
  document.getElementById("fullname").value = user.fullname;
  document.getElementById("username").value = user.username;
  document.getElementById("email").value = user.email;
}

function showLoadingButton(btn, loading = true) {
  if (!btn) return;
  if (loading) {
    btn.disabled = true;
    btn.innerHTML = '<span class="spinner"></span> Saving...';
  } else {
    btn.disabled = false;
    btn.innerHTML = btn.dataset.originalText || 'Save Changes';
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

function updateProfile(e) {
  e.preventDefault();
  const fullname = document.getElementById("fullname").value;
  const username = document.getElementById("username").value;
  const email = document.getElementById("email").value;
  const currentPassword = document.getElementById("current-password").value;
  const newPassword = document.getElementById("new-password").value;
  const confirmPassword = document.getElementById("confirm-password").value;
  const errorMessage = document.getElementById("error-message");
  const btn = e.target.querySelector("button[type='submit']");
  if (!btn.dataset.originalText) btn.dataset.originalText = btn.textContent;

  // Get current user
  const currentUser = JSON.parse(localStorage.getItem("currentUser")) || JSON.parse(sessionStorage.getItem("currentUser"));
  // Get all users
  const users = JSON.parse(localStorage.getItem("users")) || [];
  const userIndex = users.findIndex(u => u.id === currentUser.id);
  if (userIndex === -1) {
    animateMessage(errorMessage, "User not found");
    return;
  }
  if (username !== currentUser.username && users.some(u => u.username === username && u.id !== currentUser.id)) {
    animateMessage(errorMessage, "Username already taken");
    return;
  }
  if (email !== currentUser.email && users.some(u => u.email === email && u.id !== currentUser.id)) {
    animateMessage(errorMessage, "Email already in use");
    return;
  }
  // Update basic info
  users[userIndex].fullname = fullname;
  users[userIndex].username = username;
  users[userIndex].email = email;
  // Update password if provided
  if (currentPassword && newPassword) {
    if (!users[userIndex].googleId && users[userIndex].password !== currentPassword) {
      animateMessage(errorMessage, "Current password is incorrect");
      return;
    }
    if (newPassword !== confirmPassword) {
      animateMessage(errorMessage, "New passwords do not match");
      return;
    }
    if (getPasswordStrength(newPassword) < 2) {
      animateMessage(errorMessage, "New password is too weak");
      return;
    }
    users[userIndex].password = newPassword;
  }
  showLoadingButton(btn, true);
  setTimeout(() => {
    localStorage.setItem("users", JSON.stringify(users));
    const updatedUser = {
      id: currentUser.id,
      username: username,
      fullname: fullname,
      email: email,
      picture: currentUser.picture
    };
    if (localStorage.getItem("currentUser")) {
      localStorage.setItem("currentUser", JSON.stringify(updatedUser));
    } else {
      sessionStorage.setItem("currentUser", JSON.stringify(updatedUser));
    }
    animateMessage(errorMessage, "Profile updated successfully", false);
    document.getElementById("current-password").value = "";
    document.getElementById("new-password").value = "";
    document.getElementById("confirm-password").value = "";
    document.getElementById("profile-name").textContent = fullname;
    document.getElementById("profile-email").textContent = email;
    showLoadingButton(btn, false);
  }, 900);
}

function handleProfilePictureUpload(e) {
  const file = e.target.files[0];
  if (!file) return;
  if (!file.type.match('image.*')) {
    alert('Please select an image file');
    return;
  }
  if (file.size > 2 * 1024 * 1024) {
    alert('Image size should be less than 2MB');
    return;
  }
  const reader = new FileReader();
  reader.onload = function(event) {
    const currentUser = JSON.parse(localStorage.getItem("currentUser")) || JSON.parse(sessionStorage.getItem("currentUser"));
    const profilePicture = document.getElementById("profile-picture");
    profilePicture.innerHTML = `<img src="${event.target.result}" alt="${currentUser.fullname}">`;
    // Save to user data
    const users = JSON.parse(localStorage.getItem("users")) || [];
    const userIndex = users.findIndex(u => u.id === currentUser.id);
    if (userIndex !== -1) {
      users[userIndex].picture = event.target.result;
      localStorage.setItem("users", JSON.stringify(users));
    }
    currentUser.picture = event.target.result;
    localStorage.setItem("currentUser", JSON.stringify(currentUser));
  };
  reader.readAsDataURL(file);
}

function updatePasswordStrength() {
  const password = document.getElementById("new-password").value;
  const strengthBar = document.querySelector(".strength-bar");
  const strengthText = document.querySelector(".strength-text");
  
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
  const newPassword = document.getElementById("new-password").value;
  const confirmPassword = document.getElementById("confirm-password").value;
  const errorMessage = document.getElementById("error-message");
  
  if (confirmPassword && newPassword !== confirmPassword) {
    errorMessage.textContent = "Passwords do not match";
  } else {
    errorMessage.textContent = "";
  }
}

function savePreferences() {
  // Get current user
  const currentUser = JSON.parse(localStorage.getItem("currentUser")) || JSON.parse(sessionStorage.getItem("currentUser"));
  
  // Get all users
  const users = JSON.parse(localStorage.getItem("users")) || [];
  const userIndex = users.findIndex(u => u.id === currentUser.id);
  
  if (userIndex === -1) return;
  
  // Get selected genres
  const selectedGenres = [];
  document.querySelectorAll('input[name="genre"]:checked').forEach(checkbox => {
    selectedGenres.push(checkbox.value);
  });
  
  // Get content rating preference
  const contentRating = document.getElementById("content-rating").value;
  
  // Get notification preferences
  const emailNotifications = document.getElementById("email-notifications").checked;
  const browserNotifications = document.getElementById("browser-notifications").checked;
  
  // Create preferences object
  const preferences = {
    genres: selectedGenres,
    contentRating: contentRating,
    notifications: {
      email: emailNotifications,
      browser: browserNotifications
    }
  };
  
  // Update user preferences
  users[userIndex].preferences = preferences;
  localStorage.setItem("users", JSON.stringify(users));
  
  // Show success message
  alert("Preferences saved successfully");
}

function loadUserPreferences() {
  // Get current user
  const currentUser = JSON.parse(localStorage.getItem("currentUser")) || JSON.parse(sessionStorage.getItem("currentUser"));
  
  // Get all users
  const users = JSON.parse(localStorage.getItem("users")) || [];
  const user = users.find(u => u.id === currentUser.id);
  
  if (!user || !user.preferences) return;
  
  // Set genre checkboxes
  if (user.preferences.genres) {
    user.preferences.genres.forEach(genre => {
      const checkbox = document.querySelector(`input[name="genre"][value="${genre}"]`);
      if (checkbox) checkbox.checked = true;
    });
  }
  
  // Set content rating
  if (user.preferences.contentRating) {
    document.getElementById("content-rating").value = user.preferences.contentRating;
  }
  
  // Set notification preferences
  if (user.preferences.notifications) {
    document.getElementById("email-notifications").checked = user.preferences.notifications.email;
    document.getElementById("browser-notifications").checked = user.preferences.notifications.browser;
  }
}

function loadRecentlyViewed() {
  // Get current user
  const currentUser = JSON.parse(localStorage.getItem("currentUser")) || JSON.parse(sessionStorage.getItem("currentUser"));
  
  // Get recently viewed movies from localStorage
  const recentlyViewed = JSON.parse(localStorage.getItem(`recentlyViewed-${currentUser.id}`)) || [];
  const recentlyViewedContainer = document.getElementById("recently-viewed");
  
  if (recentlyViewed.length === 0) {
    recentlyViewedContainer.innerHTML = '<p class="empty-message">No recently viewed movies</p>';
    return;
  }
  
  // Clear container
  recentlyViewedContainer.innerHTML = '';
  
  // Display recently viewed movies (most recent first)
  const recentMovies = recentlyViewed.slice(0, 5).reverse();
  
  // Fetch movie details for each ID
  Promise.all(recentMovies.map(movieId => 
    fetch(`https://www.omdbapi.com/?i=${movieId}&apikey=${API_KEY}`)
      .then(res => res.json())
  ))
  .then(movies => {
    movies.forEach(movie => {
      const movieItem = document.createElement('div');
      movieItem.className = 'activity-item';
      movieItem.innerHTML = `
        <img src="${movie.Poster !== 'N/A' ? movie.Poster : 'https://via.placeholder.com/50x75?text=No+Image'}" alt="${movie.Title}">
        <div class="activity-details">
          <h5><a href="movie-details.html?id=${movie.imdbID}">${movie.Title}</a></h5>
          <p>Viewed on ${new Date().toLocaleDateString()}</p>
        </div>
      `;
      recentlyViewedContainer.appendChild(movieItem);
    });
  })
  .catch(err => {
    console.error("Error fetching recently viewed movies:", err);
    recentlyViewedContainer.innerHTML = '<p class="empty-message">Error loading recently viewed movies</p>';
  });
}

function loadUserRatings() {
  // Get current user
  const currentUser = JSON.parse(localStorage.getItem("currentUser")) || JSON.parse(sessionStorage.getItem("currentUser"));
  
  // Get user ratings from localStorage
  const userRatings = JSON.parse(localStorage.getItem(`ratings-${currentUser.id}`)) || {};
  const userRatingsContainer = document.getElementById("user-ratings");
  
  if (Object.keys(userRatings).length === 0) {
    userRatingsContainer.innerHTML = '<p class="empty-message">No ratings yet</p>';
    return;
  }
  
  // Clear container
  userRatingsContainer.innerHTML = '';
  
  // Convert to array and sort by date (most recent first)
  const ratingsArray = Object.entries(userRatings).map(([movieId, rating]) => ({
    movieId,
    rating: rating.rating,
    date: rating.date
  }));
  
  ratingsArray.sort((a, b) => new Date(b.date) - new Date(a.date));
  
  // Display user ratings (most recent first)
  const recentRatings = ratingsArray.slice(0, 5);
  
  // Fetch movie details for each ID
  Promise.all(recentRatings.map(rating => 
    fetch(`https://www.omdbapi.com/?i=${rating.movieId}&apikey=${API_KEY}`)
      .then(res => res.json())
  ))
  .then(movies => {
    movies.forEach((movie, index) => {
      const rating = recentRatings[index];
      const movieItem = document.createElement('div');
      movieItem.className = 'activity-item';
      movieItem.innerHTML = `
        <img src="${movie.Poster !== 'N/A' ? movie.Poster : 'https://via.placeholder.com/50x75?text=No+Image'}" alt="${movie.Title}">
        <div class="activity-details">
          <h5><a href="movie-details.html?id=${movie.imdbID}">${movie.Title}</a></h5>
          <p>Your rating: ${'★'.repeat(rating.rating)}${'☆'.repeat(5-rating.rating)}</p>
          <p>Rated on ${new Date(rating.date).toLocaleDateString()}</p>
        </div>
      `;
      userRatingsContainer.appendChild(movieItem);
    });
  })
  .catch(err => {
    console.error("Error fetching user ratings:", err);
    userRatingsContainer.innerHTML = '<p class="empty-message">Error loading ratings</p>';
  });
}

function loadUserComments() {
  // Get current user
  const currentUser = JSON.parse(localStorage.getItem("currentUser")) || JSON.parse(sessionStorage.getItem("currentUser"));
  
  // Get user comments from localStorage
  const allComments = JSON.parse(localStorage.getItem("movieComments")) || {};
  const userCommentsContainer = document.getElementById("user-comments");
  
  // Filter comments by current user
  const userComments = [];
  
  Object.entries(allComments).forEach(([movieId, comments]) => {
    comments.forEach(comment => {
      if (comment.userId === currentUser.id) {
        userComments.push({
          movieId,
          text: comment.text,
          date: comment.date
        });
      }
    });
  });
  
  if (userComments.length === 0) {
    userCommentsContainer.innerHTML = '<p class="empty-message">No comments yet</p>';
    return;
  }
  
  // Clear container
  userCommentsContainer.innerHTML = '';
  
  // Sort by date (most recent first)
  userComments.sort((a, b) => new Date(b.date) - new Date(a.date));
  
  // Display user comments (most recent first)
  const recentComments = userComments.slice(0, 5);
  
  // Fetch movie details for each ID
  Promise.all(recentComments.map(comment => 
    fetch(`https://www.omdbapi.com/?i=${comment.movieId}&apikey=${API_KEY}`)
      .then(res => res.json())
  ))
  .then(movies => {
    movies.forEach((movie, index) => {
      const comment = recentComments[index];
      const movieItem = document.createElement('div');
      movieItem.className = 'activity-item';
      movieItem.innerHTML = `
        <img src="${movie.Poster !== 'N/A' ? movie.Poster : 'https://via.placeholder.com/50x75?text=No+Image'}" alt="${movie.Title}">
        <div class="activity-details">
          <h5><a href="movie-details.html?id=${movie.imdbID}">${movie.Title}</a></h5>
          <p class="comment-text">"${comment.text.length > 100 ? comment.text.substring(0, 100) + '...' : comment.text}"</p>
          <p>Commented on ${new Date(comment.date).toLocaleDateString()}</p>
        </div>
      `;
      userCommentsContainer.appendChild(movieItem);
    });
  })
  .catch(err => {
    console.error("Error fetching user comments:", err);
    userCommentsContainer.innerHTML = '<p class="empty-message">Error loading comments</p>';
  });
}

// Add this function to track recently viewed movies
function addToRecentlyViewed(movieId) {
  // Get current user
  const currentUser = JSON.parse(localStorage.getItem("currentUser")) || JSON.parse(sessionStorage.getItem("currentUser"));
  if (!currentUser) return;
  
  // Get recently viewed movies
  let recentlyViewed = JSON.parse(localStorage.getItem(`recentlyViewed-${currentUser.id}`)) || [];
  
  // Remove movie if already in list
  recentlyViewed = recentlyViewed.filter(id => id !== movieId);
  
  // Add movie to the end of the list
  recentlyViewed.push(movieId);
  
  // Keep only the last 20 movies
  if (recentlyViewed.length > 20) {
    recentlyViewed = recentlyViewed.slice(recentlyViewed.length - 20);
  }
  
  // Save to localStorage
  localStorage.setItem(`recentlyViewed-${currentUser.id}`, JSON.stringify(recentlyViewed));
}

// Add this function to handle password reset
function requestPasswordReset() {
  const email = prompt("Please enter your email address to reset your password:");
  
  if (!email) return;
  
  // Check if email exists
  const users = JSON.parse(localStorage.getItem("users")) || [];
  const user = users.find(u => u.email === email);
  
  if (!user) {
    alert("No account found with that email address.");
    return;
  }
  
  // Generate reset token
  const resetToken = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  const resetExpiry = Date.now() + 3600000; // 1 hour from now
  
  // Save reset token to user
  user.resetToken = resetToken;
  user.resetExpiry = resetExpiry;
  localStorage.setItem("users", JSON.stringify(users));
  
  // In a real app, you would send an email with a reset link
  // For this demo, we'll just show the reset token
  alert(`Password reset requested. In a real app, an email would be sent to ${email} with a reset link.\n\nFor demo purposes, your reset token is: ${resetToken}`);
}

// Add this function to verify email
function verifyEmail() {
  // Get current user
  const currentUser = JSON.parse(localStorage.getItem("currentUser")) || JSON.parse(sessionStorage.getItem("currentUser"));
  
  // Get all users
  const users = JSON.parse(localStorage.getItem("users")) || [];
  const userIndex = users.findIndex(u => u.id === currentUser.id);
  
  if (userIndex === -1) return;
  
  // Generate verification token
  const verificationToken = Math.random().toString(36).substring(2, 15);
  
  // Save verification token to user
  users[userIndex].verificationToken = verificationToken;
  localStorage.setItem("users", JSON.stringify(users));
  
  // In a real app, you would send an email with a verification link
  // For this demo, we'll just show the verification token
  alert(`Email verification requested. In a real app, an email would be sent to ${currentUser.email} with a verification link.\n\nFor demo purposes, your verification token is: ${verificationToken}`);
}

// Add this function to enable two-factor authentication
function setupTwoFactorAuth() {
  // Get current user
  const currentUser = JSON.parse(localStorage.getItem("currentUser")) || JSON.parse(sessionStorage.getItem("currentUser"));
  
  // Get all users
  const users = JSON.parse(localStorage.getItem("users")) || [];
  const userIndex = users.findIndex(u => u.id === currentUser.id);
  
  if (userIndex === -1) return;
  
  // Generate 2FA secret
  const twoFactorSecret = Math.random().toString(36).substring(2, 15);
  
  // Save 2FA secret to user
  users[userIndex].twoFactorSecret = twoFactorSecret;
  users[userIndex].twoFactorEnabled = true;
  localStorage.setItem("users", JSON.stringify(users));
  
  // In a real app, you would show a QR code for the user to scan with an authenticator app
  // For this demo, we'll just show the 2FA secret
  alert(`Two-factor authentication enabled. In a real app, you would scan a QR code with an authenticator app.\n\nFor demo purposes, your 2FA secret is: ${twoFactorSecret}`);
}

// Add spinner CSS
if (!document.getElementById('profile-spinner-style')) {
  const style = document.createElement('style');
  style.id = 'profile-spinner-style';
  style.innerHTML = `.spinner { display: inline-block; width: 20px; height: 20px; border: 3px solid #fff; border-radius: 50%; border-top: 3px solid #e50914; animation: spin 1s linear infinite; vertical-align: middle; margin-right: 8px; } @keyframes spin { to { transform: rotate(360deg); } }`;
  document.head.appendChild(style);
}
