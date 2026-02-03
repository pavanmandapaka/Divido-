/**
 * Settlement Optimization Unit Tests
 * Phase 5 Day 3: Algorithm verification
 */

import {
  minimizeSettlements,
  validateSettlements,
  getTotalSettlementAmount,
  getUserSettlements,
  getTheoreticalMinimum,
  isOptimalSettlement,
} from './settlementOptimization';

import {
  EXAMPLE_1_BALANCES,
  EXAMPLE_2_BALANCES,
  EXAMPLE_3_BALANCES,
  EXAMPLE_4_BALANCES,
  EXAMPLE_5_BALANCES,
  EXAMPLE_6_BALANCES,
  EXAMPLE_7_BALANCES,
  EXAMPLE_8_BALANCES,
} from './settlementOptimization.examples';

// ========================================
// TEST SUITE 1: Basic 3-person scenario
// ========================================

function testExample1() {
  console.log('\n=== TEST 1: Simple 3-person ===');
  const settlements = minimizeSettlements(EXAMPLE_1_BALANCES);

  console.assert(settlements.length === 2, 'Should have 2 transactions');
  console.assert(validateSettlements(EXAMPLE_1_BALANCES, settlements), 'Should settle all balances');
  console.assert(isOptimalSettlement(EXAMPLE_1_BALANCES, settlements), 'Should be optimal');

  // Verify specific settlements
  const bobSettlement = settlements.find(s => s.fromUser === 'bob');
  const charlieSettlement = settlements.find(s => s.fromUser === 'charlie');

  console.assert(bobSettlement?.toUser === 'alice' && bobSettlement?.amount === 30, 'Bob → Alice $30');
  console.assert(charlieSettlement?.toUser === 'alice' && charlieSettlement?.amount === 30, 'Charlie → Alice $30');

  console.log('✓ Test 1 passed');
}

// ========================================
// TEST SUITE 2: Complex 4-person trip
// ========================================

function testExample2() {
  console.log('\n=== TEST 2: Complex 4-person trip ===');
  const settlements = minimizeSettlements(EXAMPLE_2_BALANCES);

  console.assert(settlements.length === 3, 'Should have 3 transactions');
  console.assert(validateSettlements(EXAMPLE_2_BALANCES, settlements), 'Should settle all balances');

  const totalAmount = getTotalSettlementAmount(settlements);
  console.assert(totalAmount === 160, 'Total transferred should be $160');

  console.log('✓ Test 2 passed');
}

// ========================================
// TEST SUITE 3: Multiple creditors/debtors
// ========================================

function testExample3() {
  console.log('\n=== TEST 3: Multiple creditors/debtors ===');
  const settlements = minimizeSettlements(EXAMPLE_3_BALANCES);

  console.assert(settlements.length === 3, 'Should have 3 transactions');
  console.assert(validateSettlements(EXAMPLE_3_BALANCES, settlements), 'Should settle all balances');
  console.assert(isOptimalSettlement(EXAMPLE_3_BALANCES, settlements), 'Should be optimal');

  console.log('✓ Test 3 passed');
}

// ========================================
// TEST SUITE 4: Unbalanced scenario
// ========================================

function testExample4() {
  console.log('\n=== TEST 4: Unbalanced scenario ===');
  const settlements = minimizeSettlements(EXAMPLE_4_BALANCES);

  console.assert(settlements.length === 4, 'Should have 4 transactions');
  console.assert(validateSettlements(EXAMPLE_4_BALANCES, settlements), 'Should settle all balances');

  // All debtors should pay Alice
  const allPayAlice = settlements.every(s => s.toUser === 'alice');
  console.assert(allPayAlice, 'All payments should go to Alice');

  console.log('✓ Test 4 passed');
}

// ========================================
// TEST SUITE 5: Two creditors, two debtors
// ========================================

function testExample5() {
  console.log('\n=== TEST 5: Two creditors, two debtors ===');
  const settlements = minimizeSettlements(EXAMPLE_5_BALANCES);

  console.assert(settlements.length === 3, 'Should have 3 transactions');
  console.assert(validateSettlements(EXAMPLE_5_BALANCES, settlements), 'Should settle all balances');

  console.log('✓ Test 5 passed');
}

// ========================================
// TEST SUITE 6: Edge case - all settled
// ========================================

function testExample6() {
  console.log('\n=== TEST 6: All already settled ===');
  const settlements = minimizeSettlements(EXAMPLE_6_BALANCES);

  console.assert(settlements.length === 0, 'Should have 0 transactions');
  console.assert(validateSettlements(EXAMPLE_6_BALANCES, settlements), 'Should validate');

  console.log('✓ Test 6 passed');
}

// ========================================
// TEST SUITE 7: Floating-point handling
// ========================================

function testExample7() {
  console.log('\n=== TEST 7: Floating-point rounding ===');
  const settlements = minimizeSettlements(EXAMPLE_7_BALANCES);

  console.assert(settlements.length === 2, 'Should have 2 transactions');
  console.assert(validateSettlements(EXAMPLE_7_BALANCES, settlements), 'Should settle despite rounding');

  const total = getTotalSettlementAmount(settlements);
  console.assert(Math.abs(total - 33.33) < 0.01, 'Total should equal original creditor amount');

  console.log('✓ Test 7 passed');
}

