/**
 * Split Calculation Functions
 * Pure JavaScript functions for calculating expense splits
 * NO React, NO Firebase, NO UI
 */

export interface SplitResult {
  [userId: string]: {
    amount: number;
    percentage?: number;
    shares?: number;
  };
}

export interface SplitError {
  valid: false;
  error: string;
}

export interface SplitSuccess {
  valid: true;
  splitDetails: SplitResult;
}

type SplitOutcome = SplitError | SplitSuccess;

/**
 * Round to 2 decimal places
 */
function roundToTwo(num: number): number {
  return Math.round(num * 100) / 100;
}

/**
 * Calculate equal split among participants
 * 
 * @param amount - Total expense amount
 * @param participants - Array of user IDs
 * @returns Split result or error
 * 
 * @example
 * calculateEqualSplit(100, ['a', 'b', 'c', 'd'])
 * // Returns: { a: 25, b: 25, c: 25, d: 25 }
 */
export function calculateEqualSplit(
  amount: number,
  participants: string[]
): SplitOutcome {
  // Validation
  if (typeof amount !== 'number' || isNaN(amount)) {
    return { valid: false, error: 'Amount must be a valid number' };
  }

  if (amount <= 0) {
    return { valid: false, error: 'Amount must be greater than 0' };
  }

  if (!Array.isArray(participants) || participants.length === 0) {
    return { valid: false, error: 'At least one participant is required' };
  }

  const uniqueParticipants = [...new Set(participants)];
  if (uniqueParticipants.length !== participants.length) {
    return { valid: false, error: 'Duplicate participants not allowed' };
  }

  // Calculate
  const count = participants.length;
  const baseShare = Math.floor((amount / count) * 100) / 100;
  const remainder = roundToTwo(amount - baseShare * count);

  const splitDetails: SplitResult = {};

  participants.forEach((userId, index) => {
    // Add remainder to first participant to handle rounding
    const share = index === 0 ? roundToTwo(baseShare + remainder) : baseShare;
    splitDetails[userId] = { amount: share };
  });

  return { valid: true, splitDetails };
}

/**
 * Calculate exact split with specified amounts
 * 
 * @param amount - Total expense amount
 * @param participants - Array of user IDs
 * @param exactAmounts - Object mapping userId to exact amount
 * @returns Split result or error
 * 
 * @example
 * calculateExactSplit(100, ['a', 'b', 'c'], { a: 50, b: 30, c: 20 })
 * // Returns: { a: 50, b: 30, c: 20 }
 */
export function calculateExactSplit(
  amount: number,
  participants: string[],
  exactAmounts: { [userId: string]: number }
): SplitOutcome {
  // Validation
  if (typeof amount !== 'number' || isNaN(amount)) {
    return { valid: false, error: 'Amount must be a valid number' };
  }

  if (amount <= 0) {
    return { valid: false, error: 'Amount must be greater than 0' };
  }

  if (!Array.isArray(participants) || participants.length === 0) {
    return { valid: false, error: 'At least one participant is required' };
  }

  if (!exactAmounts || typeof exactAmounts !== 'object') {
    return { valid: false, error: 'Exact amounts must be provided' };
  }

  // Check all participants have amounts
  for (const userId of participants) {
    if (typeof exactAmounts[userId] !== 'number' || isNaN(exactAmounts[userId])) {
      return { valid: false, error: `Missing or invalid amount for participant: ${userId}` };
    }
    if (exactAmounts[userId] < 0) {
      return { valid: false, error: `Amount cannot be negative for participant: ${userId}` };
    }
  }

  // Verify sum equals total
  const sum = participants.reduce((acc, userId) => acc + exactAmounts[userId], 0);
  if (Math.abs(roundToTwo(sum) - roundToTwo(amount)) > 0.01) {
    return { 
      valid: false, 
      error: `Exact amounts sum (${roundToTwo(sum)}) doesn't match total (${amount})` 
    };
  }

  // Build result
  const splitDetails: SplitResult = {};
  participants.forEach(userId => {
    splitDetails[userId] = { amount: roundToTwo(exactAmounts[userId]) };
  });

  return { valid: true, splitDetails };
}

/**
 * Calculate percentage split
 * 
 * @param amount - Total expense amount
 * @param participants - Array of user IDs
 * @param percentages - Object mapping userId to percentage (0-100)
 * @returns Split result or error
 * 
 * @example
 * calculatePercentageSplit(1000, ['a', 'b', 'c'], { a: 50, b: 30, c: 20 })
 * // Returns: { a: { amount: 500, percentage: 50 }, b: { amount: 300, percentage: 30 }, c: { amount: 200, percentage: 20 } }
 */
