// app/api/admin/telegram/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { 
  getFirestore, 
  collection, 
  getDocs,
  collectionGroup,
  Timestamp,
  query,
  where
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
    // Récupérer tous les groupes Telegram
    const groupsSnapshot = await getDocs(collectionGroup(db, 'telegram_groups'));
    
    const groups = groupsSnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        name: data.name || 'Sans nom',
        telegramGroupId: data.telegramGroupId || '',
        price: Number(data.price) || 0,
        description: data.description || '',
        currentMembers: data.currentMembers || 0,
        isActive: data.isActive || false,
        creatorUid: data.creatorUid || '',
        creatorName: data.creatorName || 'Inconnu',
        createdAt: data.createdAt,
        subscriptionType: data.subscriptionType || 'one_time',
      };
    });

    // Récupérer tous les abonnements
    const subscriptionsSnapshot = await getDocs(collection(db, 'telegram_subscriptions'));
    
    const subscriptions = subscriptionsSnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        groupId: data.groupId || '',
        groupName: data.groupName || '',
        subscriberName: data.subscriberName || 'Utilisateur Telegram',
        subscriberTelegramId: data.subscriberTelegramId || '',
        status: data.status || 'active',
        price: Number(data.price || data.paymentAmount) || 0,
        paymentConfirmed: data.paymentConfirmed || false,
        createdAt: data.createdAt,
        startDate: data.startDate,
        endDate: data.endDate,
        creatorUid: data.creatorUid || '',
      };
    });

    // Calculer les statistiques
    const totalGroups = groups.length;
    const activeGroups = groups.filter(g => g.isActive).length;
    const totalSubscriptions = subscriptions.length;
    const activeSubscriptions = subscriptions.filter(s => s.status === 'active').length;
    
    // Revenus totaux
    const totalRevenue = subscriptions
      .filter(s => s.paymentConfirmed)
      .reduce((sum, s) => sum + s.price, 0);
    
    // Revenus du mois
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    
    const monthlyRevenue = subscriptions
      .filter(s => {
        if (!s.paymentConfirmed) return false;
        
        let date;
        if (s.createdAt instanceof Timestamp) {
          date = s.createdAt.toDate();
        } else if (typeof s.createdAt === 'string') {
          date = new Date(s.createdAt);
        } else {
          return false;
        }
        
        return date.getMonth() === currentMonth && 
               date.getFullYear() === currentYear;
      })
      .reduce((sum, s) => sum + s.price, 0);

    // Groupes avec le plus d'abonnements
    const groupStats: Record<string, any> = {};
    
    subscriptions.forEach(sub => {
      if (!groupStats[sub.groupId]) {
        const group = groups.find(g => g.id === sub.groupId);
        groupStats[sub.groupId] = {
          id: sub.groupId,
          name: sub.groupName || 'Groupe inconnu',
          subscriptionCount: 0,
          revenue: 0,
          creatorName: group?.creatorName || 'Inconnu',
        };
      }
      
      groupStats[sub.groupId].subscriptionCount++;
      if (sub.paymentConfirmed) {
        groupStats[sub.groupId].revenue += sub.price;
      }
    });

    // Convertir en tableau et trier par revenus
    const topGroups = Object.values(groupStats)
      .sort((a: any, b: any) => b.revenue - a.revenue)
      .slice(0, 10);

    return NextResponse.json({
      success: true,
      totalGroups,
      activeGroups,
      totalSubscriptions,
      activeSubscriptions,
      totalRevenue,
      monthlyRevenue,
      topGroups,
    });

  } catch (error: any) {
    console.error('Erreur récupération Telegram admin:', error);
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