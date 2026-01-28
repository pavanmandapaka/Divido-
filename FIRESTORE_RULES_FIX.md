# Firestore Security Rules Fix

Your group creation is timing out because of Firestore security rules blocking writes.

## Quick Fix (For Development Only)

1. Go to Firebase Console: https://console.firebase.google.com
2. Select your project: `smart-expense-splitter-9d870`
3. Click on "Firestore Database" in the left menu
4. Click on the "Rules" tab
5. Replace the rules with this:

```javascript
rules_version = '2';

service cloud.firestore {
  match /databases/{database}/documents {
    
    // Users collection
    match /users/{userId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Groups collection
    match /groups/{groupId} {
      allow read: if request.auth != null;
      allow create: if request.auth != null && 
                      request.resource.data.createdBy == request.auth.uid;
      allow update: if request.auth != null && 
                      get(/databases/$(database)/documents/groupMembers/$(groupId + '_' + request.auth.uid)).data.role == 'admin';
      allow delete: if request.auth != null && 
                      get(/databases/$(database)/documents/groupMembers/$(groupId + '_' + request.auth.uid)).data.role == 'admin';
    }
    
    // GroupMembers collection
    match /groupMembers/{memberDocId} {
      allow read: if request.auth != null;
      allow create: if request.auth != null;
      allow update: if request.auth != null && 
                      (memberDocId.split('_')[1] == request.auth.uid ||
                       get(/databases/$(database)/documents/groupMembers/$(memberDocId.split('_')[0] + '_' + request.auth.uid)).data.role == 'admin');
      allow delete: if request.auth != null &&
                      get(/databases/$(database)/documents/groupMembers/$(memberDocId.split('_')[0] + '_' + request.auth.uid)).data.role == 'admin';
    }
  }
}
```

6. Click "Publish"

## Test After Publishing Rules

1. Wait 10-20 seconds for rules to propagate
2. Refresh your browser
3. Try creating a group again
4. Check browser console for logs

## Temporary Quick Fix (If Above Doesn't Work)

For development/testing only, you can use this rule (UNSAFE for production):

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

This allows any authenticated user to read/write anything. Only use during development!
