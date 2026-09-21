import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { apiClient, DecoupledUser } from './apiClient';
import firebaseConfig from '../../firebase-applet-config.json';

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId || '(default)');
export const storage = getStorage(app);
export const googleProvider = new GoogleAuthProvider();

export { apiClient };
export type { DecoupledUser };

/**
 * Decoupled Google Sign-in: authenticates with Google and synchronizes with cPanel / MySQL backend
 */
export const loginWithGoogle = async () => {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    const gUser = result.user;
    
    // Sync session with decoupled backend API
    try {
      await apiClient.loginGoogle({
        email: gUser.email || '',
        displayName: gUser.displayName || '',
        photoUrl: gUser.photoURL || '',
        uid: gUser.uid,
      });
    } catch (apiErr) {
      console.warn('[Decoupled API] Backend sync notice:', apiErr);
    }

    return gUser;
  } catch (error) {
    console.error("Error signing in with Google", error);
    throw error;
  }
};

/**
 * Direct Email and Password Sign-In for Standalone cPanel / MySQL
 */
export const loginWithEmailPassword = async (email: string, password?: string, tenantCode?: string) => {
  return await apiClient.login(email, password, tenantCode);
};

export const logout = async () => {
  try {
    await signOut(auth);
  } catch (error) {
    console.warn("Sign out notice", error);
  }
  await apiClient.logout();
};
