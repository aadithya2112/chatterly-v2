# Authentication Flow (v1)

## Purpose

This document defines the **authentication and authorization flow** for the SaaS.

Key principles:

- **Only admins are authenticated**
- **Widget users are anonymous**
- **Backend is the single trust boundary**
- **Prisma is never used in the frontend**

This flow must be followed exactly to avoid security and architectural issues.

---

## Actors

### 1. Admin (Authenticated)

- Signs in to the dashboard
- Creates and manages widgets
- Configures system prompts and domains
- Authenticated via **Clerk**

### 2. Widget User (Anonymous)

- Uses the embedded chat widget
- Does not log in
- Has no account
- Identified only by request metadata (origin, IP)

---

## High-Level Flow

Admin → Next.js (Clerk) → Backend (JWT verified) → DB
Visitor → Widget.js → Backend (public key + domain) → LLM

Authentication applies **only** to the admin path.

---

## Admin Authentication Flow

### Step 1: Admin signs in (Frontend)

- Admin uses Clerk-provided sign-in / sign-up UI.
- Clerk manages sessions and issues a JWT.
- Frontend never handles passwords directly.

Output:

- Clerk session exists
- Clerk can issue an access token (JWT)

---

### Step 2: Frontend sends authenticated requests

For every admin-only API call (e.g. create widget):

- Frontend must:
  1. Request a Clerk JWT
  2. Send it to the backend in the `Authorization` header

Example:

Authorization: Bearer <clerk_jwt>

The frontend does **not** send user IDs manually.

---

### Step 3: Backend verifies Clerk JWT

For every admin route, the backend must:

1. Read the `Authorization` header
2. Verify the JWT using the Clerk secret key
3. Extract claims from the token:
   - `sub` → Clerk user ID
   - `email` (if available)

If verification fails:

- Respond with `401 Unauthorized`
- Do not continue request handling

---

### Step 4: Sync admin user to database

After successful JWT verification:

- Backend must ensure the admin exists in the local database.
- Use **lazy creation** (upsert).

Logic:

- If a user with `clerkUserId` exists → use it
- Otherwise → create it

This ensures:

- No signup hooks are required
- No race conditions
- Database is always consistent

The database `User` model represents **admins only**.

---

### Step 5: Authorize admin actions

For admin-owned resources (widgets):

- Backend must enforce ownership by querying with:
  - `userId` from the authenticated admin
- Admins may only read or modify their own widgets

Authorization is enforced **in the backend**, never in the frontend.

---

## Widget / Chat Flow (Anonymous)

### Important Rule

> **Widget users are never authenticated.**

No JWTs, no sessions, no accounts.

---

### Step 1: Widget loads on a website

- Website includes the provided `<script>` tag.
- Script initializes the chat UI.
- No authentication occurs.

---

### Step 2: Widget sends chat request

When a visitor sends a message, the widget sends:

- `widgetId`
- `publicApiKey`
- `message`

No user identity is included.

---

### Step 3: Backend validates widget request

For every `/chat` request, backend must:

1. Validate `widgetId` exists
2. Validate `publicApiKey` matches the widget
3. Ensure widget is enabled
4. Extract `Origin` or `Referer` header
5. Validate domain against widget’s `allowedDomains`
6. Apply rate limiting

If any check fails:

- Respond with appropriate error (`403`, `404`, or `429`)
- Do not call the LLM

---

### Step 4: LLM interaction

If validation succeeds:

- Backend constructs messages:
  - System prompt (from widget config)
  - User message
- Backend calls the LLM provider
- Backend returns the AI response to the widget

The widget never talks directly to the LLM.

---

## Separation of Concerns (MANDATORY)

### Frontend (Next.js)

- Handles UI only
- Uses Clerk for admin auth
- Never accesses the database
- Never contains secrets

### Backend (Fastify)

- Verifies Clerk JWTs
- Enforces authorization
- Uses Prisma
- Protects LLM keys
- Enforces domain and rate limits

### Database

- Stores admins and widgets
- Has no knowledge of anonymous widget users

---

## Security Rules (Do Not Violate)

- Admin routes require valid Clerk JWT
- Widget routes must not accept JWTs
- Public API keys must never allow admin actions
- Database access is backend-only
- Domain validation is backend-only
- No wildcard CORS

---

## Summary (for the coding agent)

- Implement Clerk auth in Next.js
- Pass Clerk JWTs to backend for admin routes
- Verify JWTs in backend
- Lazily create admin users in DB
- Treat widget users as anonymous
- Secure widgets via public keys + domain checks
- Never mix admin auth with widget flow

If these rules are followed, the authentication system is correct for v1.

⸻