// ========================================
// TEST SUITE 8: Large group
// ========================================

function testExample8() {
  console.log('\n=== TEST 8: Large group (6 people) ===');
  const settlements = minimizeSettlements(EXAMPLE_8_BALANCES);

  console.assert(settlements.length === 4, 'Should have 4 transactions');
  console.assert(validateSettlements(EXAMPLE_8_BALANCES, settlements), 'Should settle all balances');

  const theoretical = getTheoreticalMinimum(EXAMPLE_8_BALANCES);
  console.assert(settlements.length === theoretical, 'Should match theoretical minimum');

  console.log('✓ Test 8 passed');
}

// ========================================
// TEST SUITE 9: User-specific settlements
// ========================================

function testUserSettlements() {
  console.log('\n=== TEST 9: User-specific settlements ===');
  const settlements = minimizeSettlements(EXAMPLE_3_BALANCES);

  const aliceSettlements = getUserSettlements(settlements, 'alice');
  console.assert(aliceSettlements.toReceive.length === 2, 'Alice receives from 2 people');
  console.assert(aliceSettlements.toPay.length === 0, 'Alice pays nobody');
  console.assert(aliceSettlements.netToReceive === 50, 'Alice receives $50 total');

  const charlieSettlements = getUserSettlements(settlements, 'charlie');
  console.assert(charlieSettlements.toPay.length === 1, 'Charlie pays 1 person');
  console.assert(charlieSettlements.toReceive.length === 0, 'Charlie receives nothing');
  console.assert(charlieSettlements.netToPay === 40, 'Charlie pays $40 total');

  console.log('✓ Test 9 passed');
}

// ========================================
// TEST SUITE 10: Edge cases
// ========================================

function testEdgeCases() {
  console.log('\n=== TEST 10: Edge cases ===');

  // Empty array
  const result1 = minimizeSettlements([]);
  console.assert(result1.length === 0, 'Empty balances → no settlements');

  // Single user
  const result2 = minimizeSettlements([{ userId: 'alice', netAmount: 0 }]);
  console.assert(result2.length === 0, 'Single user → no settlements');

  // All zeros
  const result3 = minimizeSettlements([
    { userId: 'alice', netAmount: 0 },
    { userId: 'bob', netAmount: 0 },
  ]);
  console.assert(result3.length === 0, 'All zeros → no settlements');

  // Two users (simple case)
  const result4 = minimizeSettlements([
    { userId: 'alice', netAmount: 50 },
    { userId: 'bob', netAmount: -50 },
  ]);
  console.assert(result4.length === 1, 'Two users → 1 settlement');
  console.assert(result4[0].fromUser === 'bob', 'Bob pays');
  console.assert(result4[0].toUser === 'alice', 'Alice receives');
  console.assert(result4[0].amount === 50, 'Amount is $50');

  console.log('✓ Test 10 passed');
}

// ========================================
// TEST SUITE 11: Validation function
// ========================================

function testValidation() {
  console.log('\n=== TEST 11: Settlement validation ===');

  const balances = EXAMPLE_3_BALANCES;
  const settlements = minimizeSettlements(balances);

  // Should validate correct settlements
  console.assert(validateSettlements(balances, settlements), 'Correct settlements validate');

  // Should reject wrong settlements
  const wrongSettlements = [
    { fromUser: 'charlie', toUser: 'alice', amount: 20 }, // Wrong amount
  ];
  console.assert(!validateSettlements(balances, wrongSettlements), 'Wrong settlements rejected');

  console.log('✓ Test 11 passed');
}

// ========================================
// TEST SUITE 12: Theoretical minimum
// ========================================

function testTheoreticalMinimum() {
  console.log('\n=== TEST 12: Theoretical minimum ===');

  // 3 non-zero balances → minimum = 2
  const min1 = getTheoreticalMinimum(EXAMPLE_1_BALANCES);
  console.assert(min1 === 2, '3 people → min 2 transactions');

  // 4 non-zero balances → minimum = 3
  const min2 = getTheoreticalMinimum(EXAMPLE_2_BALANCES);
  console.assert(min2 === 3, '4 people → min 3 transactions');

  // All zeros → minimum = 0
  const min3 = getTheoreticalMinimum(EXAMPLE_6_BALANCES);
  console.assert(min3 === 0, 'All settled → min 0 transactions');

  console.log('✓ Test 12 passed');
}

// ========================================
// RUN ALL TESTS
// ========================================

export function runAllTests() {
  console.log('╔════════════════════════════════════════╗');
  console.log('║  SETTLEMENT OPTIMIZATION TESTS        ║');
  console.log('╚════════════════════════════════════════╝');

  try {
    testExample1();
    testExample2();
    testExample3();
    testExample4();
    testExample5();
    testExample6();
    testExample7();
    testExample8();
    testUserSettlements();
    testEdgeCases();
    testValidation();
    testTheoreticalMinimum();

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
