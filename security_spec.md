# Nirnay Sutra — Firestore Security Specification

## 1. Core Security Principles
1. **Default Deny**: All unmatched paths are denied (`allow read, write: if false;`).
2. **Authentication Required**: No anonymous or unauthenticated reads/writes are permitted on live Firestore paths.
3. **No Self-Escalation to Brand Admin on Join**:
   - When creating a brand-new workspace (`/workspaces/{workspaceId}`), the authenticated creator (`ownerUid == request.auth.uid`) becomes `Brand Admin` of that new workspace.
   - When joining an existing workspace (`/workspaces/{workspaceId}/members/{memberUid}` where `workspace.ownerUid != request.auth.uid`), the user can **NEVER** assign themselves `role == 'Brand Admin'`. Their effective `role` must start as `'Creator'`, and if they request `'Manager'` or `'Reviewer'`, `approvalStatus` must be `'pending'`.
4. **Role Mutability Restricted to Brand Admin**:
   - Only a verified `Brand Admin` of the workspace can modify a member's `role`, `approvalStatus`, or `status`.
   - Users can read and update their own `/users/{userId}` document (such as `displayName`, `photoURL`, `lastSignInAt`, `sessionEpoch`), but cannot escalate their own `role` unless they are the owner of a newly created workspace or an existing `Brand Admin`.
5. **Workspace Isolation**:
   - Users can only read `/workspaces/{workspaceId}/contentItems`, `/libraryItems`, `/members`, and `/auditLogs` if they are an active member of `{workspaceId}`.
6. **Confidential Library Item Protection**:
   - In `/workspaces/{workspaceId}/libraryItems/{itemId}`, if `resource.data.confidential == true`, read access is restricted strictly to workspace members whose active role is `'Reviewer'` or `'Brand Admin'`.
7. **Account & Data Deletion**:
   - A user can delete their own `/users/{userId}` profile and their own membership document `/workspaces/{workspaceId}/members/{userId}`.
