// app/api/admin/transactions/route.ts
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

// Fonction de conversion pour harmoniser avec la page profile
function convertTransactionType(oldType: string): string {
  switch (oldType?.toLowerCase()) {
    case 'deposit':
    case 'sale':
    case 'purchase':
      return 'sales'; // Tout ce qui est entrée d'argent
    case 'withdrawal':
      return 'withdrawal'; // Sortie d'argent
    default:
      return oldType || 'other';
  }
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const type = searchParams.get('type'); // 'sales' ou 'withdrawal'

    let app;
    if (!getApps().length) {
      app = initializeApp(firebaseConfig);
    } else {
      app = getApps()[0];
    }

    const db = getFirestore(app);
    
    // Récupérer tous les utilisateurs
    const usersSnapshot = await getDocs(collection(db, 'users'));
    const users = usersSnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        name: data.name || data.email || `Utilisateur ${doc.id.substring(0, 8)}`,
        email: data.email || '',
        phone: data.phone || '',
      };
    });

    // Récupérer les transactions de tous les utilisateurs
    const transactionsPromises = users.map(async (user) => {
      try {
        const userTransactionsRef = collection(db, `users/${user.id}/transactions`);
        const snapshot = await getDocs(userTransactionsRef);
        return snapshot.docs.map(doc => {
          const data = doc.data();
          const originalType = data.type || '';
          const convertedType = convertTransactionType(originalType);
          
          return {
            id: doc.id,
            userId: user.id,
            userName: user.name,
            originalType: originalType,
            type: convertedType, // Utiliser le type converti
            amount: Number(data.amount) || 0,
            status: data.status || '',
            createdAt: data.createdAt,
            provider: data.provider || '',
            product: data.product || '',
            depositId: data.depositId || '',
            phoneNumber: data.phoneNumber || '',
            country: data.country || '',
            currency: data.currency || 'XAF',
          };
        });
      } catch (error) {
        console.log(`Erreur récupération transactions pour ${user.id}:`, error);
        return [];
      }
    });

    const allTransactionsArrays = await Promise.all(transactionsPromises);
    let allTransactions = allTransactionsArrays.flat();

    // Filtrer les transactions valides (similaire à la logique de la page profile)
    const getTransactionStatus = (transaction: any): string => {
      return (transaction.status || '').toLowerCase();
    };

    let validTransactions = allTransactions.filter((transaction) => {
      // Exclure les transactions avec des IDs de test
      if (transaction.id === "idle" || transaction.id === "other") {
        return false;
      }
      if (transaction.depositId === "idle" || transaction.depositId === "other") {
        return false;
      }

      const status = getTransactionStatus(transaction);

      // Exclure uniquement les transactions vraiment échouées
      if (
        status === "failed" ||
        status === "cancelled" ||
        status === "rejected" ||
        status === "declined"
      ) {
        return false;
      }

      return true;
    });

    // Si un type est spécifié, filtrer par type converti
    if (type && (type === 'sales' || type === 'withdrawal')) {
      validTransactions = validTransactions.filter(t => t.type === type);
    }

    // Calculer les statistiques sur toutes les transactions (sans filtre de type pour les stats globales)
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    // Pour les statistiques globales, nous utilisons toutes les transactions valides (sans filtre de type)
    const globalValidTransactions = allTransactions.filter((transaction) => {
      // Exclure les transactions avec des IDs de test
      if (transaction.id === "idle" || transaction.id === "other") {
        return false;
      }
      if (transaction.depositId === "idle" || transaction.depositId === "other") {
        return false;
      }

      const status = getTransactionStatus(transaction);

      // Exclure uniquement les transactions vraiment échouées
      if (
        status === "failed" ||
        status === "cancelled" ||
        status === "rejected" ||
        status === "declined"
      ) {
        return false;
      }

      return true;
    });

    // Calculer les statistiques globales avec seulement 2 catégories
    const stats = {
      total: globalValidTransactions.length,
      successful: globalValidTransactions.filter(t => {
        const status = getTransactionStatus(t);
        return status === "successful" || status === "completed";
      }).length,
      failed: globalValidTransactions.filter(t => {
        const status = getTransactionStatus(t);
        return status === "failed" || status === "cancelled" || status === "rejected" || status === "declined";
      }).length,
      pending: globalValidTransactions.filter(t => {
        const status = getTransactionStatus(t);
        return status === "pending" || status === "processing" || status === "initiated" || status === "accepted";
      }).length,
      totalAmount: globalValidTransactions
        .filter(t => t.type === 'sales' && 
          (getTransactionStatus(t) === "successful" || getTransactionStatus(t) === "completed"))
        .reduce((sum, t) => sum + t.amount, 0),
      monthlyAmount: globalValidTransactions
        .filter(t => {
          if (!(t.type === 'sales') || 
              !(getTransactionStatus(t) === "successful" || getTransactionStatus(t) === "completed")) {
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
        .reduce((sum, t) => sum + t.amount, 0),
      byType: {
        sales: globalValidTransactions.filter(t => t.type === 'sales').length,
        withdrawal: globalValidTransactions.filter(t => t.type === 'withdrawal').length,
      },
    };

    // Pagination
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    
    // Trier par date décroissante avant de paginer
    const sortedTransactions = validTransactions.sort((a, b) => {
      try {
        const getDate = (t: any) => {
          if (t.createdAt instanceof Timestamp) return t.createdAt.toDate();
          if (typeof t.createdAt === 'string') return new Date(t.createdAt);
          return new Date(0);
        };
        const dateA = getDate(a);
        const dateB = getDate(b);
        return dateB.getTime() - dateA.getTime();
      } catch (error) {
        return 0;
      }
    });

    const paginatedTransactions = sortedTransactions.slice(startIndex, endIndex);

    // Formater les transactions paginées
    const formattedTransactions = paginatedTransactions.map(t => {
      const status = getTransactionStatus(t);
      let statusDisplay = status;
      if (status === "successful" || status === "completed") statusDisplay = "Complété";
      if (status === "pending" || status === "processing") statusDisplay = "En attente";
      if (status === "failed" || status === "cancelled") statusDisplay = "Échec";

      let typeDisplay = t.type;
      if (t.type === 'sales') typeDisplay = 'Vente';
      if (t.type === 'withdrawal') typeDisplay = 'Retrait';

      return {
        id: t.id,
        type: typeDisplay,
        originalType: t.originalType,
        amount: t.amount,
        status: statusDisplay,
        createdAt: t.createdAt instanceof Timestamp ? 
          t.createdAt.toDate().toISOString() : (t.createdAt || new Date().toISOString()),
        userId: t.userId,
        userName: t.userName,
        product: t.product,
        provider: t.provider,
      };
    });

    return NextResponse.json({
      success: true,
      stats,
      transactions: formattedTransactions,
      pagination: {
        page,
        limit,
        total: validTransactions.length,
        totalPages: Math.ceil(validTransactions.length / limit),
      },
    });
  } catch (error: any) {
    console.error('Erreur dans /api/admin/transactions:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Erreur serveur', 
        details: error.message 
      },
      { status: 500 }
    );
  }
}