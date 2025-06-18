// At the top of the file, ensure components.js is loaded
// <script src="components.js"></script> in HTML if not already

const API_KEY = "8ddfd56d";

// DOM elements
const movieGrid = document.getElementById("movie-grid");
const loading = document.getElementById("loading");
const welcomeSection = document.getElementById("welcome-section");
const recommendationsGrid = document.getElementById("recommendations-grid");
const recommendationsLoading = document.getElementById("recommendations-loading");
const recommendationsSection = document.getElementById("recommendations-section");
const trendingGrid = document.getElementById("trending-grid");
const trendingLoading = document.getElementById("trending-loading");
const trendingTabs = document.querySelectorAll(".trending-tab");
const subscribeBtn = document.getElementById("subscribe-btn");
const topRatedGrid = document.getElementById("top-rated-grid");
const topRatedLoading = document.getElementById("top-rated-loading");
const genreGrid = document.getElementById("genre-grid");
const genreLoading = document.getElementById("genre-loading");
const genreTabs = document.querySelectorAll(".genre-tab");
const upcomingContainer = document.getElementById("upcoming-container");
const upcomingLoading = document.getElementById("upcoming-loading");
const upcomingPrev = document.getElementById("upcoming-prev");
const upcomingNext = document.getElementById("upcoming-next");
const factContent = document.getElementById("fact-content");
const newFactBtn = document.getElementById("new-fact-btn");
const communityGrid = document.getElementById("community-grid");
const communityLoading = document.getElementById("community-loading");

// Initialize sections
const sections = {
  popular: { query: 'popular', title: 'Popular Movies' },
  latest: { query: '2024', title: 'Latest Releases' },
  action: { query: 'action', title: 'Action Movies' },
  drama: { query: 'drama', title: 'Drama Movies' }
};

// Load everything when page loads
document.addEventListener('DOMContentLoaded', () => {
  // Initialize UI components
  setupThemeToggle();
  setupTrendingTabs();
  setupNewsletterSubscription();
  
  // Load content
  loadRecommendations();
  loadTrendingContent("movie"); // Default to movies
  
  // Load initial movies
  loadInitialMovies();
  
  // Restore search results if coming back from movie details
  const lastSearch = sessionStorage.getItem("lastSearch");
  if (lastSearch) {
    document.getElementById("search").value = lastSearch;
    searchMovies();
  }
  
  // Load new sections
  loadTopRatedMovies();
  loadGenreMovies("Action"); // Default genre
  setupGenreTabs();
  loadUpcomingReleases();
  loadRandomMovieFact();
  loadCommunityFavorites();
  
  // Setup event listeners for new sections
  if (newFactBtn) {
    newFactBtn.addEventListener("click", loadRandomMovieFact);
  }
  
  if (upcomingPrev && upcomingNext) {
    upcomingPrev.addEventListener("click", () => scrollUpcoming(-1));
    upcomingNext.addEventListener("click", () => scrollUpcoming(1));
  }

  setupTrailerPreview("#movie-grid");
  setupTrailerPreview("#recommendations-grid");
  setupTrailerPreview("#trending-grid");
  setupTrailerPreview("#top-rated-grid");
  setupTrailerPreview("#genre-grid");

  loadSectionMovies();
  initializeScrollButtons();

  // Dynamic Hero Banner Carousel
  const heroMovies = [];
  let heroIndex = 0;
  let heroInterval = null;

  function updateHeroBanner(index) {
    const details = heroMovies[index];
    document.getElementById('hero-title').textContent = details.Title || 'Featured Movie';
    document.getElementById('hero-tagline').textContent = details.Plot && details.Plot !== 'N/A' ? details.Plot : 'A short tagline or description for the featured movie goes here.';
    document.getElementById('hero-bg').style.backgroundImage = `url('${details.Poster && details.Poster !== 'N/A' ? details.Poster : 'https://placehold.co/900x420?text=No+Image'}')`;
    document.querySelector('.hero-btn.play-btn').onclick = () => {
      window.location.href = `movie-details.html?id=${details.imdbID}`;
    };
    document.querySelector('.hero-btn.info-btn').onclick = () => {
      window.location.href = `movie-details.html?id=${details.imdbID}`;
    };
    // Update dots
    const dots = document.querySelectorAll('.hero-dot');
    dots.forEach((dot, i) => dot.classList.toggle('active', i === index));
  }

  function startHeroInterval() {
    if (heroInterval) clearInterval(heroInterval);
    heroInterval = setInterval(() => {
      heroIndex = (heroIndex + 1) % heroMovies.length;
      updateHeroBanner(heroIndex);
    }, 5000);
  }

  fetch(`https://www.omdbapi.com/?apikey=${API_KEY}&s=trending&type=movie`)
    .then(res => res.json())
    .then(data => {
      if (data.Response === 'True' && data.Search && data.Search.length > 0) {
        // Pick up to 5 trending movies
        const picks = data.Search.slice(0, 5);
        Promise.all(picks.map(movie =>
          fetch(`https://www.omdbapi.com/?apikey=${API_KEY}&i=${movie.imdbID}&plot=short`).then(res => res.json())
        )).then(movies => {
          heroMovies.push(...movies);
          // Create dots
          const dotsContainer = document.getElementById('hero-dots');
          dotsContainer.innerHTML = '';
          for (let i = 0; i < heroMovies.length; i++) {
            const dot = document.createElement('span');
            dot.className = 'hero-dot' + (i === 0 ? ' active' : '');
            dot.onclick = () => {
              heroIndex = i;
              updateHeroBanner(heroIndex);
              startHeroInterval();
            };
            dotsContainer.appendChild(dot);
          }
          // Show first movie
          updateHeroBanner(0);
          // Set up nav buttons
          document.getElementById('hero-prev').onclick = () => {
            heroIndex = (heroIndex - 1 + heroMovies.length) % heroMovies.length;
            updateHeroBanner(heroIndex);
            startHeroInterval();
          };
          document.getElementById('hero-next').onclick = () => {
            heroIndex = (heroIndex + 1) % heroMovies.length;
            updateHeroBanner(heroIndex);
            startHeroInterval();
          };
          // Auto-slide
          startHeroInterval();
          // Pause on hover
          document.getElementById('hero-banner').addEventListener('mouseenter', () => clearInterval(heroInterval));
          document.getElementById('hero-banner').addEventListener('mouseleave', startHeroInterval);
        });
      }
    });

  // Show/hide logout button based on login state
  const logoutBtn = document.getElementById('logout-btn');
  const loginLink = document.getElementById('login-link');
  const currentUser = JSON.parse(localStorage.getItem('currentUser') || 'null');
  if (logoutBtn && loginLink) {
    if (currentUser) {
      logoutBtn.style.display = 'inline-block';
      loginLink.style.display = 'none';
    } else {
      logoutBtn.style.display = 'none';
      loginLink.style.display = '';
    }
    logoutBtn.onclick = () => {
      localStorage.removeItem('currentUser');
      sessionStorage.removeItem('currentUser');
      window.location.reload();
    };
  }
});

