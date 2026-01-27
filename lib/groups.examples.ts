// Example Usage: Group Creation Functions
// Phase 3 Day 2: Integration Examples

import { createGroup, isValidCurrency } from './groups';

/**
 * EXAMPLE 1: Basic Group Creation
 * 
 * This shows how to call createGroup from a UI component
 * Assumes user is authenticated and user data is available
 */
async function exampleCreateGroup(currentUser: any) {
  const result = await createGroup({
    name: 'Roommate Expenses',
    description: 'Shared apartment costs',
    currency: 'USD',
    createdBy: currentUser.uid,
    creatorDisplayName: currentUser.displayName || 'User',
    creatorEmail: currentUser.email || '',
    creatorPhotoURL: currentUser.photoURL,
  });

  if (result.success) {
    console.log('✅ Group created with ID:', result.groupId);
    // TODO: Navigate to group page
    // TODO: Show success message
  } else {
    console.error('❌ Failed to create group:', result.error);
    // TODO: Show error message to user
  }
}

/**
 * EXAMPLE 2: Form Submission Handler
 * 
 * This is how you would integrate with a form component
 */
async function handleCreateGroupSubmit(
  formData: {
    name: string;
    description: string;
    currency: string;
  },
  currentUser: any
) {
  // Validate currency before API call
  if (!isValidCurrency(formData.currency)) {
    return {
      success: false,
      error: 'Invalid currency code',
    };
  }

  // Call the create function
  const result = await createGroup({
    name: formData.name,
    description: formData.description,
    currency: formData.currency,
    createdBy: currentUser.uid,
    creatorDisplayName: currentUser.displayName || 'User',
    creatorEmail: currentUser.email || '',
    creatorPhotoURL: currentUser.photoURL || '',
  });

  return result;
}

/**
 * EXAMPLE 3: React Component Integration (Pseudo-code)
 * 
 * This shows the structure for a React component that creates groups
 */
/*
'use client'

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthProvider';
import { createGroup } from '@/lib/groups';

export default function CreateGroupButton() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Get form data
    const formData = new FormData(e.target as HTMLFormElement);
    
    const result = await createGroup({
      name: formData.get('name') as string,
      description: formData.get('description') as string,
      currency: formData.get('currency') as string,
      createdBy: user.uid,
      creatorDisplayName: user.displayName || 'User',
      creatorEmail: user.email || '',
      creatorPhotoURL: user.photoURL || '',
    });

    if (result.success) {
      // TODO: Redirect to /groups/${result.groupId}
      // TODO: Show success toast
    } else {
      setError(result.error || 'Failed to create group');
    }

    setLoading(false);
  };

  return (
    <form onSubmit={handleCreateGroup}>
      <input name="name" required />
      <textarea name="description" />
      <select name="currency" required>
        <option value="USD">USD</option>
        <option value="EUR">EUR</option>
        <option value="INR">INR</option>
      </select>
      <button type="submit" disabled={loading}>
        {loading ? 'Creating...' : 'Create Group'}
      </button>
      {error && <p>{error}</p>}
    </form>
  );
}
*/

/**
 * EXAMPLE 4: Error Handling
 * 
 * Shows comprehensive error handling patterns
 */
async function createGroupWithErrorHandling(
  groupData: any,
  currentUser: any
) {
  try {
    // Pre-validation
    if (!currentUser) {
      throw new Error('User must be logged in');
    }

    // Call create function
    const result = await createGroup({
      name: groupData.name,
      description: groupData.description,
      currency: groupData.currency,
      createdBy: currentUser.uid,
      creatorDisplayName: currentUser.displayName || 'User',
      creatorEmail: currentUser.email || '',
      creatorPhotoURL: currentUser.photoURL,
    });

    // Handle result
    if (result.success) {
      return {
        status: 'success',
        groupId: result.groupId,
        message: 'Group created successfully',
      };
    } else {
      return {
        status: 'error',
        message: result.error,
      };
    }

  } catch (error: any) {
    console.error('Unexpected error:', error);
    return {
      status: 'error',
      message: 'An unexpected error occurred',
    };
  }
}

/**
 * FIRESTORE STRUCTURE AFTER GROUP CREATION
 * 
 * When createGroup() is called, it creates these documents:
 * 
 * groups/{groupId}:
 * {
 *   groupId: "abc123",
 *   name: "Roommate Expenses",
 *   description: "Shared apartment costs",
 *   currency: "USD",
 *   createdBy: "user-uid-123",
 *   createdAt: Timestamp,
 *   updatedAt: Timestamp,
 *   memberCount: 1,
 *   totalExpenses: 0,
 *   settledExpenses: 0,
 *   isActive: true
 * }
 * 
 * groupMembers/{groupId}_{userId}:
 * {
 *   groupId: "abc123",
 *   userId: "user-uid-123",
 *   role: "admin",
 *   joinedAt: Timestamp,
 *   invitedBy: null,
 *   status: "active",
 *   displayName: "John Doe",
 *   email: "john@example.com",
 *   photoURL: "https://..."
 * }
 */

// Export examples (not used in production, just for reference)
export {
  exampleCreateGroup,
  handleCreateGroupSubmit,
  createGroupWithErrorHandling,
};
