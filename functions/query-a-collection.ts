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
  // console.log({tableName, field, value})
  // Query for single value match
  const q = query(collection(db, tableName), where(field, "==", value));

  // Listen for changes
  const unsubscribe = onSnapshot(q, (snapshot) => {
    if (!snapshot.empty) {
      // Map through the documents and get their data
      // console.log("yeahh")
      const docs = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      // console.log(docs)
      callback(docs); // Pass the data to the callback function
    } else {
      console.log("Document not snapshot");
      callback([]); // Return an empty array if no documents exist
    }
  });

  // Return an unsubscribe function
  return unsubscribe;
};

export default getRealTimeQuery;
