# Instagram Clone — Global Engineering Standards

**Document:** `standard.md`  
**Project:** Instagram Clone  
**Scope:** Entire Full-Stack Project  
**Status:** MANDATORY

---

# 1. PURPOSE

This document defines the global engineering standards for the entire Instagram Clone project.

It applies to:

- Backend
- Frontend
- Database
- REST APIs
- WebSocket communication
- Redis
- Kafka
- Media handling
- Authentication
- Authorization
- Testing
- Documentation
- Git
- Deployment
- AI development tools

This document defines **how the project must be engineered**.

Detailed implementation rules are defined in:

```text
backend/backendStandard.md
frontend/frontendStandard.md
```

---

# 2. DOCUMENT HIERARCHY

The project follows this documentation structure:

```text
readme.md
    ↓
Overall Project Definition

standard.md
    ↓
Global Engineering Standards

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

The root standards apply to the entire project.

Backend-specific rules must additionally follow:

```text
backend/backendStandard.md
```

Frontend-specific rules must additionally follow:

```text
frontend/frontendStandard.md
```

---

# 3. SOURCE OF TRUTH

When implementing functionality, use this priority:

```text
1. Actual implementation and API contract
2. Project technical documentation
3. Backend/frontend requirements
4. Global standards
5. Existing working code
6. Engineering judgment
```

Do not invent functionality when the project already defines the behavior.

When documentation and implementation conflict:

1. Identify the conflict.
2. Inspect the actual implementation.
3. Determine the intended behavior.
4. Fix the incorrect side.
5. Update documentation when necessary.

Never silently maintain contradictory behavior.

---

# 4. CORE ENGINEERING PRINCIPLES

The entire project must follow:

```text
KISS
DRY
SOLID
Separation of Concerns
Single Responsibility
Composition
Modularity
Reusability
Security by Design
Testability
Maintainability
Scalability
```

The goal is not to produce the maximum amount of code.

The goal is to produce:

**Correct + Clean + Maintainable + Secure + Scalable software.**

---

# 5. PROJECT ARCHITECTURE

The application is divided into major layers:

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
    Services       Security      Real-Time
        │
        ▼
   Data Access
        │
        ▼
      MySQL
```

Supporting infrastructure may include:

```text
Redis
Kafka
Media Storage
WebSocket Infrastructure
```

Docker is not a required project dependency unless explicitly introduced later.

---

# 6. SEPARATION OF RESPONSIBILITIES

Each layer must have a clear responsibility.

## Frontend

Responsible for:

- UI
- UX
- Client-side interaction
- Routing
- Presentation
- Client-side validation
- API communication
- Client state
- Responsive design

---

## Backend

Responsible for:

- Business logic
- Authentication
- Authorization
- Data validation
- Persistence
- API implementation
- Security enforcement
- Transaction management
- Real-time event handling

---

## Database

Responsible for:

- Persistent data
- Relationships
- Constraints
- Indexes
- Data integrity

---

## Redis

When used, Redis should be responsible only for use cases that genuinely benefit from in-memory storage, such as:

- Caching
- Temporary state
- Session-related data where applicable
- Rate limiting where applicable
- Real-time supporting data where appropriate

Do not use Redis as a replacement for the primary database.

---

## Kafka

When used, Kafka should be used for asynchronous/event-driven communication where appropriate.

Examples:

- Notifications
- Background processing
- Event propagation
- Decoupled services
- High-volume asynchronous workloads

Do not introduce Kafka merely for simple synchronous CRUD operations.

---

# 7. UUID STANDARD

The project uses **UUID identifiers** for persistent entities.

Examples:

```text
User
Post
Comment
Story
Reel
Message
Conversation
Notification
Media
```

All layers must preserve UUID values consistently.

Never assume numeric sequential IDs.

Never convert UUIDs to integers.

Never create fake sequential IDs for persistent entities.

---

# 8. API-FIRST CONTRACT

The frontend and backend must communicate through clearly defined contracts.

Every API should define:

```text
HTTP Method
Endpoint
Request
Response
Validation
Authentication
Authorization
Errors
Pagination where applicable
```

The frontend must consume the actual backend contract.

The backend must not return undocumented structures without reason.

---

# 9. REST API STANDARD

Use HTTP methods according to their intended purpose.

```text
GET
POST
PUT
PATCH
DELETE
```

Use meaningful resource-oriented endpoints.

Avoid unnecessary RPC-style endpoints when a RESTful design is appropriate.

---

# 10. API RESPONSE STANDARD

API responses should be:

- Predictable
- Consistent
- Meaningful
- Easy for the frontend to consume

