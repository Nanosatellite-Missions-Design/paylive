// app/api/admin/users/update-role/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getFirestore, doc, updateDoc } from 'firebase/firestore';
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

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, role } = body;

    if (!userId || !role) {
      return NextResponse.json(
        { success: false, error: 'User ID et rôle requis' },
        { status: 400 }
      );
    }

    // Vérifier que le rôle est valide
    const validRoles = ['admin', 'user', 'creator'];
    if (!validRoles.includes(role)) {
      return NextResponse.json(
        { success: false, error: 'Rôle invalide' },
        { status: 400 }
      );
    }

    // Mettre à jour le rôle de l'utilisateur
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, {
      role,
      updatedAt: new Date(),
    });

    return NextResponse.json({
      success: true,
      message: `Rôle de l'utilisateur mis à jour en ${role}`,
      userId,
      role,
    });
  } catch (error: any) {
    console.error('Erreur mise à jour rôle:', error);
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