// Load initial movies
function loadInitialMovies() {
  console.log("Loading initial movies...");
  if (welcomeSection) welcomeSection.style.display = "none";
  if (loading) loading.style.display = "block";
  if (movieGrid) movieGrid.innerHTML = "";

  // Use a better search term to show popular movies
  fetch(`https://www.omdbapi.com/?apikey=${API_KEY}&s=2023&type=movie`)
    .then(res => res.json())
    .then(data => {
      console.log("API Response:", data);
      if (loading) loading.style.display = "none";
      if (data.Response === "True" && data.Search && data.Search.length > 0) {
        movieGrid.innerHTML = "";
        data.Search.forEach(movie => {
          const poster = movie.Poster !== "N/A" ? movie.Poster : "https://placehold.co/300x450?text=No+Image";
          const card = document.createElement("div");
          card.className = "movie-card";
          card.onclick = () => openMovieDetails(movie.imdbID);
          card.innerHTML = `
            <div class="movie-thumbnail-container">
              <img class="movie-thumbnail" src="${poster}" alt="${movie.Title}">
              <div class="trailer-preview" style="display:none"></div>
            </div>
            <div class="movie-info">
              <h3>${movie.Title}</h3>
              <p>${movie.Year}</p>
            </div>
          `;
          movieGrid.appendChild(card);
        });
        setupTrailerPreview("#movie-grid");
      } else {
        movieGrid.innerHTML = "<p>No movies found. Please try searching for a specific movie.</p>";
      }
    })
    .catch(error => {
      console.error("Error loading movies:", error);
      if (loading) loading.style.display = "none";
      movieGrid.innerHTML = "<p>Error loading movies. Please try again.</p>";
    });
}

// Update navbar login/profile link based on authentication
document.addEventListener("DOMContentLoaded", () => {
  const loginLink = document.getElementById("login-link");
  if (loginLink) {
    const currentUser = JSON.parse(localStorage.getItem("currentUser")) || JSON.parse(sessionStorage.getItem("currentUser"));
    if (currentUser) {
      loginLink.textContent = "Profile";
      loginLink.href = "profile.html";
      loginLink.classList.remove("active");
      // Optionally, highlight profile if on profile page
      if (window.location.pathname.endsWith("profile.html")) {
        loginLink.classList.add("active");
      }
    } else {
      loginLink.textContent = "Login";
      loginLink.href = "login.html";
      loginLink.classList.remove("active");
      if (window.location.pathname.endsWith("login.html")) {
        loginLink.classList.add("active");
      }
    }
  }
});

// Show current profile name in the header
document.addEventListener("DOMContentLoaded", () => {
  const profile = JSON.parse(localStorage.getItem("currentProfile") || "null");
  const userProfile = document.getElementById("user-profile-header");
  if (profile && profile.name) {
    document.getElementById("profile-name").textContent = profile.name;
    document.getElementById("profile-avatar").textContent = profile.avatar || profile.name[0].toUpperCase();
    if (userProfile) userProfile.style.display = "flex";
  } else {
    if (userProfile) userProfile.style.display = "none";
  }
});

// Load movies for each section
async function loadSectionMovies() {
  for (const [sectionId, section] of Object.entries(sections)) {
    const sectionElement = document.querySelector(`[data-section="${sectionId}"]`);
    if (!sectionElement) continue;

    try {
      const response = await fetch(`https://www.omdbapi.com/?apikey=${API_KEY}&s=${section.query}&type=movie`);
      const data = await response.json();

      if (data.Response === "True" && data.Search) {
        sectionElement.innerHTML = ''; // Clear loading indicator
        data.Search.forEach(movie => {
          const card = createMovieCard(movie);
          sectionElement.appendChild(card);
        });
      } else {
        sectionElement.innerHTML = '<div class="no-results">No movies found</div>';
      }
    } catch (error) {
      console.error(`Error loading ${section.title}:`, error);
      sectionElement.innerHTML = '<div class="error">Error loading movies</div>';
    }
  }
}

// Handle horizontal scrolling
function initializeScrollButtons() {
  document.querySelectorAll('.movie-section').forEach(section => {
    const row = section.querySelector('.movie-row');
    const prevBtn = section.querySelector('.prev-btn');
    const nextBtn = section.querySelector('.next-btn');

    if (prevBtn && nextBtn && row) {
      prevBtn.addEventListener('click', () => {
        row.scrollBy({ left: -400, behavior: 'smooth' });
      });

      nextBtn.addEventListener('click', () => {
        row.scrollBy({ left: 400, behavior: 'smooth' });
      });

      // Show/hide scroll buttons based on scroll position
      row.addEventListener('scroll', () => {
        prevBtn.style.opacity = row.scrollLeft > 0 ? '1' : '0.5';
        nextBtn.style.opacity = row.scrollLeft < (row.scrollWidth - row.clientWidth) ? '1' : '0.5';
      });
    }
  });
}

