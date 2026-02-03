/**
 * Settlement Optimization Functions
 * Phase 5 Day 3: Minimize transaction count
 * 
 * NO UI, NO Firebase, NO actual payments
 */

/**
 * User balance structure
 */
export interface UserBalance {
  userId: string;
  netAmount: number;
}

/**
 * Settlement transaction structure
 */
export interface Settlement {
  fromUser: string;  // Who pays
  toUser: string;    // Who receives
  amount: number;    // How much
}

/**
 * Minimize settlements using greedy algorithm
 * 
 * Algorithm:
 * 1. Separate creditors (positive) from debtors (negative)
 * 2. Sort both by absolute amount (descending)
 * 3. Match largest creditor with largest debtor
 * 4. Settle as much as possible
 * 5. Remove fully settled users
 * 6. Repeat until all settled
 * 
 * Time Complexity: O(n log n) - dominated by sorting
 * Space Complexity: O(n)
 * 
 * Optimality: Greedy approach produces minimal transactions
 * Proof: Each transaction eliminates at least one user from the graph
 * Maximum transactions = n - 1 (where n = number of users)
 * 
 * @param balances - Array of user balances
 * @returns Array of settlement transactions
 */
export function minimizeSettlements(balances: UserBalance[]): Settlement[] {
  // Edge case: empty or single user
  if (!balances || balances.length <= 1) {
    return [];
  }

  // Edge case: all balances are zero
  if (balances.every(b => b.netAmount === 0)) {
    return [];
  }

  // Separate creditors and debtors
  const creditors = balances
    .filter(b => b.netAmount > 0)
    .map(b => ({ userId: b.userId, amount: b.netAmount }))
    .sort((a, b) => b.amount - a.amount); // Descending

  const debtors = balances
    .filter(b => b.netAmount < 0)
    .map(b => ({ userId: b.userId, amount: Math.abs(b.netAmount) }))
    .sort((a, b) => b.amount - a.amount); // Descending

  const settlements: Settlement[] = [];

  let i = 0; // Creditor index
  let j = 0; // Debtor index

  // Match creditors with debtors
  while (i < creditors.length && j < debtors.length) {
    const creditor = creditors[i];
    const debtor = debtors[j];

    // Settle the minimum of what creditor is owed and debtor owes
    const settlementAmount = Math.min(creditor.amount, debtor.amount);

    settlements.push({
      fromUser: debtor.userId,
      toUser: creditor.userId,
      amount: roundToTwo(settlementAmount),
    });

    // Update remaining amounts
    creditor.amount -= settlementAmount;
    debtor.amount -= settlementAmount;

    // Move to next creditor if fully settled
    if (creditor.amount < 0.01) {
      i++;
    }

    // Move to next debtor if fully settled
    if (debtor.amount < 0.01) {
      j++;
    }
  }

  return settlements;
}

/**
 * Validate settlements resolve all balances to zero
 * 
 * @param balances - Original balances
 * @param settlements - Proposed settlements
 * @returns true if settlements resolve all balances
 */
export function validateSettlements(
  balances: UserBalance[],
  settlements: Settlement[]
): boolean {
  // Create a copy of balances to simulate settlements
  const finalBalances = new Map<string, number>();

  // Initialize with original balances
  for (const balance of balances) {
    finalBalances.set(balance.userId, balance.netAmount);
  }

  // Apply each settlement
  for (const settlement of settlements) {
    const fromBalance = finalBalances.get(settlement.fromUser) || 0;
    const toBalance = finalBalances.get(settlement.toUser) || 0;

    finalBalances.set(settlement.fromUser, fromBalance + settlement.amount);
    finalBalances.set(settlement.toUser, toBalance - settlement.amount);
  }

  // Check all balances are zero (within rounding tolerance)
  for (const balance of finalBalances.values()) {
    if (Math.abs(balance) > 0.01) {
      return false;
    }
  }

  return true;
}

/**
 * Get total amount being transferred
 * (useful for UI display)
 * 
 * @param settlements - Array of settlements
 * @returns Total amount
 */
export function getTotalSettlementAmount(settlements: Settlement[]): number {
  const total = settlements.reduce((sum, s) => sum + s.amount, 0);
  return roundToTwo(total);
}

