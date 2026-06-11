# User Auth Specification

## Purpose

Define the JWT-based authentication system: login, token refresh, logout, password security, role-based access control, and frontend auth flow. Covers both backend API and frontend login experience.

## Requirements

### Requirement: User Registration

User creation MUST be restricted to users with ADMIN role. The system MUST NOT allow self-registration. Passwords MUST be hashed with bcrypt (salt rounds >= 12) before storage. The password MUST NEVER appear in any API response.

#### Scenario: Admin creates a user

- GIVEN an authenticated user with ADMIN role
- WHEN a POST request creates a user with valid email, name, password (>= 8 chars), and role
- THEN the user is created with a hashed password
- AND the response returns the user object without the password field
- AND the response status is 201

#### Scenario: Duplicate email rejected

- GIVEN a user with email `john@example.com` already exists
- WHEN an admin attempts to create another user with the same email
- THEN the response status is 409
- AND the error message indicates the email is already in use

#### Scenario: Weak password rejected

- GIVEN an admin sends a create-user request with password "123"
- WHEN the request is validated
- THEN the response status is 400
- AND the error indicates the password must be at least 8 characters

#### Scenario: Non-admin cannot create users

- GIVEN an authenticated user with MECHANIC role
- WHEN a POST request attempts to create a user
- THEN the response status is 403

### Requirement: Login

The system MUST authenticate via `POST /api/auth/login` with email and password. On success, it MUST return an access token (JWT, 15-minute expiry) and a refresh token (JWT, 7-day expiry).

#### Scenario: Valid credentials

- GIVEN a registered user with email `mech@workshop.com`
- WHEN `POST /api/auth/login` is called with correct email and password
- THEN the response status is 200
- AND the body contains `accessToken` (JWT), `refreshToken` (JWT), and `user` (id, name, email, role)
- AND the access token expires in 15 minutes
- AND the refresh token expires in 7 days

#### Scenario: Invalid email

- GIVEN no user exists with email `unknown@example.com`
- WHEN `POST /api/auth/login` is called with that email
- THEN the response status is 401
- AND the error message is "Invalid credentials" (does not reveal whether email or password was wrong)

#### Scenario: Wrong password

- GIVEN a user exists with email `mech@workshop.com`
- WHEN `POST /api/auth/login` is called with correct email but wrong password
- THEN the response status is 401
- AND the error message is "Invalid credentials"

#### Scenario: Disabled user cannot login

- GIVEN a user exists but their account is marked inactive
- WHEN `POST /api/auth/login` is called with valid credentials
- THEN the response status is 401

#### Scenario: Missing fields

- WHEN `POST /api/auth/login` is called without email or password
- THEN the response status is 400
- AND the error identifies the missing field(s)

### Requirement: Token Refresh

The system MUST provide `POST /api/auth/refresh` that accepts a valid refresh token and returns a new access token. The refresh token MUST be rotated on each use (old token invalidated, new refresh token issued).

#### Scenario: Valid refresh token

- GIVEN a valid, non-expired refresh token
- WHEN `POST /api/auth/refresh` is called with that token
- THEN the response status is 200
- AND the body contains a new `accessToken` and a new `refreshToken`
- AND the old refresh token is invalidated

#### Scenario: Expired refresh token

- GIVEN a refresh token that has expired (> 7 days old)
- WHEN `POST /api/auth/refresh` is called
- THEN the response status is 401
- AND the client MUST re-authenticate via login

#### Scenario: Reused refresh token (replay attack)

- GIVEN a refresh token that was already used in a previous refresh
- WHEN `POST /api/auth/refresh` is called with that same token
- THEN the response status is 401
- AND all active tokens for that user MAY be invalidated (security measure)

#### Scenario: Malformed token

- WHEN `POST /api/auth/refresh` is called with a non-JWT string
- THEN the response status is 401

### Requirement: Logout

The system MUST provide `POST /api/auth/logout` that invalidates the user's refresh token.

#### Scenario: Authenticated logout

- GIVEN an authenticated user with a valid refresh token
- WHEN `POST /api/auth/logout` is called
- THEN the refresh token is invalidated
- AND the response status is 200

#### Scenario: Logout with invalid token

