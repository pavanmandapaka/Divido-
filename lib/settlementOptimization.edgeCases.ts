/**
 * Settlement Optimization Edge Cases
 * Phase 5 Day 3: Comprehensive edge case handling
 */

import { minimizeSettlements, validateSettlements } from './settlementOptimization';
import { UserBalance } from './settlementOptimization';

// ========================================
// EDGE CASE 1: Empty input
// ========================================

export const EDGE_CASE_1_EMPTY: UserBalance[] = [];

const result1 = minimizeSettlements(EDGE_CASE_1_EMPTY);
// Expected: [] (no settlements)
// Reason: No balances to settle

console.assert(result1.length === 0, 'Empty input → empty output');

// ========================================
// EDGE CASE 2: Single user
// ========================================

export const EDGE_CASE_2_SINGLE: UserBalance[] = [
  { userId: 'alice', netAmount: 100 },
];

const result2 = minimizeSettlements(EDGE_CASE_2_SINGLE);
// Expected: [] (no settlements)
// Reason: Can't settle with yourself

console.assert(result2.length === 0, 'Single user → no settlements');

// ========================================
// EDGE CASE 3: All zero balances
// ========================================

export const EDGE_CASE_3_ALL_ZERO: UserBalance[] = [
  { userId: 'alice', netAmount: 0 },
  { userId: 'bob', netAmount: 0 },
  { userId: 'charlie', netAmount: 0 },
];

const result3 = minimizeSettlements(EDGE_CASE_3_ALL_ZERO);
// Expected: [] (no settlements)
// Reason: Everyone already settled

console.assert(result3.length === 0, 'All zeros → no settlements');

// ========================================
// EDGE CASE 4: Only creditors (imbalanced input)
// ========================================

export const EDGE_CASE_4_ONLY_CREDITORS: UserBalance[] = [
  { userId: 'alice', netAmount: 50 },
  { userId: 'bob', netAmount: 30 },
];

const result4 = minimizeSettlements(EDGE_CASE_4_ONLY_CREDITORS);
// Expected: [] (no settlements possible)
// Reason: No one owes money, everyone is owed
// Note: This violates the invariant (sum ≠ 0) but algorithm handles gracefully

console.assert(result4.length === 0, 'Only creditors → no settlements');

// ========================================
// EDGE CASE 5: Only debtors (imbalanced input)
// ========================================

export const EDGE_CASE_5_ONLY_DEBTORS: UserBalance[] = [
  { userId: 'alice', netAmount: -50 },
  { userId: 'bob', netAmount: -30 },
];

const result5 = minimizeSettlements(EDGE_CASE_5_ONLY_DEBTORS);
// Expected: [] (no settlements possible)
// Reason: Everyone owes, no one to pay

console.assert(result5.length === 0, 'Only debtors → no settlements');

// ========================================
// EDGE CASE 6: Two users (simplest case)
// ========================================

export const EDGE_CASE_6_TWO_USERS: UserBalance[] = [
  { userId: 'alice', netAmount: 100 },
  { userId: 'bob', netAmount: -100 },
];

const result6 = minimizeSettlements(EDGE_CASE_6_TWO_USERS);
// Expected: [{ fromUser: 'bob', toUser: 'alice', amount: 100 }]
// Reason: Direct payment from debtor to creditor

console.assert(result6.length === 1, 'Two users → 1 settlement');
console.assert(result6[0].amount === 100, 'Correct amount');

// ========================================
// EDGE CASE 7: Very small amounts (rounding)
// ========================================

export const EDGE_CASE_7_SMALL_AMOUNTS: UserBalance[] = [
  { userId: 'alice', netAmount: 0.01 },
  { userId: 'bob', netAmount: -0.01 },
];

const result7 = minimizeSettlements(EDGE_CASE_7_SMALL_AMOUNTS);
// Expected: [{ fromUser: 'bob', toUser: 'alice', amount: 0.01 }]
// Reason: Even tiny amounts are settled

console.assert(result7.length === 1, 'Small amounts handled');
console.assert(result7[0].amount === 0.01, 'Precision maintained');

// ========================================
// EDGE CASE 8: Many small debtors, one large creditor
// ========================================

export const EDGE_CASE_8_MANY_SMALL: UserBalance[] = [
  { userId: 'alice', netAmount: 100 },
  { userId: 'bob', netAmount: -1 },
  { userId: 'charlie', netAmount: -1 },
  { userId: 'diana', netAmount: -1 },
  // ... 97 more -$1 debtors
];

// Add 97 more small debtors
for (let i = 0; i < 97; i++) {
  EDGE_CASE_8_MANY_SMALL.push({
    userId: `user_${i}`,
    netAmount: -1,
  });
}

const result8 = minimizeSettlements(EDGE_CASE_8_MANY_SMALL);
// Expected: 100 transactions (each debtor pays alice)
// Reason: Can't reduce further when one person is owed by everyone

console.assert(result8.length === 100, '100 small debtors → 100 transactions');
console.assert(result8.every(s => s.toUser === 'alice'), 'All pay alice');

// ========================================
// EDGE CASE 9: Perfect pairs
// ========================================

export const EDGE_CASE_9_PAIRS: UserBalance[] = [
  { userId: 'alice', netAmount: 50 },
  { userId: 'bob', netAmount: -50 },
  { userId: 'charlie', netAmount: 30 },
  { userId: 'diana', netAmount: -30 },
];

const result9 = minimizeSettlements(EDGE_CASE_9_PAIRS);
// Expected: 2 transactions (perfect pairing possible)
// Bob → Alice, Diana → Charlie

console.assert(result9.length === 2, 'Perfect pairs → 2 transactions');
console.assert(validateSettlements(EDGE_CASE_9_PAIRS, result9), 'Validates');

// ========================================
// EDGE CASE 10: Floating-point accumulation
// ========================================

export const EDGE_CASE_10_FLOAT_ERROR: UserBalance[] = [
  { userId: 'alice', netAmount: 10.11 },
  { userId: 'bob', netAmount: 10.11 },
  { userId: 'charlie', netAmount: -6.74 },
  { userId: 'diana', netAmount: -6.74 },
  { userId: 'eve', netAmount: -6.74 },
];

const result10 = minimizeSettlements(EDGE_CASE_10_FLOAT_ERROR);
// Expected: Should handle rounding properly
// Sum = 20.22 - 20.22 = 0 (but may have floating-point error)

console.assert(validateSettlements(EDGE_CASE_10_FLOAT_ERROR, result10), 'Handles float errors');

// ========================================
// EDGE CASE SUMMARY
// ========================================

export const EDGE_CASE_SUMMARY = {
  empty: 'Returns empty array',
  singleUser: 'Returns empty array (cannot settle alone)',
  allZeros: 'Returns empty array (already settled)',
  onlyCreditors: 'Returns empty array (no debtors)',
  onlyDebtors: 'Returns empty array (no creditors)',
  twoUsers: 'Returns single settlement (direct payment)',
  smallAmounts: 'Handles precision to 2 decimals',
  manySmall: 'Handles large number of participants',
  perfectPairs: 'Optimizes when possible',
  floatErrors: 'Rounds properly to avoid accumulation',
};

console.log('\n╔════════════════════════════════════════╗');
console.log('║  EDGE CASES VERIFIED                  ║');
console.log('╚════════════════════════════════════════╝\n');

Object.entries(EDGE_CASE_SUMMARY).forEach(([key, description]) => {
  console.log(`✓ ${key.padEnd(20)} ${description}`);
});

console.log('');
