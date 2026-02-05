/**
 * Firebase Authentication Service.
 * Handles anonymous authentication for game users.
 */

import {
  Auth,
  User,
  signInAnonymously,
  onAuthStateChanged,
  Unsubscribe,
} from 'firebase/auth';

export class AuthService {
  private auth: Auth;

  constructor(auth: Auth) {
    this.auth = auth;
  }

  /**
   * Sign in anonymously and return the user's UID.
   * Firebase persists anonymous sessions in IndexedDB.
   */
  async signInAnonymous(): Promise<string> {
    const userCredential = await signInAnonymously(this.auth);
    const uid = userCredential.user.uid;
    console.log(`[AuthService] Signed in as: ${uid}`);
    return uid;
  }

  /**
   * Get the currently authenticated user, or null if not signed in.
   */
  getCurrentUser(): User | null {
    return this.auth.currentUser;
  }

  /**
   * Subscribe to authentication state changes.
   * @param callback Called with the user when auth state changes
   * @returns Unsubscribe function
   */
  onAuthChange(callback: (user: User | null) => void): Unsubscribe {
    return onAuthStateChanged(this.auth, callback);
  }
}
