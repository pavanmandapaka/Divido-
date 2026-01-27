# PHASE 3 - DAY 1: Firestore Database Schema for Groups

## Database Collections

### 1. `groups` Collection

**Purpose:** Store group information and metadata

**Document ID:** Auto-generated Firestore ID

**Schema:**
```json
{
  "groupId": "auto-generated-id",
  "name": "Roommate Expenses",
  "description": "Shared apartment costs",
  "currency": "USD",
  "createdBy": "user-uid-123",
  "createdAt": {
    "_seconds": 1738104000,
    "_nanoseconds": 0
  },
  "updatedAt": {
    "_seconds": 1738104000,
    "_nanoseconds": 0
  },
  "memberCount": 3,
  "totalExpenses": 0,
  "settledExpenses": 0,
  "isActive": true
}
```

**Field Descriptions:**
- `groupId` (string): Unique identifier (same as document ID)
- `name` (string): Group display name (required, max 50 chars)
- `description` (string): Optional group description (max 200 chars)
- `currency` (string): ISO currency code (USD, EUR, INR, etc.)
- `createdBy` (string): Firebase Auth UID of creator
- `createdAt` (timestamp): Group creation timestamp
- `updatedAt` (timestamp): Last modification timestamp
- `memberCount` (number): Denormalized count for quick access
- `totalExpenses` (number): Total number of expenses (denormalized)
- `settledExpenses` (number): Number of settled expenses (denormalized)
- `isActive` (boolean): Soft delete flag

---

### 2. `groupMembers` Collection

**Purpose:** Store group membership and roles

**Document ID:** `{groupId}_{userId}` (composite key)

**Schema:**
```json
{
  "groupId": "group-abc-123",
  "userId": "user-uid-456",
  "role": "admin",
  "joinedAt": {
    "_seconds": 1738104000,
    "_nanoseconds": 0
  },
  "invitedBy": "user-uid-123",
  "status": "active",
  "displayName": "John Doe",
  "email": "john@example.com",
  "photoURL": ""
}
```

**Field Descriptions:**
- `groupId` (string): Reference to groups collection
- `userId` (string): Firebase Auth UID
- `role` (string): Either "admin" or "member"
- `joinedAt` (timestamp): When user joined the group
- `invitedBy` (string): UID of user who invited (optional)
- `status` (string): "active" | "left" | "removed"
- `displayName` (string): Cached user name for quick display
- `email` (string): Cached user email for quick display
- `photoURL` (string): Cached user photo for quick display

---

## Example Data Structure

### Example 1: Group with 3 Members

**Group Document:** `groups/grp_2026_01_28_abc123`
```json
{
  "groupId": "grp_2026_01_28_abc123",
  "name": "Weekend Trip to Goa",
  "description": "Beach trip expenses",
  "currency": "INR",
  "createdBy": "uid_alice",
  "createdAt": "2026-01-28T10:00:00Z",
  "updatedAt": "2026-01-28T10:00:00Z",
  "memberCount": 3,
  "totalExpenses": 0,
  "settledExpenses": 0,
  "isActive": true
}
```

**Member Documents:**

`groupMembers/grp_2026_01_28_abc123_uid_alice`
```json
{
  "groupId": "grp_2026_01_28_abc123",
  "userId": "uid_alice",
  "role": "admin",
  "joinedAt": "2026-01-28T10:00:00Z",
  "invitedBy": null,
  "status": "active",
  "displayName": "Alice Smith",
  "email": "alice@example.com",
  "photoURL": "https://..."
}
```

`groupMembers/grp_2026_01_28_abc123_uid_bob`
```json
{
  "groupId": "grp_2026_01_28_abc123",
  "userId": "uid_bob",
  "role": "member",
  "joinedAt": "2026-01-28T10:05:00Z",
  "invitedBy": "uid_alice",
  "status": "active",
  "displayName": "Bob Johnson",
  "email": "bob@example.com",
  "photoURL": ""
}
```

`groupMembers/grp_2026_01_28_abc123_uid_charlie`
```json
{
  "groupId": "grp_2026_01_28_abc123",
  "userId": "uid_charlie",
  "role": "member",
  "joinedAt": "2026-01-28T10:10:00Z",
  "invitedBy": "uid_alice",
  "status": "active",
  "displayName": "Charlie Davis",
  "email": "charlie@example.com",
  "photoURL": ""
}
```

---

## Composite Indexes Required

Firestore will need these composite indexes for efficient queries:

1. **groupMembers Collection:**
   - `(userId, status)` - Get all active groups for a user
   - `(groupId, status)` - Get all active members in a group
   - `(groupId, role)` - Get all admins in a group

2. **groups Collection:**
   - `(createdBy, isActive)` - Get user's active groups
   - `(isActive, createdAt)` - List all active groups sorted by date

