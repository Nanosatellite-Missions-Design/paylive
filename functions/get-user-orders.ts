// functions/get-user-orders.ts
import { listenToSubCollection } from "@/functions/get-a-sub-collection";

export const getUserOrders = (userId: string): Promise<any[]> => {
  return new Promise((resolve) => {
    try {
      const unsubscribe = listenToSubCollection(
        "users", 
        userId, 
        "orders", 
        (orders: any[]) => {
          resolve(orders);
          // Vérifier si unsubscribe est une fonction avant de l'appeler
          if (unsubscribe && typeof unsubscribe === 'function') {
            unsubscribe();
          }
        }
      );
    } catch (error) {
      console.error("Error getting user orders:", error);
      resolve([]);
    }
  });
};