export function calculatePercentageSplit(
  amount: number,
  participants: string[],
  percentages: { [userId: string]: number }
): SplitOutcome {
  // Validation
  if (typeof amount !== 'number' || isNaN(amount)) {
    return { valid: false, error: 'Amount must be a valid number' };
  }

  if (amount <= 0) {
    return { valid: false, error: 'Amount must be greater than 0' };
  }

  if (!Array.isArray(participants) || participants.length === 0) {
    return { valid: false, error: 'At least one participant is required' };
  }

  if (!percentages || typeof percentages !== 'object') {
    return { valid: false, error: 'Percentages must be provided' };
  }

  // Check all participants have percentages
  let totalPercentage = 0;
  for (const userId of participants) {
    if (typeof percentages[userId] !== 'number' || isNaN(percentages[userId])) {
      return { valid: false, error: `Missing or invalid percentage for participant: ${userId}` };
    }
    if (percentages[userId] < 0 || percentages[userId] > 100) {
      return { valid: false, error: `Percentage must be between 0 and 100 for participant: ${userId}` };
    }
    totalPercentage += percentages[userId];
  }

  // Verify percentages sum to 100
  if (Math.abs(totalPercentage - 100) > 0.01) {
    return { 
      valid: false, 
      error: `Percentages must sum to 100 (current: ${roundToTwo(totalPercentage)})` 
    };
  }

  // Calculate amounts
  const splitDetails: SplitResult = {};
  let allocatedAmount = 0;

  participants.forEach((userId, index) => {
    const percentage = percentages[userId];
    let userAmount: number;

    // Last participant gets remainder to handle rounding
    if (index === participants.length - 1) {
      userAmount = roundToTwo(amount - allocatedAmount);
    } else {
      userAmount = roundToTwo((amount * percentage) / 100);
      allocatedAmount += userAmount;
    }

    splitDetails[userId] = { 
      amount: userAmount, 
      percentage: percentage 
    };
  });

  return { valid: true, splitDetails };
}

/**
 * Calculate custom split based on shares
 * 
 * @param amount - Total expense amount
 * @param participants - Array of user IDs
 * @param shares - Object mapping userId to number of shares
 * @returns Split result or error
 * 
 * @example
 * calculateCustomSplit(1000, ['a', 'b', 'c'], { a: 2, b: 1, c: 1 })
 * // Returns: { a: { amount: 500, shares: 2 }, b: { amount: 250, shares: 1 }, c: { amount: 250, shares: 1 } }
 */
export function calculateCustomSplit(
  amount: number,
  participants: string[],
  shares: { [userId: string]: number }
): SplitOutcome {
  // Validation
  if (typeof amount !== 'number' || isNaN(amount)) {
    return { valid: false, error: 'Amount must be a valid number' };
  }

  if (amount <= 0) {
    return { valid: false, error: 'Amount must be greater than 0' };
  }

  if (!Array.isArray(participants) || participants.length === 0) {
    return { valid: false, error: 'At least one participant is required' };
  }

  if (!shares || typeof shares !== 'object') {
    return { valid: false, error: 'Shares must be provided' };
  }

  // Check all participants have shares
  let totalShares = 0;
  for (const userId of participants) {
    if (typeof shares[userId] !== 'number' || isNaN(shares[userId])) {
      return { valid: false, error: `Missing or invalid shares for participant: ${userId}` };
    }
    if (shares[userId] < 0) {
      return { valid: false, error: `Shares cannot be negative for participant: ${userId}` };
    }
    totalShares += shares[userId];
  }

  if (totalShares === 0) {
    return { valid: false, error: 'Total shares must be greater than 0' };
  }

  // Calculate amounts based on shares
  const splitDetails: SplitResult = {};
  let allocatedAmount = 0;
  const pricePerShare = amount / totalShares;

  participants.forEach((userId, index) => {
    const userShares = shares[userId];
    let userAmount: number;

    // Last participant gets remainder to handle rounding
    if (index === participants.length - 1) {
      userAmount = roundToTwo(amount - allocatedAmount);
    } else {
      userAmount = roundToTwo(pricePerShare * userShares);
      allocatedAmount += userAmount;
    }

    splitDetails[userId] = { 
      amount: userAmount, 
      shares: userShares 
    };
  });

  return { valid: true, splitDetails };
}

/**
 * Main dispatcher function to calculate split based on type
 */
export function calculateSplit(
  splitType: 'equal' | 'exact' | 'percentage' | 'custom',
  amount: number,
  participants: string[],
  splitInput?: { [userId: string]: number }
): SplitOutcome {
  switch (splitType) {
    case 'equal':
      return calculateEqualSplit(amount, participants);
    
    case 'exact':
      if (!splitInput) {
        return { valid: false, error: 'Exact amounts required for exact split' };
      }
      return calculateExactSplit(amount, participants, splitInput);
    
    case 'percentage':
      if (!splitInput) {
        return { valid: false, error: 'Percentages required for percentage split' };
      }
      return calculatePercentageSplit(amount, participants, splitInput);
    
    case 'custom':
      if (!splitInput) {
        return { valid: false, error: 'Shares required for custom split' };
      }
      return calculateCustomSplit(amount, participants, splitInput);
    
    default:
      return { valid: false, error: `Invalid split type: ${splitType}` };
  }
}
