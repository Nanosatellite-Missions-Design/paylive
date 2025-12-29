// app/api/admin/users/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getFirestore, collection, getDocs } from 'firebase/firestore';
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

export async function GET() {
  try {
    const usersSnapshot = await getDocs(collection(db, 'users'));
    
    const users = usersSnapshot.docs.map(doc => {
      const data = doc.data();
      
      // Convertir les dates Firestore en format lisible
      let createdAt = "Date inconnue";
      let updatedAt = "Date inconnue";
      let lastTransaction = "Jamais";
      let lastWithdrawal = "Jamais";
      
      try {
        // Gérer createdAt
        if (data.createdAt) {
          if (data.createdAt.toDate) {
            createdAt = data.createdAt.toDate().toISOString();
          } else if (typeof data.createdAt === 'string') {
            createdAt = data.createdAt;
          } else if (data.createdAt._seconds) {
            // Format Firestore timestamp
            createdAt = new Date(data.createdAt._seconds * 1000).toISOString();
          }
        }
        
        // Gérer updatedAt
        if (data.updatedAt) {
          if (data.updatedAt.toDate) {
            updatedAt = data.updatedAt.toDate().toISOString();
          } else if (typeof data.updatedAt === 'string') {
            updatedAt = data.updatedAt;
          } else if (data.updatedAt._seconds) {
            updatedAt = new Date(data.updatedAt._seconds * 1000).toISOString();
          }
        }
        
        // Gérer lastTransaction
        if (data.lastTransaction) {
          if (typeof data.lastTransaction === 'string') {
            lastTransaction = data.lastTransaction;
          } else if (data.lastTransaction.toDate) {
            lastTransaction = data.lastTransaction.toDate().toISOString();
          } else if (data.lastTransaction._seconds) {
            lastTransaction = new Date(data.lastTransaction._seconds * 1000).toISOString();
          }
        }
        
        // Gérer lastWithdrawal
        if (data.lastWithdrawal) {
          if (typeof data.lastWithdrawal === 'string') {
            lastWithdrawal = data.lastWithdrawal;
          } else if (data.lastWithdrawal.toDate) {
            lastWithdrawal = data.lastWithdrawal.toDate().toISOString();
          } else if (data.lastWithdrawal._seconds) {
            lastWithdrawal = new Date(data.lastWithdrawal._seconds * 1000).toISOString();
          }
        }
      } catch (error) {
        console.log(`Erreur conversion dates pour ${doc.id}:`, error);
      }
      
      return {
        uid: doc.id,
        name: data.name || 'Sans nom',
        email: data.email || '',
        phone: data.phone || '',
        role: data.role || 'user',
        balance: data.balance || 0,
        createdAt: createdAt,
        totalWithdrawn: data.totalWithdrawn || 0,
        lifetimeSales: data.lifetimeSales || 0,
        lastTransaction: lastTransaction,
        lastWithdrawal: lastWithdrawal,
        paymentMethods: data.paymentMethods || [],
        updatedAt: updatedAt,
        photoURL: data.photoURL || '',
        isActive: data.isActive !== false,
      };
    });

    return NextResponse.json({ users });
  } catch (error: any) {
    console.error('Erreur récupération utilisateurs:', error);
    return NextResponse.json(
      { error: 'Erreur serveur', details: error.message },
      { status: 500 }
    );
  }
}