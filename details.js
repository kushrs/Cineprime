// At the top of the file, ensure components.js is loaded
// <script src="components.js"></script> in HTML if not already

const API_KEY = "8ddfd56d"; // Use the same API key
const detailsContainer = document.getElementById("movie-details");
const loading = document.getElementById("loading");
const stars = document.querySelectorAll(".star");
const userRatingText = document.getElementById("user-rating");
const submitRatingBtn = document.getElementById("submit-rating");
const submitCommentBtn = document.getElementById("submit-comment");
const commentText = document.getElementById("comment-text");
const commentName = document.getElementById("comment-name");
const commentsContainer = document.getElementById("comments-container");
const movieGrid = document.getElementById("movie-grid");

// Replace with your YouTube Data API key
const YOUTUBE_API_KEY = "AIzaSyApOIxtyKdYc2TEsDG9ftluxyxD0Ka6K8k";

// Get movie ID from URL
const urlParams = new URLSearchParams(window.location.search);
const movieId = urlParams.get("id");

// Load movie details
document.addEventListener("DOMContentLoaded", () => {
  if (!movieId) {
    window.location.href = "index.html";
    return;
  }
  
  fetchMovieDetails(movieId);
  setupRatingSystem();
  loadComments();
  
  // Set up event listeners
  submitRatingBtn.addEventListener("click", submitRating);
  submitCommentBtn.addEventListener("click", submitComment);
});

function fetchMovieDetails(id) {
  loading.style.display = "block";
  
  fetch(`https://www.omdbapi.com/?i=${id}&plot=full&apikey=${API_KEY}`)
    .then(res => res.json())
    .then(movie => {
      loading.style.display = "none";
      
      // Create movie details HTML
      const detailsHTML = `
        <div class="movie-poster">
          <img src="${movie.Poster !== "N/A" ? movie.Poster : "https://placehold.co/300x450?text=No+Image"}" alt="${movie.Title}" />
        </div>
        <div class="movie-info-details">
          <h1 class="movie-title">${movie.Title}</h1>
          <div class="movie-meta">
            <span>${movie.Year}</span>
            <span>${movie.Rated}</span>
            <span>${movie.Runtime}</span>
          </div>
          <p class="movie-rating">⭐ ${movie.imdbRating} / 10</p>
          <p class="movie-plot">${movie.Plot}</p>
          
          <div class="movie-details-section">
            <h3>Genre</h3>
            <p>${movie.Genre}</p>
          </div>
          
          <div class="movie-details-section">
            <h3>Director</h3>
            <p>${movie.Director}</p>
          </div>
          
          <div class="movie-details-section">
            <h3>Cast</h3>
            <p>${movie.Actors}</p>
          </div>
          
          <div class="movie-details-section">
            <h3>Awards</h3>
            <p>${movie.Awards}</p>
          </div>
        </div>
      `;
      
      detailsContainer.innerHTML = detailsHTML;
      
      // Set page title
      document.title = `${movie.Title} - CinePrime`;
      
      // Fetch similar movies


      // After displaying movie details
      const mainGenre = movie.Genre ? movie.Genre.split(",")[0] : "";
      loadSimilarMovies(mainGenre, movie.imdbID);
      loadMovieTrailer(movie.Title, movie.Year);      loadAIInsights(movie.Title);
    })
    .catch(err => {
      console.error("Error fetching movie details:", err);
      detailsContainer.innerHTML = "<p>Error loading movie details. Please try again.</p>";
      loading.style.display = "none";
    });
}

function setupRatingSystem() {
  // Load saved rating if exists
  const savedRating = localStorage.getItem(`movie-rating-${movieId}`);
  if (savedRating) {
    updateStars(parseInt(savedRating));
    userRatingText.textContent = `Your rating: ${savedRating} out of 5`;
  }
  
  // Add event listeners to stars
  stars.forEach(star => {
    star.addEventListener("click", () => {
      const rating = star.getAttribute("data-rating");
      localStorage.setItem(`movie-rating-${movieId}`, rating);
      updateStars(parseInt(rating));
      userRatingText.textContent = `Your rating: ${rating} out of 5`;
    });
  });
}

function updateStars(rating) {
  stars.forEach(star => {
    const starRating = parseInt(star.getAttribute("data-rating"));
    if (starRating <= rating) {
      star.classList.add("active");
    } else {
      star.classList.remove("active");
    }
  });
}

