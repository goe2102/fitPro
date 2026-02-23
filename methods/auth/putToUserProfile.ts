import { User } from "firebase/auth";
import { doc, setDoc, updateDoc } from "firebase/firestore";
import { db } from "../../constants/FirebaseConfig";

export default async function putToUserProfile(currentUser: User, item: any) {
  if (!currentUser) {
    throw new Error("No user is currently logged in");
  }

  const docRef = doc(db, 'users', currentUser.uid);

  try {

    await setDoc(docRef, {
      ...item,
      updatedAt: new Date(),
      email: currentUser.email
    }, { merge: false }); 

    console.log("User profile updated successfully!");
    return { success: true };

  } catch (error) {
    console.error("Error updating user profile:", error);
    throw error;
  }
}