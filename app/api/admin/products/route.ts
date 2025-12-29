// app/api/admin/products/route.ts
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
    // Récupérer tous les utilisateurs
    const usersSnapshot = await getDocs(collection(db, 'users'));
    const users = usersSnapshot.docs.map(doc => ({
      id: doc.id,
      name: doc.data().name,
      email: doc.data().email,
    }));

    // Récupérer les produits de tous les utilisateurs
    const productsPromises = users.map(async (user) => {
      try {
        const userProductsRef = collection(db, `users/${user.id}/products`);
        const snapshot = await getDocs(userProductsRef);
        return snapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            name: data.name || 'Sans nom',
            price: Number(data.price) || 0,
            description: data.description || '',
            category: data.category || 'Non catégorisé',
            status: data.status || 'draft',
            salesCount: data.salesCount || 0,
            creatorUid: user.id,
            creatorName: user.name || user.email || 'Inconnu',
            createdAt: data.createdAt,
            updatedAt: data.updatedAt,
            images: data.images || [],
            stock: data.stock || 0,
            isActive: data.isActive !== false,
          };
        });
      } catch (error) {
        console.log(`Aucun produit pour ${user.id}:`, error);
        return [];
      }
    });

    const allProductsArrays = await Promise.all(productsPromises);
    const products = allProductsArrays.flat();

    // Calculer les statistiques
    const totalProducts = products.length;
    const activeProducts = products.filter(p => 
      p.status === 'published' && p.isActive !== false
    ).length;
    
    const totalSales = products.reduce((sum, p) => sum + p.salesCount, 0);
    const totalRevenue = products.reduce((sum, p) => sum + (p.price * p.salesCount), 0);
    const averagePrice = totalProducts > 0 ? totalRevenue / totalProducts : 0;

    // Compter par catégorie
    const byCategory: Record<string, number> = {};
    products.forEach(product => {
      const category = product.category;
      byCategory[category] = (byCategory[category] || 0) + 1;
    });

    // Produits les plus vendus
    const topProducts = products
      .filter(p => p.salesCount > 0)
      .sort((a, b) => b.salesCount - a.salesCount)
      .slice(0, 10);

    const stats = {
      totalProducts,
      activeProducts,
      totalSales,
      totalRevenue,
      averagePrice,
      byCategory,
    };

    return NextResponse.json({
      success: true,
      stats,
      topProducts,
      total: products.length,
    });

  } catch (error: any) {
    console.error('Erreur récupération produits admin:', error);
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