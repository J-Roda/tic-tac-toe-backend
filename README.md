# X · O · ARENA — Backend

A REST API built with **Express + MongoDB** for managing Tic-Tac-Toe game sessions. Handles session creation, round tracking, stats, and session history — secured against spam and common web attacks.

---

## Documentation

| File | Description |
|------|-------------|
| `README.md` | You are here — project overview, setup, and API reference |
| `SECURITY.md` | Deep dive into every security measure applied to this backend |

---

## Stack

- **Node.js** — runtime
- **Express** — web framework
- **Mongoose** — MongoDB ODM
- **Helmet** — secure HTTP headers
- **express-rate-limit** — IP-based rate limiting
- **express-mongo-sanitize** — NoSQL injection protection
- **dotenv** — environment variable management

---

## Project Structure

```
backend/
├── controller/
│   └── sessionController.js   # Route handlers with input validation
├── models/
│   └── GameSession.js         # Mongoose schema with field constraints
├── routes/
│   └── session.js             # Express router — maps endpoints to controllers
├── server.js                  # App entry point — middleware, security, DB connection
├── package.json
├── .env.example               # Environment variable template
├── README.md                  # This file
└── SECURITY.md                # Security measures reference
```

---

## Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment variables

```bash
cp .env.example .env
```

Then open `.env` and fill in your values:

```env
MONGO_URI=mongodb://localhost:27017/tictactoe
PORT=5000
NODE_ENV=development
ALLOWED_ORIGINS=http://localhost:5173
```

### 3. Run the server

```bash
# Development (auto-restarts on file change)
npm run dev

# Production
npm start
```

Server runs on `http://localhost:5000` by default.

---

## API Reference

Base URL: `/api/session`

### Health Check

```
GET /api/session/
```

Returns `{ "status": "ok" }` if the server is running. Used by the frontend DB status indicator.

---

### Create Session

```
POST /api/session/create
```

**Body:**
```json
{
  "player1": "Alice",
  "player2": "Bob"
}
```

**Response `201`:**
```json
{
  "_id": "64f1a2b3c4d5e6f7a8b9c0d1",
  "player1": "Alice",
  "player2": "Bob",
  "rounds": [],
  "stats": { "player1Wins": 0, "player2Wins": 0, "draws": 0 },
  "isActive": true,
  "createdAt": "2024-01-01T00:00:00.000Z"
}
```

**Validation:**
- Both `player1` and `player2` are required
- Max 32 characters each
- Cannot be identical

---

### Log a Round

```
POST /api/session/:id/round
```

**Body:**
```json
{ "winner": "Alice" }
```

`winner` must be one of: `player1`'s name, `player2`'s name, or `"draw"`.

**Response `200`:** Updated session object with new round appended and stats incremented.

**Validation:**
- Session must exist and be active
- `winner` must match a known player name or `"draw"`
- Max 100 rounds per session

---

### End Session

```
POST /api/session/:id/stop
```

Marks the session as inactive (`isActive: false`). No body required.

**Response `200`:** Updated session object.

---

### Get All Sessions

```
GET /api/session/all
```

Supports pagination via query params:

```
GET /api/session/all?page=1&limit=20
```

| Param | Default | Max |
|-------|---------|-----|
| `page` | `1` | — |
| `limit` | `20` | `50` |

**Response `200`:**
```json
{
  "sessions": [ ...],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 42,
    "pages": 3
  }
}
```

---

### Delete Session

```
DELETE /api/session/:id
```

**Response `200`:**
```json
{ "message": "Session deleted successfully." }
```

---

## Error Responses

All errors follow a consistent shape:

```json
{ "error": "Descriptive error message." }
```

| Status | Meaning |
|--------|---------|
| `400` | Bad request — validation failed or invalid input |
| `404` | Resource not found |
| `429` | Too many requests — rate limit exceeded |
| `500` | Internal server error (message hidden in production) |

---

## Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `MONGO_URI` | ✅ | — | MongoDB connection string |
| `PORT` | ❌ | `5000` | Port the server listens on |
| `NODE_ENV` | ❌ | `development` | Set to `production` to hide error details in responses |
| `ALLOWED_ORIGINS` | ❌ | `http://localhost:5173` | Comma-separated list of allowed CORS origins |

---

## Security Overview

This backend is hardened against the most common attack vectors for a public-facing game API. For the full breakdown see [`SECURITY.md`](./SECURITY.md).

| Layer | Measure |
|-------|---------|
| Headers | Helmet sets XSS, clickjacking, MIME, and HSTS headers |
| CORS | Only whitelisted origins can make requests |
| Rate limiting | 100 req/15 min globally, 30 req/15 min on write routes |
| Payload | Request body capped at 10 kb |
| Injection | `$` and `.` stripped from all input before DB queries |
| Validation | ObjectId format, string length, winner whitelist enforced in controllers |
| Schema | Mongoose enforces constraints as a second line of defence |
| Pagination | `getAllSessions` never dumps more than 50 records at once |
| Errors | Stack traces hidden from responses in production |

---

## Frontend

The matching frontend lives in `tictactoe-frontend/` and is built with Vite + React + Tailwind CSS + TanStack Query. See its own `README.md` for setup instructions.

The frontend proxies all `/api` requests to `http://localhost:5000` via Vite's dev server proxy, so no extra CORS configuration is needed during development.
