// Unified Movie Card Component for CinePrime
// Usage: createMovieCard(movie, { badge: 'Trending', badgeType: 'trending' })

function createMovieCard(movie, options = {}) {
  const card = document.createElement("div");
  card.className = "movie-card";
  card.dataset.imdbId = movie.imdbID;

  // Badge (Trending, Top Rated, Genre, etc.)
  if (options.badge) {
    const badge = document.createElement("div");
    badge.className = `movie-badge ${options.badgeType || ''}`;
    badge.textContent = options.badge;
    card.appendChild(badge);
  }

  // Thumbnail
  const thumbnailContainer = document.createElement("div");
  thumbnailContainer.className = "movie-thumbnail-container";
  const thumbnail = document.createElement("img");
  thumbnail.className = "movie-thumbnail";
  thumbnail.src = movie.Poster && movie.Poster !== "N/A" ? movie.Poster : 'https://placehold.co/300x450?text=No+Image';
  thumbnail.onerror = function() { this.onerror = null; this.src = 'https://placehold.co/300x450?text=No+Image'; };
  thumbnail.alt = movie.Title;
  thumbnail.loading = "lazy";
  thumbnailContainer.appendChild(thumbnail);
  card.appendChild(thumbnailContainer);

  // Info overlay
  const info = document.createElement("div");
  info.className = "movie-info";
  const title = document.createElement("h3");
  title.textContent = movie.Title || "Untitled";
  info.appendChild(title);

  // Meta (year, rating, runtime)
  const meta = document.createElement("div");
  meta.className = "movie-meta";
  const year = document.createElement("span");
  year.className = "year";
  year.textContent = movie.Year || "";
  meta.appendChild(year);
  if (movie.Runtime) {
    const runtime = document.createElement("span");
    runtime.className = "runtime";
    runtime.textContent = ` • ${movie.Runtime}`;
    meta.appendChild(runtime);
  }
  const rating = document.createElement("span");
  rating.className = "rating";
  rating.innerHTML = `★ ${movie.imdbRating && movie.imdbRating !== "N/A" ? movie.imdbRating : "N/A"}`;
  meta.appendChild(rating);
  info.appendChild(meta);

  // Genre
  if (movie.Genre && movie.Genre !== "N/A") {
    const genre = document.createElement("p");
    genre.className = "genre";
    genre.textContent = movie.Genre;
    info.appendChild(genre);
  }

  // Actions
  const actions = document.createElement("div");
  actions.className = "card-actions";
  // Watchlist button
  const watchlist = JSON.parse(localStorage.getItem('watchlist') || '[]');
  const isInWatchlist = watchlist.includes(movie.imdbID);
  const watchlistBtn = document.createElement("button");
  watchlistBtn.className = "watchlist-btn" + (isInWatchlist ? " in-watchlist" : "");
  watchlistBtn.textContent = isInWatchlist ? "✓ In Watchlist" : "+ Add to Watchlist";
  watchlistBtn.onclick = (e) => {
    e.stopPropagation();
    if (typeof addToWatchlist === 'function') addToWatchlist(movie);
  };
  actions.appendChild(watchlistBtn);
  // Details button
  const detailsBtn = document.createElement("button");
  detailsBtn.className = "details-btn";
  detailsBtn.textContent = "Details";
  detailsBtn.onclick = (e) => {
    e.stopPropagation();
    if (typeof showMovieDetails === 'function') showMovieDetails(movie.imdbID);
    else window.location.href = `movie-details.html?id=${movie.imdbID}`;
  };
  actions.appendChild(detailsBtn);
  info.appendChild(actions);

  card.appendChild(info);
  return card;
}

// Export for use in other scripts
window.createMovieCard = createMovieCard; 