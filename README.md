# Last Player Standing (MVP)
A browser-based, real-time elimination game for up to ~100 players. Host launches rounds of questions; wrong/late answers are eliminated until one winner remains.

## Tech
- **Server:** Node.js + Express + Socket.IO
- **Client:** React + Vite + Socket.IO Client

> This MVP uses in-memory state on the server for simplicity. You can add MongoDB later if you want persistence and analytics.

## Quick Start
### 1) Server
```bash
cd server
npm install
cp .env.sample .env   # then edit as needed
npm run dev           # starts on http://localhost:4000
```
### 2) Client
```bash
cd client
npm install
npm run dev           # opens Vite dev server (http://localhost:5173)
```
## Environment
### Server .env values (see .env.sample):
```
PORT=4000
CORS_ORIGIN=http://localhost:5173
```
### Client .env (optional): create client/.env with:
```
VITE_SERVER_URL=http://localhost:4000
```
## Game Flow
1.  Host creates a game => gets a 6-digit code.
2.  Players join with the code and a display name.
3.  Host starts a round (multiple-choice question with a timer).
4.  Answer fast and correct to survive. Wrong/late => eliminated.
5.  Repeat until one player remains.

## Planned Upgrades
- MongoDB persistence (games, players, rounds, answers).
- Additional mini-games (reflex, trace, team tug).
- Admin dashboard with CSV export, revives, and moderation.
