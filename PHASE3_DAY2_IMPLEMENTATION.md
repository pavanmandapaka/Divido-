# Phase 3 Day 2: Group Creation Implementation

## Overview

This document explains the server-side group creation logic implemented for the Smart Expense Splitter.

---

## Files Created

1. **`/lib/groups.ts`** - Main group management functions
2. **`/lib/groups.examples.ts`** - Usage examples and integration patterns

---

## Core Function: `createGroup()`

### Purpose
Creates a new group in Firestore with the creator as the first admin member.

### Function Signature
```typescript
async function createGroup(input: CreateGroupInput): Promise<{
  success: boolean;
  groupId?: string;
  error?: string;
}>
```

### Input Parameters
```typescript
interface CreateGroupInput {
  name: string;              // Group name (required, max 50 chars)
  description: string;        // Group description (max 200 chars)
  currency: string;           // ISO currency code (3 letters: USD, EUR, etc.)
  createdBy: string;          // Firebase Auth UID of creator
  creatorDisplayName: string; // Display name from user profile
  creatorEmail: string;       // Email from user profile
  creatorPhotoURL?: string;   // Optional photo URL
}
```

### Return Value
```typescript
{
  success: true,
  groupId: "abc123xyz"  // Firebase auto-generated ID
}
// OR
{
  success: false,
  error: "Error message"
}
```

---

## Implementation Details

### 1. Input Validation

The function validates all inputs before attempting to write to Firestore:

```typescript
✅ Group name is required and not empty
✅ Group name ≤ 50 characters
✅ Description ≤ 200 characters
✅ Currency is exactly 3 characters
✅ User is authenticated (createdBy exists)
```

**Why Validate?**
- Prevents invalid data in Firestore
- Provides clear error messages to users
- Reduces unnecessary database writes

### 2. Atomic Writes (Batch Operations)

The function uses **Firestore batch writes** to ensure atomicity:

```typescript
const batch = writeBatch(db);
batch.set(newGroupRef, groupData);      // Write 1: Create group
batch.set(memberRef, memberData);        // Write 2: Add creator as admin
await batch.commit();                    // Both succeed or both fail
```

**Why Atomic?**
- **Data Consistency:** Group and creator membership always created together
- **No Orphaned Data:** Can't have a group without an admin, or admin without a group
- **Transaction Safety:** If one write fails, both are rolled back

### 3. Document Structure

#### Group Document
```typescript
groups/{auto-generated-id}
{
  groupId: string,           // Same as document ID
  name: string,
  description: string,
  currency: string,
  createdBy: string,         // Creator's UID
  createdAt: Timestamp,      // Server timestamp
  updatedAt: Timestamp,      // Server timestamp
  memberCount: 1,            // Denormalized count
  totalExpenses: 0,          // Denormalized count
  settledExpenses: 0,        // Denormalized count
  isActive: true             // Soft delete flag
}
```

#### Group Member Document
```typescript
groupMembers/{groupId}_{userId}  // Composite key
{
  groupId: string,
  userId: string,
  role: 'admin',             // Creator is always admin
  joinedAt: Timestamp,
  invitedBy: null,           // Creator wasn't invited
  status: 'active',
  displayName: string,       // Cached from user
  email: string,             // Cached from user
  photoURL: string           // Cached from user
}
```

### 4. Server Timestamps

Uses Firestore `serverTimestamp()` for consistency:

```typescript
createdAt: serverTimestamp()
updatedAt: serverTimestamp()
joinedAt: serverTimestamp()
```

**Why Server Timestamps?**
- **Consistency:** All users see the same time regardless of timezone
- **Accuracy:** Based on server time, not client device
- **No Manipulation:** Client can't fake timestamps

### 5. Composite Keys

Group members use composite document IDs: `{groupId}_{userId}`

**Benefits:**
- **Natural Uniqueness:** One user can only be in a group once
- **Direct Access:** Can fetch membership with doc ID (O(1))
- **No Extra Queries:** Don't need to check if user already exists

**Example:**
```
groupMembers/grp_abc123_user_xyz789
```

### 6. Denormalization Strategy

The group document stores denormalized data:

```typescript
memberCount: 1        // Instead of counting groupMembers documents
totalExpenses: 0      // Instead of counting expenses documents
settledExpenses: 0    // Instead of counting settled expenses
```

**Trade-offs:**
- ✅ **Faster Reads:** No need to count documents
- ✅ **Lower Cost:** Fewer queries needed
- ❌ **Complex Writes:** Must update denormalized fields
- ❌ **Consistency Risk:** Must use transactions/batches

**Mitigation:** We use batch writes to keep denormalized data consistent

---

## Logic Flow Diagram

```
User Submits Form
    ↓
Input Validation
    ├─ Invalid? → Return error
    └─ Valid? → Continue
    ↓
Generate Group ID (Firestore auto-ID)
    ↓
Create Composite Member ID: {groupId}_{userId}
    ↓
Prepare Group Document
    ├─ Set basic info (name, description, currency)
    ├─ Set creator UID
    ├─ Set server timestamps
    ├─ Set memberCount = 1
    └─ Set isActive = true
    ↓
Prepare Member Document
    ├─ Set group and user IDs
    ├─ Set role = 'admin'
    ├─ Set status = 'active'
    ├─ Set invitedBy = null
    └─ Cache user info (name, email, photo)
    ↓
Create Batch Write
    ├─ Add group document write
    └─ Add member document write
    ↓
Commit Batch (Atomic Operation)
    ├─ Success? → Return {success: true, groupId}
    └─ Error? → Rollback & return {success: false, error}
```

