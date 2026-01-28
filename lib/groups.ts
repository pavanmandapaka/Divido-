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
  getDoc,
  updateDoc,
  setDoc
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

export interface GroupInvite {
  inviteId: string;
  groupId: string;
  groupName: string;
  createdBy: string;
  createdByName: string;
  token: string;
  expiresAt: Timestamp;
  isActive: boolean;
  usageCount: number;
  maxUsage: number | null; // null = unlimited
  createdAt: Timestamp;
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

/**
 * Generate a secure random token for invite links
 * Uses crypto.randomUUID for secure token generation
 * 
 * @returns A unique token string
 */
function generateInviteToken(): string {
  // Generate a secure random token
  // Using crypto.randomUUID() for strong randomness
  const uuid = crypto.randomUUID();
  // Remove hyphens and take first 16 characters for cleaner URLs
  return uuid.replace(/-/g, '').substring(0, 16);
}

/**
 * Create an invite link for a group
 * Only group admins can create invites
 * 
 * @param groupId - The group ID to create invite for
 * @param userId - The user creating the invite (must be admin)
 * @param expiresInHours - Hours until invite expires (default 168 = 7 days)
 * @param maxUsage - Maximum number of times invite can be used (null = unlimited)
 * @returns Object with invite token and expiry, or error
 */
export async function createGroupInvite(
  groupId: string,
  userId: string,
  expiresInHours: number = 168, // Default 7 days
  maxUsage: number | null = null
): Promise<{
  success: boolean;
  inviteId?: string;
  token?: string;
  expiresAt?: Date;
  error?: string;
}> {
  try {
    if (!db) {
      return { success: false, error: 'Database not initialized' };
    }

    // Verify user is an admin of this group
    const memberDocId = `${groupId}_${userId}`;
    const memberRef = doc(db, 'groupMembers', memberDocId);
    const memberSnap = await getDoc(memberRef);

    if (!memberSnap.exists()) {
      return { success: false, error: 'You are not a member of this group' };
    }

    if (memberSnap.data().role !== 'admin') {
      return { success: false, error: 'Only admins can create invite links' };
    }

    // Get group details
    const groupRef = doc(db, 'groups', groupId);
    const groupSnap = await getDoc(groupRef);

    if (!groupSnap.exists()) {
      return { success: false, error: 'Group not found' };
    }

    const groupData = groupSnap.data() as Group;

    // Generate unique token
    const token = generateInviteToken();
    
    // Calculate expiry timestamp
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + expiresInHours);

    // Create invite document
    const invitesRef = collection(db, 'groupInvites');
    const newInviteRef = doc(invitesRef);
    const inviteId = newInviteRef.id;

    const inviteData: Omit<GroupInvite, 'createdAt' | 'expiresAt'> & {
      createdAt: ReturnType<typeof serverTimestamp>;
      expiresAt: Timestamp;
    } = {
      inviteId,
      groupId,
      groupName: groupData.name,
      createdBy: userId,
      createdByName: memberSnap.data().displayName,
      token,
      expiresAt: Timestamp.fromDate(expiresAt),
      isActive: true,
      usageCount: 0,
      maxUsage,
      createdAt: serverTimestamp(),
    };

    await setDoc(newInviteRef, inviteData);

    console.log('Invite created:', inviteId, 'Token:', token);

    return {
      success: true,
      inviteId,
      token,
      expiresAt,
    };

  } catch (error: any) {
    console.error('Error creating invite:', error);
    return {
      success: false,
      error: error.message || 'Failed to create invite',
    };
  }
}

/**
 * Validate an invite token
 * Checks if token exists, is active, not expired, and under usage limit
 * 
 * @param token - The invite token to validate
 * @returns Validation result with group info or error
 */
export async function validateInviteToken(token: string): Promise<{
  valid: boolean;
  inviteId?: string;
  groupId?: string;
  groupName?: string;
  error?: string;
}> {
  try {
    if (!db) {
      return { valid: false, error: 'Database not initialized' };
    }

    if (!token || token.trim().length === 0) {
      return { valid: false, error: 'Invalid token' };
    }

    // Query for invite by token
    const invitesRef = collection(db, 'groupInvites');
    const q = query(invitesRef, where('token', '==', token.trim()));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      return { valid: false, error: 'Invite not found' };
    }

    // Get the first (should be only) matching invite
    const inviteDoc = querySnapshot.docs[0];
    const invite = inviteDoc.data() as GroupInvite;

    // Check if invite is active
    if (!invite.isActive) {
      return { valid: false, error: 'This invite has been deactivated' };
    }

    // Check expiration
    const now = new Date();
    const expiryDate = invite.expiresAt.toDate();
    
    if (now > expiryDate) {
      return { valid: false, error: 'This invite has expired' };
    }

    // Check usage limit
    if (invite.maxUsage !== null && invite.usageCount >= invite.maxUsage) {
      return { valid: false, error: 'This invite has reached its usage limit' };
    }

    // Check if group still exists
    const groupRef = doc(db, 'groups', invite.groupId);
    const groupSnap = await getDoc(groupRef);

    if (!groupSnap.exists()) {
      return { valid: false, error: 'Group no longer exists' };
    }

    return {
      valid: true,
      inviteId: invite.inviteId,
      groupId: invite.groupId,
      groupName: invite.groupName,
    };

  } catch (error: any) {
    console.error('Error validating invite:', error);
    return {
      valid: false,
      error: error.message || 'Failed to validate invite',
    };
  }
}

