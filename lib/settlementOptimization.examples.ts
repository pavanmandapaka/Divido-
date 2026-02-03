/**
 * Settlement Optimization Examples
 * Phase 5 Day 3: Walkthrough scenarios
 */

import { UserBalance, Settlement } from './settlementOptimization';


// EXAMPLE 1: Simple 3-person scenario


export const EXAMPLE_1_BALANCES: UserBalance[] = [
  { userId: 'alice', netAmount: 60.00 },   // Alice is owed $60
  { userId: 'bob', netAmount: -30.00 },    // Bob owes $30
  { userId: 'charlie', netAmount: -30.00 }, // Charlie owes $30
];

export const EXAMPLE_1_EXPECTED: Settlement[] = [
  { fromUser: 'bob', toUser: 'alice', amount: 30.00 },
  { fromUser: 'charlie', toUser: 'alice', amount: 30.00 },
];

// Explanation:
// - Alice is owed $60
// - Bob pays Alice $30
// - Charlie pays Alice $30
// - Result: 2 transactions (optimal)

// ========================================
// EXAMPLE 2: Complex 4-person trip
// ========================================

export const EXAMPLE_2_BALANCES: UserBalance[] = [
  { userId: 'alice', netAmount: 160.00 },  // Alice is owed $160
  { userId: 'bob', netAmount: -5.00 },     // Bob owes $5
  { userId: 'charlie', netAmount: -60.00 }, // Charlie owes $60
  { userId: 'diana', netAmount: -95.00 },  // Diana owes $95
];

export const EXAMPLE_2_EXPECTED: Settlement[] = [
  { fromUser: 'diana', toUser: 'alice', amount: 95.00 },
  { fromUser: 'charlie', toUser: 'alice', amount: 60.00 },
  { fromUser: 'bob', toUser: 'alice', amount: 5.00 },
];

// Explanation:
// - Alice is owed $160 total
// - Diana pays Alice $95 (Diana settled)
// - Charlie pays Alice $60 (Charlie settled)
// - Bob pays Alice $5 (Bob settled, Alice settled)
// - Result: 3 transactions (optimal for 4 people)

// ========================================
// EXAMPLE 3: Multiple creditors and debtors
// ========================================

export const EXAMPLE_3_BALANCES: UserBalance[] = [
  { userId: 'alice', netAmount: 50.00 },
  { userId: 'bob', netAmount: 30.00 },
  { userId: 'charlie', netAmount: -40.00 },
  { userId: 'diana', netAmount: -40.00 },
];

export const EXAMPLE_3_EXPECTED: Settlement[] = [
  { fromUser: 'charlie', toUser: 'alice', amount: 40.00 },
  { fromUser: 'diana', toUser: 'alice', amount: 10.00 },
  { fromUser: 'diana', toUser: 'bob', amount: 30.00 },
];

// Explanation:
// Creditors: Alice (+$50), Bob (+$30)
// Debtors: Charlie (-$40), Diana (-$40)
// 
// Step 1: Match largest debtor (Charlie $40) with largest creditor (Alice $50)
//   → Charlie pays Alice $40 (Charlie settled, Alice has $10 left)
// 
// Step 2: Match remaining debtor (Diana $40) with Alice ($10 left)
//   → Diana pays Alice $10 (Alice settled, Diana has $30 left)
// 
// Step 3: Match Diana ($30 left) with Bob ($30)
//   → Diana pays Bob $30 (both settled)
// 
// Result: 3 transactions (optimal)

// ========================================
// EXAMPLE 4: Unbalanced scenario
// ========================================

export const EXAMPLE_4_BALANCES: UserBalance[] = [
  { userId: 'alice', netAmount: 100.00 },
  { userId: 'bob', netAmount: -25.00 },
  { userId: 'charlie', netAmount: -25.00 },
  { userId: 'diana', netAmount: -25.00 },
  { userId: 'eve', netAmount: -25.00 },
];

export const EXAMPLE_4_EXPECTED: Settlement[] = [
  { fromUser: 'bob', toUser: 'alice', amount: 25.00 },
  { fromUser: 'charlie', toUser: 'alice', amount: 25.00 },
  { fromUser: 'diana', toUser: 'alice', amount: 25.00 },
  { fromUser: 'eve', toUser: 'alice', amount: 25.00 },
];

// Explanation:
// One person paid everything, 4 people owe equal amounts
// Each debtor pays the creditor directly
// Result: 4 transactions (optimal for 5 people)

// ========================================
// EXAMPLE 5: Two creditors, two debtors
// ========================================

export const EXAMPLE_5_BALANCES: UserBalance[] = [
  { userId: 'alice', netAmount: 70.00 },
  { userId: 'bob', netAmount: 30.00 },
  { userId: 'charlie', netAmount: -50.00 },
  { userId: 'diana', netAmount: -50.00 },
];

export const EXAMPLE_5_EXPECTED: Settlement[] = [
  { fromUser: 'charlie', toUser: 'alice', amount: 50.00 },
  { fromUser: 'diana', toUser: 'alice', amount: 20.00 },
  { fromUser: 'diana', toUser: 'bob', amount: 30.00 },
];

