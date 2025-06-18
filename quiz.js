const API_KEY = "8ddfd56d"; // Same API key as other pages
const questionText = document.getElementById("question-text");
const optionsContainer = document.getElementById("options-container");
const scoreDisplay = document.getElementById("score-display");
const nextQuestionBtn = document.getElementById("next-question");

let currentScore = 0;
let currentQuestionIndex = 0;
let quizQuestions = [];
let fetchedMovies = [];

// Initialize quiz when page loads
document.addEventListener("DOMContentLoaded", () => {
  // Fetch popular movies to create quiz questions
  fetchMoviesForQuiz();
  
  // Set up event listener for next question button
  nextQuestionBtn.addEventListener("click", showNextQuestion);
});

document.addEventListener("DOMContentLoaded", () => {
  const loginLink = document.getElementById("login-link");
  if (loginLink) {
    const currentUser = JSON.parse(localStorage.getItem("currentUser")) || JSON.parse(sessionStorage.getItem("currentUser"));
    if (currentUser) {
      loginLink.textContent = "Profile";
      loginLink.href = "profile.html";
      loginLink.classList.remove("active");
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

// Fetch movies from OMDB API to create quiz questions
function fetchMoviesForQuiz() {
  // Use popular search terms to get a variety of movies
  const searchTerms = ["marvel", "star", "harry", "lord", "jurassic", "fast", "mission"];
  const randomTerm = searchTerms[Math.floor(Math.random() * searchTerms.length)];
  
  fetch(`https://www.omdbapi.com/?s=${randomTerm}&type=movie&apikey=${API_KEY}`)
    .then(res => res.json())
    .then(data => {
      if (data.Response === "True") {
        // Store fetched movies
        fetchedMovies = data.Search;
        
        // Fetch detailed info for each movie
        const detailPromises = fetchedMovies.map(movie => 
          fetch(`https://www.omdbapi.com/?i=${movie.imdbID}&apikey=${API_KEY}`)
            .then(res => res.json())
        );
        
        // When all details are fetched, create quiz questions
        Promise.all(detailPromises)
          .then(detailedMovies => {
            createQuizQuestions(detailedMovies);
            showQuestion(0);
          });
      } else {
        questionText.textContent = "Error loading quiz questions. Please try again.";
      }
    })
    .catch(err => {
      console.error("Error fetching movies for quiz:", err);
      questionText.textContent = "Error loading quiz questions. Please try again.";
    });
}

// Create different types of quiz questions from movie data
function createQuizQuestions(movies) {
  quizQuestions = [];
  
  // Only use movies with complete data
  const validMovies = movies.filter(movie => 
    movie.Director !== "N/A" && 
    movie.Year !== "N/A" && 
    movie.Actors !== "N/A" &&
    movie.Plot !== "N/A"
  );
  
  // 1. "Who directed" questions
  validMovies.forEach(movie => {
    if (movie.Director !== "N/A") {
      // Get other directors for wrong answers
      const wrongDirectors = validMovies
        .filter(m => m.imdbID !== movie.imdbID && m.Director !== movie.Director)
        .map(m => m.Director)
        .slice(0, 3);
      
      if (wrongDirectors.length >= 3) {
        quizQuestions.push({
          question: `Who directed "${movie.Title}" (${movie.Year})?`,
          options: shuffleArray([movie.Director, ...wrongDirectors]),
          correctAnswer: movie.Director,
          movieId: movie.imdbID
        });
      }
    }
  });
  
  // 2. "What year was released" questions
  validMovies.forEach(movie => {
    const wrongYears = [];
    const correctYear = parseInt(movie.Year);
    
    // Generate 3 wrong years within +/- 5 years
    while (wrongYears.length < 3) {
      const offset = Math.floor(Math.random() * 10) - 5;
      const wrongYear = correctYear + offset;
      
      if (wrongYear !== correctYear && !wrongYears.includes(wrongYear) && wrongYear > 1900) {
        wrongYears.push(wrongYear);
      }
    }
    
    quizQuestions.push({
      question: `What year was "${movie.Title}" released?`,
      options: shuffleArray([movie.Year, ...wrongYears.map(y => y.toString())]),
      correctAnswer: movie.Year,
      movieId: movie.imdbID
    });
  });
  
  // 3. "Which actor starred in" questions
  validMovies.forEach(movie => {
    if (movie.Actors !== "N/A") {
      const mainActor = movie.Actors.split(',')[0].trim();
      
      // Get actors from other movies for wrong answers
      const wrongActors = validMovies
        .filter(m => m.imdbID !== movie.imdbID)
        .map(m => m.Actors.split(',')[0].trim())
        .filter(actor => actor !== mainActor)
        .slice(0, 3);
      
      if (wrongActors.length >= 3) {
        quizQuestions.push({
          question: `Which actor starred in "${movie.Title}"?`,
          options: shuffleArray([mainActor, ...wrongActors]),
          correctAnswer: mainActor,
          movieId: movie.imdbID
        });
      }
    }
  });
  
  // Shuffle all questions and limit to 10
  quizQuestions = shuffleArray(quizQuestions).slice(0, 10);
}

// Display a question
function showQuestion(index) {
  if (index >= quizQuestions.length) {
    // Quiz is finished
    showQuizResults();
    return;
  }
  
  const question = quizQuestions[index];
  questionText.textContent = question.question;
  
  // Clear previous options
  optionsContainer.innerHTML = "";
  
  // Add options
  question.options.forEach(option => {
    const optionButton = document.createElement("button");
    optionButton.classList.add("option-btn");
    optionButton.textContent = option;
    optionButton.addEventListener("click", () => checkAnswer(option, question.correctAnswer));
    optionsContainer.appendChild(optionButton);
  });
  
  // Disable next button until answer is selected
  nextQuestionBtn.disabled = true;
}

// Check if the selected answer is correct
function checkAnswer(selectedOption, correctAnswer) {
  const optionButtons = document.querySelectorAll(".option-btn");
  
  // Disable all option buttons
  optionButtons.forEach(button => {
    button.disabled = true;
    
    // Mark correct and incorrect answers
    if (button.textContent === correctAnswer) {
      button.classList.add("correct");
    } else if (button.textContent === selectedOption && selectedOption !== correctAnswer) {
      button.classList.add("incorrect");
    }
  });
  
  // Update score if correct
  if (selectedOption === correctAnswer) {
    currentScore++;
    scoreDisplay.textContent = `Score: ${currentScore}`;
  }
  
  // Enable next button
  nextQuestionBtn.disabled = false;
}

// Show the next question
function showNextQuestion() {
  currentQuestionIndex++;
  showQuestion(currentQuestionIndex);
}

// Show final quiz results
function showQuizResults() {
  const quizContainer = document.querySelector(".quiz-container");
  
  quizContainer.innerHTML = `
    <h2>Quiz Complete!</h2>
    <div class="quiz-results">
      <p>Your final score: ${currentScore} out of ${quizQuestions.length}</p>
      <p class="result-message">${getResultMessage(currentScore, quizQuestions.length)}</p>
      <button id="restart-quiz" class="btn">Try Again</button>
    </div>
  `;
  
  // Add event listener to restart button
  document.getElementById("restart-quiz").addEventListener("click", () => {
    window.location.reload();
  });
}

// Get a message based on score percentage
function getResultMessage(score, total) {
  const percentage = (score / total) * 100;
  
  if (percentage >= 90) {
    return "Amazing! You're a true movie expert!";
  } else if (percentage >= 70) {
    return "Great job! You really know your movies!";
  } else if (percentage >= 50) {
    return "Not bad! You know your fair share of movie trivia.";
  } else if (percentage >= 30) {
    return "Keep watching more movies to improve your knowledge!";
  } else {
    return "Time to binge some classic films and try again!";
  }
}

// Utility function to shuffle an array
function shuffleArray(array) {
  const newArray = [...array];
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }
  return newArray;
}