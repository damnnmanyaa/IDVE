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

**Status: Presentation Ready**

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


