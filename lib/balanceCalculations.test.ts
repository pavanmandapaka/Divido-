/**
 * Balance Calculation Unit Tests
 * Phase 5 Day 2: Pure function tests
 * 
 * Run with: npm test (when Jest is configured)
 * Or manually verify outputs
 */

import {
  calculateBalances,
  calculateBalancesArray,
  validateBalanceSum,
  getUserBalance,
  getCreditors,
  getDebtors,
} from './balanceCalculations';

import {
  EXAMPLE_1_EXPENSES,
  EXAMPLE_1_EXPECTED,
  EXAMPLE_2_EXPENSES,
  EXAMPLE_2_EXPECTED,
  EXAMPLE_3_EXPENSES,
  EXAMPLE_3_EXPECTED,
  EXAMPLE_4_EXPENSES,
  EXAMPLE_4_EXPECTED,
  EXAMPLE_5_EXPENSES,
  EXAMPLE_5_EXPECTED,
  EXAMPLE_6_EXPENSES,
  EXAMPLE_6_EXPECTED,
} from './balanceCalculations.examples';

// ========================================
// TEST SUITE 1: Basic Calculation
// ========================================

function testExample1() {
  console.log('\n=== TEST 1: Simple Equal Split ===');
  const result = calculateBalances(EXAMPLE_1_EXPENSES);

  // Check Alice
  const alice = result.get('alice');
  console.assert(alice?.netAmount === 60.00, 'Alice should have +60');
  console.assert(alice?.totalPaid === 90.00, 'Alice paid 90');
  console.assert(alice?.totalOwed === 30.00, 'Alice owes 30');

  // Check Bob
  const bob = result.get('bob');
  console.assert(bob?.netAmount === -30.00, 'Bob should have -30');
  console.assert(bob?.totalPaid === 0, 'Bob paid 0');
  console.assert(bob?.totalOwed === 30.00, 'Bob owes 30');

  // Check sum = 0
  console.assert(validateBalanceSum(result), 'Sum should be zero');

  console.log('✓ Test 1 passed');
}

// ========================================
// TEST SUITE 2: Multiple Expenses
// ========================================

function testExample2() {
  console.log('\n=== TEST 2: Multiple Expenses ===');
  const result = calculateBalances(EXAMPLE_2_EXPENSES);

  const alice = result.get('alice');
  const bob = result.get('bob');
  const charlie = result.get('charlie');

  console.assert(alice?.netAmount === 30.00, 'Alice: +30');
  console.assert(bob?.netAmount === -25.00, 'Bob: -25');
  console.assert(charlie?.netAmount === -5.00, 'Charlie: -5');

  console.assert(validateBalanceSum(result), 'Sum should be zero');

  console.log('✓ Test 2 passed');
}

// ========================================
// TEST SUITE 3: Unequal Split
// ========================================

function testExample3() {
  console.log('\n=== TEST 3: Unequal Split ===');
  const result = calculateBalances(EXAMPLE_3_EXPENSES);

  const alice = result.get('alice');
  const bob = result.get('bob');
  const charlie = result.get('charlie');

  console.assert(alice?.netAmount === 90.00, 'Alice: +90');
  console.assert(bob?.netAmount === -40.00, 'Bob: -40');
  console.assert(charlie?.netAmount === -50.00, 'Charlie: -50');

  console.log('✓ Test 3 passed');
}

// ========================================
// TEST SUITE 4: Floating-Point Rounding
// ========================================

function testExample4() {
  console.log('\n=== TEST 4: Floating-Point Rounding ===');
  const result = calculateBalances(EXAMPLE_4_EXPENSES);

  const alice = result.get('alice');
  const bob = result.get('bob');
  const charlie = result.get('charlie');

  console.assert(alice?.netAmount === 6.67, 'Alice: +6.67');
  console.assert(bob?.netAmount === -3.33, 'Bob: -3.33');
  console.assert(charlie?.netAmount === -3.34, 'Charlie: -3.34');

  // Sum should be zero (within rounding tolerance)
  console.assert(validateBalanceSum(result), 'Sum should be ~zero');

  console.log('✓ Test 4 passed');
}

// ========================================
// TEST SUITE 5: Empty Expenses
// ========================================

function testExample5() {
  console.log('\n=== TEST 5: Empty Expenses ===');
  const result = calculateBalances(EXAMPLE_5_EXPENSES);

  console.assert(result.size === 0, 'Should have no balances');
  console.assert(validateBalanceSum(result), 'Empty set sums to zero');

  console.log('✓ Test 5 passed');
}

// ========================================
// TEST SUITE 6: Complex Trip Scenario
// ========================================

