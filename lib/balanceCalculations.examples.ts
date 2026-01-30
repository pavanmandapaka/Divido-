/**
 * Balance Calculation Examples
 * Phase 5 Day 2: Test data and expected outputs
 */

import { ExpenseForBalance } from './balanceCalculations';

// ========================================
// EXAMPLE 1: Simple equal split
// ========================================

export const EXAMPLE_1_EXPENSES: ExpenseForBalance[] = [
  {
    expenseId: 'exp1',
    amount: 90.00,
    paidBy: 'alice',
    participants: ['alice', 'bob', 'charlie'],
    splitDetails: {
      alice: { amount: 30.00 },
      bob: { amount: 30.00 },
      charlie: { amount: 30.00 },
    },
  },
];

export const EXAMPLE_1_EXPECTED = {
  alice: { userId: 'alice', netAmount: 60.00, totalPaid: 90.00, totalOwed: 30.00 },
  bob: { userId: 'bob', netAmount: -30.00, totalPaid: 0, totalOwed: 30.00 },
  charlie: { userId: 'charlie', netAmount: -30.00, totalPaid: 0, totalOwed: 30.00 },
};

// ========================================
// EXAMPLE 2: Multiple expenses, multiple payers
// ========================================

export const EXAMPLE_2_EXPENSES: ExpenseForBalance[] = [
  {
    expenseId: 'exp1',
    amount: 100.00,
    paidBy: 'alice',
    participants: ['alice', 'bob'],
    splitDetails: {
      alice: { amount: 50.00 },
      bob: { amount: 50.00 },
    },
  },
  {
    expenseId: 'exp2',
    amount: 60.00,
    paidBy: 'bob',
    participants: ['alice', 'bob', 'charlie'],
    splitDetails: {
      alice: { amount: 20.00 },
      bob: { amount: 20.00 },
      charlie: { amount: 20.00 },
    },
  },
  {
    expenseId: 'exp3',
    amount: 30.00,
    paidBy: 'charlie',
    participants: ['bob', 'charlie'],
    splitDetails: {
      bob: { amount: 15.00 },
      charlie: { amount: 15.00 },
    },
  },
];

export const EXAMPLE_2_EXPECTED = {
  alice: { userId: 'alice', netAmount: 30.00, totalPaid: 100.00, totalOwed: 70.00 },
  bob: { userId: 'bob', netAmount: -25.00, totalPaid: 60.00, totalOwed: 85.00 },
  charlie: { userId: 'charlie', netAmount: -5.00, totalPaid: 30.00, totalOwed: 35.00 },
};

// ========================================
// EXAMPLE 3: Unequal split (exact amounts)
// ========================================

export const EXAMPLE_3_EXPENSES: ExpenseForBalance[] = [
  {
    expenseId: 'exp1',
    amount: 100.00,
    paidBy: 'alice',
    participants: ['alice', 'bob', 'charlie'],
    splitDetails: {
      alice: { amount: 10.00 },
      bob: { amount: 40.00 },
      charlie: { amount: 50.00 },
    },
  },
];

export const EXAMPLE_3_EXPECTED = {
  alice: { userId: 'alice', netAmount: 90.00, totalPaid: 100.00, totalOwed: 10.00 },
  bob: { userId: 'bob', netAmount: -40.00, totalPaid: 0, totalOwed: 40.00 },
  charlie: { userId: 'charlie', netAmount: -50.00, totalPaid: 0, totalOwed: 50.00 },
};

// ========================================
// EXAMPLE 4: Floating-point edge case
// ========================================

export const EXAMPLE_4_EXPENSES: ExpenseForBalance[] = [
  {
    expenseId: 'exp1',
    amount: 10.00,
    paidBy: 'alice',
    participants: ['alice', 'bob', 'charlie'],
    splitDetails: {
      alice: { amount: 3.33 },
      bob: { amount: 3.33 },
      charlie: { amount: 3.34 }, // Rounded to make total = 10.00
    },
  },
];

export const EXAMPLE_4_EXPECTED = {
  alice: { userId: 'alice', netAmount: 6.67, totalPaid: 10.00, totalOwed: 3.33 },
  bob: { userId: 'bob', netAmount: -3.33, totalPaid: 0, totalOwed: 3.33 },
  charlie: { userId: 'charlie', netAmount: -3.34, totalPaid: 0, totalOwed: 3.34 },
};

// ========================================
// EXAMPLE 5: Empty expenses
// ========================================

export const EXAMPLE_5_EXPENSES: ExpenseForBalance[] = [];

export const EXAMPLE_5_EXPECTED = {};

// ========================================
// EXAMPLE 6: Complex scenario (party trip)
// ========================================

export const EXAMPLE_6_EXPENSES: ExpenseForBalance[] = [
  // Hotel - Alice paid
  {
    expenseId: 'exp1',
    amount: 300.00,
    paidBy: 'alice',
    participants: ['alice', 'bob', 'charlie', 'diana'],
    splitDetails: {
      alice: { amount: 75.00 },
      bob: { amount: 75.00 },
      charlie: { amount: 75.00 },
      diana: { amount: 75.00 },
    },
  },
  // Dinner - Bob paid
  {
    expenseId: 'exp2',
    amount: 120.00,
    paidBy: 'bob',
    participants: ['alice', 'bob', 'charlie', 'diana'],
    splitDetails: {
      alice: { amount: 30.00 },
      bob: { amount: 30.00 },
      charlie: { amount: 30.00 },
      diana: { amount: 30.00 },
    },
  },
  // Gas - Charlie paid
  {
    expenseId: 'exp3',
    amount: 80.00,
    paidBy: 'charlie',
    participants: ['alice', 'bob', 'charlie', 'diana'],
    splitDetails: {
      alice: { amount: 20.00 },
      bob: { amount: 20.00 },
      charlie: { amount: 20.00 },
      diana: { amount: 20.00 },
    },
  },
  // Breakfast - Diana paid (only 3 people ate)
  {
    expenseId: 'exp4',
    amount: 45.00,
    paidBy: 'diana',
    participants: ['alice', 'charlie', 'diana'],
    splitDetails: {
      alice: { amount: 15.00 },
      charlie: { amount: 15.00 },
      diana: { amount: 15.00 },
    },
  },
];

export const EXAMPLE_6_EXPECTED = {
  alice: { userId: 'alice', netAmount: 160.00, totalPaid: 300.00, totalOwed: 140.00 },
  bob: { userId: 'bob', netAmount: -5.00, totalPaid: 120.00, totalOwed: 125.00 },
  charlie: { userId: 'charlie', netAmount: -60.00, totalPaid: 80.00, totalOwed: 140.00 },
  diana: { userId: 'diana', netAmount: -95.00, totalPaid: 45.00, totalOwed: 140.00 },
};