// Explanation:
// Creditors: Alice (+70), Bob (+30) = +100 total
// Debtors: Charlie (-50), Diana (-50) = -100 total
// 
// Greedy matching:
// 1. Charlie ($50) → Alice ($70): Charlie pays $50 to Alice
//    Charlie settled, Alice has $20 left
// 
// 2. Diana ($50) → Alice ($20 left): Diana pays $20 to Alice
//    Alice settled, Diana has $30 left
// 
// 3. Diana ($30 left) → Bob ($30): Diana pays $30 to Bob
//    Both settled
// 
// Result: 3 transactions (optimal for 4 people)

// ========================================
// EXAMPLE 6: Edge case - all settled
// ========================================

export const EXAMPLE_6_BALANCES: UserBalance[] = [
  { userId: 'alice', netAmount: 0 },
  { userId: 'bob', netAmount: 0 },
  { userId: 'charlie', netAmount: 0 },
];

export const EXAMPLE_6_EXPECTED: Settlement[] = [];

// Explanation:
// Everyone already settled
// Result: 0 transactions

// ========================================
// EXAMPLE 7: Floating-point edge case
// ========================================

export const EXAMPLE_7_BALANCES: UserBalance[] = [
  { userId: 'alice', netAmount: 33.33 },
  { userId: 'bob', netAmount: -16.67 },
  { userId: 'charlie', netAmount: -16.66 },
];

export const EXAMPLE_7_EXPECTED: Settlement[] = [
  { fromUser: 'bob', toUser: 'alice', amount: 16.67 },
  { fromUser: 'charlie', toUser: 'alice', amount: 16.66 },
];

// Explanation:
// Handles rounding properly
// Total: 33.33 = 16.67 + 16.66 ✓

// ========================================
// EXAMPLE 8: Large group (6 people)
// ========================================

export const EXAMPLE_8_BALANCES: UserBalance[] = [
  { userId: 'alice', netAmount: 120.00 },
  { userId: 'bob', netAmount: 80.00 },
  { userId: 'charlie', netAmount: -30.00 },
  { userId: 'diana', netAmount: -50.00 },
  { userId: 'eve', netAmount: -70.00 },
  { userId: 'frank', netAmount: -50.00 },
];

export const EXAMPLE_8_EXPECTED: Settlement[] = [
  { fromUser: 'eve', toUser: 'alice', amount: 70.00 },
  { fromUser: 'diana', toUser: 'alice', amount: 50.00 },
  { fromUser: 'frank', toUser: 'bob', amount: 50.00 },
  { fromUser: 'charlie', toUser: 'bob', amount: 30.00 },
];

// Explanation:
// Creditors: Alice (+120), Bob (+80)
// Debtors: Eve (-70), Diana (-50), Frank (-50), Charlie (-30)
// 
// Greedy matching (largest first):
// 1. Eve ($70) → Alice ($120): Eve pays $70 (Eve settled, Alice has $50 left)
// 2. Diana ($50) → Alice ($50 left): Diana pays $50 (both settled)
// 3. Frank ($50) → Bob ($80): Frank pays $50 (Frank settled, Bob has $30 left)
// 4. Charlie ($30) → Bob ($30 left): Charlie pays $30 (both settled)
// 
// Result: 4 transactions (optimal, theoretical min = 6 - 1 - 1 = 4)
// Note: -1 for people who are settled (0 balance doesn't count)

// ========================================
// WALKTHROUGH: Step-by-step Example 3
// ========================================

export const WALKTHROUGH_EXAMPLE = {
  initial: EXAMPLE_3_BALANCES,
  
  steps: [
    {
      step: 1,
      description: 'Match largest debtor (Charlie -$40) with largest creditor (Alice +$50)',
      settlement: { fromUser: 'charlie', toUser: 'alice', amount: 40.00 },
      remaining: [
        { userId: 'alice', netAmount: 10.00 },   // 50 - 40 = 10
        { userId: 'bob', netAmount: 30.00 },
        { userId: 'charlie', netAmount: 0 },     // Settled
        { userId: 'diana', netAmount: -40.00 },
      ],
    },
    {
      step: 2,
      description: 'Match remaining debtor (Diana -$40) with Alice (+$10)',
      settlement: { fromUser: 'diana', toUser: 'alice', amount: 10.00 },
      remaining: [
        { userId: 'alice', netAmount: 0 },       // Settled
        { userId: 'bob', netAmount: 30.00 },
        { userId: 'charlie', netAmount: 0 },
        { userId: 'diana', netAmount: -30.00 },  // -40 + 10 = -30
      ],
    },
    {
      step: 3,
      description: 'Match Diana (-$30) with Bob (+$30)',
      settlement: { fromUser: 'diana', toUser: 'bob', amount: 30.00 },
      remaining: [
        { userId: 'alice', netAmount: 0 },
        { userId: 'bob', netAmount: 0 },         // Settled
        { userId: 'charlie', netAmount: 0 },
        { userId: 'diana', netAmount: 0 },       // Settled
      ],
    },
  ],
  
  final: EXAMPLE_3_EXPECTED,
  transactionCount: 3,
  theoreticalMinimum: 3, // 4 people with non-zero balances = 4 - 1 = 3
  isOptimal: true,
};
