# Requirements – Embeddable AI Chat Widget SaaS (v1)

## 1. Overview

This project is a SaaS platform that allows users to create and embed an AI-powered chat widget into their websites using a simple `<script>` tag. The widget enables website visitors to interact with an AI model, while the widget owner controls behavior via a system prompt from an admin dashboard.

The platform consists of:

- An **admin dashboard** for widget management
- A **public embeddable widget**
- A **backend API** responsible for security, chat handling, and LLM interaction

---

## 2. Technology Stack

### Frontend (Admin Dashboard)

- Next.js 16 (App Router)
- Clerk for authentication
- shadcn/ui for UI components
- TypeScript

### Backend API

- Node.js
- Fastify
- TypeScript
- Prisma ORM

### Database

- PostgreSQL

### Infrastructure & Supporting Tools

- CDN for serving widget script
- Rate limiting middleware
- CORS enforcement
- Environment variable management
- LLM provider API (OpenAI-compatible)

---

## 3. User Roles

### 3.1 Admin (Widget Owner)

- Authenticated user
- Manages widgets
- Configures system prompt
- Retrieves embed code

### 3.2 End User (Website Visitor)

- Unauthenticated
- Interacts with the chat widget only

---

## 4. Functional Requirements

### 4.1 Authentication

- Email/password authentication via Clerk
- Session-based access to dashboard
- Secure JWT-based authorization between frontend and backend

---

### 4.2 Widget Management

Admins must be able to:

- Create a widget
- Update widget name
- Enable or disable a widget
- Configure a system prompt
- Configure allowed domains
- Regenerate widget public API key
- Copy embeddable script tag

Each widget must have:

- Unique widget ID
- Public API key (client-side use)
- System prompt
- Enabled/disabled state
- Allowed domains list
- Creation timestamp

---

### 4.3 Embeddable Script

- Provided as a single `<script>` tag
- Loads asynchronously
- Framework-agnostic
- Injects a floating chat UI into the host website
- Uses iframe or Shadow DOM to avoid CSS conflicts

Example:

```html
<script
  src="https://cdn.example.com/widget.js"
  data-widget-id="widget_123"
  data-public-key="pk_live_xxx"
></script>
```

### 4.4 Chat Functionality

- Visitors can send text messages
- Messages are sent to backend /chat endpoint
- Backend applies the widget's system prompt
- Backend forwards the request to the LLM provider
- AI response is returned and displayed in the widget UI

---

### 4.5 Domain Restriction & Abuse Prevention

- Each widget must define an allowlist of domains
- Backend must validate Origin and/or Referer headers
- Chat requests from unauthorized domains must be rejected
- Widget public keys must be scoped to chat-only usage
- Rate limiting must be applied per widget and/or IP

---

### 4.6 CORS Policy

- No wildcard CORS allowed
- Access-Control-Allow-Origin must be dynamically set based on allowed domains
- Requests from unapproved origins must be blocked

---

## 5. Backend Responsibilities

The backend API must:

- Verify Clerk-issued JWTs for admin routes
- Validate widget public API keys for chat requests
- Enforce domain allowlists
- Apply rate limiting
- Communicate with the LLM provider
- Prevent direct access to admin functionality from public keys
- Remain stateless

The widget and chat traffic must not be handled by Next.js API routes.

---

## 6. Database Requirements

### Tables

#### Users

- id
- clerk_user_id
- email
- created_at

#### Widgets

- id
- user_id
- name
- public_api_key
- system_prompt
- allowed_domains
- enabled
- created_at

#### Chat Logs (Optional)

- id
- widget_id
- role (user / assistant)
- message
- created_at

---

## 7. Non-Functional Requirements

### Security

- No LLM API keys exposed to the client
- Public API keys must not allow admin operations
- Backend must be the single trust boundary
- Rate limiting enabled by default

### Performance

- Widget script must load quickly via CDN
- Backend must handle concurrent chat requests efficiently

### Scalability

- Backend must support horizontal scaling
- Stateless API design
- Database connections managed via Prisma

---

## 8. Deployment Requirements

- Admin dashboard deployed separately from backend API
- Backend API deployed as a standalone service
- Widget script served from a CDN
- PostgreSQL hosted as a managed service
- Environment variables isolated per service

---

## 9. Out of Scope (v1)

- Analytics dashboards
- Conversation history UI
- Workflows or tool calling
- File uploads
- Theming and customization
- OAuth login providers

---

## 10. Definition of Done

- Admin can create a widget and embed it on an allowed domain
- Widget loads and displays a chat UI
- Chat requests succeed only on approved domains
- Chat requests fail on unapproved domains
- System prompt affects AI behavior
- No admin functionality is accessible via public keys

---

If you want next, I can:

- Generate the **Prisma schema**
- Create a **Fastify folder structure**
- Write the **`/chat` endpoint middleware**
- Help you structure this as a **monorepo**

Just tell me 👍

```

```