// Update search functionality
async function searchMovies() {
  const searchInput = document.getElementById('search');
  const query = searchInput.value.trim();
  const searchResults = document.getElementById('search-results');
  const loadingIndicator = document.getElementById('loading');
  
  // Always show the search results container
  searchResults.style.display = 'block';

  if (!window.API_KEY || API_KEY === 'YOUR_OMDB_API_KEY' || API_KEY === 'demo' || API_KEY === '') {
    searchResults.innerHTML = '<div style="color: red; font-size: 1.2em; padding: 20px;">OMDb API key is missing or invalid. Please set your API key in script.js.</div>';
    loadingIndicator.style.display = 'none';
    return;
  }

  if (query.length < 3) {
    searchResults.innerHTML = '';
    return;
  }

  loadingIndicator.style.display = 'block';
  searchResults.innerHTML = '';

  try {
    const response = await fetch(`https://www.omdbapi.com/?apikey=${API_KEY}&s=${query}`);
    const data = await response.json();
    console.log('OMDb API response:', data); // DEBUG

    if (data.Response === "True" && data.Search) {
      const row = document.createElement('div');
      row.className = 'movie-row';
      
      data.Search.forEach(movie => {
        const card = createMovieCard(movie);
        console.log('Appending card:', card); // DEBUG
        row.appendChild(card);
      });

      searchResults.appendChild(row);
    } else {
      searchResults.innerHTML = `<div class="no-results" style="color: red; font-size: 1.1em;">${data.Error ? data.Error : 'No movies found'}</div>`;
    }
  } catch (error) {
    console.error('Error searching movies:', error);
    searchResults.innerHTML = '<div class="error" style="color: red; font-size: 1.1em;">Error searching movies. Please check your internet connection and API key.</div>';
  } finally {
    loadingIndicator.style.display = 'none';
  }
}

// Check if a year is within the selected range
function isInYearRange(movieYear, rangeString) {
  if (!rangeString) return true;
  
  const year = parseInt(movieYear);
  if (isNaN(year)) return false;
  
  const [start, end] = rangeString.split('-').map(y => parseInt(y));
  return year >= start && year <= end;
}

// Sort search results
function sortResults() {
  const sortBy = document.getElementById("sort-by").value;
  const cards = Array.from(movieGrid.querySelectorAll(".movie-card"));
  
  if (cards.length === 0) return;
  
  cards.sort((a, b) => {
    if (sortBy === "year-desc") {
      return parseInt(b.dataset.year) - parseInt(a.dataset.year);
    } else if (sortBy === "year-asc") {
      return parseInt(a.dataset.year) - parseInt(b.dataset.year);
    } else if (sortBy === "rating-desc") {
      return parseFloat(b.dataset.rating || 0) - parseFloat(a.dataset.rating || 0);
    } else if (sortBy === "rating-asc") {
      return parseFloat(a.dataset.rating || 0) - parseFloat(b.dataset.rating || 0);
    }
    return 0;
  });
  
  // Clear and re-append in new order
  movieGrid.innerHTML = "";
  cards.forEach(card => movieGrid.appendChild(card));
}

// Toggle watchlist status
function toggleWatchlist(button, movieId) {
  let watchlist = JSON.parse(localStorage.getItem('watchlist')) || [];
  const isInWatchlist = watchlist.includes(movieId);
  
  if (isInWatchlist) {
    // Remove from watchlist
    watchlist = watchlist.filter(id => id !== movieId);
    button.textContent = "+ Add to Watchlist";
    button.classList.remove("in-watchlist");
  } else {
    // Add to watchlist
    watchlist.push(movieId);
    button.textContent = "✓ In Watchlist";
    button.classList.add("in-watchlist");
  }
  
  localStorage.setItem('watchlist', JSON.stringify(watchlist));
}

// Open movie details page
function openMovieDetails(imdbID) {
  sessionStorage.setItem("scrollPosition", window.pageYOffset);
  window.location.href = `movie-details.html?id=${imdbID}`;
}

// Setup trending tabs
function setupTrendingTabs() {
  trendingTabs.forEach(tab => {
    tab.addEventListener("click", () => {
      // Remove active class from all tabs
      trendingTabs.forEach(t => t.classList.remove("active"));
      // Add active class to clicked tab
      tab.classList.add("active");
      // Load content based on tab type
      loadTrendingContent(tab.dataset.type);
    });
  });
}

// Load trending content
function loadTrendingContent(type) {
  trendingGrid.innerHTML = "";
  trendingLoading.style.display = "block";
  
  // Use different search terms based on type
  let searchTerms;
  if (type === "movie") {
    searchTerms = ["2023", "popular", "blockbuster", "award", "hit"];
  } else {
    searchTerms = ["series", "tv show", "netflix", "hbo", "popular"];
  }
  
  const randomTerm = searchTerms[Math.floor(Math.random() * searchTerms.length)];
  
  fetch(`https://www.omdbapi.com/?s=${randomTerm}&type=${type}&apikey=${API_KEY}`)
    .then(res => res.json())
    .then(data => {
      trendingLoading.style.display = "none";
      
      if (data.Response === "True") {
        // Shuffle the results for variety
        const shuffled = data.Search.sort(() => 0.5 - Math.random());
        displayTrendingContent(shuffled.slice(0, 8), type);
      } else {
        trendingGrid.innerHTML = `<p class="no-results">No trending ${type === "movie" ? "movies" : "TV shows"} found</p>`;
      }
    })
    .catch(() => {
      trendingLoading.style.display = "none";
      trendingGrid.innerHTML = `<p class="error-message">Failed to load trending content</p>`;
    });
}

