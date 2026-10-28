# 🎬 CinePrime — Stream Premium Movies & Series

> A feature-rich movie discovery and tracking web app with AI-powered recommendations, interactive quizzes, cloud-synced watchlists, and more.

![HTML5](https://img.shields.io/badge/HTML5-E34F26?style=for-the-badge&logo=html5&logoColor=white)
![CSS3](https://img.shields.io/badge/CSS3-1572B6?style=for-the-badge&logo=css3&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black)
![Supabase](https://img.shields.io/badge/Supabase-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)
![Vercel](https://img.shields.io/badge/Vercel-000000?style=for-the-badge&logo=vercel&logoColor=white)

---

## 📖 Table of Contents

- [Overview](#-overview)
- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Architecture](#-architecture)
- [Project Structure](#-project-structure)
- [Getting Started](#-getting-started)
- [Database Schema](#-database-schema)
- [API Reference](#-api-reference)
- [User Flow](#-user-flow)
- [Deployment](#-deployment)
- [Environment Variables](#-environment-variables)
- [Contributing](#-contributing)
- [License](#-license)

---

## 🌟 Overview

CinePrime is a **Netflix-inspired movie discovery platform** where users can browse movies, save watchlists, read and write reviews, watch trailers, take movie trivia quizzes, and chat with an AI for personalized recommendations.

It does **not** stream movies — it helps you **find, organize, and explore** them using real data from the OMDb API.

The app works as a **guest** (no login needed to browse) and progressively unlocks features like cloud-synced watchlists, ratings, and profile management upon sign-up.

---

## ✨ Features

### 🏠 Homepage & Discovery
- **Hero Banner** — Rotating carousel of featured movies
- **Curated Sections** — Popular Movies, Trending Now, Top Rated
- **Genre Tabs** — Browse by Action, Comedy, Drama, Sci-Fi
- **Personalized Recommendations** — Suggested movies based on your activity
- **Advanced Search** — Filter by title, type (movie/series), year, and genre
- **Dark / Light Mode** — Toggle theme with a single click

### 🎥 Movie Details
- Full plot, cast, director, and runtime information
- Ratings from **IMDb, Rotten Tomatoes, and Metacritic**
- Embedded **YouTube trailers** (via YouTube Data API)
- **Streaming availability** — See which platforms carry the movie (Netflix, Prime, Hotstar, etc.)
- **User ratings** (1–5 stars) and **comments** section
- **Similar movies** recommendations
- **Recently viewed** tracking for logged-in users

### 📋 Watchlist
- Add/remove movies from any page with a single click
- **Guest mode**: Watchlist saved to browser localStorage
- **Logged-in mode**: Cloud-synced via Supabase, with localStorage as a mirror
- **Collaborative Rooms** — Share a watchlist with friends via a room link
- Sort and filter your saved movies

### 🤖 AI Movie Matchmaker
- Powered by **Google Gemini AI** (Gemini 2.5 Flash)
- Conversational chatbot interface — multi-turn back-and-forth
- Preset mood pills (e.g., "Feel-good", "Mind-bending") or custom prompts
- AI returns movie recommendations with "curator insights" explaining each pick
- Recommended movies render as interactive cards (add to watchlist, view details)

### 🧠 Movie Quiz
- Trivia questions auto-generated from real OMDb movie data
- Multiple-choice format with instant feedback
- Score tracking per session
- **Global leaderboard** (Supabase-backed when available)

### 👤 User Profile
- Editable display name, bio, and profile picture (upload via Supabase Storage)
- Password change with **strength meter** and confirmation match
- Viewing preferences (favorite genres)
- Activity dashboard: recently viewed, ratings given, comments posted

### 📂 Custom Lists
- Create named collections beyond the default watchlist (e.g., "Horror Favorites", "Date Night")
- Add/remove movies to/from any list
- Edit or delete lists

### 🔐 Authentication
- **Email + Password** registration and login via Supabase Auth
- **Google OAuth** sign-in (one-click)
- Email verification support
- Automatic profile creation on first login
- Graceful offline fallback when Supabase is unreachable

### 📡 Offline & PWA Support
- **Service Worker** caches core pages and assets for offline access
- `offline.html` fallback page when the network is completely down
- LocalStorage mirrors all critical data for uninterrupted browsing
- Smart **fetch interceptor** falls back to direct API calls when serverless functions are unavailable

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | HTML5, CSS3, Vanilla JavaScript (no frameworks) |
| **Fonts** | Google Fonts — Poppins, Outfit |
| **Auth & Database** | [Supabase](https://supabase.com) (PostgreSQL + Auth + Storage) |
| **Movie Data** | [OMDb API](https://www.omdbapi.com/) |
| **Trailers** | [YouTube Data API v3](https://developers.google.com/youtube/v3) |
| **AI Recommendations** | [Google Gemini API](https://ai.google.dev/) (Gemini 2.5 Flash) |
| **Serverless Functions** | Vercel Serverless Functions (Node.js) |
| **Deployment** | [Vercel](https://vercel.com) |
| **Legacy Backend** | Express.js + MongoDB (deprecated — replaced by Supabase) |

---

## 🏗️ Architecture

```
┌───────────────────────────────────────────────────────────┐
│                     BROWSER (Client)                      │
│                                                           │
│  index.html ─── script.js          movie-details.html     │
│  watchlist.html ─── watchlist.js   matchmaker.html        │
│  quiz.html ─── quiz.js            profile.html            │
│  login.html / register.html ─── auth.js                   │
│                                                           │
│  Shared: supabase-config.js · app-common.js · components.js│
│  Service Worker: service-worker.js                        │
└──────────────┬────────────────────────────────────────────┘
               │
               │  fetch() with smart interceptor
               │  (tries serverless → falls back to direct)
               │
       ┌───────┴───────────────────────────────┐
       │        Vercel Serverless APIs          │
       │  /api/search    /api/movie             │
       │  /api/omdb      /api/trailer           │
       │  /api/matchmaker /api/availability     │
       └───────┬──────────┬──────────┬─────────┘
               │          │          │
       ┌───────▼──┐  ┌────▼────┐ ┌──▼──────────┐
       │ OMDb API │  │YouTube  │ │ Gemini AI   │
       │          │  │Data API │ │ (Google)    │
       └──────────┘  └─────────┘ └─────────────┘
               │
       ┌───────▼──────────────────────────────┐
       │           Supabase (BaaS)             │
       │                                       │
       │  Auth ──── Users, OAuth, Sessions     │
       │  Database ─ watchlist, profiles,       │
       │             ratings, comments,         │
       │             recently_viewed            │
       │  Storage ── Profile pictures           │
       └───────────────────────────────────────┘
```

### Smart Fetch Interceptor

The app includes a global fetch interceptor in `supabase-config.js` that:

1. Intercepts any request to `/api/*`
2. Tries the Vercel serverless function first
3. If it fails (e.g., running locally without Vercel), falls back to **direct client-side API calls**
4. This allows the app to work identically on Vercel, on a local Live Server, or even offline

---

## 📁 Project Structure

```
cineprimee/
│
├── index.html                 # Homepage — hero banner, movie sections, search
├── movie-details.html         # Individual movie detail page
├── watchlist.html             # User's saved movies
├── login.html                 # Login page (email + Google OAuth)
├── register.html              # Registration page
├── profile.html               # User profile dashboard
├── profiles.html              # Profile selector (multi-profile support)
├── quiz.html                  # Movie trivia quiz
├── matchmaker.html            # AI Movie Matchmaker chatbot
├── list-detail.html           # Individual custom list view
├── google-callback.html       # Google OAuth redirect handler
├── offline.html               # Offline fallback page
│
├── style.css                  # Main stylesheet (47KB — full design system)
├── auth.css                   # Auth pages (login/register) styles
├── details.css                # Movie details page styles
├── watchlist.css               # Watchlist page styles
├── quiz.css                   # Quiz page styles
├── matchmaker.css             # AI Matchmaker page styles
├── profile.css                # Profile page styles
├── lists.css                  # Custom lists page styles
│
├── script.js                  # Homepage logic — loaders, search, watchlist toggle
├── details.js                 # Movie details — trailers, ratings, comments
├── watchlist.js               # Watchlist — CRUD, collaborative rooms, offline cache
├── auth.js                    # Login, register, Google OAuth logic
├── quiz.js                    # Quiz — question generation, scoring, leaderboard
├── matchmaker.js              # AI chatbot — Gemini integration, chat history
├── profile.js                 # Profile — edit info, preferences, activity
├── lists.js                   # Custom lists — create, edit, delete
├── profiles.js                # Multi-profile selector logic
├── list-detail.js             # Individual list detail view
├── continueWatching.js        # Continue watching tracker
├── components.js              # Shared UI components (movie cards, toasts)
├── app-common.js              # Shared utilities (auth nav, logout, service worker)
├── supabase-config.js         # Supabase client + fetch interceptor + fallbacks
│
├── service-worker.js          # PWA service worker (caching, offline support)
├── package.json               # Root dependencies (node-fetch for serverless)
├── vercel.json                # Vercel deployment config (headers, caching)
│
├── supabase-setup.sql         # Database schema — tables, RLS policies, indexes
├── supabase-setup-v2.sql      # Alternative/updated schema
├── supabase-trigger.sql       # Database triggers (auto profile creation)
│
├── api/                       # Vercel Serverless Functions
│   ├── search.js              # Proxy: OMDb search endpoint
│   ├── movie.js               # Proxy: OMDb movie details endpoint
│   ├── omdb.js                # Proxy: Generic OMDb pass-through
│   ├── trailer.js             # Proxy: YouTube trailer search
│   ├── matchmaker.js          # Proxy: Gemini AI recommendations
│   └── availability.js        # Streaming availability lookup
│
├── backend/                   # Legacy Express.js backend (deprecated)
│   ├── server.js              # Express server entry point
│   ├── package.json           # Backend dependencies
│   ├── .env.example           # Environment variables template
│   ├── routes/
│   │   ├── auth.js            # Auth routes (JWT-based)
│   │   ├── users.js           # User profile routes
│   │   └── watchlist.js       # Watchlist CRUD routes
│   ├── models/
│   │   └── User.js            # Mongoose User model
│   ├── middleware/             # Auth middleware (JWT verification)
│   └── test-api.js            # API test script
│
└── .gitignore
```

---

## 🚀 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v16 or higher)
- A [Supabase](https://supabase.com) project (free tier works)
- An [OMDb API key](https://www.omdbapi.com/apikey.aspx) (free: 1,000 requests/day)
- A [YouTube Data API key](https://console.cloud.google.com/) (optional — for trailers)
- A [Google Gemini API key](https://ai.google.dev/) (optional — for AI Matchmaker)

### 1. Clone the Repository

```bash
git clone https://github.com/your-username/cineprime.git
cd cineprime
```

### 2. Set Up Supabase

1. Create a new project at [supabase.com](https://supabase.com)
2. Go to **SQL Editor** and run the contents of `supabase-setup.sql`
3. (Optional) Run `supabase-trigger.sql` for automatic profile creation on signup
4. Copy your **Project URL** and **Anon Key** from **Settings → API**

### 3. Configure API Keys

Update the keys in `supabase-config.js`:

```javascript
const SUPABASE_URL = "https://your-project.supabase.co";
const SUPABASE_ANON_KEY = "your-anon-key";
const OMDB_API_KEY = "your-omdb-key";
```

And set the YouTube and Gemini keys:

```javascript
window.YOUTUBE_API_KEY = "your-youtube-key";
```

For the Vercel serverless matchmaker, set `GEMINI_API_KEY` as an environment variable.

### 4. Run Locally

**Option A — Simple (Live Server)**

Open the project in VS Code and use the [Live Server extension](https://marketplace.visualstudio.com/items?itemName=ritwickdey.LiveServer) to serve `index.html`. The fetch interceptor will automatically bypass the serverless functions and call APIs directly.

**Option B — With Vercel Dev (full serverless functions)**

```bash
npm install
npx vercel dev
```

This spins up a local Vercel environment at `http://localhost:3000` with the `/api/*` serverless functions working.

---

## 🗄️ Database Schema

The app uses **5 tables** in Supabase with Row Level Security (RLS) enabled:

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   profiles      │     │   watchlist      │     │   ratings       │
├─────────────────┤     ├─────────────────┤     ├─────────────────┤
│ id (UUID, PK)   │     │ id (BIGSERIAL)  │     │ id (BIGINT)     │
│ email           │     │ user_id (FK)    │     │ user_id (FK)    │
│ username        │     │ movie_id (TEXT)  │     │ movie_id (TEXT) │
│ full_name       │     │ created_at      │     │ rating (1–5)    │
│ avatar_url      │     │ UNIQUE(user,    │     │ created_at      │
│ bio             │     │        movie)   │     │ updated_at      │
│ created_at      │     └─────────────────┘     │ UNIQUE(user,    │
│ updated_at      │                             │        movie)   │
└─────────────────┘                             └─────────────────┘

┌─────────────────┐     ┌─────────────────────┐
│   comments      │     │   recently_viewed   │
├─────────────────┤     ├─────────────────────┤
│ id (BIGINT)     │     │ id (BIGINT)         │
│ user_id (FK)    │     │ user_id (FK)        │
│ movie_id (TEXT) │     │ movie_id (TEXT)      │
│ content (TEXT)  │     │ viewed_at           │
│ created_at      │     │ UNIQUE(user, movie) │
└─────────────────┘     └─────────────────────┘
```

### RLS Policies Summary

| Table | SELECT | INSERT | UPDATE | DELETE |
|---|---|---|---|---|
| `profiles` | Public (anyone) | Own profile only | Own profile only | — |
| `watchlist` | Own items only | Own items only | — | Own items only |
| `ratings` | Own items only | Own items only | Own items only | Own items only |
| `comments` | Public (anyone) | Own comments only | — | Own comments only |
| `recently_viewed` | Own items only | Own items only | Own items only | Own items only |

---

## 📡 API Reference

### Vercel Serverless Functions (`/api/`)

| Endpoint | Method | Description | Parameters |
|---|---|---|---|
| `/api/search` | GET | Search movies/shows | `s` (query), `page` |
| `/api/movie` | GET | Get movie details by ID | `id` (IMDb ID) |
| `/api/omdb` | GET | Generic OMDb pass-through | Any OMDb params |
| `/api/trailer` | GET | Search YouTube trailers | `q` (search query) |
| `/api/matchmaker` | GET/POST | AI movie recommendations | `mood`, `genre`, `era`, `prompt` or POST body with `history[]` |
| `/api/availability` | GET | Streaming platform lookup | `title`, `year` |

### External APIs Used

| API | Purpose | Docs |
|---|---|---|
| OMDb API | Movie metadata (title, plot, cast, ratings, poster) | [omdbapi.com](https://www.omdbapi.com/) |
| YouTube Data API v3 | Trailer search and embed | [developers.google.com](https://developers.google.com/youtube/v3) |
| Google Gemini API | AI conversational movie recommendations | [ai.google.dev](https://ai.google.dev/) |
| Supabase Auth | User authentication (email + Google OAuth) | [supabase.com/docs/auth](https://supabase.com/docs/guides/auth) |

---

## 🚶 User Flow

```
NEW USER ARRIVES (no account)
        │
        ├── 🏠 Browse Homepage (Popular, Trending, Top Rated, Genres)
        ├── 🔍 Search & filter movies
        ├── 🎥 View movie details, trailers, streaming availability
        ├── 🤖 Chat with AI Matchmaker for recommendations
        ├── 🧠 Play Movie Quiz
        │
        └── ➕ Adds movie to Watchlist
                │
                ├── Saved to localStorage (browser only)
                └── Toast: "Log in to sync!"
                        │
                        ▼
              ┌─────────────────────┐
              │   📝 SIGN UP        │
              │  Email or Google    │
              └────────┬────────────┘
                       │
                       ▼
              ┌─────────────────────────┐
              │   ✅ LOGGED IN           │
              │                         │
              │  • Watchlist → Supabase │
              │  • Ratings & Comments   │
              │  • Profile dashboard    │
              │  • Custom lists         │
              │  • Recently viewed      │
              │  • Quiz leaderboard     │
              └─────────────────────────┘
```

**Key principle:** Everything works without login. Sign-up progressively unlocks cloud sync and social features.

---

## 🌐 Deployment

### Deploy to Vercel

1. Push the repo to GitHub
2. Import the project in [Vercel](https://vercel.com)
3. Set environment variables in Vercel dashboard:
   - `GEMINI_API_KEY` — your Google Gemini API key
   - `OMDB_API_KEY` — your OMDb API key (optional; also hardcoded in client as fallback)
   - `YOUTUBE_API_KEY` — your YouTube Data API key
4. Deploy — Vercel auto-detects the serverless functions in `/api/`

The `vercel.json` configures:
- Security headers (`X-Content-Type-Options`, `X-Frame-Options`, `X-XSS-Protection`)
- Aggressive caching for CSS (1 year) and JS/images (1 day)
- Clean URLs (no `.html` extensions needed)

---

## 🔐 Environment Variables

### Vercel (Production)

| Variable | Required | Description |
|---|---|---|
| `GEMINI_API_KEY` | Yes (for AI Matchmaker) | Google Gemini API key |
| `OMDB_API_KEY` | Optional | OMDb API key (has client-side fallback) |
| `YOUTUBE_API_KEY` | Optional | YouTube Data API key (has client-side fallback) |

### Backend (Legacy — if running Express server)

Create a `.env` file in the `backend/` directory (see `backend/.env.example`):

```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your-anon-key
PORT=5000
MONGODB_URI=mongodb://127.0.0.1:27017/cineprime
JWT_SECRET=your_jwt_secret_key_here
```

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

---

<p align="center">
  Made with ❤️ by CinePrime | Powered by OMDb API, Supabase & Google Gemini
</p>
