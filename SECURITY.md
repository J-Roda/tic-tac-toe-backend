# Security Guide — X · O · ARENA Backend

A breakdown of every security measure applied to this backend, why it exists, and how to configure it.

---

## Packages Added

| Package | Purpose |
|---------|---------|
| `helmet` | Sets secure HTTP response headers |
| `express-rate-limit` | Blocks excessive requests per IP |
| `express-mongo-sanitize` | Strips NoSQL injection characters from input |

Install them with:

```bash
npm install helmet express-rate-limit express-mongo-sanitize
```

---

## 1. Secure HTTP Headers — `helmet`

**File:** `server.js`

```js
app.use(helmet());
```

Helmet automatically sets the following headers on every response:

| Header | What it prevents |
|--------|-----------------|
| `X-Content-Type-Options` | MIME-type sniffing attacks |
| `X-Frame-Options` | Clickjacking via iframes |
| `X-XSS-Protection` | Basic reflected XSS in older browsers |
| `Strict-Transport-Security` | Forces HTTPS in production |
| `Content-Security-Policy` | Controls which resources the browser can load |

No configuration needed — the defaults are solid for an API server.

---

## 2. CORS — Origin Whitelist

**File:** `server.js`

```js
const allowedOrigins = (process.env.ALLOWED_ORIGINS || "http://localhost:5173")
    .split(",")
    .map((o) => o.trim());
```

Only requests from origins listed in `ALLOWED_ORIGINS` are accepted. Any other origin receives a CORS error before it reaches your routes.

**How to configure:**

```env
# .env — development
ALLOWED_ORIGINS=http://localhost:5173

# .env — production (comma-separated, no spaces)
ALLOWED_ORIGINS=https://yourdomain.com,https://www.yourdomain.com
```

---

## 3. Rate Limiting — `express-rate-limit`

**File:** `server.js`

Two limiters are applied — one broad, one targeted at write operations.

### Global limiter
```js
// 100 requests per 15 minutes per IP — applies to all routes
const globalLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 100 });
app.use(globalLimiter);
```

### Write limiter
```js
// 30 requests per 15 minutes per IP — applies to session creation and round logging
const writeLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 30 });
app.use("/api/session/create", writeLimiter);
app.use("/api/session/:id/round", writeLimiter);
```

When a limit is hit, the server responds with:

```json
{ "error": "Too many requests, please try again later." }
```

**Adjusting limits:**

Raise or lower `max` and `windowMs` to fit your expected traffic. For example, a public-facing game with many simultaneous players might raise the global limit to `300`. A private hobby project can keep it low.

---

## 4. Body Size Cap

**File:** `server.js`

```js
app.use(express.json({ limit: "10kb" }));
```

Requests with a body larger than 10 kb are rejected immediately with a `413 Payload Too Large` response. This prevents memory exhaustion attacks where an attacker sends an enormous JSON body.

For a game API sending only player names and round results, 10 kb is many times larger than any legitimate request will ever be.

---

## 5. NoSQL Injection Protection — `express-mongo-sanitize`

**File:** `server.js`

```js
app.use(mongoSanitize());
```

Strips `$` and `.` characters from all incoming `req.body`, `req.query`, and `req.params` before they reach your controllers. This prevents attackers from injecting MongoDB operators like `{ "$gt": "" }` to bypass queries.

**Example attack this blocks:**

```json
{ "player1": { "$gt": "" }, "player2": "attacker" }
```

Without sanitization, this could match unintended documents. With sanitization, the operator characters are removed before Mongoose ever sees the value.

---

## 6. Input Validation — Controller Layer

**File:** `controller/sessionController.js`

Every controller validates its inputs before touching the database.

### ObjectId validation
```js
const isValidObjectId = (id) => /^[a-f\d]{24}$/i.test(id);
```
All `req.params.id` values are checked to be valid 24-character hex MongoDB ObjectIds. Malformed IDs are rejected with a `400` before any DB query runs — preventing Mongoose cast errors from leaking stack traces.

### String sanitization
```js
const sanitizeString = (str) =>
    typeof str === "string" ? str.trim().slice(0, 32) : null;
```
All string inputs are trimmed of whitespace and hard-capped at 32 characters.

### Winner validation
```js
const validWinners = [session.player1, session.player2, "draw"];
if (!validWinners.includes(winner)) {
    return res.status(400).json({ error: "Invalid winner value." });
}
```
The `winner` field in a round can only be one of the two known player names or `"draw"`. Arbitrary strings are rejected.

### Identical player names
```js
if (player1 === player2) {
    return res.status(400).json({ error: "Players must have different names." });
}
```

### Round cap per session
```js
if (session.rounds.length >= 100) {
    return res.status(400).json({ error: "Maximum rounds reached for this session." });
}
```
Prevents a single session from being spammed with thousands of rounds.

---

## 7. Schema-Level Constraints — Mongoose Model

**File:** `models/GameSession.js`

The database schema enforces its own constraints as a second line of defence, independent of the controller.

```js
player1: { type: String, required: true, trim: true, minlength: 1, maxlength: 32 },
player2: { type: String, required: true, trim: true, minlength: 1, maxlength: 32 },
rounds:  { validate: (r) => r.length <= 100, ... },
stats: {
    player1Wins: { type: Number, default: 0, min: 0 },
    player2Wins: { type: Number, default: 0, min: 0 },
    draws:       { type: Number, default: 0, min: 0 },
},
```

Even if a request somehow bypassed the controller checks, Mongoose would still reject values that violate these constraints before they reach the database.

---

## 8. Paginated Responses

**File:** `controller/sessionController.js`

```js
// GET /api/session/all?page=1&limit=20
const page  = Math.max(1, parseInt(req.query.page)  || 1);
const limit = Math.min(50, Math.max(1, parseInt(req.query.limit) || 20));
```

`getAllSessions` never dumps the entire collection in one response. The limit is server-enforced at a maximum of 50 per page — a client cannot request more than that by manipulating the query string.

---

## 9. Error Handling

**File:** `server.js`

```js
app.use((err, req, res, next) => {
    const status = err.status || 500;
    const message =
        process.env.NODE_ENV === "production"
            ? "Internal server error"
            : err.message;
    res.status(status).json({ error: message });
});
```

A global error handler catches any unhandled exception across all routes. In production, raw error messages and stack traces are hidden from the response — the client only sees `"Internal server error"`. Full details are still logged server-side for debugging.

---

## Environment Variables Reference

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `MONGO_URI` | ✅ | — | MongoDB connection string |
| `PORT` | ❌ | `5000` | Port the server listens on |
| `NODE_ENV` | ❌ | `development` | Set to `production` to hide error details |
| `ALLOWED_ORIGINS` | ❌ | `http://localhost:5173` | Comma-separated list of allowed CORS origins |

---

## Security Checklist for Production

- [ ] Set `NODE_ENV=production`
- [ ] Set `ALLOWED_ORIGINS` to your actual frontend domain only
- [ ] Use a strong, unique `MONGO_URI` with a dedicated database user (not root)
- [ ] Ensure your MongoDB instance is not publicly exposed — connect via private network or VPN
- [ ] Run the server behind a reverse proxy (e.g. Nginx) with HTTPS/TLS terminated at the proxy
- [ ] Consider adding an API key or session token if you want to restrict access to known clients only
