# IDVE — Cloud-Based Identity Verification & Access Management

IDVE is a secure, cloud-ready Identity Verification and Access Management platform designed to manage user authentication, identity verification, role-based access control, document verification, and administrative security workflows.

The platform provides separate USER and ADMIN experiences. Users can register, verify their email using OTP, authenticate using JWT or OAuth, upload identity documents, and track their verification status. Administrators can review submitted identity documents, approve or reject verification requests, and monitor security audit logs.

---

## Features

### Authentication & Identity

- User registration with email OTP verification
- JWT-based authentication
- Google OAuth authentication
- GitHub OAuth authentication
- Forgot-password workflow
- Role-based authentication for USER and ADMIN
- Protected routes and unauthorized-access handling

### Identity Verification

- User identity profile
- Identity verification status tracking
- Identity document upload
- Pending, Verified, and Rejected verification states
- Administrative verification workflow
- Applicant review interface

### Admin Security Console

- Centralized identity verification queue
- Total identity statistics
- Pending verification count
- Verified user count
- Rejected request count
- Search users by name or email
- Filter users by role and verification status
- Applicant review interface
- Approve / Reject verification actions
- Security audit log display

### Security

- JWT authentication and session handling
- Role-Based Access Control (RBAC)
- Protected frontend routes
- Backend authorization for administrative operations
- OAuth authentication
- OTP-based registration verification
- Security audit logging
- Protected administrative verification endpoints

---

## Application Workflow

### User Workflow

```text
Signup
   ↓
OTP Verification
   ↓
Login
   ↓
User Dashboard
   ↓
Upload Identity Document
   ↓
Verification Pending
   ↓
Administrator Review
   ↓
Approved / Rejected
```

### Administrator Workflow

```text
Admin Login
   ↓
Admin Security Console
   ↓
Verification Queue
   ↓
Review Applicant
   ↓
View Document & Applicant Details
   ↓
Approve / Reject
   ↓
Verification Status Updated
   ↓
Audit Log
```

---

## Technology Stack

### Frontend

- React
- Vite
- React Router
- Tailwind CSS
- Lucide React
- Axios

### Backend

- Spring Boot
- Spring Security
- REST APIs
- JWT

### Database

- PostgreSQL

### Authentication

- JWT
- Google OAuth
- GitHub OAuth
- Email OTP

---

## API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/auth/login` | Authenticate user and issue JWT |
| POST | `/api/auth/send-otp` | Send registration OTP |
| POST | `/api/auth/verify-otp` | Verify OTP and complete registration |
| POST | `/api/auth/forgot-password` | Initiate password recovery |
| GET | `/api/auth/oauth-config` | Retrieve OAuth configuration |
| GET | `/api/user/me` | Retrieve authenticated user information |
| POST | `/api/user/upload-document` | Upload identity verification document |
| GET | `/api/admin/users` | Retrieve registered users |
| PATCH | `/api/admin/users/{id}/approve` | Approve identity verification |
| PATCH | `/api/admin/users/{id}/reject` | Reject identity verification |
| GET | `/api/admin/audit-logs` | Retrieve security audit logs |

---

## UI & Design

The frontend uses an enterprise-focused security interface built around a dark charcoal and obsidian visual system.

The redesigned interface focuses on:

- Enterprise security visual language
- Clear verification states
- Security-focused visual hierarchy
- Dedicated USER and ADMIN dashboards
- Identity verification workspace
- Applicant review interface
- Security audit visibility
- Responsive layouts for desktop, tablet, and mobile
- Lucide-based vector iconography

The UI redesign improves the presentation and usability of the existing application while preserving the underlying authentication, authorization, identity verification, document upload, approval/rejection, and audit logging workflows.

---

## Security Architecture

```text
                    ┌─────────────────────┐
                    │      React UI       │
                    └──────────┬──────────┘
                               │
                         JWT / OAuth
                               │
                               ▼
                    ┌─────────────────────┐
                    │   Spring Boot API   │
                    └──────────┬──────────┘
                               │
                 ┌─────────────┼─────────────┐
                 │             │             │
                 ▼             ▼             ▼
          Authentication      RBAC      Audit Logging
                 │             │             │
                 └─────────────┼─────────────┘
                               │
                               ▼
                    ┌─────────────────────┐
                    │     PostgreSQL      │
                    └─────────────────────┘
```

---

## Project Structure

```text
IDVE/
│
├── src/
│   ├── components/
│   ├── context/
│   ├── pages/
│   ├── services/
│   └── ...
│
├── backend/
│   └── ...
│
├── public/
├── package.json
├── tailwind.config.cjs
└── README.md
```

---

## Running the Project

### 1. Clone the Repository

```bash
git clone https://github.com/damnnmanyaa/IDVE.git
cd IDVE
```

### 2. Install Frontend Dependencies

```bash
npm install
```

### 3. Start the Frontend

```bash
npm run dev
```

The frontend will start using the Vite development server.

### 4. Start the Backend

Start the Spring Boot backend using your preferred IDE or Maven configuration.

Ensure that PostgreSQL and the required environment variables are configured before starting the backend.

---

## Security & Access Control

IDVE separates normal user functionality from administrative functionality using role-based access control.

```text
USER
 ├── Login
 ├── Profile
 ├── Upload Document
 └── View Verification Status

ADMIN
 ├── Login
 ├── View Users
 ├── Review Identity Documents
 ├── Approve / Reject Verification
 └── View Audit Logs
```

Administrative operations are protected through backend authorization and frontend route guards.

---

## Cloud Readiness

The application is designed with future cloud deployment in mind.

Potential deployment architecture includes:

