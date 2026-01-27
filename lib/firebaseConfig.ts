// Check if Firebase is properly configured
export function isFirebaseConfigured(): boolean {
  const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
  
  // Check if we have a real API key (not the placeholder)
  return !!(
    apiKey && 
    apiKey !== 'AIzaSyDummyKeyForDevelopment123456789' &&
    apiKey.length > 20
  );
}

export function getFirebaseSetupMessage(): string {
  if (!isFirebaseConfigured()) {
    return 'Firebase is not configured. Please set up your Firebase project to enable authentication.';
  }
  return '';
}
