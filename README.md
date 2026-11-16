# Instagram Clone

A full-stack, production-oriented social media platform inspired by modern image/video-based social networking applications.

This project is being developed as a complete **frontend + backend + real-time + media + social interaction system**, with a strong focus on clean architecture, scalability, security, maintainability, and real-world engineering practices.

> **Important:** This is an independent learning/project implementation inspired by social media platform patterns. It does not use Instagram's proprietary source code, private APIs, or proprietary assets.

---

# 1. PROJECT OVERVIEW

The Instagram Clone provides a complete social-media experience where users can:

- Create accounts
- Authenticate securely
- Manage profiles
- Follow/unfollow users
- Create posts
- Upload media
- Like posts
- Comment on posts
- Save content
- View a personalized feed
- Search users/content
- Explore content
- Create/view stories
- Create/view reels where supported
- Receive notifications
- Communicate through real-time messaging
- Manage account/privacy settings
- Perform authorized moderation actions

The project is designed as a **real full-stack application**, not a static UI demo.

---

# 2. PROJECT GOALS

The main goals are:

1. Build a complete social media application.
2. Practice enterprise-style full-stack architecture.
3. Build a production-quality React frontend.
4. Build a scalable Spring Boot backend.
5. Implement secure authentication and authorization.
6. Implement real-time communication.
7. Handle media-based content.
8. Use UUID-based entity identifiers.
9. Apply clean coding standards.
10. Build reusable frontend components.
11. Build well-structured backend services.
12. Implement proper error handling.
13. Implement testing.
14. Optimize performance.
15. Create a maintainable and scalable codebase.

---

# 3. HIGH-LEVEL ARCHITECTURE

The application follows a layered full-stack architecture.

```text
                    CLIENT
                      │
                      ▼
             React Frontend
                      │
             REST / WebSocket
                      │
                      ▼
             Spring Boot Backend
                      │
        ┌─────────────┼─────────────┐
        │             │             │
        ▼             ▼             ▼
   Business        Security      Real-Time
    Services       / Auth        Services
        │
        ▼
   Data Access Layer
        │
        ▼
      MySQL
```

Additional infrastructure may include:

```text
Redis
Kafka
Media Storage
WebSocket Infrastructure
```

according to the implemented backend architecture.

---

# 4. TECHNOLOGY STACK

## Frontend

Primary frontend technologies:

- React
- Vite
- JavaScript / JSX
- React Router
- HTTP client such as Axios
- WebSocket client according to backend implementation
- CSS / approved styling system

---

## Backend

Primary backend technologies include:

- Java
- Spring Boot
- Spring Security
- Spring Data JPA
- Hibernate
- REST APIs
- WebSocket
- MySQL

Additional technologies are used only where required by the architecture.

---

## Infrastructure

The project may use:

- Redis
- Kafka
- Media storage
- WebSocket infrastructure

Docker is NOT a required part of the project architecture unless explicitly introduced later.

---

# 5. PROJECT STRUCTURE

The project documentation is organized as:

```text
Instagram-clone/
│
├── readme.md
├── standard.md
│
├── backend/
│   ├── backendReadme.md
│   └── backendStandard.md
│
├── frontend/
│   ├── frontendReadme.md
│   └── frontendStandard.md
│
└── instagram-clone-documents/
    └── detailed technical documentation
```

---

# 6. DOCUMENTATION HIERARCHY

## Root Documentation

### `readme.md`

Defines:

- Overall project
- Project goals
- Architecture
- Technology stack
- Major features
- Development phases
- Overall structure

---

### `standard.md`

Defines:

- Global engineering rules
- Project-wide standards
- Naming conventions
- Security principles
- Git standards
- Documentation standards
- Quality requirements

---

## Backend Documentation

### `backend/backendReadme.md`

Defines:

- Backend requirements
- Backend modules
- APIs
- Services
- Security
- Database
- Real-time functionality
- Backend implementation phases

---

### `backend/backendStandard.md`

Defines:

- Backend architecture rules
- Java/Spring standards
- API standards
- Database standards
- Security standards
- Exception handling
- UUID standards
- Testing standards