// Display trending content
function displayTrendingContent(items, type) {
  trendingGrid.innerHTML = "";
  
  items.forEach(item => {
    fetch(`https://www.omdbapi.com/?i=${item.imdbID}&apikey=${API_KEY}`)
      .then(res => res.json())
      .then(details => {
        const watchlist = JSON.parse(localStorage.getItem('watchlist')) || [];
        const isInWatchlist = watchlist.includes(details.imdbID);
        const poster = details.Poster !== "N/A" ? details.Poster : "https://placehold.co/300x450?text=No+Image";
        
        const card = document.createElement("div");
        card.classList.add("movie-card", "trending-card");
        card.setAttribute("data-id", details.imdbID);
        card.style.cursor = "pointer";
        
        // Add a "trending" badge
        card.innerHTML = `
          <div class="trending-badge">${type === "movie" ? "🔥" : "📺"} Trending</div>
          <div class="movie-thumbnail-container">
            <img class="movie-thumbnail" src="${poster}" alt="${details.Title}">
            <div class="trailer-preview" style="display:none"></div>
          </div>
          <div class="movie-info">
            <h3>${details.Title}</h3>
            <p>${details.Year} • ${details.Runtime}</p>
            <p class="rating">⭐ ${details.imdbRating}</p>
            <div class="card-actions">
              <button class="watchlist-btn ${isInWatchlist ? 'in-watchlist' : ''}">
                ${isInWatchlist ? '✓ In Watchlist' : '+ Add to Watchlist'}
              </button>
              <button class="details-btn">Details</button>
            </div>
          </div>
        `;
        
        // Make the entire card clickable
        card.addEventListener("click", (e) => {
          if (!e.target.closest('.watchlist-btn') && !e.target.closest('.details-btn')) {
            openMovieDetails(details.imdbID);
          }
        });
        
        card.querySelector(".details-btn").addEventListener("click", () => {
          openMovieDetails(details.imdbID);
        });
        
        card.querySelector(".watchlist-btn").addEventListener("click", (e) => {
          e.stopPropagation();
          toggleWatchlist(e.target, details.imdbID);
        });
        
        trendingGrid.appendChild(card);
      });
  });
}

// Add newsletter subscription functionality
function setupNewsletterSubscription() {
  if (subscribeBtn) {
    subscribeBtn.addEventListener("click", () => {
      const email = document.getElementById("newsletter-email").value;
      if (!email || !isValidEmail(email)) {
        showNotification("Please enter a valid email address", "error");
        return;
      }
      
      // Save subscription to localStorage
      let subscribers = JSON.parse(localStorage.getItem("newsletter-subscribers")) || [];
      if (!subscribers.includes(email)) {
        subscribers.push(email);
        localStorage.setItem("newsletter-subscribers", JSON.stringify(subscribers));
        showNotification("Thanks for subscribing to our newsletter!", "success");
        document.getElementById("newsletter-email").value = "";
      } else {
        showNotification("You're already subscribed!", "info");
      }
    });
  }
}

function isValidEmail(email) {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
}

// Add notification system
function showNotification(message, type = "info") {
  // Create notification element if it doesn't exist
  let notification = document.getElementById("notification");
  if (!notification) {
    notification = document.createElement("div");
    notification.id = "notification";
    document.body.appendChild(notification);
  }
  
  // Set notification content and type
  notification.textContent = message;
  notification.className = `notification ${type}`;
  
  // Show notification
  notification.style.display = "block";
  notification.style.opacity = "1";
  
  // Hide after 3 seconds
  setTimeout(() => {
    notification.style.opacity = "0";
    setTimeout(() => {
      notification.style.display = "none";
    }, 500);
  }, 3000);
}

// Theme toggle functionality
function setupThemeToggle() {
  const themeToggle = document.getElementById("theme-toggle");
  const currentTheme = localStorage.getItem("theme") || "dark";
  
  document.body.classList.toggle("light-theme", currentTheme === "light");
  themeToggle.textContent = currentTheme === "light" ? "🌙" : "☀️";
  
  themeToggle.addEventListener("click", () => {
    const newTheme = document.body.classList.contains("light-theme") ? "dark" : "light";
    document.body.classList.toggle("light-theme");
    themeToggle.textContent = newTheme === "light" ? "🌙" : "☀️";
    localStorage.setItem("theme", newTheme);
  });
}

// Load recommendations
function loadRecommendations() {
  if (!recommendationsGrid || !recommendationsLoading || !recommendationsSection) return;

  recommendationsGrid.innerHTML = "";
  recommendationsLoading.style.display = "block";
  recommendationsSection.style.display = "block";

  const currentUser = JSON.parse(localStorage.getItem("currentUser")) || JSON.parse(sessionStorage.getItem("currentUser"));

  if (currentUser) {
    const users = JSON.parse(localStorage.getItem("users")) || [];
    const user = users.find(u => u.id === currentUser.id);
    const recentlyViewed = JSON.parse(localStorage.getItem(`recentlyViewed-${currentUser.id}`)) || [];

    if (recentlyViewed.length > 0) {
      // Use the most recently viewed movie to get recommendations
      const latestMovieId = recentlyViewed[0];
      fetch(`https://www.omdbapi.com/?i=${latestMovieId}&apikey=${API_KEY}`)
        .then(res => res.json())
        .then(movie => {
          const mainGenre = movie.Genre ? movie.Genre.split(', ')[0] : "Action";
          return fetch(`https://www.omdbapi.com/?s=${mainGenre}&type=movie&apikey=${API_KEY}`);
        })
        .then(res => res.json())
        .then(data => {
          recommendationsLoading.style.display = "none";
          if (data.Response === "True") {
            const filteredMovies = data.Search.filter(m => !recentlyViewed.includes(m.imdbID));
            displayRecommendations(filteredMovies.slice(0, 8), "Based on your recently viewed");
          } else {
            searchByGenre(user?.preferences?.genres?.[0] || "Action", "Based on your preferences");
          }
        })
        .catch(() => searchByGenre(user?.preferences?.genres?.[0] || "Action", "Based on your preferences"));
    } else if (user?.preferences?.genres?.length) {
      searchByGenre(user.preferences.genres[0], "Based on your preferences");
    } else {
      loadTrendingMovies();
    }
  } else {
    loadTrendingMovies();
  }
}

function searchByGenre(genre, subtitle) {
  fetch(`https://www.omdbapi.com/?s=${genre}&type=movie&apikey=${API_KEY}`)
    .then(res => res.json())
    .then(data => {
      recommendationsLoading.style.display = "none";
      if (data.Response === "True") {
        displayRecommendations(data.Search.slice(0, 8), subtitle);
      } else {
        loadTrendingMovies();
      }
    })
    .catch(() => loadTrendingMovies());
}