function submitRating() {
  const rating = localStorage.getItem(`movie-rating-${movieId}`);
  if (!rating) {
    alert("Please select a rating first!");
    return;
  }

  // Get user info (you may need to adjust this based on your auth setup)
  const currentUser = JSON.parse(localStorage.getItem("currentUser"));
  if (!currentUser || !currentUser.id) {
    alert("You must be logged in to rate!");
    return;
  }

  fetch('http://127.0.0.1:8000/api/ratings/', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      user: currentUser.id,      // user ID from your auth system
      movie: movieId,            // movie ID (should match your Django model)
      rating: parseInt(rating)
    })
  })
  .then(res => {
    if (!res.ok) throw new Error("Failed to submit rating");
    return res.json();
  })
  .then(data => {
    alert(`Thank you for rating this movie ${rating} out of 5!`);
  })
  .catch(err => {
    alert("Error submitting rating: " + err.message);
  });
}

function submitComment() {
  const text = commentText.value.trim();
  const name = commentName.value.trim() || "Anonymous";
  if (!text) {
    alert("Please enter a comment!");
    return;
  }
  const currentUser = JSON.parse(localStorage.getItem("currentUser"));
  if (!currentUser || !currentUser.id) {
    alert("You must be logged in to comment!");
    return;
  }
  // Save comment to localStorage
  const comment = {
    name: name,
    text: text,
    date: new Date().toISOString()
  };
  let comments = JSON.parse(localStorage.getItem(`movie-comments-${movieId}`)) || [];
  comments.push(comment);
  localStorage.setItem(`movie-comments-${movieId}`, JSON.stringify(comments));
  addCommentToPage(comment);
  commentText.value = "";
  commentName.value = "";
}

function loadComments() {
  const comments = JSON.parse(localStorage.getItem(`movie-comments-${movieId}`)) || [];
  if (comments.length === 0) {
    commentsContainer.innerHTML = '<p class="no-comments">No comments yet. Be the first to comment!</p>';
  } else {
    commentsContainer.innerHTML = '';
    comments.forEach(comment => {
      addCommentToPage(comment);
    });
  }
}

function addCommentToPage(comment) {
  // Format the date
  const date = new Date(comment.date);
  const formattedDate = `${date.toLocaleDateString()} at ${date.toLocaleTimeString()}`;
  
  // Create comment HTML
  const commentElement = document.createElement('div');
  commentElement.classList.add('comment');
  commentElement.innerHTML = `
    <div class="comment-header">
      <span class="comment-author">${comment.name}</span>
      <span class="comment-date">${formattedDate}</span>
    </div>
    <div class="comment-content">${comment.text}</div>
  `;
  
  // Add to container
  if (commentsContainer.querySelector('.no-comments')) {
    commentsContainer.innerHTML = '';
  }
  commentsContainer.appendChild(commentElement);
}

function loadMovieTrailer(title, year) {
  const trailerSection = document.getElementById("trailer-section");
  if (!trailerSection) return;
  trailerSection.innerHTML = "<p>Loading trailer...</p>";

  const searchQuery = encodeURIComponent(`${title} ${year} official trailer`);
  fetch(`https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&maxResults=1&q=${searchQuery}&key=${YOUTUBE_API_KEY}`)
    .then(res => res.json())
    .then(data => {
      if (data.items && data.items.length > 0) {
        const videoId = data.items[0].id.videoId;
        trailerSection.innerHTML = `
          <h3>Trailer</h3>
          <div class="trailer-container">
            <iframe width="100%" height="315"
              src="https://www.youtube.com/embed/${videoId}"
              frameborder="0" allowfullscreen>
            </iframe>
          </div>
        `;
      } else {
        trailerSection.innerHTML = `<p>No trailer found. <a href="https://www.youtube.com/results?search_query=${searchQuery}" target="_blank">Search on YouTube</a></p>`;
      }
    })
    .catch(() => {
      trailerSection.innerHTML = `<p>Failed to load trailer. <a href="https://www.youtube.com/results?search_query=${searchQuery}" target="_blank">Search on YouTube</a></p>`;
    });
}

function trackMovieView(movieId) {
  const currentUser = JSON.parse(localStorage.getItem("currentUser")) || JSON.parse(sessionStorage.getItem("currentUser"));
  if (!currentUser) return;

  let recentlyViewed = JSON.parse(localStorage.getItem(`recentlyViewed-${currentUser.id}`)) || [];

  recentlyViewed = recentlyViewed.filter(id => id !== movieId);
  recentlyViewed.unshift(movieId);
  recentlyViewed = recentlyViewed.slice(0, 5);

  localStorage.setItem(`recentlyViewed-${currentUser.id}`, JSON.stringify(recentlyViewed));
}