Do not return unrelated internal implementation details.

Do not expose:

- Database stack traces
- SQL queries
- Internal server paths
- Secrets
- Sensitive infrastructure information

---

# 11. HTTP STATUS STANDARD

Use appropriate HTTP status codes.

```text
200 OK
201 Created
204 No Content

400 Bad Request
401 Unauthorized
403 Forbidden
404 Not Found
409 Conflict
422 Unprocessable Entity
429 Too Many Requests

500 Internal Server Error
```

Use the project's existing API conventions consistently.

---

# 12. ERROR HANDLING

Errors must be handled intentionally.

The system should distinguish between:

```text
Validation Error
Authentication Error
Authorization Error
Not Found
Conflict
Rate Limit
Server Error
Network Error
Infrastructure Error
```

Users should receive understandable messages.

Developers should receive enough technical information for debugging without exposing sensitive data.

---

# 13. SECURITY PRINCIPLE

Security must be enforced primarily on the backend.

Never rely on frontend restrictions for security.

Backend must verify:

- Authentication
- Authorization
- Ownership
- Permissions
- Input validation
- Resource access

Example:

```text
Frontend hides Delete button
        ≠
User is authorized to delete
```

The backend must always verify the operation.

---

# 14. AUTHENTICATION STANDARD

Authentication must be centralized.

Do not duplicate authentication logic across controllers, services, or frontend components.

Authentication must support the project's defined:

- Login
- Registration
- Logout
- Session handling
- Token/session validation
- Protected resources

Actual implementation must follow the backend authentication architecture.

---

# 15. AUTHORIZATION STANDARD

Authorization must be enforced at the backend.

Consider:

```text
User
Role
Permission
Ownership
Resource
Action
```

A user must only access resources they are authorized to access.

Never trust:

- Frontend role values
- Client-provided permissions
- Hidden UI
- Client-side IDs alone

---

# 16. INPUT VALIDATION

All externally supplied data is untrusted.

Validate:

- Request body
- Query parameters
- Path variables
- Uploaded files
- User-generated content
- WebSocket input

Frontend validation improves UX.

Backend validation provides actual security.

---

# 17. USER-GENERATED CONTENT

Treat the following as untrusted:

```text
Username
Bio
Caption
Comment
Message
Search Query
Post Content
Uploaded Media
```

Never assume user input is safe.

Prevent:

- XSS
- Injection
- Malicious file uploads
- Invalid data
- Unauthorized resource access

---

# 18. DATABASE STANDARD

Database access must follow a clean data-access architecture.

Preferred flow:

```text
Controller
    ↓
Service
    ↓
Repository
    ↓
Database
```

Controllers should not contain database/business logic.

Repositories should not contain unrelated business decisions.

---

# 19. DATABASE INTEGRITY

Maintain:

- Primary keys
- Foreign keys
- Unique constraints
- Appropriate indexes
- Non-null constraints
- Referential integrity

Avoid unnecessary duplication of persistent data.

---

# 20. TRANSACTION STANDARD

Transactions should be used where multiple database operations must behave atomically.

Do not create unnecessary large transactions.

Transactions should be placed at the appropriate service/business layer.

---

# 21. SOFT DELETE STANDARD

If the project uses soft deletion:

- Do not physically delete records unnecessarily.
- Respect deletion flags consistently.
- Ensure deleted records do not appear in normal queries.
- Maintain relationships correctly.

Follow the actual backend implementation.

---

# 22. CACHING STANDARD

Caching must be intentional.

Before adding a cache, determine:

1. What data is expensive?
2. How frequently does it change?
3. How stale can it be?
4. What invalidates it?
5. What happens when the cache is unavailable?

Never cache data simply because Redis exists.

The database remains the source of truth for persistent data unless explicitly designed otherwise.

---

# 23. REDIS STANDARD

When Redis is used:

- Define key naming conventions.
- Define TTL where appropriate.
- Avoid storing unnecessary large objects.
- Handle cache misses.
- Handle Redis failure gracefully.
- Prevent stale data from causing incorrect application behavior.

Redis must not become an accidental second database.

---

# 24. KAFKA STANDARD

When Kafka is used:

- Events must have clear names.
- Event payloads must be documented.
- Producers and consumers must have defined responsibilities.
- Consumers should be idempotent where appropriate.
- Failures must be handled.
- Duplicate event processing must be considered.
- Topic naming must be consistent.

Do not use Kafka for operations that require immediate synchronous request/response behavior unless there is a clear architectural reason.

---

# 25. WEBSOCKET STANDARD

Real-time communication must support:

```text
Connect
Authenticate
Subscribe
Send
Receive
Error
Reconnect
Disconnect
Cleanup
```

