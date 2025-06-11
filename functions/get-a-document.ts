import { db } from "./firebase";
import { doc, onSnapshot } from "firebase/firestore";

export const getADocument = (
  id: string,
  collection: string,
  callback: (data: any) => void
) => {
  try {
    // Ensure id and collection are valid
    if (!id || !collection) {
      return "";
    }

    // Reference to the document
    const docRef = doc(db, collection, id);

    // Listen to document changes in real-time
    const unsubscribe = onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        // Document data
        callback({ id: id, ...docSnap.data() }); // Return the document data
      } else {
        // Document does not exist
        callback(null); // Return null or handle the absence of the document
      }
    });

    // Return the unsubscribe function in case you need to stop listening to updates
    return unsubscribe;
  } catch (error) {
    console.error("Error getting document:", error);
    // Handle error (e.g., show an error message)
    return null;
  }
};