---

## Error Handling

### Client-Side Errors (Pre-validation)
```typescript
"Group name is required"
"Group name must be 50 characters or less"
"Description must be 200 characters or less"
"Valid currency code is required"
"User must be authenticated"
```

### Server-Side Errors (Firestore)
```typescript
"Failed to create group"  // Generic Firestore error
```

### Error Response Pattern
```typescript
{
  success: false,
  error: "Human-readable error message"
}
```

---

## Security Considerations

### Current Implementation
- ✅ Validates all inputs
- ✅ Uses authenticated user UID
- ✅ Server timestamps (can't be faked)

### TODO: Firestore Security Rules (Day 3)
```javascript
// Future implementation needed
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /groups/{groupId} {
      // Anyone authenticated can create
      allow create: if request.auth != null 
                    && request.resource.data.createdBy == request.auth.uid;
      
      // Only members can read
      allow read: if request.auth != null 
                  && exists(/databases/$(database)/documents/groupMembers/$(groupId + '_' + request.auth.uid));
    }
    
    match /groupMembers/{memberId} {
      // Only group admins can add members
      allow create: if request.auth != null;  // TODO: Check if user is admin
      
      // Users can read groups they're in
      allow read: if request.auth != null 
                  && memberId.split('_')[1] == request.auth.uid;
    }
  }
}
```

---

## Performance Characteristics

### Time Complexity
- **Operation:** Create group
- **Writes:** 2 documents (group + member)
- **Time:** O(1) - constant time

### Space Complexity
- **Per Group:** ~800 bytes
  - Group document: ~500 bytes
  - Member document: ~300 bytes

### Cost Analysis (Firestore Pricing)
- **Writes:** 2 per group creation
- **Free Tier:** 20,000 writes/day
- **Cost:** $0.18 per 100,000 writes after free tier

**Example:**
- 1,000 groups/day = 2,000 writes
- Well within free tier ✅

---

## Testing Scenarios

### Valid Group Creation
```typescript
Input: {
  name: "Weekend Trip",
  description: "Beach vacation",
  currency: "USD",
  createdBy: "user123",
  creatorDisplayName: "John Doe",
  creatorEmail: "john@example.com"
}

Expected Result: {
  success: true,
  groupId: "abc123xyz"
}

Firestore State:
✅ groups/abc123xyz created
✅ groupMembers/abc123xyz_user123 created
✅ Both have matching timestamps
✅ memberCount = 1
```

### Invalid Input - Empty Name
```typescript
Input: {
  name: "",
  description: "Test",
  currency: "USD",
  ...
}

Expected Result: {
  success: false,
  error: "Group name is required"
}

Firestore State:
✅ No documents created
```

### Invalid Input - Long Name
```typescript
Input: {
  name: "A".repeat(51),  // 51 characters
  description: "Test",
  currency: "USD",
  ...
}

Expected Result: {
  success: false,
  error: "Group name must be 50 characters or less"
}
```

### Invalid Input - Bad Currency
```typescript
Input: {
  name: "Test Group",
  description: "Test",
  currency: "INVALID",  // More than 3 chars
  ...
}

Expected Result: {
  success: false,
  error: "Valid currency code is required"
}
```

---

## Integration Guide (For Day 3+)

### Step 1: Import the Function
```typescript
import { createGroup } from '@/lib/groups';
import { useAuth } from '@/contexts/AuthProvider';
```

### Step 2: Call from Component
```typescript
const { user } = useAuth();

const handleSubmit = async (formData) => {
  const result = await createGroup({
    name: formData.name,
    description: formData.description,
    currency: formData.currency,
    createdBy: user.uid,
    creatorDisplayName: user.displayName,
    creatorEmail: user.email,
    creatorPhotoURL: user.photoURL,
  });
  
  if (result.success) {
    // Navigate to /groups/{result.groupId}
  } else {
    // Show error: result.error
  }
};
```

### Step 3: Handle Loading States
```typescript
const [loading, setLoading] = useState(false);

const handleSubmit = async () => {
  setLoading(true);
  const result = await createGroup(...);
  setLoading(false);
  // Handle result
};
```

---

## TODO Comments for Future Work

```typescript
// TODO: Phase 3 Day 3 - Add member management functions
// - addMemberToGroup()
// - removeMemberFromGroup()
// - updateMemberRole()
// - getMembersByGroup()

// TODO: Phase 3 Day 4 - Add group query functions
// - getUserGroups() - Get all groups for a user
// - getGroupById() - Get group details
// - updateGroup() - Update group info
// - deleteGroup() - Soft delete group

// TODO: Phase 3 Day 5 - Build UI components
// - CreateGroupForm component
// - GroupList component
// - GroupCard component

// TODO: Phase 4 - Add invite system
// - generateInviteLink()
// - joinGroupViaInvite()
// - revokeInviteLink()

// TODO: Add Firestore security rules
// TODO: Add unit tests for createGroup()
// TODO: Add integration tests
```

---

## Summary

✅ **Created:** `createGroup()` function with full validation  
✅ **Atomicity:** Uses batch writes for data consistency  
✅ **Type Safety:** Full TypeScript interfaces  
✅ **Error Handling:** Comprehensive validation and error messages  
✅ **Documentation:** Examples and integration guide provided  
✅ **Performance:** Optimized with denormalization  
✅ **Security:** Ready for security rules implementation  

**No UI created** - Pure business logic as requested.

---

# DAY 2 COMPLETE — STOP
