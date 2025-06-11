import { doc, deleteDoc } from "firebase/firestore";
import { db } from "./firebase";

export async function deleteSubcollectionDocument(
  collectionName: string,
  collectionId: string,
  subcollectionName: string,
  subcollectionDocId: string
) {
  try {
    // Build the path to the specific document in the subcollection
    const subDocRef = doc(
      db,
      `${collectionName}/${collectionId}/${subcollectionName}`,
      subcollectionDocId
    );

    // Delete the document
    await deleteDoc(subDocRef);

  } catch (error) {
    console.error("Error deleting subcollection document:", error);
    throw new Error("Failed to delete subcollection document");
  }
}