---

## Why This Structure Scales

### 1. **Denormalization Strategy**
- User info cached in `groupMembers` → No need to join with `users` collection for display
- `memberCount` in `groups` → No need to count documents for simple displays
- Trade-off: Slight storage overhead for significant read performance gain

### 2. **Composite Document IDs**
- `groupMembers` uses `{groupId}_{userId}` → Natural uniqueness constraint
- Prevents duplicate memberships without additional queries
- Easy to construct document path for direct reads

### 3. **Flexible Role System**
- Current: "admin" | "member"
- Future: Easy to add "viewer", "editor", etc.
- No schema migration needed

### 4. **Soft Deletes**
- `isActive` in groups → Don't delete, just mark inactive
- `status` in groupMembers → Track left/removed members
- Maintains audit trail and allows "undelete" functionality

### 5. **Query Efficiency**
- Single collection queries (no joins)
- Indexed fields for common queries
- Document reads scale independently

### 6. **Future Proof**
- Adding new fields doesn't break existing documents
- Denormalized fields can be recalculated if needed
- Status enums allow workflow expansion

---

## Query Patterns (Planned)

```javascript
// TODO: Phase 3 Day 2 - Implement these queries

// Get all groups for a user
// groupMembers
//   .where('userId', '==', currentUserId)
//   .where('status', '==', 'active')

// Get all members in a group
// groupMembers
//   .where('groupId', '==', groupId)
//   .where('status', '==', 'active')

// Get group admins
// groupMembers
//   .where('groupId', '==', groupId)
//   .where('role', '==', 'admin')

// Check if user is in group
// groupMembers.doc(`${groupId}_${userId}`).get()
```

---

## Security Rules (To Be Implemented)

```javascript
// TODO: Phase 3 Day 3 - Add Firestore security rules

// groups collection:
// - Anyone authenticated can create
// - Only members can read
// - Only admins can update/delete

// groupMembers collection:
// - Only group admins can add members
// - Only admins or self can remove
// - Users can read groups they're in
```

---

## Migration Strategy

If schema changes are needed later:

1. Add new fields with default values
2. Run migration script to update existing documents
3. Update application code to use new fields
4. No downtime required (Firestore is schemaless)

---

## Data Consistency Rules

1. **Creating a Group:**
   - Create group document
   - Create groupMembers document for creator (role: admin)
   - Set memberCount = 1

2. **Adding a Member:**
   - Create groupMembers document
   - Increment group.memberCount
   - Both operations in a batch write

3. **Removing a Member:**
   - Update groupMembers status to "left" or "removed"
   - Decrement group.memberCount
   - If last admin leaving, promote another member

4. **Deleting a Group:**
   - Set group.isActive = false
   - Update all groupMembers status to "removed"
   - Don't actually delete (soft delete)

---

## TODO Comments for Future Phases

```javascript
// TODO: Phase 3 Day 2 - Create group CRUD functions
// TODO: Phase 3 Day 3 - Add member management functions
// TODO: Phase 3 Day 4 - Build group UI components
// TODO: Phase 4 - Add invite link system (separate collection: groupInvites)
// TODO: Phase 5 - Add expenses collection linked to groups
// TODO: Phase 6 - Add settlements collection
// TODO: Phase 7 - Add notifications for group activities
```

---

## Storage Estimates

**Per Group:**
- 1 group document: ~500 bytes
- N member documents: ~300 bytes each
- Example: 10-member group = ~3.5 KB

**At Scale (10,000 users, avg 5 groups each, avg 5 members per group):**
- 10,000 groups
- 50,000 groupMembers documents
- Total storage: ~20 MB
- Well within Firestore free tier

---

## Performance Characteristics

**Reads:**
- Get user's groups: 1 query → O(n) where n = user's group count
- Get group members: 1 query → O(m) where m = group member count
- Check membership: 1 document read → O(1)

**Writes:**
- Create group: 2 writes (group + creator membership)
- Add member: 2 writes (membership + increment)
- Remove member: 2 writes (status update + decrement)

**Cost Optimization:**
- Denormalization reduces reads (expensive)
- Increases writes (cheaper)
- Net cost: Lower for read-heavy workloads ✅

---

# DAY 1 COMPLETE — STOP

## Summary

✅ **Designed Firestore collections:** `groups` and `groupMembers`  
✅ **Defined complete schema** with all required and future-proof fields  
✅ **Provided JSON examples** for real-world scenarios  
✅ **Explained scalability** through denormalization and composite keys  
✅ **Added TODO comments** for Phase 3 continuation  
✅ **NO UI code** - Pure database design

**Next Steps (Day 2):**
- Implement CRUD functions for groups
- Create helper functions for member management
- Add TypeScript interfaces for type safety
