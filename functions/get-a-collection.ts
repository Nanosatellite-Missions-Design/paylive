import { db } from "./firebase";
import { collection, onSnapshot } from "firebase/firestore";

export const getACollection = (collect: string, callback: (data: any[]) => void) => {
    try {
        // Reference to the specified collection
        const collectionRef = collection(db, collect);

        // Listen for real-time updates
        const unsubscribe = onSnapshot(collectionRef, (querySnapshot) => {
            if (!querySnapshot.empty) {
                // Map through the documents and get their data
                const data = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                callback(data); // Pass the data to the callback function
            } else {
                callback([]); // Return an empty array if no documents exist
            }
        });

        return unsubscribe; // Return the unsubscribe function to stop listening when needed
    } catch (error) {
        console.error("Error getting collection:", error);
        callback([]);
    }
};