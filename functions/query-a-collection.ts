import { collection, query, where, onSnapshot } from "firebase/firestore";
import { db } from "@/functions/firebase"; // Adjust this path

const getRealTimeQuery = (
  tableName: string,
  field: string,
  value: string,
  callback: (data: any[]) => void
) => {
  if (!tableName || !field || value === undefined) {
    return () => {}; // Always return a function to avoid errors
  }

  // Query for single value match
  const q = query(
    collection(db, tableName),
    where(field, "array-contains", value)
  );

  // Listen for changes
  const unsubscribe = onSnapshot(q, (snapshot) => {
    if (!snapshot.empty) {
      // Map through the documents and get their data
      const docs = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      callback(docs); // Pass the data to the callback function
    } else {
      callback([]); // Return an empty array if no documents exist
    }
  });

  // Return an unsubscribe function
  return unsubscribe;
};

export default getRealTimeQuery;