The backend must verify authorization for real-time resources.

Frontend connections must be cleaned up properly.

Duplicate connections must be avoided.

---

# 26. MEDIA SECURITY

Uploaded media must be treated as untrusted.

Validate:

- File type
- File size
- File name
- Content where appropriate

Do not rely only on file extensions.

Media storage must not expose unnecessary private resources.

---

# 27. PERFORMANCE PRINCIPLES

Performance must be considered from the beginning.

Important areas:

```text
Database Queries
API Response Size
Caching
Pagination
Frontend Rendering
Media Loading
WebSocket Connections
Network Requests
```

Avoid premature optimization.

Optimize actual bottlenecks.

---

# 28. PAGINATION

Large datasets must use pagination.

Examples:

- Feed
- Comments
- Followers
- Following
- Notifications
- Messages
- Search results

Never assume a collection will remain small forever.

Use the pagination strategy supported by the backend.

---

# 29. SEARCH STANDARD

Search should be optimized.

Frontend:

- Debounce requests.
- Avoid duplicate searches.
- Handle empty queries.

Backend:

- Validate search input.
- Use appropriate indexes/query strategies.
- Prevent abusive query patterns.

---

# 30. LOGGING STANDARD

Logs must be useful and safe.

Log:

- Important application events
- Errors
- Failures
- Relevant debugging information

Never log:

- Passwords
- Tokens
- Secrets
- Private keys
- Sensitive personal data unnecessarily

Remove temporary debugging logs before production.

---

# 31. CONFIGURATION STANDARD

Configuration must not be hardcoded throughout the codebase.

Use environment/configuration mechanisms for:

```text
Database URL
Database credentials
API URLs
WebSocket URLs
Redis configuration
Kafka configuration
Media configuration
Security configuration
```

Never commit secrets.

---

# 32. ENVIRONMENT FILES

Use environment examples such as:

```text
.env.example
```

The example file may contain variable names and safe placeholders.

It must never contain real credentials.

---

# 33. DEPENDENCY STANDARD

Before adding a dependency:

1. Check whether an existing dependency already provides the functionality.
2. Check whether native functionality is sufficient.
3. Evaluate maintenance.
4. Evaluate security.
5. Evaluate performance/bundle impact.
6. Add only when justified.

Avoid dependency bloat.

---

# 34. NAMING STANDARD

Names must be:

- Meaningful
- Consistent
- Descriptive
- Domain-oriented

Avoid:

```text
temp
data2
abc
test123
newService
newController
```

Use meaningful names such as:

```text
PostService
UserController
NotificationService
ConversationRepository
```

---

# 35. CODE QUALITY

Code should be:

- Readable
- Small where practical
- Modular
- Testable
- Predictable

Avoid:

- Giant classes
- Giant components
- Giant methods
- Duplicate logic
- Hidden side effects
- Unnecessary abstractions

---

# 36. SINGLE RESPONSIBILITY

Every class/module/component/function should have a clear primary responsibility.

If one component is responsible for:

```text
UI
API
Validation
Business Logic
State
Navigation
Formatting
```

all at once, consider separating those responsibilities.

---

# 37. DRY STANDARD

Do not unnecessarily duplicate logic.

However:

> Do not create abstractions merely to eliminate two similar lines.

Abstraction should improve maintainability rather than make simple code harder to understand.

---

# 38. FRONTEND-SPECIFIC RULE

The frontend must additionally follow:

```text
frontend/frontendStandard.md
```

Important principles include:

- Component reusability
- Responsive design
- Accessibility
- API separation
- State management
- Loading/error states
- UUID handling
- Performance

---

# 39. BACKEND-SPECIFIC RULE

The backend must additionally follow:

```text
backend/backendStandard.md
```

Important principles include:

- Layered architecture
- Spring standards
- Security
- API design
- Database access
- Transactions
- Exception handling
- UUID
- Testing

---

# 40. TESTING STANDARD

Testing must exist at appropriate levels.

## Backend

Test:

- Controllers
- Services
- Repositories where appropriate
- Security
- Validation
- Important business rules
- Integration flows

## Frontend

Test:

- Components
- Hooks
- API integration
- Authentication
- Critical user flows
- Important UI behavior

---

# 41. TESTING PRINCIPLE

Tests should verify behavior.

Avoid tests that depend unnecessarily on internal implementation details.

A refactor that preserves behavior should not break large numbers of tests without a meaningful reason.

---

# 42. REGRESSION STANDARD

Every significant change must consider existing functionality.

After modifications:

