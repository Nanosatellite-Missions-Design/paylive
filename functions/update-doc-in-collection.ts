import { db } from "./firebase";
import { doc, updateDoc, serverTimestamp } from "firebase/firestore";

export const updateDocument = async (
  collectionName: string,
  docId: string,
  updatedData: any
) => {
  try {
    const docRef = doc(db, collectionName, docId);
    await updateDoc(docRef, {
      ...updatedData,
      updatedAt: serverTimestamp(),
    });
    // console.log(`Document ${docId} successfully updated!`);
    return true;
  } catch (error) {
    // console.error("Error updating document:", error);
    return false;
  }
};
