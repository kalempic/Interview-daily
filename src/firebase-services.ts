import { getApps, initializeApp, type FirebaseOptions } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

export function createFirebaseServices(config: FirebaseOptions) {
  const app = getApps()[0] ?? initializeApp(config);
  return {
    auth: getAuth(app),
    db: getFirestore(app),
  };
}