- GIVEN an already-invalidated refresh token
- WHEN `POST /api/auth/logout` is called
- THEN the response status is 200 (idempotent — no error)

### Requirement: Auth Middleware

The backend MUST provide middleware that verifies the JWT access token from the `Authorization: Bearer <token>` header. On success, the decoded user payload (id, email, role) MUST be attached to the request object.

#### Scenario: Valid token

- GIVEN a request with a valid, non-expired access token in the Authorization header
- WHEN the auth middleware processes the request
- THEN the request proceeds to the next handler
- AND `req.user` contains `{ id, email, role }`

#### Scenario: Missing token

- GIVEN a request with no Authorization header
- WHEN the auth middleware processes the request
- THEN the response status is 401
- AND the error message is "No token provided"

#### Scenario: Expired token

- GIVEN a request with an expired access token
- WHEN the auth middleware processes the request
- THEN the response status is 401
- AND the error message is "Token expired"

#### Scenario: Tampered token

- GIVEN a request with a JWT whose signature has been modified
- WHEN the auth middleware processes the request
- THEN the response status is 401

### Requirement: Role-Based Access Middleware

The system MUST provide middleware that checks if the authenticated user has one of the required roles for a given route.

#### Scenario: Authorized role

- GIVEN a route requires ADMIN or MANAGER role
- AND the authenticated user has role MANAGER
- WHEN the role middleware processes the request
- THEN the request proceeds to the next handler

#### Scenario: Unauthorized role

- GIVEN a route requires ADMIN role
- AND the authenticated user has role MECHANIC
- WHEN the role middleware processes the request
- THEN the response status is 403
- AND the error message is "Insufficient permissions"

### Requirement: Login Page (Frontend)

The frontend MUST provide a mobile-first login page at `/login`. The form MUST include email and password fields with appropriate input types. Touch targets MUST be at least 44px. The form MUST show inline validation errors.

#### Scenario: Successful login flow

- GIVEN the user is on the `/login` page
- WHEN the user enters valid credentials and submits
- THEN the access token and refresh token are stored securely
- AND the user is redirected to the dashboard (`/_authenticated/dashboard`)

#### Scenario: Login failure feedback

- GIVEN the user is on the `/login` page
- WHEN the user submits invalid credentials
- THEN an error message "Invalid credentials" is displayed
- AND the password field is cleared
- AND the form remains focused for retry

#### Scenario: Loading state during login

- GIVEN the user has submitted the login form
- WHEN the API request is in flight
- THEN the submit button shows a loading indicator
- AND the button is disabled to prevent double submission

#### Scenario: Redirect after login

- GIVEN an unauthenticated user tries to access `/dashboard`
- WHEN the route guard detects no valid session
- THEN the user is redirected to `/login?redirect=/dashboard`
- AND after successful login, the user is sent to `/dashboard`

### Requirement: Frontend Auth Context

The frontend MUST maintain authentication state (user info, tokens) in a context provider. The context MUST attempt token refresh before declaring the user logged out.

#### Scenario: App starts with stored tokens

- GIVEN valid tokens exist in storage from a previous session
- WHEN the app initializes
- THEN the auth context loads the user data
- AND protected routes are accessible

#### Scenario: Access token expired, refresh succeeds

- GIVEN the access token has expired but the refresh token is valid
- WHEN a protected API call is made
- THEN the system automatically refreshes the access token
- AND the original request succeeds transparently

#### Scenario: Both tokens expired

- GIVEN both access and refresh tokens have expired
- WHEN any protected route or API call is attempted
- THEN the user is redirected to `/login`
- AND all stored tokens are cleared

### Requirement: Protected Route Guard

Routes under the `_authenticated` pathless layout MUST redirect unauthenticated users to `/login`. The guard MUST run in `beforeLoad`, not in component code.

#### Scenario: Authenticated user accesses protected route

- GIVEN a valid auth session exists
- WHEN the user navigates to `/_authenticated/dashboard`
- THEN the route loads normally

#### Scenario: Unauthenticated user accesses protected route

- GIVEN no valid auth session exists
- WHEN the user navigates to `/_authenticated/dashboard`
- THEN the user is redirected to `/login`
- AND the original URL is preserved as a `redirect` search param
