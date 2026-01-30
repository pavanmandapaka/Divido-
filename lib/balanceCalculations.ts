/**
 * Balance Calculation Functions
 * Phase 5 Day 2: Pure calculation logic
 * 
 * NO Firebase, NO React, NO UI
 */

/**
 * Expense structure (from existing system)
 */
export interface ExpenseForBalance {
  expenseId: string;
  amount: number;
  paidBy: string;
  participants: string[];
  splitDetails: {
    [userId: string]: {
      amount: number;
      percentage?: number;
      shares?: number;
      isSettled?: boolean;
    };
  };
}

/**
 * Balance result structure
 */
export interface UserBalance {
  userId: string;
  netAmount: number;
  totalPaid: number;
  totalOwed: number;
}

/**
 * Calculate balances for a group from all expenses
 * 
 * Algorithm:
 * 1. Initialize balance map for all users
 * 2. For each expense:
 *    - Credit payer with full amount
 *    - Debit each participant with their share
 * 3. Round to 2 decimal places
 * 
 * @param expenses - Array of expenses
 * @returns Map of userId to balance details
 */
export function calculateBalances(expenses: ExpenseForBalance[]): Map<string, UserBalance> {
  // Edge case: no expenses
  if (!expenses || expenses.length === 0) {
    return new Map();
  }

  // Track balances: userId -> {netAmount, totalPaid, totalOwed}
  const balanceMap = new Map<string, { paid: number; owed: number }>();

  // Initialize helper to get or create user balance
  const getBalance = (userId: string) => {
    if (!balanceMap.has(userId)) {
      balanceMap.set(userId, { paid: 0, owed: 0 });
    }
    return balanceMap.get(userId)!;
  };

  // Process each expense
  for (const expense of expenses) {
    // Validate expense
    if (!expense.amount || expense.amount <= 0) {
      continue; // Skip invalid expenses
    }

    if (!expense.paidBy || !expense.participants || expense.participants.length === 0) {
      continue; // Skip malformed expenses
    }

    // Credit the payer
    const payerBalance = getBalance(expense.paidBy);
    payerBalance.paid += expense.amount;

    // Debit each participant
    for (const participantId of expense.participants) {
      const participantBalance = getBalance(participantId);
      const splitDetail = expense.splitDetails[participantId];

      if (!splitDetail || splitDetail.amount === undefined) {
        // Fallback: equal split if no split details
        const equalShare = expense.amount / expense.participants.length;
        participantBalance.owed += equalShare;
      } else {
        participantBalance.owed += splitDetail.amount;
      }
    }
  }

  // Convert to final balance structure with netAmount
  const result = new Map<string, UserBalance>();

  for (const [userId, balance] of balanceMap.entries()) {
    const netAmount = balance.paid - balance.owed;

    result.set(userId, {
      userId,
      netAmount: roundToTwo(netAmount),
      totalPaid: roundToTwo(balance.paid),
      totalOwed: roundToTwo(balance.owed),
    });
  }

  return result;
}

/**
 * Get balances as sorted array
 * Sorted by netAmount descending (who is owed most → who owes most)
 * 
 * @param expenses - Array of expenses
 * @returns Sorted array of user balances
 */
export function calculateBalancesArray(expenses: ExpenseForBalance[]): UserBalance[] {
  const balanceMap = calculateBalances(expenses);
  const balances = Array.from(balanceMap.values());

  // Sort: positive (owed TO user) first, negative (user owes) last
  balances.sort((a, b) => b.netAmount - a.netAmount);

  return balances;
}

/**
 * Validate that all balances sum to zero
 * (fundamental invariant: total paid = total owed)
 * 
 * @param balances - Balance map
 * @returns true if sum is zero (within rounding tolerance)
 */
export function validateBalanceSum(balances: Map<string, UserBalance>): boolean {
  let sum = 0;

  for (const balance of balances.values()) {
    sum += balance.netAmount;
  }

  // Allow 1 cent total rounding error
  return Math.abs(roundToTwo(sum)) < 0.01;
}

/**
 * Get balance for specific user in group
 * 
 * @param expenses - Array of expenses
 * @param userId - User ID to check
 * @returns User balance or null if user has no transactions
 */
export function getUserBalance(expenses: ExpenseForBalance[], userId: string): UserBalance | null {
  const balances = calculateBalances(expenses);
  return balances.get(userId) || null;
}

/**
 * Round number to 2 decimal places
 * Handles floating-point precision issues
 * 
 * @param value - Number to round
 * @returns Rounded number
 */
function roundToTwo(value: number): number {
  return Math.round(value * 100) / 100;
}

/**
 * Get users who are owed money (positive balance)
 * 
 * @param expenses - Array of expenses
 * @returns Array of users with positive balances
 */
export function getCreditors(expenses: ExpenseForBalance[]): UserBalance[] {
  const balances = calculateBalancesArray(expenses);
  return balances.filter(b => b.netAmount > 0);
}

/**
 * Get users who owe money (negative balance)
 * 
 * @param expenses - Array of expenses
 * @returns Array of users with negative balances
 */
export function getDebtors(expenses: ExpenseForBalance[]): UserBalance[] {
  const balances = calculateBalancesArray(expenses);
  return balances.filter(b => b.netAmount < 0);
}
