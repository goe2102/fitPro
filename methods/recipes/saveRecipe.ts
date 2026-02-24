import { doc, setDoc, collection } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { auth, db, storage } from '../../constants/FirebaseConfig';
import { Recipe } from '../../types/GlobalTypes';

export const saveRecipe = async (
  recipeData: Partial<Recipe>,
  localImageUri: string | null,
  existingRecipeId?: string
) => {
  if (!auth.currentUser) throw new Error("User must be logged in to save a recipe.");

  const userId = auth.currentUser.uid;

  // 1. Generate a new ID if creating, or use the existing one if editing
  const recipeRef = existingRecipeId
    ? doc(db, 'recipes', existingRecipeId)
    : doc(collection(db, 'recipes'));
  const recipeId = recipeRef.id;

  let finalImageUrl = recipeData.imageUrl || '';

  // 2. Handle Image Upload (Only if it's a new local file from the phone)
  if (localImageUri && !localImageUri.startsWith('http')) {
    const response = await fetch(localImageUri);
    const blob = await response.blob();
    const imageRef = ref(storage, `users/${userId}/recipes/${recipeId}.jpg`);
    await uploadBytes(imageRef, blob);
    // Store the full URL — useFirebaseImageUrl hook will refresh it when displaying
    finalImageUrl = await getDownloadURL(imageRef);
  }

  // 3. Construct the final document
  const finalRecipe = {
    ...recipeData,
    id: recipeId,
    authorId: userId,
    imageUrl: finalImageUrl,
    ...(!existingRecipeId && {
      createdAt: Date.now(),
      likeCount: 0,
    })
  };

  // 4. Save to Firestore
  await setDoc(recipeRef, finalRecipe, { merge: true });
  return finalRecipe;
};