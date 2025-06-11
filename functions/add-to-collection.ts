import { db } from "./firebase";
import {
  collection,
  addDoc,
  doc,
  setDoc,
  serverTimestamp,
} from "firebase/firestore";

export const addToCollection = async (collectionName: string, data: any) => {
  try {
    const collectionRef = collection(db, collectionName);
    const docRef = await addDoc(collectionRef, {
      ...data,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    // console.log("Document successfully added with ID:", docRef.id);
    return docRef;
  } catch (error) {
    console.error("Error adding document : ", error);
    return null;
  }
};

export const setToCollection = async (
  collectionName: string,
  docId: string,
  data: any
) => {
  try {
    const docRef = doc(db, collectionName, docId);
    const result = await setDoc(docRef, {
      ...data,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    console.log("document added");
    return true;
  } catch (error) {
    console.error("Error adding document : ", error);
    return false;
  }
};