- Containerized frontend and backend
- Cloud-hosted PostgreSQL
- Reverse proxy / API gateway
- HTTPS
- Secure environment and secret management
- Cloud object storage for identity documents
- Centralized logging and monitoring
- Independently scalable frontend and backend services

---

## Current Status

**Status: Deployment Configured — Provider Accounts and Secrets Required**

The current implementation includes:

- Secure authentication
- OTP verification
- JWT-based sessions
- Google and GitHub OAuth
- Role-Based Access Control
- Identity document upload
- Identity verification workflow
- Admin approval and rejection
- Security audit logs
- Enterprise security-focused UI
- Responsive dashboards

The frontend redesign preserves the existing application workflow and backend API contracts.

---

## Deployment: Free Resume Demo

IDVE is a portfolio demonstration of a role-protected identity document review workflow. Applicants submit a document and track its status; administrators review requests and record an approval or rejection. It is not an automated identity checker or a compliance-certified KYC service.

The public demo must use synthetic names and documents. Do not upload real identity documents or production user data. Uploaded files are limited to 5 MB and stored in PostgreSQL so they survive backend restarts. This is suitable for a low-volume demo; a production service should use managed object storage and a stronger data retention policy.

### Free-tier architecture

| Service | Responsibility | Demo limitation |
|---|---|---|
| Vercel Hobby | React/Vite frontend | Uses a Vercel URL; a purchased custom domain is separate |
| Render Free | Dockerized Spring Boot API | Sleeps after 15 minutes idle and can take about a minute to wake |
| Neon Free | PostgreSQL records and small synthetic uploads | Subject to monthly compute and storage limits |
| Upstash Redis Free | Five-minute OTPs and authentication rate limits | Subject to monthly command and storage limits |
| Resend Free | OTP delivery through HTTPS | Requires a verified sender domain to email arbitrary visitors |

Free-plan quotas and terms can change. This deployment is for a resume demo, not production identity processing.

### 1. Deploy the backend

1. Create a Neon PostgreSQL project and an Upstash Redis database.
2. Create a Resend account and configure a verified sender domain. Set the sender as `IDVE <no-reply@your-verified-domain>`.
3. In Render, create a Blueprint from this repository and select `render.yaml`. Render builds `backend/Dockerfile`.
4. Add the required values when Render prompts for them:
   - `DATABASE_URL`: a JDBC URL such as `jdbc:postgresql://HOST/DB?sslmode=require`.
   - `DB_USER` and `DB_PASSWORD`: the database credentials from Neon.
   - `REDIS_URL`: the Upstash TLS URL beginning with `rediss://`.
   - `APP_JWT_SECRET`: a long random secret.
   - `RESEND_API_KEY` and `MAIL_FROM`: the Resend key and verified sender.
   - `CORS_ALLOWED_ORIGINS`: your Vercel origin, for example `https://idve-demo.vercel.app`.
   - `DEMO_ADMIN_EMAIL` and `DEMO_ADMIN_PASSWORD`: the demo administrator credentials. The password must be at least 12 characters.
   - `OAUTH2_REDIRECT_URI`: your Vercel URL followed by `/login`.
   - `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GITHUB_CLIENT_ID`, and `GITHUB_CLIENT_SECRET`: credentials from each OAuth provider. If not configured, those sign-in buttons stay disabled.
5. Wait for the backend health check at `/api/health` to pass. The first request after the service has slept may take about a minute.

If you do not have a sender domain, the backend also supports Brevo SMTP as a free-tier fallback: leave `RESEND_API_KEY` blank, set `MAIL_HOST=smtp-relay.brevo.com`, `MAIL_PORT=2525`, and use Brevo's SMTP login/key with a verified sender address. Brevo's free plan currently includes 300 emails per day. Email delivery from an unauthenticated free email domain can have weaker inbox placement; a verified sending domain is the more reliable option. Render blocks the standard SMTP ports but does not list port 2525 among those blocked.

The demo administrator is created or refreshed at backend startup from its environment variables. Never put these values in source control. The frontend intentionally displays the demo credentials if `VITE_DEMO_ADMIN_EMAIL` and `VITE_DEMO_ADMIN_PASSWORD` are set, because the administrator workspace is part of the public walkthrough. With `VITE_DEMO_MODE=true`, the admin console also shows a reset control; it clears user accounts, uploaded demo documents, pending OTPs, and audit history while keeping the administrator account.

### 2. Deploy the frontend

1. Import the repository into Vercel as a Vite project. Keep the repository root as the project root.
2. Set `VITE_API_BASE_URL` to the Render service origin, such as `https://idve-api.onrender.com`.
3. Set `VITE_DEMO_ADMIN_EMAIL` and `VITE_DEMO_ADMIN_PASSWORD` to the same demo credentials configured on Render.
4. Set `VITE_DEMO_MODE=true` to show the administrator's reset control.
5. Deploy, then update Render's `CORS_ALLOWED_ORIGINS` to the deployed Vercel origin. Do not include a trailing slash.
6. Add the Vercel callback URL to Google and GitHub OAuth settings if using social sign-in. The backend callback URLs are `https://YOUR-RENDER-HOST/login/oauth2/code/google` and `https://YOUR-RENDER-HOST/login/oauth2/code/github`.

The `vercel.json` rewrite sends client-side routes such as `/login` and `/admin` back to the Vite app.

### Local environment

Copy `backend/.env.example` to `backend/.env` for backend settings and `.env.example` to `.env.local` for the frontend API URL. Set `REDIS_ENABLED=false` for local development without Redis; OTPs then use the PostgreSQL fallback. Production should set `REDIS_ENABLED=true` and provide `REDIS_URL`.

`RESEND_API_KEY` and `MAIL_FROM` are only needed for Resend. For local SMTP development, leave the Resend key blank and configure the `MAIL_*` variables. The demo does not return email OTPs in API responses.