function loadRecentlyViewed() {
  const currentUser = JSON.parse(localStorage.getItem("currentUser")) || JSON.parse(sessionStorage.getItem("currentUser"));
  if (!currentUser) return;

  const recentlyViewed = JSON.parse(localStorage.getItem(`recentlyViewed-${currentUser.id}`)) || [];

  if (recentlyViewed.length === 0) return;

  const recentlySection = document.createElement('div');
  recentlySection.classList.add('recently-viewed');
  recentlySection.innerHTML = `
    <h3>Recently Viewed Movies</h3>
    <div class="recently-grid"></div>
  `;

  const recentlyGrid = recentlySection.querySelector('.recently-grid');

  recentlyViewed.forEach(id => {
    fetch(`https://www.omdbapi.com/?i=${id}&apikey=${API_KEY}`)
      .then(res => res.json())
      .then(details => {
        const movieCard = createMovieCard(details);
        recentlyGrid.appendChild(movieCard);
      });
  });

  document.querySelector('.details-container').after(recentlySection);
}

function loadSimilarMovies(mainGenre, excludeId) {
  const similarGrid = document.getElementById("similar-movies-grid");
  if (!similarGrid) return;
  similarGrid.innerHTML = "Loading...";

  fetch(`https://www.omdbapi.com/?s=${encodeURIComponent(mainGenre)}&type=movie&apikey=${API_KEY}`)
    .then(res => res.json())
    .then(data => {
      if (data.Response === "True") {
        // Exclude the current movie and limit to 6
        const filtered = data.Search.filter(m => m.imdbID !== excludeId).slice(0, 6);
        similarGrid.innerHTML = "";
        filtered.forEach(movie => {
          const movieCard = createMovieCard(movie);
          similarGrid.appendChild(movieCard);
        });
      } else {
        similarGrid.innerHTML = "<p>No similar movies found.</p>";
      }
    })
    .catch(() => {
      similarGrid.innerHTML = "<p>Failed to load similar movies.</p>";
    });
}

function loadAIInsights(title) {
  // Simulate AI insights (replace with real AI API if available)
  const facts = [
    `Did you know? "${title}" was one of the most searched movies of its release year!`,
    `AI says: "${title}" is recommended for fans of adventure and drama.`,
    `Fun fact: Many viewers rated "${title}" highly for its soundtrack!`
  ];
  document.getElementById("ai-insights-content").textContent =
    facts[Math.floor(Math.random() * facts.length)];
}

// Call loadRecentlyViewed after DOMContentLoaded
loadRecentlyViewed();

// Add to details.js
function votePoll(option) {
  let poll = JSON.parse(localStorage.getItem("poll-" + movieId) || '{"yes":0,"no":0}');
  poll[option]++;
  localStorage.setItem("poll-" + movieId, JSON.stringify(poll));
  renderPollResults();
}
function renderPollResults() {
  let poll = JSON.parse(localStorage.getItem("poll-" + movieId) || '{"yes":0,"no":0}');
  document.getElementById("poll-results").textContent =
    `Yes: ${poll.yes} | No: ${poll.no}`;
}
// Call renderPollResults() on page load
renderPollResults();

async function fetchMovies() {
  const { data, error } = await supabase.from('movies').select('*');
  if (error) {
    console.error(error);
    return [];
  }
  return data;
}

async function addRating(user_id, movie_id, rating) {
  const { error } = await supabase.from('ratings').insert([{ user_id, movie_id, rating }]);
  if (error) alert('Error adding rating');
}

async function addComment(user_id, movie_id, text) {
  const { error } = await supabase.from('comments').insert([{ user_id, movie_id, text }]);
  if (error) alert('Error adding comment');
}

async function showAllSupabaseMovies() {
  const movies = await fetchMovies();
  movieGrid.innerHTML = "";
  movies.forEach(movie => {
    const poster = movie.poster || "https://placehold.co/300x450?text=No+Image";
    movieGrid.innerHTML += `
      <div class="movie-card">
        <div class="movie-thumbnail-container">
          <img class="movie-thumbnail" src="${poster}" alt="${movie.title}">
          <div class="trailer-preview" style="display:none"></div>
        </div>
        <div class="movie-info">
          <h3>${movie.title}</h3>
          <p>${movie.year}</p>
        </div>
      </div>
    `;
  });
  setupTrailerPreview("#movie-grid");
}





