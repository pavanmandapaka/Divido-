/**
 * Expense Management Functions
 * Phase 4 Day 3: Expense Creation Logic
 */

import { 
  collection, 
  doc, 
  writeBatch, 
  serverTimestamp,
  Timestamp,
  getDoc,
  Firestore
} from 'firebase/firestore';
import { db } from './firebase';
import { calculateSplit, SplitResult } from './splitCalculations';

// Helper to ensure db is initialized
function getDb(): Firestore {
  if (!db) {
    throw new Error('Firestore is not initialized');
  }
  return db;
}

// Expense categories
export const EXPENSE_CATEGORIES = [
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
] as const;

export type ExpenseCategory = typeof EXPENSE_CATEGORIES[number];

// TypeScript interfaces
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
  splitInput?: { [userId: string]: number };
  category: string;
  note: string;
  date: Date;
  createdBy: string;
}

/**
 * Validate expense input data
 * 
 * @param input - Expense creation input
 * @returns Validation result with error message if invalid
 */
function validateExpenseInput(input: CreateExpenseInput): { valid: boolean; error?: string } {
  // Required fields
  if (!input.groupId || input.groupId.trim().length === 0) {
    return { valid: false, error: 'Group ID is required' };
  }

  if (typeof input.amount !== 'number' || isNaN(input.amount)) {
    return { valid: false, error: 'Amount must be a valid number' };
  }

  if (input.amount <= 0) {
    return { valid: false, error: 'Amount must be greater than 0' };
  }

  if (input.amount > 10000000) { // 10 million limit
    return { valid: false, error: 'Amount exceeds maximum limit' };
  }

  if (!input.paidBy || input.paidBy.trim().length === 0) {
    return { valid: false, error: 'Payer (paidBy) is required' };
  }

  if (!Array.isArray(input.participants) || input.participants.length === 0) {
    return { valid: false, error: 'At least one participant is required' };
  }

  // Validate split type
  const validSplitTypes = ['equal', 'exact', 'percentage', 'custom'];
  if (!validSplitTypes.includes(input.splitType)) {
    return { valid: false, error: `Invalid split type: ${input.splitType}` };
  }

  // Validate category
  if (!input.category || input.category.trim().length === 0) {
    return { valid: false, error: 'Category is required' };
  }

  // Validate date
  if (!(input.date instanceof Date) || isNaN(input.date.getTime())) {
    return { valid: false, error: 'Valid date is required' };
  }

  // Date cannot be in future (more than 1 day ahead)
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  if (input.date > tomorrow) {
    return { valid: false, error: 'Expense date cannot be in the future' };
  }

  if (!input.createdBy || input.createdBy.trim().length === 0) {
    return { valid: false, error: 'Creator (createdBy) is required' };
  }

  // Note is optional but has max length
  if (input.note && input.note.length > 500) {
    return { valid: false, error: 'Note cannot exceed 500 characters' };
  }

  return { valid: true };
}

/**
 * Create a new expense in a group
 * 
 * Validation Steps:
 * 1. Validate input data format
 * 2. Verify user is member of group
 * 3. Verify payer is participant or member
 * 4. Verify all participants are group members
 * 5. Calculate split based on split type
 * 6. Create expense document with atomic write
 * 
 * @param input - Expense creation input data
 * @returns Object with success status and expenseId or error
 */
