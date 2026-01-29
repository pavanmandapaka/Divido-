// Firebase configuration and initialization

import { initializeApp, getApps, type FirebaseApp } from 'firebase/app';
import { 
  getAuth, 
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  updateProfile,
  type Auth
} from 'firebase/auth';
import { getFirestore, doc, setDoc, getDoc, serverTimestamp, type Firestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || '',
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || '',
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || '',
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || '',
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '',
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || '',
};

// Initialize Firebase only on client side
let app: FirebaseApp | undefined;
let auth: Auth | undefined;
let db: Firestore | undefined;

if (typeof window !== 'undefined') {
  app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
  auth = getAuth(app);
  db = getFirestore(app);
  console.log('Firebase initialized on client');
}

// Export with proper fallbacks
export { auth, db };

// Google Auth Provider
const googleProvider = new GoogleAuthProvider();

// Create user document in Firestore
async function createUserDocument(uid: string, name: string, email: string, photoURL: string = '') {
  if (!db) {
    console.error('Firestore not initialized');
    return;
  }
  const userRef = doc(db, 'users', uid);
  const userSnap = await getDoc(userRef);
  
  if (!userSnap.exists()) {
    await setDoc(userRef, {
      uid,
      name,
      email,
      photoURL,
      createdAt: serverTimestamp(),
    });
  }
}

// Email/Password Sign Up
export async function signUpWithEmail(name: string, email: string, password: string) {
  try {
    if (!auth) {
      return { user: null, error: 'Firebase auth not initialized' };
    }
    
    if (!process.env.NEXT_PUBLIC_FIREBASE_API_KEY || 
        process.env.NEXT_PUBLIC_FIREBASE_API_KEY === 'AIzaSyDummyKeyForDevelopment123456789') {
      return { 
        user: null, 
        error: 'Firebase is not configured. Please set up your Firebase project in .env.local' 
      };
    }
    
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    await updateProfile(userCredential.user, { displayName: name });
    await createUserDocument(userCredential.user.uid, name, email);
    return { user: userCredential.user, error: null };
  } catch (error: any) {
    return { user: null, error: error.message };
  }
}

// Email/Password Login
export async function loginWithEmail(email: string, password: string) {
  try {
    if (!auth) {
      return { user: null, error: 'Firebase auth not initialized' };
    }
    
    if (!process.env.NEXT_PUBLIC_FIREBASE_API_KEY || 
        process.env.NEXT_PUBLIC_FIREBASE_API_KEY === 'AIzaSyDummyKeyForDevelopment123456789') {
      return { 
        user: null, 
        error: 'Firebase is not configured. Please set up your Firebase project in .env.local' 
      };
    }
    
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return { user: userCredential.user, error: null };
  } catch (error: any) {
    return { user: null, error: error.message };
  }
}

// Google Sign In
export async function loginWithGoogle() {
  try {
    if (!auth) {
      return { user: null, error: 'Firebase auth not initialized' };
    }
    
    if (!process.env.NEXT_PUBLIC_FIREBASE_API_KEY || 
        process.env.NEXT_PUBLIC_FIREBASE_API_KEY === 'AIzaSyDummyKeyForDevelopment123456789') {
      return { 
        user: null, 
        error: 'Firebase is not configured. Please set up your Firebase project in .env.local' 
      };
    }
    
    const result = await signInWithPopup(auth, googleProvider);
    const user = result.user;
    await createUserDocument(
      user.uid,
      user.displayName || 'User',
      user.email || '',
      user.photoURL || ''
    );
    return { user, error: null };
  } catch (error: any) {
    return { user: null, error: error.message };
  }
}
