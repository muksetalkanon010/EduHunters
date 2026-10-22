import { 
  signInWithPopup, 
  signOut as firebaseSignOut, 
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile
} from 'firebase/auth';
import { auth, googleProvider } from '../firebase/config';
import { supabase, isSupabaseConfigured } from '../supabase/config';

/**
 * Sync user profile to Supabase eduhunters_users table
 */
export async function syncUserToSupabase(user, extraData = {}) {
  if (!user || !isSupabaseConfigured || !supabase) return user;

  const payload = {
    id: user.uid,
    email: user.email || '',
    name: user.displayName || extraData.name || 'Student',
    phone: user.phoneNumber || extraData.phone || '',
    role: extraData.role || 'student',
    raw_data: {
      uid: user.uid,
      displayName: user.displayName,
      email: user.email,
      photoURL: user.photoURL,
      providerId: user.providerData?.[0]?.providerId || 'firebase'
    },
    last_active_at: new Date().toISOString()
  };

  try {
    // Check if user already exists to keep their enrolled_courses array
    const { data: existing } = await supabase
      .from('eduhunters_users')
      .select('enrolled_courses, role')
      .eq('id', user.uid)
      .maybeSingle();

    if (existing) {
      payload.enrolled_courses = existing.enrolled_courses || [];
      payload.role = existing.role || 'student';
    }

    const { error } = await supabase
      .from('eduhunters_users')
      .upsert(payload, { onConflict: 'id' });

    if (error) {
      console.warn('[Supabase Sync User] Note:', error.message);
    }
  } catch (err) {
    console.warn('[Supabase Sync User Error]:', err);
  }

  return payload;
}

/**
 * Sign in with Google Popup
 */
export async function loginWithGoogle() {
  if (!auth || !googleProvider) {
    throw new Error('Firebase Auth is not configured.');
  }
  const result = await signInWithPopup(auth, googleProvider);
  const user = result.user;
  await syncUserToSupabase(user);
  return user;
}

/**
 * Sign in with Email / Password
 */
export async function loginWithEmail(email, password) {
  if (!auth) throw new Error('Auth not configured.');
  const result = await signInWithEmailAndPassword(auth, email, password);
  await syncUserToSupabase(result.user);
  return result.user;
}

/**
 * Register with Email / Password
 */
export async function registerWithEmail(email, password, name = '', phone = '') {
  if (!auth) throw new Error('Auth not configured.');
  const result = await createUserWithEmailAndPassword(auth, email, password);
  if (name && result.user) {
    await updateProfile(result.user, { displayName: name });
  }
  await syncUserToSupabase(result.user, { name, phone });
  return result.user;
}

/**
 * Sign Out
 */
export async function logoutUser() {
  if (auth) {
    await firebaseSignOut(auth);
  }
}

/**
 * Subscribe to Auth State
 */
export function subscribeToAuthState(callback) {
  if (!auth) {
    callback(null);
    return () => {};
  }
  return onAuthStateChanged(auth, async (firebaseUser) => {
    if (firebaseUser) {
      // Fetch fresh profile from Supabase
      let userProfile = {
        uid: firebaseUser.uid,
        email: firebaseUser.email,
        displayName: firebaseUser.displayName || 'Student',
        photoURL: firebaseUser.photoURL,
        role: 'student'
      };

      if (isSupabaseConfigured && supabase) {
        try {
          const { data } = await supabase
            .from('eduhunters_users')
            .select('*')
            .eq('id', firebaseUser.uid)
            .maybeSingle();

          if (data) {
            userProfile = { ...userProfile, ...data };
          }
        } catch (e) {
          console.warn('[Auth State Sync]:', e);
        }
      }
      callback(userProfile);
    } else {
      callback(null);
    }
  });
}
