const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY ?? '',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN ?? '',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID ?? '',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET ?? '',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID ?? '',
  appId: import.meta.env.VITE_FIREBASE_APP_ID ?? '',
};

export const firebaseConfigured = Boolean(
  firebaseConfig.apiKey &&
    firebaseConfig.authDomain &&
    firebaseConfig.projectId &&
    firebaseConfig.appId,
);

export type FirebaseServices = {
  auth: import('firebase/auth').Auth;
  db: import('firebase/firestore').Firestore;
};

let servicesPromise: Promise<FirebaseServices> | null = null;

export function loadFirebase(): Promise<FirebaseServices> {
  if (!firebaseConfigured) return Promise.reject(new Error('Firebase is not configured'));
  if (!servicesPromise) {
    servicesPromise = import('./firebase-services').then((mod) => mod.createFirebaseServices(firebaseConfig));
  }
  return servicesPromise;
}