export async function createExpense(input: CreateExpenseInput): Promise<{
  success: boolean;
  expenseId?: string;
  error?: string;
}> {
  try {
    // Check if Firebase is initialized
    if (!db) {
      return { success: false, error: 'Database not initialized' };
    }

    console.log('Creating expense:', { 
      groupId: input.groupId, 
      amount: input.amount, 
      splitType: input.splitType 
    });

    // Step 1: Validate input
    const inputValidation = validateExpenseInput(input);
    if (!inputValidation.valid) {
      return { success: false, error: inputValidation.error };
    }

    // Step 2: Verify creator is member of group
    const creatorMemberDocId = `${input.groupId}_${input.createdBy}`;
    const creatorMemberRef = doc(getDb(), 'groupMembers', creatorMemberDocId);
    const creatorMemberSnap = await getDoc(creatorMemberRef);

    if (!creatorMemberSnap.exists() || creatorMemberSnap.data().status !== 'active') {
      return { success: false, error: 'You are not a member of this group' };
    }

    // Step 3: Verify payer is in participants list
    if (!input.participants.includes(input.paidBy)) {
      // Auto-add payer to participants if not included
      input.participants = [input.paidBy, ...input.participants];
    }

    // Step 4: Verify all participants are group members
    for (const participantId of input.participants) {
      const participantMemberDocId = `${input.groupId}_${participantId}`;
      const participantMemberRef = doc(getDb(), 'groupMembers', participantMemberDocId);
      const participantMemberSnap = await getDoc(participantMemberRef);

      if (!participantMemberSnap.exists() || participantMemberSnap.data().status !== 'active') {
        return { 
          success: false, 
          error: `Participant ${participantId} is not a member of this group` 
        };
      }
    }

    // Step 5: Get group details for currency
    const groupRef = doc(getDb(), 'groups', input.groupId);
    const groupSnap = await getDoc(groupRef);

    if (!groupSnap.exists()) {
      return { success: false, error: 'Group not found' };
    }

    const groupData = groupSnap.data();
    const currency = groupData.currency || 'INR';

    // Step 6: Calculate split
    const splitResult = calculateSplit(
      input.splitType,
      input.amount,
      input.participants,
      input.splitInput
    );

    if (!splitResult.valid) {
      return { success: false, error: splitResult.error };
    }

    // Add isSettled flag to each participant's split
    const splitDetails: Expense['splitDetails'] = {};
    for (const [userId, details] of Object.entries(splitResult.splitDetails)) {
      splitDetails[userId] = {
        ...details,
        isSettled: userId === input.paidBy // Payer's share is auto-settled
      };
    }

    // Step 7: Create expense document
    const expensesRef = collection(getDb(), 'expenses');
    const newExpenseRef = doc(expensesRef);
    const expenseId = newExpenseRef.id;

    const expenseData: Omit<Expense, 'createdAt' | 'updatedAt' | 'date'> & {
      createdAt: ReturnType<typeof serverTimestamp>;
      updatedAt: ReturnType<typeof serverTimestamp>;
      date: Timestamp;
    } = {
      expenseId,
      groupId: input.groupId,
      amount: input.amount,
      paidBy: input.paidBy,
      participants: input.participants,
      splitType: input.splitType,
      splitDetails,
      category: input.category,
      note: input.note || '',
      date: Timestamp.fromDate(input.date),
      createdAt: serverTimestamp(),
      createdBy: input.createdBy,
      updatedAt: serverTimestamp(),
      isSettled: false,
      currency,
    };

    // Step 8: Atomic write - expense + group totalExpenses update
    const batch = writeBatch(getDb());
    
    // Add expense document
    batch.set(newExpenseRef, expenseData);

    // Update group's totalExpenses
    batch.update(groupRef, {
      totalExpenses: (groupData.totalExpenses || 0) + input.amount,
      updatedAt: serverTimestamp(),
    });

    // Commit batch
    console.log('Committing expense batch...');
    await batch.commit();

    console.log('Expense created successfully:', expenseId);

    return {
      success: true,
      expenseId,
    };

  } catch (error: any) {
    console.error('Error creating expense:', error);
    return {
      success: false,
      error: error.message || 'Failed to create expense',
    };
  }
}

// TODO: Phase 4 Day 4+ - Balance calculation functions
// - calculateUserBalances(groupId) - Calculate who owes whom
// - getGroupBalances(groupId) - Get current balance state
// - simplifyDebts(balances) - Minimize number of transactions

// TODO: Phase 4 Day 5+ - Settlement functions
// - recordSettlement(fromUser, toUser, amount, groupId)
// - markExpenseSettled(expenseId)
// - getSettlementHistory(groupId)

// TODO: Phase 5 - Expense management
// - getGroupExpenses(groupId) - List expenses
// - getExpenseById(expenseId) - Get single expense
// - updateExpense(expenseId, updates) - Edit expense
// - deleteExpense(expenseId) - Remove expense