/**
 * Revoke/deactivate an invite link
 * Only the creator or group admins can revoke invites
 * 
 * @param inviteId - The invite ID to revoke
 * @param userId - The user attempting to revoke (must be admin)
 * @returns Success status
 */
export async function revokeInvite(
  inviteId: string,
  userId: string
): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    if (!db) {
      return { success: false, error: 'Database not initialized' };
    }

    // Get invite details
    const inviteRef = doc(db, 'groupInvites', inviteId);
    const inviteSnap = await getDoc(inviteRef);

    if (!inviteSnap.exists()) {
      return { success: false, error: 'Invite not found' };
    }

    const invite = inviteSnap.data() as GroupInvite;

    // Verify user is admin of the group
    const memberDocId = `${invite.groupId}_${userId}`;
    const memberRef = doc(db, 'groupMembers', memberDocId);
    const memberSnap = await getDoc(memberRef);

    if (!memberSnap.exists() || memberSnap.data().role !== 'admin') {
      return { success: false, error: 'Only admins can revoke invites' };
    }

    // Deactivate the invite
    await updateDoc(inviteRef, {
      isActive: false,
      updatedAt: serverTimestamp(),
    });

    console.log('Invite revoked:', inviteId);

    return { success: true };

  } catch (error: any) {
    console.error('Error revoking invite:', error);
    return {
      success: false,
      error: error.message || 'Failed to revoke invite',
    };
  }
}

/**
 * Join a group using an invite token
 * Validates token and adds user as a member
 * 
 * @param token - The invite token
 * @param userId - The user ID joining
 * @param userDisplayName - Display name of user
 * @param userEmail - Email of user
 * @param userPhotoURL - Photo URL of user (optional)
 * @returns Success status with groupId
 */
export async function joinGroupWithToken(
  token: string,
  userId: string,
  userDisplayName: string,
  userEmail: string,
  userPhotoURL?: string
): Promise<{
  success: boolean;
  groupId?: string;
  error?: string;
}> {
  try {
    if (!db) {
      return { success: false, error: 'Database not initialized' };
    }

    if (!userId) {
      return { success: false, error: 'User must be authenticated' };
    }

    console.log('Attempting to join group with token:', token);

    // Step 1: Validate the invite token
    const validation = await validateInviteToken(token);
    
    if (!validation.valid) {
      return { success: false, error: validation.error || 'Invalid invite' };
    }

    const { groupId, inviteId } = validation;

    if (!groupId || !inviteId) {
      return { success: false, error: 'Invalid invite data' };
    }

    console.log('Token validated. Group:', groupId);

    // Step 2: Check if user is already a member
    const memberDocId = `${groupId}_${userId}`;
    const memberRef = doc(db, 'groupMembers', memberDocId);
    const existingMember = await getDoc(memberRef);

    if (existingMember.exists()) {
      const memberData = existingMember.data();
      if (memberData.status === 'active') {
        return { 
          success: true, 
          groupId,
          // User already member, just return success
        };
      }
      // If left or removed, we'll reactivate below
    }

    // Step 3: Get group details and invite details
    const groupRef = doc(db, 'groups', groupId);
    const inviteRef = doc(db, 'groupInvites', inviteId);
    
    const [groupSnap, inviteSnap] = await Promise.all([
      getDoc(groupRef),
      getDoc(inviteRef)
    ]);

    if (!groupSnap.exists()) {
      return { success: false, error: 'Group not found' };
    }

    if (!inviteSnap.exists()) {
      return { success: false, error: 'Invite not found' };
    }

    const invite = inviteSnap.data() as GroupInvite;
    const group = groupSnap.data() as Group;

    // Step 4: Create or update member document and increment group member count
    const batch = writeBatch(db);

    const memberData: Omit<GroupMember, 'joinedAt'> & {
      joinedAt: ReturnType<typeof serverTimestamp>;
    } = {
      groupId,
      userId,
      role: 'member', // Always join as member
      joinedAt: serverTimestamp(),
      invitedBy: invite.createdBy,
      status: 'active',
      displayName: userDisplayName,
      email: userEmail,
      photoURL: userPhotoURL || '',
    };

    batch.set(memberRef, memberData);

    // Increment group member count (only if new member)
    if (!existingMember.exists() || existingMember.data().status !== 'active') {
      batch.update(groupRef, {
        memberCount: (group.memberCount || 0) + 1,
        updatedAt: serverTimestamp(),
      });
    }

    // Increment invite usage count
    batch.update(inviteRef, {
      usageCount: invite.usageCount + 1,
      updatedAt: serverTimestamp(),
    });

    // Commit all changes atomically
    console.log('Committing batch: adding member and updating counts');
    await batch.commit();

    console.log('Successfully joined group:', groupId);

    return {
      success: true,
      groupId,
    };

  } catch (error: any) {
    console.error('Error joining group:', error);
    return {
      success: false,
      error: error.message || 'Failed to join group',
    };
  }
}
