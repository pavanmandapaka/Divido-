# Firestore Schema: Expenses Collection

## Collection: `expenses`

### Document Structure

```typescript
interface Expense {
  expenseId: string;           // Document ID (auto-generated)
  groupId: string;             // Reference to group
  amount: number;              // Total expense amount (in smallest currency unit or decimal)
  paidBy: string;              // userId of person who paid
  participants: string[];      // Array of userIds involved in split
  splitType: 'equal' | 'exact' | 'percentage' | 'custom';
  splitDetails: SplitDetails;  // Object with split breakdown per participant
  category: string;            // Category for expense (food, transport, etc.)
  note: string;                // Description/note
  date: Timestamp;             // When expense occurred
  createdAt: Timestamp;        // Document creation time
  createdBy: string;           // userId who created the entry
  updatedAt: Timestamp;        // Last modification time
  isSettled: boolean;          // Whether expense is fully settled
  currency: string;            // Currency code (inherited from group or overridden)
}

interface SplitDetails {
  [userId: string]: {
    amount: number;            // Amount owed by this user
    percentage?: number;       // Percentage share (for percentage split)
    isSettled?: boolean;       // Individual settlement status
  };
}
```

---

## Split Types Explained

### 1. EQUAL Split
Everyone pays the same amount. `splitDetails` stores calculated share per person.

### 2. EXACT Split  
Specific amounts assigned to each participant. Amounts must sum to total.

### 3. PERCENTAGE Split
Each participant pays a percentage. Percentages must sum to 100%.

### 4. CUSTOM Split
Flexible shares (e.g., "2 shares for A, 1 share for B"). Converted to amounts.

---

## Example Documents

### Example 1: Equal Split (Dinner for 4)

```json
{
  "expenseId": "exp_abc123",
  "groupId": "grp_weekend_trip",
  "amount": 2000,
  "paidBy": "user_alice",
  "participants": ["user_alice", "user_bob", "user_carol", "user_dave"],
  "splitType": "equal",
  "splitDetails": {
    "user_alice": { "amount": 500, "isSettled": true },
    "user_bob": { "amount": 500, "isSettled": false },
    "user_carol": { "amount": 500, "isSettled": false },
    "user_dave": { "amount": 500, "isSettled": false }
  },
  "category": "food",
  "note": "Team dinner at Italian restaurant",
  "date": "2026-01-28T19:30:00Z",
  "createdAt": "2026-01-28T21:00:00Z",
  "createdBy": "user_alice",
  "updatedAt": "2026-01-28T21:00:00Z",
  "isSettled": false,
  "currency": "INR"
}
```

**Logic:** Total ₹2000 ÷ 4 participants = ₹500 each

---

### Example 2: Exact Split (Shared Groceries)

```json
{
  "expenseId": "exp_def456",
  "groupId": "grp_roommates",
  "amount": 1500,
  "paidBy": "user_bob",
  "participants": ["user_alice", "user_bob", "user_carol"],
  "splitType": "exact",
  "splitDetails": {
    "user_alice": { "amount": 400, "isSettled": false },
    "user_bob": { "amount": 800, "isSettled": true },
    "user_carol": { "amount": 300, "isSettled": false }
  },
  "category": "groceries",
  "note": "Weekly groceries - Alice got snacks, Bob got most items",
  "date": "2026-01-27T10:00:00Z",
  "createdAt": "2026-01-27T11:30:00Z",
  "createdBy": "user_bob",
  "updatedAt": "2026-01-27T11:30:00Z",
  "isSettled": false,
  "currency": "INR"
}
```

**Logic:** Exact amounts specified: 400 + 800 + 300 = 1500 ✓

---

### Example 3: Percentage Split (Office Rent)

```json
{
  "expenseId": "exp_ghi789",
  "groupId": "grp_coworking",
  "amount": 30000,
  "paidBy": "user_carol",
  "participants": ["user_alice", "user_bob", "user_carol"],
  "splitType": "percentage",
  "splitDetails": {
    "user_alice": { "amount": 15000, "percentage": 50, "isSettled": false },
    "user_bob": { "amount": 9000, "percentage": 30, "isSettled": false },
    "user_carol": { "amount": 6000, "percentage": 20, "isSettled": true }
  },
  "category": "rent",
  "note": "Office rent - split by desk usage",
  "date": "2026-01-01T00:00:00Z",
  "createdAt": "2026-01-01T09:00:00Z",
  "createdBy": "user_carol",
  "updatedAt": "2026-01-01T09:00:00Z",
  "isSettled": false,
  "currency": "INR"
}
```

