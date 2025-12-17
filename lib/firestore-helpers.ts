// lib/firestore-helpers.ts
import { db } from "@/functions/firebase"; // Ton instance Firebase existante
import { collection, doc, setDoc, addDoc, updateDoc, deleteDoc } from "firebase/firestore";

export const createTelegramGroup = async (userId: string, groupData: any) => {
  try {
    // Créer dans telegram_groups
    const telegramGroupRef = doc(collection(db, `users/${userId}/telegram_groups`));
    await setDoc(telegramGroupRef, {
      ...groupData,
      id: telegramGroupRef.id,
      createdAt: new Date().toISOString(),
    });

    // Créer dans products pour l'affichage
    const productRef = doc(collection(db, `users/${userId}/products`));
    const productData = {
      id: productRef.id,
      name: groupData.name,
      creatorId: userId,
      creatorName: groupData.creatorName,
      price: groupData.price,
      description: groupData.description,
      category: "telegram_group",
      productType: "telegram_group",
      subscriptionType: groupData.subscriptionType,
      telegramGroupId: telegramGroupRef.id,
      status: "available",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      images: [],
    };

    await setDoc(productRef, productData);

    return {
      success: true,
      groupId: telegramGroupRef.id,
      productId: productRef.id,
    };
  } catch (error) {
    console.error("Erreur création groupe:", error);
    throw error;
  }
};