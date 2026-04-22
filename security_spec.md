# Firestore Security Specification - MedMentor AI

## Data Invariants
1. A **User** profile must match the authenticated user's UID. Ranks are restricted to "Student", "Resident", or "Attending".
2. A **SessionResult** must be linked to the `userId` of the person who completed the case.
3. Once a session is completed (created), it should not be modifiable by the client to maintain academic integrity.

## The Dirty Dozen Payloads (Targeting Rejection)
1. Creating a user profile for someone else's UID.
2. Updating a user profile's `uid` field to a different value.
3. Increasing `knowledgeProgress` beyond 100 via client side.
4. Reading another user's profile.
5. Creating a session result for another `userId`.
6. Reading another user's session history.
7. Updating an existing session result (Sessions should be immutable).
8. Injecting a massive string (>1KB) into `caseTitle`.
9. Using a non-UUID or malicious string as a `sessionId`.
10. Spoofing `createdAt` to be in the future.
11. Setting an invalid `rank` (e.g., "Admin") via client.
12. Deleting a session result to "hide" poor performance.

## Test Boundaries
- `allow create` on `/users/{userId}`: `if userId == request.auth.uid`.
- `allow update` on `/users/{userId}`: `if userId == request.auth.uid` && limited fields.
- `allow create` on `/sessions/{sessionId}`: `if incoming().userId == request.auth.uid`.
- `allow read` on `/sessions/{sessionId}`: `if resource.data.userId == request.auth.uid`.
