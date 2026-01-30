/**
 * Quick manual verification
 * Run this to see balance calculations in action
 */

import { calculateBalances, calculateBalancesArray } from './balanceCalculations';
import { EXAMPLE_6_EXPENSES } from './balanceCalculations.examples';

console.log('Input: 4 people on a trip, multiple expenses\n');

const balances = calculateBalancesArray(EXAMPLE_6_EXPENSES);

console.log('Results (sorted by who is owed most):');
console.log('=====================================\n');

for (const balance of balances) {
  const status = balance.netAmount > 0 ? 'is owed' : 'owes';
  const amount = Math.abs(balance.netAmount).toFixed(2);
  
  console.log(`${balance.userId.padEnd(10)} ${status.padEnd(7)} $${amount}`);
  console.log(`  Paid: $${balance.totalPaid.toFixed(2)}, Owes: $${balance.totalOwed.toFixed(2)}\n`);
}

// Verify sum = 0
const sum = balances.reduce((acc, b) => acc + b.netAmount, 0);
console.log(`\nBalance check: Sum = $${sum.toFixed(2)} (should be 0.00)`);
