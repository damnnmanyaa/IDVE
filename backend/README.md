# IDVE Backend (Spring Boot JWT)

## Stack
- Spring Boot 3.3.4
- Spring Security (stateless)
- JWT (jjwt)
- Spring Data JPA
- PostgreSQL (runtime), H2 (test only)

## Run
1. Make sure Java 17+ is installed.
2. From `backend` folder, run:

```bash
mvn spring-boot:run
```

Backend starts on `http://localhost:8080`.

## Environment Variables
Create a local `.env` file in `backend` (already gitignored) and set:

- `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD` (PostgreSQL connection)
- `APP_UPLOADS_PATH` (optional, defaults to `backend/uploads`)
- `APP_JWT_SECRET` (required, use a long random value)
- `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`
- `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET`
- `OAUTH2_REDIRECT_URI` (default: `http://localhost:5173/login`)
- `MAIL_HOST`, `MAIL_PORT`, `MAIL_USERNAME`, `MAIL_PASSWORD`

## Auth APIs
- `POST /api/auth/register`
  - body: `{ "name": "...", "email": "...", "password": "..." }`
- `POST /api/auth/login`
  - body: `{ "email": "...", "password": "..." }`
  - response: `{ "token": "..." }`
- `POST /api/auth/send-otp`
  - body: `{ "email": "..." }`
- `POST /api/auth/verify-otp`
  - body: `{ "name": "...", "email": "...", "password": "...", "otp": "..." }`
  - response: `{ "token": "..." }`
- `POST /api/auth/forgot-password`
  - body: `{ "email": "..." }`
  - always returns a generic message so existing accounts can't be guessed from the response
- `POST /api/auth/reset-password`
  - body: `{ "email": "...", "otp": "...", "newPassword": "..." }`
  - resets the password if the OTP is valid and not expired

## Protected API
- `GET /api/user/me`
  - header: `Authorization: Bearer <token>`
- `POST /api/user/upload-document`
  - multipart form field: `file`

## Admin API (requires ADMIN role)
- `GET /api/admin/users`
- `PATCH /api/admin/users/{id}/approve`
- `PATCH /api/admin/users/{id}/reject`

## CORS
Allowed frontend origins are configured in `application.yml`:
- `http://localhost:3000`
- `http://localhost:5173`
- `http://localhost:5174`

## Database
PostgreSQL is the default and only runtime database.

Start a local PostgreSQL instance (e.g., via Docker):

```bash
docker run -d --name idve-pg -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=idve_db \
  -p 5432:5432 postgres:16-alpine
```

Then create a `.env` file in `backend/` with your credentials (see `.env.example`).
Tests use H2 in-memory (test-scoped) and run automatically with `mvn test`.

## Security notes
- Passwords are hashed with BCrypt, never stored in plain text.
- JWT secret, DB credentials, and OAuth/mail credentials are all pulled from environment variables, nothing sensitive is committed.
- Uploaded documents are stored outside the repo path and the upload service checks the destination path so a request can't escape the configured uploads folder.
- OTPs (registration and password reset) expire after a few minutes and are single-use.

## Tests
15+ backend tests covering the OTP flow (including expiry), login with correct/incorrect passwords, and admin-only endpoints correctly rejecting non-admin users. Run with:

```bash
mvn test
```

## Known limitations
- Password reset currently generates and verifies the OTP correctly, but the final "set new password" step is disabled in the UI while I finish testing it end to end.
- No rate limiting yet on login/OTP endpoints.