function loadTrendingMovies() {
  const trendingTerms = ["2023", "action", "marvel", "star", "top"];
  const randomTerm = trendingTerms[Math.floor(Math.random() * trendingTerms.length)];
  fetch(`https://www.omdbapi.com/?s=${randomTerm}&type=movie&apikey=${API_KEY}`)
    .then(res => res.json())
    .then(data => {
      recommendationsLoading.style.display = "none";
      if (data.Response === "True") {
        displayRecommendations(data.Search.slice(0, 8), "Trending now");
      } else {
        recommendationsSection.style.display = "none";
      }
    })
    .catch(() => {
      recommendationsSection.style.display = "none";
    });
}

function displayRecommendations(movies, subtitle) {
  const recommendationsTitle = document.querySelector("#recommendations-section h2");
  if (recommendationsTitle) {
    recommendationsTitle.innerHTML = `Recommended For You <span class="subtitle">${subtitle}</span>`;
  }
  recommendationsGrid.innerHTML = "";

  movies.forEach(movie => {
    fetch(`https://www.omdbapi.com/?i=${movie.imdbID}&apikey=${API_KEY}`)
      .then(res => res.json())
      .then(movieDetails => {
        const watchlist = JSON.parse(localStorage.getItem('watchlist')) || [];
        const isInWatchlist = watchlist.includes(movieDetails.imdbID);
        const poster = movieDetails.Poster !== "N/A" ? movieDetails.Poster : "https://placehold.co/300x450?text=No+Image";

        const card = document.createElement("div");
        card.classList.add("movie-card");
        card.setAttribute("data-id", movieDetails.imdbID);
        card.innerHTML = `
          <div class="movie-thumbnail-container">
            <img class="movie-thumbnail" src="${poster}" alt="${movieDetails.Title}">
            <div class="trailer-preview" style="display:none"></div>
          </div>
          <div class="movie-info">
            <h3>${movieDetails.Title}</h3>
            <p>${movieDetails.Year} • ${movieDetails.Runtime}</p>
            <p class="rating">⭐ ${movieDetails.imdbRating}</p>
            <div class="card-actions">
              <button class="watchlist-btn ${isInWatchlist ? 'in-watchlist' : ''}">
                ${isInWatchlist ? '✓ In Watchlist' : '+ Add to Watchlist'}
              </button>
              <button class="details-btn">Details</button>
            </div>
          </div>
        `;

        card.querySelector(".details-btn").addEventListener("click", () => {
          openMovieDetails(movieDetails.imdbID);
        });

        card.querySelector(".watchlist-btn").addEventListener("click", (e) => {
          e.stopPropagation();
          toggleWatchlist(e.target, movieDetails.imdbID);
        });

        recommendationsGrid.appendChild(card);
      });
  });
}

// Top Rated Movies Section
function loadTopRatedMovies() {
  if (!topRatedGrid || !topRatedLoading) return;
  
  topRatedGrid.innerHTML = "";
  topRatedLoading.style.display = "block";
  
  // Use high-rated movies search terms
  const searchTerms = ["masterpiece", "classic", "best", "award", "oscar"];
  const randomTerm = searchTerms[Math.floor(Math.random() * searchTerms.length)];
  
  fetch(`https://www.omdbapi.com/?s=${randomTerm}&type=movie&apikey=${API_KEY}`)
    .then(res => res.json())
    .then((data) => {
      topRatedLoading.style.display = "none";
      
      if (data.Response === "True") {
        // Process and display only movies with high ratings
        processTopRatedMovies(data.Search);
      } else {
        topRatedGrid.innerHTML = `<p class="no-results">No top rated movies found</p>`;
      }
    })
    .catch(() => {
      topRatedLoading.style.display = "none";
      topRatedGrid.innerHTML = `<p class="error-message">Failed to load top rated movies</p>`;
    });
}

function processTopRatedMovies(movies) {
  // Fetch details for each movie to get ratings
  let processedCount = 0;
  const highRatedMovies = [];
  
  movies.forEach(movie => {
    fetch(`https://www.omdbapi.com/?i=${movie.imdbID}&apikey=${API_KEY}`)
      .then(res => res.json())
      .then(details => {
        processedCount++;
        
        // Only include movies with rating >= 7.5
        if (parseFloat(details.imdbRating) >= 7.5) {
          highRatedMovies.push(details);
        }
        
        // When all movies are processed, display the high-rated ones
        if (processedCount === movies.length) {
          // Sort by rating (highest first)
          highRatedMovies.sort((a, b) => parseFloat(b.imdbRating) - parseFloat(a.imdbRating));
          displayTopRatedMovies(highRatedMovies.slice(0, 8));
        }
      })
      .catch(() => {
        processedCount++;
        // Check if all movies have been processed
        if (processedCount === movies.length) {
          displayTopRatedMovies(highRatedMovies.slice(0, 8));
        }
      });
  });
}

function displayTopRatedMovies(movies) {
  if (!topRatedGrid) return;
  
  topRatedGrid.innerHTML = "";
  
  if (movies.length === 0) {
    topRatedGrid.innerHTML = `<p class="no-results">No top rated movies found</p>`;
    return;
  }
  
  movies.forEach(movie => {
    const watchlist = JSON.parse(localStorage.getItem('watchlist')) || [];
    const isInWatchlist = watchlist.includes(movie.imdbID);
    const poster = movie.Poster !== "N/A" ? movie.Poster : "https://placehold.co/300x450?text=No+Image";
    
    const card = document.createElement("div");
    card.classList.add("movie-card", "top-rated-card");
    card.setAttribute("data-id", movie.imdbID);
    card.style.cursor = "pointer";
    
    // Add a "top rated" badge with the rating
    card.innerHTML = `
      <div class="top-rated-badge">⭐ ${movie.imdbRating}</div>
      <div class="movie-thumbnail-container">
        <img class="movie-thumbnail" src="${poster}" alt="${movie.Title}">
        <div class="trailer-preview" style="display:none"></div>
      </div>
      <div class="movie-info">
        <h3>${movie.Title}</h3>
        <p>${movie.Year} • ${movie.Runtime}</p>
        <div class="card-actions">
          <button class="watchlist-btn ${isInWatchlist ? 'in-watchlist' : ''}">
            ${isInWatchlist ? '✓ In Watchlist' : '+ Add to Watchlist'}
          </button>
          <button class="details-btn">Details</button>
        </div>
      </div>
    `;
    
    // Make the entire card clickable
    card.addEventListener("click", (e) => {
      if (!e.target.closest('.watchlist-btn') && !e.target.closest('.details-btn')) {
        openMovieDetails(movie.imdbID);
      }
    });
    
    card.querySelector(".details-btn").addEventListener("click", () => {
      openMovieDetails(movie.imdbID);
    });
    
    card.querySelector(".watchlist-btn").addEventListener("click", (e) => {
      e.stopPropagation();
      toggleWatchlist(e.target, movie.imdbID);
    });
    
    topRatedGrid.appendChild(card);
  });
}

