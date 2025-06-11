import { collection, onSnapshot } from "firebase/firestore";
import { db } from "./firebase";

export const listenToSubCollection = (
  collect: string,
  id: string,
  subCollect: string,
  callback: (data: any[]) => void
) => {
  try {
    // Reference to the subcollection
    const subCollectionRef = collection(db, collect, id, subCollect);

    // Set up a real-time listener
    const unsubscribe = onSnapshot(subCollectionRef, (querySnapshot) => {
      if (!querySnapshot.empty) {
        // Map through the documents and get their data
        const items = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        callback(items); // Pass the updated data to the callback
      } else {
        callback([]); // Pass an empty array if no data exists
      }
    });

    // Return the unsubscribe function to stop listening
    return unsubscribe;
  } catch (error) {
    // console.error("Error listening to subcollection:", error);
    return callback([]); // Pass an empty array in case of error
  }
};
