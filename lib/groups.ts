// Group Management Functions
// Phase 3 Day 2: Group Creation Logic

import { 
  collection, 
  doc, 
  writeBatch, 
  serverTimestamp,
  Timestamp 
} from 'firebase/firestore';
import { db } from './firebase';

// TypeScript interfaces for type safety
export interface CreateGroupInput {
  name: string;
  description: string;
  currency: string;
  createdBy: string;
  creatorDisplayName: string;
  creatorEmail: string;
  creatorPhotoURL?: string;
}

export interface Group {
  groupId: string;
  name: string;
  description: string;
  currency: string;
  createdBy: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  memberCount: number;
  totalExpenses: number;
  settledExpenses: number;
  isActive: boolean;
}

export interface GroupMember {
  groupId: string;
  userId: string;
  role: 'admin' | 'member';
  joinedAt: Timestamp;
  invitedBy: string | null;
  status: 'active' | 'left' | 'removed';
  displayName: string;
  email: string;
  photoURL: string;
}

/**
 * Create a new group with the creator as admin
 * 
 * This function performs atomic writes to ensure data consistency:
 * 1. Creates a group document in the 'groups' collection
 * 2. Creates a groupMembers document for the creator with admin role
 * 
 * Both operations succeed or fail together (atomicity)
 * 
 * @param input - Group creation input data
 * @returns Object containing groupId and success status
 * 
 * @example
 * const result = await createGroup({
 *   name: "Weekend Trip",
 *   description: "Beach vacation expenses",
 *   currency: "USD",
 *   createdBy: "user-uid-123",
 *   creatorDisplayName: "John Doe",
 *   creatorEmail: "john@example.com"
 * });
 */
export async function createGroup(input: CreateGroupInput): Promise<{
  success: boolean;
  groupId?: string;
  error?: string;
}> {
  try {
    // Validate input
    if (!input.name || input.name.trim().length === 0) {
      return { success: false, error: 'Group name is required' };
    }

    if (input.name.length > 50) {
      return { success: false, error: 'Group name must be 50 characters or less' };
    }

    if (input.description.length > 200) {
      return { success: false, error: 'Description must be 200 characters or less' };
    }

    if (!input.currency || input.currency.length !== 3) {
      return { success: false, error: 'Valid currency code is required (e.g., USD, EUR, INR)' };
    }

    if (!input.createdBy) {
      return { success: false, error: 'User must be authenticated' };
    }

    // Generate new group ID
    const groupsRef = collection(db, 'groups');
    const newGroupRef = doc(groupsRef);
    const groupId = newGroupRef.id;

    // Create composite key for groupMembers: {groupId}_{userId}
    const memberDocId = `${groupId}_${input.createdBy}`;
    const groupMembersRef = collection(db, 'groupMembers');
    const memberRef = doc(groupMembersRef, memberDocId);

    // Prepare group document
    const groupData: Omit<Group, 'createdAt' | 'updatedAt'> & {
      createdAt: ReturnType<typeof serverTimestamp>;
      updatedAt: ReturnType<typeof serverTimestamp>;
    } = {
      groupId,
      name: input.name.trim(),
      description: input.description.trim(),
      currency: input.currency.toUpperCase(),
      createdBy: input.createdBy,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      memberCount: 1, // Creator is first member
      totalExpenses: 0,
      settledExpenses: 0,
      isActive: true,
    };

    // Prepare group member document (creator as admin)
    const memberData: Omit<GroupMember, 'joinedAt'> & {
      joinedAt: ReturnType<typeof serverTimestamp>;
    } = {
      groupId,
      userId: input.createdBy,
      role: 'admin',
      joinedAt: serverTimestamp(),
      invitedBy: null, // Creator wasn't invited
      status: 'active',
      displayName: input.creatorDisplayName,
      email: input.creatorEmail,
      photoURL: input.creatorPhotoURL || '',
    };

    // Use batch write for atomicity
    // Both documents are created together or not at all
    const batch = writeBatch(db);
    batch.set(newGroupRef, groupData);
    batch.set(memberRef, memberData);

    // Commit the batch
    await batch.commit();

    console.log('Group created successfully:', groupId);

    return {
      success: true,
      groupId,
    };

  } catch (error: any) {
    console.error('Error creating group:', error);
    return {
      success: false,
      error: error.message || 'Failed to create group',
    };
  }
}

/**
 * Helper function to validate currency code
 * 
 * @param currency - ISO currency code (3 letters)
 * @returns boolean indicating if currency is valid
 */
export function isValidCurrency(currency: string): boolean {
  // Common currencies - can be extended
  const validCurrencies = [
    'USD', 'EUR', 'GBP', 'INR', 'JPY', 'CNY', 'AUD', 'CAD',
    'CHF', 'HKD', 'SGD', 'SEK', 'KRW', 'NOK', 'NZD', 'MXN',
    'BRL', 'ZAR', 'RUB', 'TRY', 'AED', 'SAR', 'THB', 'IDR'
  ];
  
  return validCurrencies.includes(currency.toUpperCase());
}

// TODO: Phase 3 Day 3 - Add member management functions
// - addMemberToGroup()
// - removeMemberFromGroup()
// - updateMemberRole()
// - getMembersByGroup()

// TODO: Phase 3 Day 4 - Add group query functions
// - getUserGroups() - Get all groups for a user
// - getGroupById() - Get group details
// - updateGroup() - Update group info
// - deleteGroup() - Soft delete group

// TODO: Phase 3 Day 5 - Build UI components
// - CreateGroupForm component
// - GroupList component
// - GroupCard component

// TODO: Phase 4 - Add invite system
// - generateInviteLink()
// - joinGroupViaInvite()
// - revokeInviteLink()
