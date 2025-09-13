# Flashcard Frenzy Multiplayer

A multiplayer flashcard quiz game where two logged-in players race to answer questions.  
The first player to answer correctly scores a point.  
Built with **Next.js**, **Supabase (Auth + Realtime)**, and **MongoDB** for persistent match history.  

---

## 🚀 Features
- **Authentication** – Players sign in with Supabase Auth.
- **Lobby System** – Players can create or join lobbies.
- **Realtime Gameplay** – Supabase Realtime channels sync scores, answers, and timers instantly.
- **Match History** – MongoDB stores match results (with `winner`, `createdAt`, `updatedAt`).
- **Game Logic** –  
  - Countdown before the game starts  
  - Timer per question  
  - Score tracking  
  - Game-over screen with winner/loser/draw result

---

## 🛠️ Tech Stack
- **Frontend**: Next.js (App Router, Client Components, CSS Modules)  
- **Auth & Realtime**: Supabase (Auth + Realtime channels)  
- **Database**: MongoDB (match history storage)  
- **Deployment**: Vercel (recommended)  

---


## 🔑 Environment Variables
Create a `.env.local` file at the root:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# MongoDB
MONGODB_URI=your_mongodb_connection_string
MONGODB_DB=your_db_name


## ▶️ Running Locally

# 1. Install dependencies
npm install

# 2. Run development server
npm run dev

# 3. Visit
http://localhost:3000

# 4. Open the game on another device or browser and you will automatically join the open lobby to play multiplayer