// Genre Showcase Section
function setupGenreTabs() {
  if (!genreTabs) return;
  
  genreTabs.forEach(tab => {
    tab.addEventListener("click", () => {
      // Remove active class from all tabs
      genreTabs.forEach(t => t.classList.remove("active"));
      // Add active class to clicked tab
      tab.classList.add("active");
      // Load movies for the selected genre
      loadGenreMovies(tab.dataset.genre);
    });
  });
}

function loadGenreMovies(genre) {
  if (!genreGrid || !genreLoading) return;
  
  genreGrid.innerHTML = "";
  genreLoading.style.display = "block";
  
  fetch(`https://www.omdbapi.com/?s=${genre}&type=movie&apikey=${API_KEY}`)
    .then(res => res.json())
    .then(data => {
      genreLoading.style.display = "none";
      
      if (data.Response === "True") {
        // Shuffle the results for variety
        const shuffled = data.Search.sort(() => 0.5 - Math.random());
        displayGenreMovies(shuffled.slice(0, 8), genre);
      } else {
        genreGrid.innerHTML = `<p class="no-results">No ${genre} movies found</p>`;
      }
    })
    .catch(() => {
      genreLoading.style.display = "none";
      genreGrid.innerHTML = `<p class="error-message">Failed to load ${genre} movies</p>`;
    });
}

function displayGenreMovies(movies, genre) {
  if (!genreGrid) return;
  
  genreGrid.innerHTML = "";
  
  movies.forEach(movie => {
    fetch(`https://www.omdbapi.com/?i=${movie.imdbID}&apikey=${API_KEY}`)
      .then(res => res.json())
      .then(details => {
        // Verify the movie actually has the selected genre
        if (!details.Genre.includes(genre)) return;
        
        const watchlist = JSON.parse(localStorage.getItem('watchlist')) || [];
        const isInWatchlist = watchlist.includes(details.imdbID);
        const poster = details.Poster !== "N/A" ? details.Poster : "https://placehold.co/300x450?text=No+Image";
        
        const card = document.createElement("div");
        card.classList.add("movie-card", "genre-card");
        card.setAttribute("data-id", details.imdbID);
        card.style.cursor = "pointer";
        
        card.innerHTML = `
          <div class="genre-badge">${genre}</div>
          <div class="movie-thumbnail-container">
            <img class="movie-thumbnail" src="${poster}" alt="${details.Title}">
            <div class="trailer-preview" style="display:none"></div>
          </div>
          <div class="movie-info">
            <h3>${details.Title}</h3>
            <p>${details.Year} • ${details.Runtime}</p>
            <p class="rating">⭐ ${details.imdbRating}</p>
            <div class="card-actions">
              <button class="watchlist-btn ${isInWatchlist ? 'in-watchlist' : ''}">
                ${isInWatchlist ? '✓ In Watchlist' : '+ Add to Watchlist'}
              </button>
              <button class="details-btn">Details</button>
            </div>
          </div>
        `;
        
        // Make the entire card clickable
        card.addEventListener("click", (e) => {
          if (!e.target.closest('.watchlist-btn') && !e.target.closest('.details-btn')) {
            openMovieDetails(details.imdbID);
          }
        });
        
        card.querySelector(".details-btn").addEventListener("click", () => {
          openMovieDetails(details.imdbID);
        });
        
        card.querySelector(".watchlist-btn").addEventListener("click", (e) => {
          e.stopPropagation();
          toggleWatchlist(e.target, details.imdbID);
        });
        
        genreGrid.appendChild(card);
      });
  });
}

// Upcoming Releases Section
function loadUpcomingReleases() {
  if (!upcomingContainer || !upcomingLoading) return;
  
  upcomingContainer.innerHTML = "";
  upcomingLoading.style.display = "block";
  
  // Simulate upcoming releases (since OMDB doesn't have this feature)
  // Use current year + 1 to find upcoming movies
  const nextYear = new Date().getFullYear() + 1;
  
  fetch(`https://www.omdbapi.com/?s=${nextYear}&type=movie&apikey=${API_KEY}`)
    .then(res => res.json())
    .then(data => {
      upcomingLoading.style.display = "none";
      
      if (data.Response === "True") {
        displayUpcomingReleases(data.Search.slice(0, 10));
      } else {
        // Fallback to using keywords for upcoming movies
        fetchUpcomingWithKeywords();
      }
    })
    .catch(() => {
      fetchUpcomingWithKeywords();
    });
}

function fetchUpcomingWithKeywords() {
  const upcomingKeywords = ["upcoming", "anticipated", "sequel", "teaser"];
  const randomKeyword = upcomingKeywords[Math.floor(Math.random() * upcomingKeywords.length)];
  
  fetch(`https://www.omdbapi.com/?s=${randomKeyword}&type=movie&apikey=${API_KEY}`)
    .then(res => res.json())
    .then(data => {
      upcomingLoading.style.display = "none";
      
      if (data.Response === "True") {
        displayUpcomingReleases(data.Search.slice(0, 10));
      } else {
        upcomingContainer.innerHTML = `<p class="no-results">No upcoming releases found</p>`;
      }
    })
    .catch(() => {
      upcomingLoading.style.display = "none";
      upcomingContainer.innerHTML = `<p class="error-message">Failed to load upcoming releases</p>`;
    });
}