---

## Frontend Documentation

### `frontend/frontendReadme.md`

Defines:

- Frontend requirements
- Pages
- Features
- API integration
- UI requirements
- Routing
- Authentication
- Real-time functionality
- Responsive behavior
- Testing
- Production requirements

---

### `frontend/frontendStandard.md`

Defines:

- React architecture
- Component standards
- API standards
- State management
- UI/UX standards
- UUID rules
- Security
- Performance
- Accessibility
- Testing
- Code quality

---

# 7. CORE APPLICATION FEATURES

The project is designed around the following major feature domains.

## Authentication

- Registration
- Login
- Logout
- Session handling
- Protected resources
- Authentication error handling

---

## User Management

- User profile
- Profile picture
- Bio
- Edit profile
- User information
- Account settings

---

## Social Graph

- Follow
- Unfollow
- Followers
- Following
- Relationship state
- Privacy behavior where supported

---

## Posts

- Create posts
- Media upload
- Captions
- Post details
- Edit/delete where supported
- Like
- Save
- Comment
- Share where supported

---

## Feed

- Personalized feed
- Pagination
- Infinite scrolling where appropriate
- Post interactions
- Loading states
- Empty states
- Error states

---

## Stories

Where supported:

- Story creation
- Story viewing
- Story navigation
- Story media
- Story expiration
- Story interaction

---

## Reels

Where supported:

- Short-form video
- Reel feed
- Video playback
- Reel creation
- Likes
- Comments
- Saves
- Sharing

---

## Search & Explore

- User search
- Content discovery
- Search results
- Explore
- Search suggestions where supported

---

## Notifications

- Notification list
- Read/unread state
- Notification navigation
- Real-time notifications where supported

---

## Messaging

- Conversations
- Messages
- Real-time messaging
- Unread messages
- Typing status where supported
- Online/offline status where supported
- WebSocket communication

---

## Settings

- Account settings
- Privacy
- Security
- Notification settings
- Other supported preferences

---

## Moderation

Where supported:

- Reports
- Content moderation
- User moderation
- Administrative operations

All administrative functionality must be protected by backend authorization.

---

# 8. UUID IDENTIFIER STRATEGY

The project uses **UUID identifiers** for persistent entities.

Examples:

```text
User ID
Post ID
Comment ID
Story ID
Reel ID
Message ID
Conversation ID
Notification ID
Media ID
```

The application must NOT assume sequential numeric identifiers.

Incorrect:

```text
1
2
3
4
```

Correct:

```text
550e8400-e29b-41d4-a716-446655440000
```

UUID handling must remain consistent between frontend and backend.

---

# 9. FRONTEND ↔ BACKEND COMMUNICATION

The frontend communicates with the backend through:

```text
REST APIs
+
WebSocket / Real-Time APIs
```

The backend API contract is the source of truth.

The frontend must not invent endpoint structures when the backend already defines them.

---

# 10. DATA FLOW

The general application flow is:

```text
User Interaction
       ↓
React Component
       ↓
Feature Logic / Hook
       ↓
API / Service Layer
       ↓
Backend Controller
       ↓
Service Layer
       ↓
Repository
       ↓
Database
```

For real-time features:

```text
User / Event
      ↓
WebSocket
      ↓
Backend
      ↓
WebSocket Event
      ↓
Frontend
      ↓
UI Update
```

---

# 11. SECURITY MODEL

Security is divided between frontend and backend.

## Frontend Responsibilities

- Authentication state
- Protected routes
- Input validation for UX
- Secure handling of client-side state
- Avoiding secret exposure
- Safe rendering of user content

## Backend Responsibilities

- Authentication
- Authorization
- Business rules
- Data validation
- Database security
- Resource ownership
- Permission enforcement
- Sensitive operations

Frontend security must never be treated as a replacement for backend authorization.

---

# 12. MEDIA ARCHITECTURE

The application supports media-based content.

Media functionality may include:

- Images
- Videos
- Profile pictures
- Post media
- Story media
- Reel media

The frontend is responsible for:

