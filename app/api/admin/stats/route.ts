// app/api/admin/stats/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { 
  getFirestore, 
  collection, 
  getDocs,
  Timestamp
} from 'firebase/firestore';
import { initializeApp, getApps } from 'firebase/app';

const firebaseConfig = {
  apiKey: "AIzaSyB5g7s0q2eR4WXOp7OlKJNpXW0TRbFX9PM",
  authDomain: "paylive-cd9a1.firebaseapp.com",
  projectId: "paylive-cd9a1",
  storageBucket: "paylive-cd9a1.firebasestorage.app",
  messagingSenderId: "163452827765",
  appId: "1:163452827765:web:ee5cd11c4ee0497dcda03c"
};   

let app;
if (!getApps().length) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApps()[0];
}

const db = getFirestore(app);

export async function GET(request: NextRequest) {
  try {
       // const authHeader = request.headers.get('Authorization');
    // if (!authHeader) {
    //   return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    // }
    // Récupérer tous les utilisateurs
    const usersSnapshot = await getDocs(collection(db, 'users'));
    const users = usersSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }));

    // Récupérer les transactions de tous les utilisateurs
    const transactionsPromises = users.map(async (user) => {
      try {
        const userTransactionsRef = collection(db, `users/${user.id}/transactions`);
        const snapshot = await getDocs(userTransactionsRef);
        return snapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            userId: user.id,
            userName: user.name || user.email || `Utilisateur ${user.id.substring(0, 8)}`,
            type: data.type,
            amount: Number(data.amount) || 0,
            status: data.status,
            createdAt: data.createdAt,
            provider: data.provider,
            product: data.product,
          };
        });
      } catch (error) {
        console.log(`Erreur récupération transactions pour ${user.id}:`, error);
        return [];
      }
    });

    const allTransactionsArrays = await Promise.all(transactionsPromises);
    const allTransactions = allTransactionsArrays.flat();

    // Récupérer les produits de tous les utilisateurs
    const productsPromises = users.map(async (user) => {
      try {
        const userProductsRef = collection(db, `users/${user.id}/products`);
        const snapshot = await getDocs(userProductsRef);
        return snapshot.docs.map(doc => ({
          id: doc.id,
          userId: user.id,
          ...doc.data(),
        }));
      } catch (error) {
        console.log(`Aucun produit pour l'utilisateur ${user.id}`);
        return [];
      }
    });

    const allProductsArrays = await Promise.all(productsPromises);
    const allProducts = allProductsArrays.flat();

    // Récupérer les commandes
    const ordersSnapshot = await getDocs(collection(db, 'orders'));
    const orders = ordersSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }));

    // Récupérer les groupes Telegram de tous les utilisateurs
    const telegramGroupsPromises = users.map(async (user) => {
      try {
        const userGroupsRef = collection(db, `users/${user.id}/telegram_groups`);
        const snapshot = await getDocs(userGroupsRef);
        return snapshot.docs.map(doc => ({
          id: doc.id,
          userId: user.id,
          ...doc.data(),
        }));
      } catch (error) {
        return [];
      }
    });

    const allGroupsArrays = await Promise.all(telegramGroupsPromises);
    const telegramGroups = allGroupsArrays.flat();

    // Récupérer les abonnements Telegram
    const subscriptionsSnapshot = await getDocs(collection(db, 'telegram_subscriptions'));
    const telegramSubscriptions = subscriptionsSnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        price: Number(data.price || data.paymentAmount || 0),
        paymentConfirmed: data.paymentConfirmed || false,
        status: data.status || '',
        createdAt: data.createdAt,
        creatorUid: data.creatorUid,
      };
    });

    // Calculer les statistiques
    const activeCreators = users.filter(user => 
      user.role === 'user' && user.isActive !== false
    ).length;

    // Calculer les revenus
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    // Revenus des transactions
    const transactionRevenue = allTransactions
      .filter(t => (t.type === 'deposit' || t.type === 'sale') &&
        (t.status === 'SUCCESSFUL' || t.status === 'COMPLETED' || 
         t.status === 'successful' || t.status === 'completed'))
      .reduce((sum, t) => sum + t.amount, 0);

    const monthlyTransactionRevenue = allTransactions
      .filter(t => {
        if (!(t.type === 'deposit' || t.type === 'sale') || 
            !(t.status === 'SUCCESSFUL' || t.status === 'COMPLETED' || 
              t.status === 'successful' || t.status === 'completed')) {
          return false;
        }
        
        let date;
        if (t.createdAt instanceof Timestamp) {
          date = t.createdAt.toDate();
        } else if (typeof t.createdAt === 'string') {
          date = new Date(t.createdAt);
        } else {
          return false;
        }
        
        return date.getMonth() === currentMonth && 
               date.getFullYear() === currentYear;
      })
      .reduce((sum, t) => sum + t.amount, 0);

    // Revenus des abonnements Telegram
    const telegramRevenue = telegramSubscriptions
      .filter(sub => sub.paymentConfirmed === true || sub.status === 'active')
      .reduce((sum, sub) => sum + sub.price, 0);

    const telegramMonthlyRevenue = telegramSubscriptions
      .filter(sub => {
        if (!(sub.paymentConfirmed === true || sub.status === 'active')) return false;
        
        let date;
        if (sub.createdAt instanceof Timestamp) {
          date = sub.createdAt.toDate();
        } else if (typeof sub.createdAt === 'string') {
          date = new Date(sub.createdAt);
        } else {
          return false;
        }
        
        return date.getMonth() === currentMonth && 
               date.getFullYear() === currentYear;
      })
      .reduce((sum, sub) => sum + sub.price, 0);

    // Totaux combinés
    const totalRevenue = transactionRevenue + telegramRevenue;
    const monthlyRevenue = monthlyTransactionRevenue + telegramMonthlyRevenue;

    // Calculer les retraits en attente
    const pendingWithdrawals = allTransactions.filter(t => 
      t.type === 'withdrawal' && 
      (t.status === 'PENDING' || t.status === 'pending')
    ).length;

    const stats = {
      totalUsers: users.length,
      totalProducts: allProducts.length,
      totalOrders: orders.length,
      totalTelegramGroups: telegramGroups.length,
      totalTelegramSubscriptions: telegramSubscriptions.length,
      totalRevenue,
      monthlyRevenue,
      activeCreators,
      pendingWithdrawals,
      transactionRevenue,
      telegramRevenue,
      monthlyTransactionRevenue,
      telegramMonthlyRevenue,
    };

    return NextResponse.json(stats);
  } catch (error: any) {
    console.error('Erreur récupération stats admin:', error);
    return NextResponse.json(
      { error: 'Erreur serveur', details: error.message },
      { status: 500 }
    );
  }
}