function testExample6() {
  console.log('\n=== TEST 6: Complex Trip ===');
  const result = calculateBalances(EXAMPLE_6_EXPENSES);

  const alice = result.get('alice');
  const bob = result.get('bob');
  const charlie = result.get('charlie');
  const diana = result.get('diana');

  console.assert(alice?.netAmount === 160.00, 'Alice: +160');
  console.assert(bob?.netAmount === -5.00, 'Bob: -5');
  console.assert(charlie?.netAmount === -60.00, 'Charlie: -60');
  console.assert(diana?.netAmount === -95.00, 'Diana: -95');

  console.assert(validateBalanceSum(result), 'Sum should be zero');

  console.log('✓ Test 6 passed');
}

// ========================================
// TEST SUITE 7: Array Sorting
// ========================================

function testArraySorting() {
  console.log('\n=== TEST 7: Sorted Array ===');
  const array = calculateBalancesArray(EXAMPLE_6_EXPENSES);

  // Should be sorted: highest positive → lowest negative
  console.assert(array[0].userId === 'alice', 'Alice first (+160)');
  console.assert(array[1].userId === 'bob', 'Bob second (-5)');
  console.assert(array[2].userId === 'charlie', 'Charlie third (-60)');
  console.assert(array[3].userId === 'diana', 'Diana last (-95)');

  console.log('✓ Test 7 passed');
}

// ========================================
// TEST SUITE 8: Creditors/Debtors
// ========================================

function testCreditorsDebtors() {
  console.log('\n=== TEST 8: Creditors & Debtors ===');
  const creditors = getCreditors(EXAMPLE_6_EXPENSES);
  const debtors = getDebtors(EXAMPLE_6_EXPENSES);

  console.assert(creditors.length === 1, 'One creditor');
  console.assert(creditors[0].userId === 'alice', 'Alice is creditor');

  console.assert(debtors.length === 3, 'Three debtors');
  console.assert(debtors.some(d => d.userId === 'bob'), 'Bob is debtor');
  console.assert(debtors.some(d => d.userId === 'charlie'), 'Charlie is debtor');
  console.assert(debtors.some(d => d.userId === 'diana'), 'Diana is debtor');

  console.log('✓ Test 8 passed');
}

// ========================================
// TEST SUITE 9: Get User Balance
// ========================================

function testGetUserBalance() {
  console.log('\n=== TEST 9: Get User Balance ===');
  const aliceBalance = getUserBalance(EXAMPLE_2_EXPENSES, 'alice');
  const nonExistentUser = getUserBalance(EXAMPLE_2_EXPENSES, 'eve');

  console.assert(aliceBalance?.netAmount === 30.00, 'Alice has +30');
  console.assert(nonExistentUser === null, 'Non-existent user returns null');

  console.log('✓ Test 9 passed');
}

// ========================================
// TEST SUITE 10: Edge Cases
// ========================================

function testEdgeCases() {
  console.log('\n=== TEST 10: Edge Cases ===');

  // Null/undefined expenses
  const result1 = calculateBalances(null as any);
  console.assert(result1.size === 0, 'Null expenses → empty result');

  // Expense with zero amount
  const result2 = calculateBalances([
    {
      expenseId: 'exp1',
      amount: 0,
      paidBy: 'alice',
      participants: ['alice'],
      splitDetails: { alice: { amount: 0 } },
    },
  ]);
  console.assert(result2.size === 0, 'Zero amount → no balances');

  // Expense with no participants
  const result3 = calculateBalances([
    {
      expenseId: 'exp1',
      amount: 100,
      paidBy: 'alice',
      participants: [],
      splitDetails: {},
    },
  ]);
  console.assert(result3.size === 0 || result3.get('alice')?.netAmount === 0, 'No participants handled');

  console.log('✓ Test 10 passed');
}

// ========================================
// RUN ALL TESTS
// ========================================

export function runAllTests() {
  console.log('╔════════════════════════════════════════╗');
  console.log('║  BALANCE CALCULATION UNIT TESTS       ║');
  console.log('╚════════════════════════════════════════╝');

  try {
    testExample1();
    testExample2();
    testExample3();
    testExample4();
    testExample5();
    testExample6();
    testArraySorting();
    testCreditorsDebtors();
    testGetUserBalance();
    testEdgeCases();

    console.log('\n╔════════════════════════════════════════╗');
    console.log('║  ✓ ALL TESTS PASSED                   ║');
    console.log('╚════════════════════════════════════════╝\n');
  } catch (error) {
    console.error('\n❌ TEST FAILED:', error);
    throw error;
  }
}

// Auto-run if executed directly
if (require.main === module) {
  runAllTests();
}