- Selection
- Validation
- Preview
- Upload interaction
- Progress display
- Presentation

The backend/media infrastructure is responsible for:

- Storage
- Persistence
- Access control
- Processing
- Media metadata

---

# 13. REAL-TIME ARCHITECTURE

Real-time features may include:

- Chat messages
- Notifications
- Typing indicators
- Online status
- Other supported events

The frontend must correctly manage:

- Connection
- Authentication
- Subscription
- Event handling
- Reconnection
- Disconnect
- Cleanup

The backend remains responsible for authorization and event generation.

---

# 14. PERFORMANCE GOALS

The application should be designed for scalability.

Important areas include:

- Pagination
- Lazy loading
- Optimized images
- Video optimization
- API caching
- Debounced search
- Efficient React rendering
- Code splitting
- Appropriate state management

Do not load unnecessary data.

Do not make unnecessary API requests.

---

# 15. RESPONSIVE DESIGN

The frontend must support:

```text
Mobile
Tablet
Laptop
Desktop
```

Important screens include:

- Authentication
- Home feed
- Profile
- Explore
- Search
- Posts
- Stories
- Reels
- Notifications
- Messages
- Settings

Mobile experience should be intentionally designed rather than simply shrinking desktop layouts.

---

# 16. ERROR HANDLING

The application must properly handle:

```text
400
401
403
404
409
422
429
500
Network Errors
Timeouts
Upload Errors
WebSocket Errors
```

Users should receive understandable messages.

Internal technical errors should not be unnecessarily exposed to users.

---

# 17. LOADING AND EMPTY STATES

Important asynchronous operations must provide feedback.

Examples:

```text
Loading
Uploading
Saving
Sending
Fetching
```

Collections must support meaningful empty states.

Examples:

```text
No posts yet.
No followers yet.
No messages yet.
No notifications yet.
No results found.
```

---

# 18. TESTING

Testing should exist across the application.

## Frontend

- Unit tests
- Component tests
- Integration tests
- Authentication tests
- API integration tests
- Critical user-flow tests

## Backend

- Unit tests
- Service tests
- Repository tests where appropriate
- Controller/API tests
- Security tests
- Integration tests

The exact testing strategy is defined by the backend/frontend standards.

---

# 19. DEVELOPMENT PHASES

The overall project follows controlled phases.

```text
PHASE 1
Project Planning & Documentation

        ↓

PHASE 2
Backend Architecture & Implementation

        ↓

PHASE 3
Backend Testing & Verification

        ↓

PHASE 4
Frontend Architecture

        ↓

PHASE 5
Frontend Authentication

        ↓

PHASE 6
Frontend Application Shell

        ↓

PHASE 7
User & Profile

        ↓

PHASE 8
Posts & Feed

        ↓

PHASE 9
Stories & Reels

        ↓

PHASE 10
Search & Explore

        ↓

PHASE 11
Notifications

        ↓

PHASE 12
Messaging / WebSocket

        ↓

PHASE 13
Settings & Moderation

        ↓

PHASE 14
Responsive & UX Refinement

        ↓

PHASE 15
Performance Optimization

        ↓

PHASE 16
Testing

        ↓

PHASE 17
Production Verification
```

---

# 20. CURRENT PROJECT STATUS

## Backend

Status:

**COMPLETED / PRIMARY INTEGRATION TARGET**

The frontend should consume the existing backend rather than rebuild it.

---

## Frontend

Status:

**ACTIVE DEVELOPMENT**

The frontend is now being implemented against the completed backend.

---

# 21. FRONTEND IMPLEMENTATION STRATEGY

Frontend development should follow:

```text
Read Documentation
       ↓
Inspect Existing Frontend
       ↓
Inspect Backend
       ↓
Map APIs
       ↓
Identify Missing Features
       ↓
Implement
       ↓
Integrate
       ↓
Test
       ↓
Fix
       ↓
Optimize
       ↓
Verify
```

Do not immediately rewrite the existing frontend.

First understand what already exists.

---

# 22. BACKEND MODIFICATION POLICY

The backend should not be modified merely to make frontend development easier.