function displayUpcomingReleases(movies) {
  if (!upcomingContainer) return;
  
  upcomingContainer.innerHTML = "";
  
  movies.forEach(movie => {
    fetch(`https://www.omdbapi.com/?i=${movie.imdbID}&apikey=${API_KEY}`)
      .then(res => res.json())
      .then(details => {
        const poster = details.Poster !== "N/A" ? details.Poster : "https://placehold.co/300x450?text=No+Image";
        
        const card = document.createElement("div");
        card.classList.add("upcoming-card");
        card.setAttribute("data-id", details.imdbID);
        card.style.cursor = "pointer";
        
        poster = details.Poster && details.Poster !== "N/A" ? details.Poster : "https://placehold.co/300x450?text=No+Image";
        card.innerHTML = `
          <div class="upcoming-poster">
            <img src="${poster}" alt="${details.Title}" loading="lazy" />
            <div class="upcoming-overlay">
              <h4>${details.Title}</h4>
              <p>${details.Year}</p>
              <p class="upcoming-genre">${details.Genre}</p>
              <button class="details-btn">View Details</button>
            </div>
          </div>
        `;
        
        // Make the entire card clickable
        card.addEventListener("click", (e) => {
          if (!e.target.closest('.details-btn')) {
            openMovieDetails(details.imdbID);
          }
        });
        
        card.querySelector(".details-btn").addEventListener("click", () => {
          openMovieDetails(details.imdbID);
        });
        
        upcomingContainer.appendChild(card);
      });
  });
}

function scrollUpcoming(direction) {
  if (!upcomingContainer) return;
  
  const scrollAmount = direction * 300; // Scroll by 300px
  upcomingContainer.scrollBy({
    left: scrollAmount,
    behavior: 'smooth'
  });
}

// Movie Facts Section
function loadRandomMovieFact() {
  if (!factContent) return;
  
  factContent.innerHTML = "Loading...";
  
  // Array of interesting movie facts
  const movieFacts = [
    "The Lord of the Rings trilogy was filmed entirely in New Zealand.",
    "The iconic 'I'll be back' line from The Terminator was almost changed to 'I'll come back'.",
    "The Shawshank Redemption was a box office disappointment before becoming one of the most beloved films of all time.",
    "The Matrix code is actually Japanese sushi recipes.",
    "The original Star Wars budget was only $11 million.",
    "The Godfather's cat in the opening scene was a stray that wandered onto the set.",
    "Psycho was the first American film to show a toilet flushing.",
    "The Titanic's budget was higher than the cost of building the actual Titanic.",
    "The dark knight's Joker licking his lips was unscripted - Heath Ledger did it because the prosthetics kept sticking to his mouth.",
    "E.T.'s voice was created by combining the voices of an elderly woman, a raccoon, and other animals.",
    "The Wizard of Oz's Tin Man costume was so uncomfortable that it caused the actor to be hospitalized.",
    "The iconic chest-bursting scene in Alien was filmed in one take with the actors having little idea what would happen.",
    "The 'Wilhelm Scream' has been used in over 400 films and has become an inside joke among sound designers.",
    "The original Jurassic Park used only 15 minutes of CGI dinosaur footage. The rest were animatronics.",
    "The 'Here's Johnny!' line from The Shining was improvised by Jack Nicholson."
  ];
  
  // Display a random fact
  const randomFact = movieFacts[Math.floor(Math.random() * movieFacts.length)];
  factContent.innerHTML = randomFact;
}

// Community Favorites Section
function loadCommunityFavorites() {
  if (!communityGrid || !communityLoading) return;
  
  communityGrid.innerHTML = "";
  communityLoading.style.display = "block";
  
  // Simulate community favorites by getting most added to watchlist
  // In a real app, this would come from a backend
  let allWatchlists = [];
  
  // Get all users
  const users = JSON.parse(localStorage.getItem("users")) || [];
  
  // Get current user's watchlist
  const currentWatchlist = JSON.parse(localStorage.getItem("watchlist")) || [];
  allWatchlists = [...currentWatchlist];
  
  // Count occurrences of each movie
  const movieCounts = {};
  allWatchlists.forEach(movieId => {
    movieCounts[movieId] = (movieCounts[movieId] || 0) + 1;
  });
  
  // Sort by count
  const sortedMovies = Object.keys(movieCounts).sort((a, b) => movieCounts[b] - movieCounts[a]);
  
  // If we have community favorites, display them
  if (sortedMovies.length > 0) {
    displayCommunityFavorites(sortedMovies.slice(0, 8));
  } else {
    // Fallback to popular movies
    loadPopularMovies();
  }
}

function loadPopularMovies() {
  const popularTerms = ["popular", "blockbuster", "hit", "classic", "masterpiece"];
  const randomTerm = popularTerms[Math.floor(Math.random() * popularTerms.length)];
  
  fetch(`https://www.omdbapi.com/?s=${randomTerm}&type=movie&apikey=${API_KEY}`)
    .then(res => res.json())
    .then(data => {
      communityLoading.style.display = "none";
      
      if (data.Response === "True") {
        displayCommunityFavorites(data.Search.slice(0, 8));
      } else {
        communityGrid.innerHTML = `<p class="no-results">No popular movies found</p>`;
      }
    })
    .catch(() => {
      communityLoading.style.display = "none";
      communityGrid.innerHTML = `<p class="error-message">Failed to load popular movies</p>`;

    });
}

function displayCommunityFavorites(movies) {
  if (!communityGrid) return;
  
  communityGrid.innerHTML = "";
  
  movies.forEach(movie => {
    fetch(`https://www.omdbapi.com/?i=${movie}&apikey=${API_KEY}`)
      .then(res => res.json())
      .then(movieDetails => {
        let poster;
        if (movieDetails.Poster && movieDetails.Poster !== "N/A") {
          poster = movieDetails.Poster;
        } else {          poster = "https://placehold.co/300x450?text=No+Image";
        }

        const card = document.createElement("div");
        card.classList.add("movie-card");
        card.setAttribute("data-id", movieDetails.imdbID);
        card.style.cursor = "pointer";

        card.innerHTML = `
          <div class="movie-thumbnail-container">
            <img class="movie-thumbnail" src="${poster}" alt="${movieDetails.Title}">
            <div class="trailer-preview" style="display:none"></div>
          </div>
          <div class="movie-info">
            <h3>${movieDetails.Title}</h3>
            <p>${movieDetails.Year} • ${movieDetails.Runtime}</p>
            <p class="rating">⭐ ${movieDetails.imdbRating}</p>
            <div class="card-actions">
              <button class="watchlist-btn ${isInWatchlist ? 'in-watchlist' : ''}">
                ${isInWatchlist ? '✓ In Watchlist' : '+ Add to Watchlist'}
              </button>
              <button class="details-btn">Details</button>
            </div>
          </div>
        `;

        card.querySelector(".details-btn").addEventListener("click", () => {
          openMovieDetails(movieDetails.imdbID);
        });

        card.querySelector(".watchlist-btn").addEventListener("click", (e) => {
          e.stopPropagation();
          toggleWatchlist(e.target, movieDetails.imdbID);
        });

        communityGrid.appendChild(card);
      });
  });
}

