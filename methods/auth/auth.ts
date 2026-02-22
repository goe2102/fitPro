import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendEmailVerification,
  signOut
} from 'firebase/auth';
import { auth } from '../../constants/FirebaseConfig';

// 1. Login
export const loginUser = async (email: string, pass: string) => {
  return await signInWithEmailAndPassword(auth, email, pass);
};

// 2. Register & Send Verification
export const registerUser = async (email: string, pass: string) => {
  const userCredential = await createUserWithEmailAndPassword(auth, email, pass);
  await sendEmailVerification(userCredential.user);
  return userCredential;
};

// 3. Logout
export const logoutUser = async () => {
  return await signOut(auth);
};

// 4. Resend Verification Email (if needed)
export const resendVerification = async () => {
  if (auth.currentUser) {
    await sendEmailVerification(auth.currentUser);
  }
};