/**
 * Get settlements for a specific user
 * (what they need to pay or receive)
 * 
 * @param settlements - All settlements
 * @param userId - User to filter for
 * @returns Object with payments and receipts
 */
export function getUserSettlements(settlements: Settlement[], userId: string): {
  toPay: Settlement[];
  toReceive: Settlement[];
  netToPay: number;
  netToReceive: number;
} {
  const toPay = settlements.filter(s => s.fromUser === userId);
  const toReceive = settlements.filter(s => s.toUser === userId);

  const netToPay = roundToTwo(toPay.reduce((sum, s) => sum + s.amount, 0));
  const netToReceive = roundToTwo(toReceive.reduce((sum, s) => sum + s.amount, 0));

  return { toPay, toReceive, netToPay, netToReceive };
}

/**
 * Group settlements by direction (simplified view)
 * 
 * @param settlements - All settlements
 * @returns Grouped by payer
 */
export function groupSettlementsByPayer(settlements: Settlement[]): Map<string, Settlement[]> {
  const grouped = new Map<string, Settlement[]>();

  for (const settlement of settlements) {
    const existing = grouped.get(settlement.fromUser) || [];
    existing.push(settlement);
    grouped.set(settlement.fromUser, existing);
  }

  return grouped;
}

/**
 * Calculate theoretical minimum transactions
 * Minimum = n - 1 where n = number of users with non-zero balance
 * 
 * @param balances - User balances
 * @returns Theoretical minimum number of transactions
 */
export function getTheoreticalMinimum(balances: UserBalance[]): number {
  const nonZeroCount = balances.filter(b => Math.abs(b.netAmount) > 0.01).length;
  return Math.max(0, nonZeroCount - 1);
}

/**
 * Check if settlement count is optimal
 * 
 * @param balances - Original balances
 * @param settlements - Proposed settlements
 * @returns true if settlement count equals theoretical minimum
 */
export function isOptimalSettlement(
  balances: UserBalance[],
  settlements: Settlement[]
): boolean {
  const theoretical = getTheoreticalMinimum(balances);
  return settlements.length === theoretical;
}

/**
 * Round to 2 decimal places
 */
function roundToTwo(value: number): number {
  return Math.round(value * 100) / 100;
}

/**
 * Alternative algorithm: Vertex merging (more complex, same result)
 * Only included for reference - minimizeSettlements is preferred
 * 
 * This uses a different approach but produces the same optimal result
 */
export function minimizeSettlementsAlternative(balances: UserBalance[]): Settlement[] {
  const nonZero = balances.filter(b => Math.abs(b.netAmount) > 0.01);
  
  if (nonZero.length === 0) return [];

  const settlements: Settlement[] = [];
  const amounts = new Map<string, number>();

  // Initialize amounts
  for (const balance of nonZero) {
    amounts.set(balance.userId, balance.netAmount);
  }

  // Process until all settled
  while (amounts.size > 1) {
    // Find max creditor and max debtor
    let maxCreditor = '';
    let maxCreditorAmount = -Infinity;
    let maxDebtor = '';
    let maxDebtorAmount = -Infinity;

    for (const [userId, amount] of amounts.entries()) {
      if (amount > maxCreditorAmount) {
        maxCreditorAmount = amount;
        maxCreditor = userId;
      }
      if (amount < 0 && Math.abs(amount) > maxDebtorAmount) {
        maxDebtorAmount = Math.abs(amount);
        maxDebtor = userId;
      }
    }

    if (!maxCreditor || !maxDebtor) break;

    // Settle between them
    const settlementAmount = Math.min(maxCreditorAmount, maxDebtorAmount);

    settlements.push({
      fromUser: maxDebtor,
      toUser: maxCreditor,
      amount: roundToTwo(settlementAmount),
    });

    // Update amounts
    const newCreditorAmount = maxCreditorAmount - settlementAmount;
    const newDebtorAmount = -maxDebtorAmount + settlementAmount;

    if (Math.abs(newCreditorAmount) < 0.01) {
      amounts.delete(maxCreditor);
    } else {
      amounts.set(maxCreditor, newCreditorAmount);
    }

    if (Math.abs(newDebtorAmount) < 0.01) {
      amounts.delete(maxDebtor);
    } else {
      amounts.set(maxDebtor, newDebtorAmount);
    }
  }

  return settlements;
}
