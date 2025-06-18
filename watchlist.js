// At the top of the file, ensure components.js is loaded
// <script src="components.js"></script> in HTML if not already

const API_KEY = "8ddfd56d";
const watchlistGrid = document.getElementById("watchlist-grid");
const emptyWatchlist = document.getElementById("empty-watchlist");

// Show loading state
function showLoading() {
  watchlistGrid.innerHTML = `
    <div class="loading-card">
      <div class="loading-spinner"></div>
      <p>Loading your watchlist...</p>
    </div>
  `;
}

// Show error state
function showError(message) {
  watchlistGrid.innerHTML = `
    <div class="error-message">
      <h3>Oops! Something went wrong</h3>
      <p>${message}</p>
      <button onclick="loadWatchlist()" class="retry-btn">Try Again</button>
    </div>
  `;
}

// Create movie card with enhanced information
function createMovieCard(data) {
  const card = document.createElement("div");
  card.className = "movie-card";
  card.setAttribute('data-imdb-id', data.imdbID);

  // Thumbnail container
  const thumbnailContainer = document.createElement("div");
  thumbnailContainer.className = "movie-thumbnail-container";

  const thumbnail = document.createElement("img");
  thumbnail.className = "movie-thumbnail";
  thumbnail.src = data.Poster && data.Poster !== "N/A" ? data.Poster : 'https://placehold.co/300x450?text=No+Image';
  thumbnail.onerror = function() { this.onerror = null; this.src = 'https://placehold.co/300x450?text=No+Image'; };
  thumbnail.alt = data.Title;
  thumbnail.loading = "lazy";
  thumbnailContainer.appendChild(thumbnail);

  // Info overlay
  const info = document.createElement("div");
  info.className = "movie-info";

  const title = document.createElement("h3");
  title.textContent = data.Title || "Untitled";
  info.appendChild(title);

  // Meta (year, rating)
  const meta = document.createElement("div");
  meta.className = "movie-meta";
  const year = document.createElement("span");
  year.className = "year";
  year.textContent = data.Year || "";
  meta.appendChild(year);
  const rating = document.createElement("span");
  rating.className = "rating";
  rating.innerHTML = `★ ${data.imdbRating && data.imdbRating !== "N/A" ? data.imdbRating : "N/A"}`;
  meta.appendChild(rating);
  info.appendChild(meta);

  // Genre
  if (data.Genre && data.Genre !== "N/A") {
    const genre = document.createElement("p");
    genre.className = "genre";
    genre.textContent = data.Genre;
    info.appendChild(genre);
  }

  // Actions
  const actions = document.createElement("div");
  actions.className = "watchlist-actions";
  const detailsBtn = document.createElement("button");
  detailsBtn.className = "view-details-btn";
  detailsBtn.innerHTML = '<i class="fas fa-info-circle"></i> Details';
  detailsBtn.onclick = () => window.location.href = `movie-details.html?id=${data.imdbID}`;
  const removeBtn = document.createElement("button");
  removeBtn.className = "remove-btn";
  removeBtn.innerHTML = '<i class="fas fa-trash"></i> Remove';
  removeBtn.onclick = () => removeFromWatchlist(data.imdbID);
  actions.appendChild(detailsBtn);
  actions.appendChild(removeBtn);
  info.appendChild(actions);

  card.appendChild(thumbnailContainer);
  card.appendChild(info);
  return card;
}

// Load watchlist with error handling and loading states
async function loadWatchlist() {
  showLoading();
  
  try {
    let watchlist = [];
    try {
      watchlist = JSON.parse(localStorage.getItem("watchlist") || "[]");
    } catch (e) {
      localStorage.removeItem("watchlist");
      watchlist = [];
    }

    if (!watchlist.length) {
      watchlistGrid.style.display = "none";
      emptyWatchlist.style.display = "block";
      return;
    }

    watchlistGrid.style.display = "grid";
    emptyWatchlist.style.display = "none";
    watchlistGrid.innerHTML = "";

    // Fetch movie details in parallel
    const moviePromises = watchlist.map(imdbID =>
      fetch(`https://www.omdbapi.com/?apikey=${API_KEY}&i=${imdbID}`)
        .then(res => res.json())
        .then(data => {
          if (data.Response === "True") {
            return data;
          }
          throw new Error(`Failed to fetch movie: ${data.Error || 'Unknown error'}`);
        })
    );

    const movies = await Promise.all(moviePromises);
    movies.forEach(movie => {
      const card = createMovieCard(movie);
      watchlistGrid.appendChild(card);
    });

  } catch (error) {
    console.error('Error loading watchlist:', error);
    showError('Failed to load your watchlist. Please try again later.');
  }
}

// Remove movie from watchlist with animation
async function removeFromWatchlist(imdbID) {
  const card = document.querySelector(`[data-imdb-id="${imdbID}"]`);
  if (card) {
    card.classList.add('removing');
    await new Promise(resolve => setTimeout(resolve, 300));
  }

  let watchlist = JSON.parse(localStorage.getItem("watchlist") || "[]");
  watchlist = watchlist.filter(id => id !== imdbID);
  localStorage.setItem("watchlist", JSON.stringify(watchlist));

  if (watchlist.length === 0) {
    watchlistGrid.style.display = "none";
    emptyWatchlist.style.display = "block";
  } else {
    loadWatchlist();
  }
}

// Initialize page
document.addEventListener("DOMContentLoaded", () => {
  loadWatchlist();
  
  // Theme toggle functionality
  const themeToggle = document.getElementById("theme-toggle");
  const currentTheme = localStorage.getItem("theme") || "dark";
  document.body.classList.toggle("light-theme", currentTheme === "light");
  themeToggle.textContent = currentTheme === "light" ? "🌙" : "☀️";

  themeToggle.addEventListener("click", () => {
    document.body.classList.toggle("light-theme");
    const isLight = document.body.classList.contains("light-theme");
    localStorage.setItem("theme", isLight ? "light" : "dark");
    themeToggle.textContent = isLight ? "🌙" : "☀️";
  });
});
