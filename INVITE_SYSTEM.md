# Invite System Schema & Logic

## Firestore Collection: `groupInvites`

### Document Structure

```typescript
{
  inviteId: string;        // Unique invite ID (document ID)
  groupId: string;         // Reference to group
  groupName: string;       // Cached group name for display
  createdBy: string;       // User ID who created invite
  createdByName: string;   // Display name of creator
  token: string;           // 16-character unique token (indexed)
  expiresAt: Timestamp;    // Expiration timestamp
  isActive: boolean;       // Can be deactivated by admin
  usageCount: number;      // Times invite has been used
  maxUsage: number | null; // Max uses (null = unlimited)
  createdAt: Timestamp;    // Creation timestamp
}
```

### Firestore Indexes Required

```
Collection: groupInvites
- token (ASC)
- groupId (ASC) + isActive (ASC) + expiresAt (DESC)
```

---

## Token Generation Logic

**Function:** `generateInviteToken()`

- Uses `crypto.randomUUID()` for secure randomness
- Removes hyphens and takes first 16 characters
- Example token: `a3b5c7d9e1f2g4h6`

**Security:**
- Cryptographically secure random generation
- Short enough for URLs, long enough to prevent guessing
- 16 hex characters = 64 bits of entropy

---

## Invite Creation Logic

**Function:** `createGroupInvite(groupId, userId, expiresInHours, maxUsage)`

**Validation Steps:**
1. Check database initialization
2. Verify user is member of group (composite key lookup)
3. Verify user has admin role
4. Verify group exists
5. Generate unique token
6. Calculate expiry timestamp (default 7 days)
7. Store invite document

**Parameters:**
- `groupId`: Target group
- `userId`: Admin creating invite
- `expiresInHours`: Expiry duration (default 168 = 7 days)
- `maxUsage`: Usage limit (null = unlimited)

**Returns:**
```typescript
{
  success: boolean;
  inviteId?: string;
  token?: string;
  expiresAt?: Date;
  error?: string;
}
```

---

## Invite Validation Logic

**Function:** `validateInviteToken(token)`

**Validation Checks (in order):**
1. Database initialized
2. Token not empty
3. Token exists in database (query by token field)
4. Invite is active (`isActive === true`)
5. Not expired (`now <= expiresAt`)
6. Under usage limit (`usageCount < maxUsage` or unlimited)
7. Group still exists

**Returns:**
```typescript
{
  valid: boolean;
  inviteId?: string;
  groupId?: string;
  groupName?: string;
  error?: string;
}
```

**Error Messages:**
- "Invalid token" - Empty or missing
- "Invite not found" - Token doesn't exist
- "This invite has been deactivated" - Admin revoked
- "This invite has expired" - Past expiry date
- "This invite has reached its usage limit" - Max uses reached
- "Group no longer exists" - Group deleted

---

## Invite Revocation Logic

**Function:** `revokeInvite(inviteId, userId)`

**Validation Steps:**
1. Check database initialization
2. Verify invite exists
3. Verify user is admin of invite's group
4. Set `isActive = false`

**Returns:**
```typescript
{
  success: boolean;
  error?: string;
}
```

---

## Usage Flow

### Creating an Invite

```typescript
const result = await createGroupInvite(
  'group123',      // groupId
  'user456',       // admin userId
  168,             // 7 days expiry
  10               // max 10 uses
);

if (result.success) {
  const inviteUrl = `https://yourapp.com/invite/${result.token}`;
  // Share inviteUrl
}
```

### Validating an Invite

```typescript
const validation = await validateInviteToken('a3b5c7d9e1f2g4h6');

if (validation.valid) {
  // Show group name: validation.groupName
  // Proceed to join flow with: validation.groupId
} else {
  // Show error: validation.error
}
```

### Revoking an Invite

```typescript
const result = await revokeInvite('invite789', 'adminUserId');

if (result.success) {
  // Invite deactivated
}
```

---

## Security Considerations

1. **Admin-only creation**: Only group admins can create invites
2. **Token uniqueness**: Crypto-secure random generation
3. **Expiration**: All invites expire (default 7 days)
4. **Revocation**: Admins can deactivate invites anytime
5. **Usage limits**: Optional max usage count
6. **Group verification**: Validates group exists before use

---

## Future Enhancements (Not Implemented)

- Single-use tokens for specific users
- Track which users joined via which invite
- Invite usage analytics
- Email-based invites with personalization
- Role-specific invites (auto-assign role)

---

## DAY 6 COMPLETE — STOP