// Track movie views for recommendations
function trackMovieView(movieId) {
  const currentUser = JSON.parse(localStorage.getItem("currentUser")) || JSON.parse(sessionStorage.getItem("currentUser"));
  if (!currentUser) return;
  addToRecentlyViewed(movieId);
}

// Add this function to add a movie to the recently viewed list
function addToRecentlyViewed(movieId) {
  const currentUser = JSON.parse(localStorage.getItem("currentUser")) || JSON.parse(sessionStorage.getItem("currentUser"));
  if (!currentUser) return;
  
  let recentlyViewed = JSON.parse(localStorage.getItem(`recentlyViewed-${currentUser.id}`)) || [];
  
  // Remove the movie if it already exists in the list
  recentlyViewed = recentlyViewed.filter(id => id !== movieId);
  
  // Add the new movie to the beginning of the list
  recentlyViewed.unshift(movieId);
  
  // Limit the list to 5 movies
  recentlyViewed = recentlyViewed.slice(0, 5);
  
  localStorage.setItem(`recentlyViewed-${currentUser.id}`, JSON.stringify(recentlyViewed));
}

// Add this function to load recommendations when the page loads
const profile = JSON.parse(localStorage.getItem("currentProfile") || "null");
if (profile) {
  document.getElementById("profile-name").textContent = profile.name;
}

// Add trailer preview on hover for all movie cards
function setupTrailerPreview(containerSelector = ".grid-container") {
  document.querySelectorAll(`${containerSelector} .movie-card`).forEach(card => {
    const thumbnailContainer = card.querySelector('.movie-thumbnail-container');
    const trailerPreview = card.querySelector('.trailer-preview');
    const posterImg = card.querySelector('.movie-thumbnail');
    let hoverTimeout;

    // Helper: Get YouTube trailer embed URL (search-based)
    function getYouTubeTrailerEmbed(title, year) {
      const query = encodeURIComponent(`${title} ${year || ""} official trailer`);
      return `https://www.youtube.com/embed?listType=search&list=${query}&autoplay=1&mute=1&controls=0&showinfo=0&rel=0`;
    }

    thumbnailContainer.addEventListener('mouseenter', () => {
      hoverTimeout = setTimeout(() => {
        posterImg.style.opacity = '0';
        trailerPreview.style.display = 'block';
        const title = card.querySelector('h3')?.textContent || '';
        const year = card.querySelector('p')?.textContent?.split('•')[0]?.trim() || '';
        trailerPreview.innerHTML = `
          <iframe
            src="${getYouTubeTrailerEmbed(title, year)}"
            frameborder="0"
            allow="autoplay; encrypted-media"
            allowfullscreen
            style="width:100%;height:100%;border-radius:10px;"
          ></iframe>
        `;
      }, 1500); // 1.5 seconds
    });

    thumbnailContainer.addEventListener('mouseleave', () => {
      clearTimeout(hoverTimeout);
      trailerPreview.innerHTML = '';
      trailerPreview.style.display = 'none';
      posterImg.style.opacity = '1';
    });
  });
}

function createMovieCard(movie) {
  const card = document.createElement("div");
  card.className = "movie-card";
  card.dataset.imdbId = movie.imdbID;

  const thumbnailContainer = document.createElement("div");
  thumbnailContainer.className = "movie-thumbnail-container";

  const thumbnail = document.createElement("img");
  thumbnail.className = "movie-thumbnail";
  thumbnail.src = movie.Poster !== "N/A" ? movie.Poster : "https://placehold.co/300x450?text=No+Image";
  thumbnail.alt = movie.Title;
  thumbnail.loading = "lazy";
  thumbnail.onerror = function() { this.onerror = null; this.src = 'https://placehold.co/300x450?text=No+Image'; };

  thumbnailContainer.appendChild(thumbnail);

  const info = document.createElement("div");
  info.className = "movie-info";

  const title = document.createElement("h3");
  title.textContent = movie.Title;

  const year = document.createElement("p");
  year.textContent = movie.Year;

  const type = document.createElement("p");
  type.textContent = movie.Type.charAt(0).toUpperCase() + movie.Type.slice(1);

  const rating = document.createElement("p");
  rating.className = "rating";
  rating.innerHTML = `<span>★</span> ${movie.imdbRating || "N/A"}`;

  const genre = document.createElement("p");
  genre.className = "genre";
  genre.textContent = movie.Genre || "Genre not available";

  const actions = document.createElement("div");
  actions.className = "card-actions";

  const watchlistBtn = document.createElement("button");
  watchlistBtn.className = "watchlist-btn";
  watchlistBtn.textContent = "Add to Watchlist";
  watchlistBtn.onclick = (e) => {
    e.stopPropagation();
    toggleWatchlist(e.target, movie.imdbID);
  };

  const detailsBtn = document.createElement("button");
  detailsBtn.className = "details-btn";
  detailsBtn.textContent = "Details";
  detailsBtn.onclick = (e) => {
    e.stopPropagation();
    openMovieDetails(movie.imdbID);
  };

  actions.appendChild(watchlistBtn);
  actions.appendChild(detailsBtn);

  info.appendChild(title);
  info.appendChild(year);
  info.appendChild(type);
  info.appendChild(rating);
  info.appendChild(genre);
  info.appendChild(actions);

  card.appendChild(thumbnailContainer);
  card.appendChild(info);

  return card;
}

function addToWatchlist(movie) {
  toggleWatchlist(null, movie.imdbID);
}




