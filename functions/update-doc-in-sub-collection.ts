import { db } from "./firebase";
import { doc, serverTimestamp, updateDoc } from "firebase/firestore";

export const updateSubcollectionDocument = async (
  parentCollection: string,
  parentId: string,
  subCollection: string,
  subDocId: string,
  updatedData: any
) => {
  try {
    const subDocRef = doc(
      db,
      parentCollection,
      parentId,
      subCollection,
      subDocId
    );
    await updateDoc(subDocRef, {
      ...updatedData,
      updatedAt: serverTimestamp(),
    });
    console.log(`Subcollection document ${subDocId} successfully updated!`);
    return true;
  } catch (error) {
    console.error("Error updating subcollection document:", error);
    return false;
  }
};