**Logic:** 
- Alice: 50% of 30000 = 15000
- Bob: 30% of 30000 = 9000  
- Carol: 20% of 30000 = 6000
- Total: 50 + 30 + 20 = 100% ✓

---

### Example 4: Custom Split (Road Trip Gas with Different Usage)

```json
{
  "expenseId": "exp_jkl012",
  "groupId": "grp_road_trip",
  "amount": 4000,
  "paidBy": "user_dave",
  "participants": ["user_alice", "user_bob", "user_dave"],
  "splitType": "custom",
  "splitDetails": {
    "user_alice": { "amount": 1000, "shares": 1, "isSettled": false },
    "user_bob": { "amount": 1000, "shares": 1, "isSettled": false },
    "user_dave": { "amount": 2000, "shares": 2, "isSettled": true }
  },
  "category": "transport",
  "note": "Fuel for road trip - Dave drove most, pays 2 shares",
  "date": "2026-01-26T14:00:00Z",
  "createdAt": "2026-01-26T18:00:00Z",
  "createdBy": "user_dave",
  "updatedAt": "2026-01-26T18:00:00Z",
  "isSettled": false,
  "currency": "INR"
}
```

**Logic:** 
- Total shares: 1 + 1 + 2 = 4
- Per share: 4000 ÷ 4 = 1000
- Alice: 1 × 1000 = 1000
- Bob: 1 × 1000 = 1000
- Dave: 2 × 1000 = 2000

---

## Categories (Suggested)

```typescript
const EXPENSE_CATEGORIES = [
  'food',
  'transport',
  'accommodation',
  'groceries',
  'entertainment',
  'shopping',
  'utilities',
  'rent',
  'medical',
  'travel',
  'subscriptions',
  'other'
];
```

---

## Firestore Indexes Required

For efficient querying:

```
Collection: expenses

1. groupId (ASC) + date (DESC)
   → Fetch expenses for a group sorted by date

2. groupId (ASC) + createdAt (DESC)
   → Fetch recent expenses in a group

3. groupId (ASC) + paidBy (ASC) + date (DESC)
   → Fetch expenses paid by specific user

4. groupId (ASC) + category (ASC) + date (DESC)
   → Filter by category

5. groupId (ASC) + isSettled (ASC) + date (DESC)
   → Fetch unsettled expenses
```

---

## Scalability Considerations

### 1. **Document Size**
- Firestore documents limited to 1MB
- `splitDetails` object grows with participants
- Max ~100 participants per expense is safe

### 2. **Query Patterns**
- All queries filter by `groupId` first (partition key concept)
- Composite indexes for multi-field queries
- Avoid "NOT" queries (use boolean flags like `isSettled`)

### 3. **Denormalization Strategy**
- Store `amount` in `splitDetails` (pre-calculated)
- Avoids recalculating on every read
- Trade-off: Update all on expense edit

### 4. **Why Not Subcollections?**
```
Option A: expenses/{expenseId}                     ← CHOSEN
Option B: groups/{groupId}/expenses/{expenseId}
```
- Option A allows cross-group queries (admin dashboard)
- Option A simpler for collection group queries
- Filter by groupId in query (indexed)

### 5. **Settlement Tracking**
- `isSettled` at expense level = all participants settled
- `splitDetails[userId].isSettled` = individual status
- Enables partial settlement tracking

### 6. **Currency Handling**
- Store amounts as numbers (not strings)
- Currency code stored with expense
- Handle precision at application layer (2 decimals for most currencies)

### 7. **Timestamps**
- `date` = when expense happened (user-selected)
- `createdAt` = when document created (server timestamp)
- `updatedAt` = last edit (server timestamp)

---

## TypeScript Interface (For Reference)

```typescript
import { Timestamp } from 'firebase/firestore';

export interface Expense {
  expenseId: string;
  groupId: string;
  amount: number;
  paidBy: string;
  participants: string[];
  splitType: 'equal' | 'exact' | 'percentage' | 'custom';
  splitDetails: {
    [userId: string]: {
      amount: number;
      percentage?: number;
      shares?: number;
      isSettled: boolean;
    };
  };
  category: string;
  note: string;
  date: Timestamp;
  createdAt: Timestamp;
  createdBy: string;
  updatedAt: Timestamp;
  isSettled: boolean;
  currency: string;
}

export interface CreateExpenseInput {
  groupId: string;
  amount: number;
  paidBy: string;
  participants: string[];
  splitType: 'equal' | 'exact' | 'percentage' | 'custom';
  splitDetails: Record<string, { amount: number; percentage?: number; shares?: number }>;
  category: string;
  note: string;
  date: Date;
}
```

---

## DAY 1 COMPLETE — STOP