```text
Implement
   ↓
Test New Feature
   ↓
Test Related Features
   ↓
Check Existing Functionality
   ↓
Build
```

Do not fix one feature by silently breaking another.

---

# 43. GIT STANDARD

Git must be used consistently.

Commits should be:

- Meaningful
- Focused
- Related to one logical change where practical

Avoid commits containing unrelated changes.

---

# 44. FILES THAT MUST NOT BE COMMITTED

Never commit:

```text
.env
node_modules/
dist/
build/
target/
IDE temporary files
Credentials
Passwords
Private keys
Tokens
Secrets
Large temporary files
```

Use `.gitignore`.

---

# 45. BRANCHING

Use clear branch names where branching is required.

Examples:

```text
feature/authentication
feature/posts
feature/chat
fix/profile-api
fix/websocket-connection
refactor/api-client
```

---

# 46. CODE REVIEW STANDARD

Before considering a major feature complete, review:

```text
Correctness
Architecture
Security
Performance
Testing
Documentation
```

Ask:

- Does this solve the actual requirement?
- Does it follow the architecture?
- Does it introduce duplication?
- Does it expose sensitive information?
- Does it break existing behavior?
- Is it testable?
- Is it maintainable?

---

# 47. DOCUMENTATION STANDARD

Documentation must reflect the actual implementation.

When a major architectural decision changes:

1. Update the appropriate documentation.
2. Remove obsolete instructions.
3. Keep terminology consistent.
4. Document important API/architecture changes.

Never intentionally maintain outdated documentation.

---

# 48. AI DEVELOPMENT TOOL STANDARD

AI coding tools such as Antigravity must follow this workflow:

```text
READ
  ↓
UNDERSTAND
  ↓
INSPECT
  ↓
PLAN
  ↓
IMPLEMENT
  ↓
TEST
  ↓
VERIFY
  ↓
DOCUMENT
```

AI tools must NOT:

- Randomly rewrite the project
- Delete working functionality
- Invent APIs
- Invent database structures
- Ignore documentation
- Hardcode credentials
- Introduce unnecessary dependencies
- Change architecture without justification

---

# 49. AI BEFORE CODING

Before modifying code, an AI development tool must:

1. Read the relevant documentation.
2. Inspect the existing implementation.
3. Identify dependencies.
4. Inspect API contracts.
5. Determine what is already working.
6. Identify the smallest appropriate change.

---

# 50. AI AFTER CODING

After making changes, an AI development tool should:

1. Run relevant tests.
2. Run the application where practical.
3. Verify affected functionality.
4. Check for regressions.
5. Run production build.
6. Report what changed.
7. Report remaining issues honestly.

---

# 51. NO SILENT MAJOR CHANGES

Major architectural changes must not happen silently.

Examples:

- Replacing state management
- Replacing authentication
- Changing database architecture
- Changing API contracts
- Replacing WebSocket architecture
- Introducing Kafka/Redis unnecessarily
- Rewriting major frontend sections

Such changes must be justified.

---

# 52. NO FAKE COMPLETION

A feature is not complete because:

- The page exists.
- The button exists.
- Mock data appears.
- The UI looks correct.

A feature is complete only when:

```text
UI
+
API
+
Validation
+
Security
+
Persistence
+
Error Handling
+
Testing
```

are appropriately implemented.

---

# 53. DEFINITION OF DONE

A feature is considered complete when:

```text
[ ] Requirement understood
[ ] Architecture respected
[ ] Backend implemented where required
[ ] Frontend implemented where required
[ ] Real API integration completed
[ ] UUID handled correctly
[ ] Authentication handled
[ ] Authorization handled
[ ] Validation implemented
[ ] Loading state handled
[ ] Error state handled
[ ] Empty state handled
[ ] Responsive behavior verified
[ ] Security reviewed
[ ] Performance reviewed
[ ] Tests completed
[ ] Build succeeds
[ ] Documentation updated where necessary
```

---

# 54. PRODUCTION READINESS

Before production readiness, verify:

## Security

- No secrets committed
- Authentication works
- Authorization works
- Input validation works
- Sensitive information is protected

## Backend

- APIs work
- Database works
- Transactions are correct
- Error handling works
- Real-time features work

## Frontend

- Routes work
- API integration works
- Responsive design works
- Loading/error states work
- No critical console errors

## Infrastructure

- Configuration is externalized
- Redis works where required
- Kafka works where required
- Media storage works
- WebSocket infrastructure works

---

# 55. PERFORMANCE CHECKLIST

Before production:

```text
[ ] API calls optimized
[ ] Database queries reviewed
[ ] Pagination implemented
[ ] Large media optimized
[ ] Frontend bundle reviewed
[ ] Unnecessary dependencies removed
[ ] Duplicate requests removed
[ ] WebSocket connections controlled
[ ] Caching reviewed
```

---

# 56. SECURITY CHECKLIST

Before production:

```text
[ ] No credentials in source code
[ ] No secrets in frontend
[ ] Authentication verified
[ ] Authorization verified
[ ] Input validation verified
[ ] File upload validation verified
[ ] XSS risks reviewed
[ ] Sensitive logging removed
[ ] Protected APIs verified
[ ] Resource ownership verified
```

---

# 57. FINAL PROJECT WORKFLOW

The complete project should follow:

```text
Requirement
    ↓
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
Security Review
    ↓
Performance Review
    ↓
Production Verification
```

Never skip directly from:

```text
Requirement
    ↓
Code
```

without understanding the architecture.

---

# 58. GLOBAL DEVELOPMENT RULE

When implementing any new feature:

### First ask:

```text
What is the requirement?
```

### Then:

```text
Where does this feature belong?
```

### Then:

```text
What APIs/data are required?
```

### Then:

```text
What security rules apply?
```

### Then:

```text
How will it be tested?
```

### Then implement.

---

# 59. PROJECT-WIDE NON-NEGOTIABLE RULES

The following rules are mandatory:

```text
1. Use UUID for persistent entity IDs.
2. Do not expose secrets.
3. Backend authorization is authoritative.
4. Do not invent APIs.
5. Do not randomly rewrite working code.
6. Do not introduce unnecessary dependencies.
7. Do not duplicate business logic unnecessarily.
8. Validate external input.
9. Handle errors properly.
10. Test significant functionality.
11. Maintain responsive frontend behavior.
12. Keep documentation synchronized.
13. Preserve existing functionality.
14. Build successfully before completion.
15. Never claim completion without verification.
```

---

# 60. FINAL ENGINEERING PHILOSOPHY

The project must be developed with the mindset:

```text
Build it correctly.
        ↓
Keep it understandable.
        ↓
Keep it secure.
        ↓
Keep it testable.
        ↓
Keep it scalable.
        ↓
Keep it maintainable.
```

Do not optimize for:

```text
More Code
More Dependencies
More Abstraction
More Features Without Quality
```

Optimize for:

```text
Correctness
+
Quality
+
Security
+
Performance
+
Maintainability
+
User Experience
```

---

---

# 61. PRODUCTION READINESS & SECURITY STANDARDS

The application architecture mandates:

```text
1. WebSocket Security: STOMP destinations must verify authorization and channel access prior to message subscription or publication.
2. Token Revocation: Distributed stateless token blacklisting (Redis + in-memory fallback) must support logout and session invalidation across all devices.
3. Social Privacy: User blocking must be enforced symmetrically across follows, messaging, and content access.
4. Distributed Tracing: Inbound requests must carry or generate X-Correlation-ID headers for end-to-end log correlation.
5. Error Contract Uniformity: All uncaught errors must adhere to standard API response wrappers with strict status mappings.
```

---

# 62. DYNAMIC RUNTIME CONFIGURATION & PSEUDO-PERMANENT DATA LIFECYCLE

All operational parameters and data lifecycle behaviors must adhere to runtime configurability standards:

1. **Runtime Operational Modifiability**: Operational limits (media size, duration, rate limits, email templates, feature flags) must be stored in PostgreSQL, cached in Redis, and editable via the Admin Dashboard without restarting backend services.
2. **Pseudo-Permanent Delete ("Pretend Purge")**: Permanent delete operations must present a complete permanent deletion experience to clients (immediate removal from Recently Deleted, 404 on restore and lookup) while preserving underlying database rows, audit logs, and Cloudinary media assets for legal compliance and administrative review.
3. **Emergency Legal Hold**: A dynamic platform-wide toggle must exist to instantly freeze all automated background cleanup and purge jobs during active investigations.
4. **Zero-Latency Cache-Aside**: Active feed generation, media uploads, and rate checks must read configuration strictly from Redis/in-memory caches, with immediate cache eviction upon Admin updates.

---

# 63. FINAL STANDARD

This document is the **global engineering contract** for the Instagram Clone.

All developers and AI development tools working on this project must follow it.

For implementation-specific rules:

```text
Backend → backend/backendStandard.md
Frontend → frontend/frontendStandard.md
```

For overall project requirements:

```text
readme.md
```

For detailed technical reference:

```text
instagram-clone-documents/
```

The final application must be treated as a serious full-stack software project and must not be reduced to a simple UI clone or demo.

**END OF GLOBAL ENGINEERING STANDARDS**