// Group Management Functions
// Phase 3 Day 2: Group Creation Logic

import { 
  collection, 
  doc, 
  writeBatch, 
  serverTimestamp,
  Timestamp,
  query,
  where,
  getDocs,
  getDoc
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
    // Check if we're in a browser environment
    if (typeof window === 'undefined') {
      console.error('Cannot create group on server side');
      return { success: false, error: 'This operation must be performed in the browser' };
    }

    // Check if Firestore is initialized
    if (!db) {
      console.error('Firestore database not initialized');
      return { success: false, error: 'Database not initialized. Please refresh the page.' };
    }

    console.log('createGroup called with:', { name: input.name, currency: input.currency });

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
    console.log('Creating batch write...');
    const batch = writeBatch(db);
    batch.set(newGroupRef, groupData);
    batch.set(memberRef, memberData);

    console.log('Committing batch to Firestore...');
    console.log('Writing to collections: groups and groupMembers');
    
    try {
      await batch.commit();
      console.log('Batch committed successfully');
    } catch (batchError: any) {
      console.error('Batch commit failed:', batchError);
      console.error('Error code:', batchError.code);
      console.error('Error message:', batchError.message);
      
      if (batchError.code === 'permission-denied') {
        return { 
          success: false, 
          error: 'Permission denied. Please check Firestore security rules.' 
        };
      }
      
      throw batchError;
    }

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


/**
 * Get all groups for a user
 * 
 * Query Strategy:
 * 1. Query groupMembers collection where userId === current user
 * 2. Extract groupIds from results
 * 3. Fetch full group documents from groups collection
 * 4. Merge group data with member role
 * 
 * @param userId - The user ID to fetch groups for
 * @returns Array of groups with user's role
 */
export async function getUserGroups(userId: string): Promise<Array<{
  group: Group;
  role: 'admin' | 'member';
}>> {
  try {
    if (!userId) {
      throw new Error('User ID is required');
    }

    // Step 1: Query groupMembers collection for this user
    const groupMembersRef = collection(db, 'groupMembers');
    const q = query(
      groupMembersRef,
      where('userId', '==', userId),
      where('status', '==', 'active')
    );

    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
      return [];
    }

    // Step 2: Extract group IDs and roles
    const memberData = querySnapshot.docs.map(doc => ({
      groupId: doc.data().groupId,
      role: doc.data().role as 'admin' | 'member'
    }));

    // Step 3: Fetch full group documents
    const groupsRef = collection(db, 'groups');
    const groupPromises = memberData.map(async ({ groupId, role }) => {
      const groupDocRef = doc(groupsRef, groupId);
      const groupSnap = await getDoc(groupDocRef);
      
      if (groupSnap.exists()) {
        return {
          group: { ...groupSnap.data(), groupId } as Group,
          role
        };
      }
      return null;
    });

    const results = await Promise.all(groupPromises);
    
    // Filter out null values (groups that don't exist)
    return results.filter((item): item is { group: Group; role: 'admin' | 'member' } => item !== null);
    
  } catch (error) {
    console.error('Error fetching user groups:', error);
    throw error;
  }
}

/**
 * Get a single group by ID with user's role
 * 
 * Verifies the user is a member and returns group details with their role
 * Includes retry logic for immediate reads after creation
 * 
 * @param groupId - The group ID to fetch
 * @param userId - The user ID to verify membership
 * @param retries - Number of retries for propagation delay (default 3)
 * @returns Group details with user's role, or null if not a member
 */
export async function getGroupById(
  groupId: string, 
  userId: string,
  retries: number = 3
): Promise<{ group: Group; role: 'admin' | 'member' } | null> {
  try {
    if (!groupId || !userId) {
      throw new Error('Group ID and User ID are required');
    }

    // Check if user is a member of this group
    const memberDocId = `${groupId}_${userId}`;
    const memberRef = doc(db, 'groupMembers', memberDocId);
    
    let memberSnap = await getDoc(memberRef);
    
    // Retry logic for immediate reads after creation (Firestore propagation delay)
    let attempts = 0;
    while (!memberSnap.exists() && attempts < retries) {
      await new Promise(resolve => setTimeout(resolve, 200)); // 200ms delay
      memberSnap = await getDoc(memberRef);
      attempts++;
      console.log(`Retry ${attempts} for member document`);
    }

    if (!memberSnap.exists() || memberSnap.data().status !== 'active') {
      return null; // User is not an active member
    }

    // Fetch the group document
    const groupRef = doc(db, 'groups', groupId);
    let groupSnap = await getDoc(groupRef);
    
    // Retry logic for group document
    attempts = 0;
    while (!groupSnap.exists() && attempts < retries) {
      await new Promise(resolve => setTimeout(resolve, 200));
      groupSnap = await getDoc(groupRef);
      attempts++;
      console.log(`Retry ${attempts} for group document`);
    }

    if (!groupSnap.exists()) {
      return null; // Group doesn't exist
    }

    return {
      group: { ...groupSnap.data(), groupId } as Group,
      role: memberSnap.data().role as 'admin' | 'member'
    };

  } catch (error) {
    console.error('Error fetching group:', error);
    throw error;
  }
}