Backend changes should occur only when:

- a genuine backend defect is discovered;
- an API contract is incorrect;
- a required documented feature cannot function because of the backend;
- a security or correctness issue must be fixed.

Any significant backend change must be reviewed for frontend impact.

---

# 23. PROJECT QUALITY TARGET

The final application should be:

```text
Functional
+
Secure
+
Responsive
+
Maintainable
+
Scalable
+
Testable
+
Performant
+
Production-Ready
```

The goal is not simply to create a visual Instagram-like page.

The goal is to build a complete full-stack social media application using professional engineering practices.

---

# 24. DEFINITION OF PROJECT COMPLETION

The project is considered complete only when:

## Backend

- [ ] APIs implemented
- [ ] Authentication implemented
- [ ] Authorization implemented
- [ ] Database integration working
- [ ] UUID strategy implemented
- [ ] Required features implemented
- [ ] Real-time functionality working where required
- [ ] Error handling implemented
- [ ] Tests passing

## Frontend

- [ ] Authentication
- [ ] Profiles
- [ ] Social graph
- [ ] Posts
- [ ] Feed
- [ ] Comments
- [ ] Likes
- [ ] Saves
- [ ] Stories where supported
- [ ] Reels where supported
- [ ] Search
- [ ] Explore
- [ ] Notifications
- [ ] Messaging
- [ ] Settings
- [ ] Moderation where supported
- [ ] Responsive UI
- [ ] Accessibility
- [ ] Error handling
- [ ] Loading states
- [ ] Empty states
- [ ] Testing
- [ ] Production build

## Integration

- [ ] Frontend communicates with real backend
- [ ] UUIDs work consistently
- [ ] Authentication works end-to-end
- [ ] Protected APIs work
- [ ] Media workflows work
- [ ] WebSocket functionality works
- [ ] No critical integration errors

---

# 25. PROJECT ENGINEERING PRINCIPLE

The project should always follow:

```text
Documentation
      ↓
Architecture
      ↓
Implementation
      ↓
Integration
      ↓
Testing
      ↓
Optimization
      ↓
Production
```

Do not skip architecture and testing simply to implement features faster.

---

# 26. IMPORTANT RULE FOR AI DEVELOPMENT TOOLS

AI development tools such as Antigravity must:

1. Read the project documentation before modifying code.
2. Inspect existing code before rewriting it.
3. Understand backend APIs before implementing frontend integrations.
4. Preserve working functionality.
5. Follow `standard.md`.
6. Follow backend standards for backend changes.
7. Follow frontend standards for frontend changes.
8. Use UUID identifiers.
9. Avoid unnecessary dependencies.
10. Avoid unnecessary rewrites.
11. Test changes.
12. Fix regressions.
13. Build the project before declaring completion.
14. Clearly report blockers rather than silently inventing solutions.

---

# 27. DOCUMENTATION MAP

```text
readme.md
    ↓
Overall Project Definition

standard.md
    ↓
Overall Project Engineering Rules

backend/backendReadme.md
    ↓
Backend Requirements

backend/backendStandard.md
    ↓
Backend Engineering Standards

frontend/frontendReadme.md
    ↓
Frontend Requirements

frontend/frontendStandard.md
    ↓
Frontend Engineering Standards

instagram-clone-documents/
    ↓
Detailed Technical Documentation
```

---

# 28. FINAL PROJECT PRINCIPLE

This project should be treated as a serious software engineering project rather than a simple clone/demo.

Every major feature should satisfy:

```text
Correctness
+
Security
+
Maintainability
+
User Experience
+
Performance
+
Testing
```

The final result should demonstrate practical knowledge of:

- Full-stack development
- React
- Java
- Spring Boot
- REST APIs
- Authentication
- Authorization
- Databases
- UUID-based architecture
- WebSockets
- Real-time systems
- Media handling
- State management
- Responsive UI
- Testing
- Software architecture

---

# 29. FINAL STATUS

