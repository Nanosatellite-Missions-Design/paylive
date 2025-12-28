import { NextRequest, NextResponse } from 'next/server';
import { 
  getFirestore, 
  collection, 
  getDocs,
  query,
  where,
  orderBy,
  QueryConstraint
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
    const searchParams = request.nextUrl.searchParams;
    const creatorUid = searchParams.get('creatorUid');
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('limit') || '10');
    const groupId = searchParams.get('groupId');
    const status = searchParams.get('status');
    const search = searchParams.get('search');

    if (!creatorUid) {
      return NextResponse.json(
        { success: false, error: 'UID du créateur requis' },
        { status: 400 }
      );
    }

    console.log(`🔍 API: Recherche abonnements pour creatorUid: ${creatorUid}`);

    let subscriptions = [];
    
    try {
      // ESSAYER la version avec index (optimisée)
      // IMPORTANT: Puisque nous avons l'index creatorUid, status, createdAt,
      // nous devons TOUJOURS inclure le filtre status dans la requête
      const constraints: QueryConstraint[] = [
        where('creatorUid', '==', creatorUid),
        orderBy('createdAt', 'desc')
      ];

      // Pour utiliser l'index existant, nous devons TOUJOURS filtrer par status
      // Si status n'est pas fourni ou est 'all', on filtre par un status valide
      const actualStatus = status && status !== 'all' ? status : 'active';
      constraints.push(where('status', '==', actualStatus));

      const q = query(collection(db, 'telegram_subscriptions'), ...constraints);
      const snapshot = await getDocs(q);

      subscriptions = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          creatorUid: data.creatorUid || '',
          subscriberName: data.subscriberName || 'Utilisateur Telegram',
          subscriberTelegramUsername: data.subscriberTelegramUsername || '',
          subscriberTelegramId: data.subscriberTelegramId || '',
          subscriberEmail: data.subscriberEmail || '',
          subscriberUid: data.subscriberUid || '',
          status: data.status || '',
          groupId: data.groupId || '',
          groupName: data.groupName || 'Sans nom',
          telegramGroupId: data.telegramGroupId || '',
          addedToGroup: data.addedToGroup || false,
          paymentAmount: Number(data.paymentAmount) || 0,
          price: Number(data.price || data.paymentAmount || 0),
          paymentTransactionId: data.paymentTransactionId || '',
          subscriptionType: data.subscriptionType || 'one_time',
          startDate: data.startDate?.toDate?.()?.toISOString(),
          endDate: data.endDate?.toDate?.()?.toISOString(),
          createdAt: data.createdAt?.toDate?.()?.toISOString(),
          updatedAt: data.updatedAt?.toDate?.()?.toISOString(),
          addedAt: data.addedAt?.toDate?.()?.toISOString(),
          invitedAt: data.invitedAt?.toDate?.()?.toISOString(),
          botInviteLink: data.botInviteLink || '',
          inviteLinkExpires: data.inviteLinkExpires?.toDate?.()?.toISOString(),
          fromBot: data.fromBot || false,
          source: data.source || '',
          paymentConfirmed: data.paymentConfirmed || false,
          lastAccessAt: data.lastAccessAt?.toDate?.()?.toISOString(),
        };
      });

      console.log(`✅ API (avec index): ${subscriptions.length} abonnements trouvés avec status=${actualStatus}`);

    } catch (indexError: any) {
      // Si erreur d'index, utiliser la méthode sans index (fallback)
      console.log('⚠️ Utilisation du mode fallback (sans index)');
      
      const subscriptionsRef = collection(db, 'telegram_subscriptions');
      const snapshot = await getDocs(subscriptionsRef);
      
      subscriptions = snapshot.docs
        .map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            creatorUid: data.creatorUid || '',
            subscriberName: data.subscriberName || 'Utilisateur Telegram',
            subscriberTelegramUsername: data.subscriberTelegramUsername || '',
            subscriberTelegramId: data.subscriberTelegramId || '',
            subscriberEmail: data.subscriberEmail || '',
            subscriberUid: data.subscriberUid || '',
            status: data.status || '',
            groupId: data.groupId || '',
            groupName: data.groupName || 'Sans nom',
            telegramGroupId: data.telegramGroupId || '',
            addedToGroup: data.addedToGroup || false,
            paymentAmount: Number(data.paymentAmount) || 0,
            price: Number(data.price || data.paymentAmount || 0),
            paymentTransactionId: data.paymentTransactionId || '',
            subscriptionType: data.subscriptionType || 'one_time',
            startDate: data.startDate?.toDate?.()?.toISOString(),
            endDate: data.endDate?.toDate?.()?.toISOString(),
            createdAt: data.createdAt?.toDate?.()?.toISOString(),
            updatedAt: data.updatedAt?.toDate?.()?.toISOString(),
            addedAt: data.addedAt?.toDate?.()?.toISOString(),
            invitedAt: data.invitedAt?.toDate?.()?.toISOString(),
            botInviteLink: data.botInviteLink || '',
            inviteLinkExpires: data.inviteLinkExpires?.toDate?.()?.toISOString(),
            fromBot: data.fromBot || false,
            source: data.source || '',
            paymentConfirmed: data.paymentConfirmed || false,
            lastAccessAt: data.lastAccessAt?.toDate?.()?.toISOString(),
          };
        })
        .filter(sub => sub.creatorUid === creatorUid)
        .sort((a, b) => {
          const dateA = new Date(a.createdAt || 0).getTime();
          const dateB = new Date(b.createdAt || 0).getTime();
          return dateB - dateA;
        });

      console.log(`✅ API (sans index): ${subscriptions.length} abonnements trouvés`);
    }

    // Maintenant, appliquer les filtres additionnels en mémoire
    let filteredSubscriptions = subscriptions;
    
    // Filtrer par status si spécifié et différent de 'all'
    if (status && status !== 'all') {
      filteredSubscriptions = filteredSubscriptions.filter(sub => sub.status === status);
    }
    
    // Filtrer par groupId
    if (groupId && groupId !== 'all') {
      filteredSubscriptions = filteredSubscriptions.filter(sub => sub.groupId === groupId);
    }
    
    // Recherche textuelle
    if (search) {
      const searchLower = search.toLowerCase();
      filteredSubscriptions = filteredSubscriptions.filter(sub => 
        sub.subscriberName?.toLowerCase().includes(searchLower) ||
        sub.subscriberTelegramUsername?.toLowerCase().includes(searchLower) ||
        sub.subscriberTelegramId?.toString().includes(search)
      );
    }

    // Pagination en mémoire
    const offset = (page - 1) * pageSize;
    const paginatedSubscriptions = filteredSubscriptions.slice(offset, offset + pageSize);

    // Récupérer les groupes
    const groupsSnapshot = await getDocs(
      collection(db, `users/${creatorUid}/telegram_groups`)
    );

    const groups = groupsSnapshot.docs.map(doc => ({
      id: doc.id,
      name: doc.data().name || 'Sans nom',
      telegramGroupId: doc.data().telegramGroupId,
    }));

    // Calculer les revenus
    const revenue = filteredSubscriptions
      .filter(sub => sub.status === 'active')
      .reduce((sum, sub) => sum + sub.price, 0);

    return NextResponse.json({
      success: true,
      subscriptions: paginatedSubscriptions,
      groups,
      revenue,
      pagination: {
        page,
        limit: pageSize,
        total: filteredSubscriptions.length,
        totalPages: Math.ceil(filteredSubscriptions.length / pageSize)
      }
    });

  } catch (error: any) {
    console.error('❌ Erreur récupération abonnements créateur:', error);
    
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