```text
Project: Instagram Clone

Backend:
COMPLETED

Frontend:
IN PROGRESS

Current Priority:
COMPLETE FRONTEND AGAINST THE EXISTING BACKEND

Identifier Strategy:
UUID

Architecture:
Full-Stack Modular Architecture

Development Approach:
Documentation → Implementation → Integration → Testing → Production
```

# 30. INSTAGRAM-STYLE STAGED REGISTRATION ARCHITECTURE

The registration lifecycle implements an Instagram-inspired progressive staging model ensuring that no user, profile, or session token is created until email ownership is proven and the final profile details are submitted.

### Registration Journey

```text
Step 1: Enter Email ──► POST /api/v1/auth/signup/request-otp (Generates Redis OTP with SIGNUP purpose)
                                │
Step 2: Verify OTP  ──► POST /api/v1/auth/signup/verify-otp (Validates 6-digit code, issues signupToken)
                                │
Step 3: Profile     ──► POST /api/v1/auth/register (Atomically creates verified user, profile & session tokens)
                                │
Step 4: Auto-Login  ──► Establishes AuthContext session and navigates directly to Dashboard
```

### Core Invariants

1. **Zero Rows Prior to Profile Completion**: `request-otp` and `verify-otp` do not write rows to `users`, `profiles`, or `refresh_tokens`.
2. **Authoritative Email Derivation**: The browser never submits an authoritative email during final registration; the email is resolved exclusively from the database-backed signup ticket.
3. **Cryptographic Signup Proof**: After successful OTP verification, the server issues a 256-bit cryptographically secure `signupToken`. Only its SHA-256 hash is persisted in `signup_verification_tickets` (TTL: 600 seconds).
4. **Concurrency & Replay Protection**: Consuming the signup ticket utilizes `PESSIMISTIC_WRITE` row-level locking within a Spring `@Transactional` boundary, preventing duplicate registrations with the same ticket.
5. **Purpose Isolation**: Redis OTP keys and HMAC calculations are purpose-bound (`SIGNUP` vs `ACCOUNT_VERIFICATION`), preventing cross-purpose token misuse.
6. **Legacy Compatibility**: Existing unverified accounts retain access to legacy email verification links and `/api/v1/auth/verify-otp` without interference.
7. **Anti-Enumeration**: Generic responses are returned on OTP request regardless of email existence.

### API Contracts

#### 1. Request Signup OTP
- **URL**: `POST /api/v1/auth/signup/request-otp`
- **Rate Limit**: 5 requests / 60 seconds (IP-based) + Email hourly cooldown
- **Request Body**:
```json
{
  "email": "user@example.com"
}
```
- **Response** (`200 OK`):
```json
{
  "success": true,
  "message": "If this email address is eligible, a confirmation code has been dispatched.",
  "data": null,
  "errors": []
}
```

#### 2. Verify Signup OTP
- **URL**: `POST /api/v1/auth/signup/verify-otp`
- **Rate Limit**: 10 requests / 60 seconds (IP-based) + Email attempt limits
- **Request Body**:
```json
{
  "email": "user@example.com",
  "code": "012345"
}
```
- **Response** (`200 OK`):
```json
{
  "success": true,
  "message": "Email verified successfully.",
  "data": {
    "signupToken": "4a7f2c89e1b3d56789abcdef0123456789abcdef0123456789abcdef01234567",
    "expiresIn": 600
  },
  "errors": []
}
```

#### 3. Complete Registration
- **URL**: `POST /api/v1/auth/register`
- **Request Body**:
```json
{
  "signupToken": "4a7f2c89e1b3d56789abcdef0123456789abcdef0123456789abcdef01234567",
  "username": "alex_smith",
  "displayName": "Alex Smith",
  "password": "UserSecurePass123!"
}
```
- **Response** (`200 OK`):
```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "accessToken": "eyJhbGci...",
    "refreshToken": "7c8a...",
    "tokenType": "Bearer",
    "expiresIn": 900000,
    "user": {
      "id": "c3b7a5a8-4395-4672-8822-4946631ad18e",
      "username": "alex_smith",
      "email": "user@example.com",
      "displayName": "Alex Smith"
    }
  },
  "errors": []
}
```

---

**END OF PROJECT README**