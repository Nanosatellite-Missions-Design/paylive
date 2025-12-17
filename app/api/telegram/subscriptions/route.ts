import { NextRequest, NextResponse } from 'next/server';
import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { 
  getFirestore,
  Firestore,
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  getDoc, 
  serverTimestamp,
  getDocs,
  query,
  where,
  DocumentData
} from 'firebase/firestore';

// Configuration Firebase IDENTIQUE à ton app
const firebaseConfig = {
  apiKey: "AIzaSyB5g7s0q2eR4WXOp7OlKJNpXW0TRbFX9PM",
  authDomain: "paylive-cd9a1.firebaseapp.com",
  projectId: "paylive-cd9a1",
  storageBucket: "paylive-cd9a1.firebasestorage.app",
  messagingSenderId: "163452827765",
  appId: "1:163452827765:web:ee5cd11c4ee0497dcda03c"
};

// Initialiser Firebase
let app: FirebaseApp | undefined;
let db: Firestore | undefined;

try {
  if (!getApps().length) {
    app = initializeApp(firebaseConfig);
    console.log('✅ Firebase initialisé dans API');
  } else {
    app = getApps()[0];
  }
  db = getFirestore(app);
} catch (error) {
  console.error('❌ Erreur Firebase API:', error);
}

export async function POST(request: NextRequest) {
  try {
    // Vérifier que Firebase est initialisé
    if (!db) {
      console.error('❌ Firebase non initialisé dans API');
      return NextResponse.json(
        { success: false, error: 'Base de données non disponible' },
        { status: 500 }
      );
    }

    const body = await request.json();
    console.log('📦 Données reçues pour abonnement:', JSON.stringify(body, null, 2));

    // 1. Données essentielles
    if (!body.groupId || !body.paymentTransactionId) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Données manquantes: groupId et paymentTransactionId sont requis' 
        },
        { status: 400 }
      );
    }

    // 2. Récupérer les infos du groupe
    let groupName = body.groupName || "Groupe Telegram";
    let telegramGroupId = body.telegramGroupId || null;
    let creatorUid = body.creatorUid || null;
    let price = parseFloat(body.paymentAmount?.toString() || body.price?.toString() || '0');
    let subscriptionType = body.subscriptionType || 'one_time';

    // 3. Calculer la date d'expiration
    const now = new Date();
    const endDate = new Date(now);
    
    if (subscriptionType === 'monthly') {
      endDate.setMonth(now.getMonth() + 1);
    } else if (subscriptionType === 'weekly') {
      endDate.setDate(now.getDate() + 7);
    } else if (subscriptionType === 'yearly') {
      endDate.setFullYear(now.getFullYear() + 1);
    } else {
      endDate.setDate(now.getDate() + 30); // 30 jours par défaut
    }

    // 4. S'assurer que l'ID Telegram est bien enregistré
    const subscriberTelegramId = body.subscriberTelegramId || null;
    console.log('🔍 ID Telegram à enregistrer:', subscriberTelegramId);

    // 5. Créer l'abonnement dans Firestore
    const subscriptionData = {
      // Données de base
      groupId: body.groupId,
      telegramGroupId: telegramGroupId,
      groupName: groupName,
      creatorUid: creatorUid,
      
      // Informations abonné
      subscriberUid: body.subscriberUid || null,
      subscriberTelegramId: subscriberTelegramId,
      subscriberTelegramUsername: body.subscriberTelegramUsername || null,
      subscriberName: body.subscriberName || "Utilisateur Telegram",
      subscriberEmail: body.subscriberEmail || null,
      
      // Paiement
      price: price,
      paymentTransactionId: body.paymentTransactionId,
      subscriptionType: subscriptionType,
      paymentAmount: price,
      
      // Statut
      status: 'active',
      startDate: now,
      endDate: endDate,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      addedToGroup: false,
      botInviteLink: null,
      paymentConfirmed: true,
      
      // Métadonnées
      fromBot: body.fromBot || false
    };

    console.log('📝 Création de l\'abonnement avec:', {
      groupName: groupName,
      price: price,
      subscriberTelegramId: subscriberTelegramId,
      telegramGroupId: telegramGroupId
    });

    const subscriptionRef = await addDoc(
      collection(db, 'telegram_subscriptions'),
      subscriptionData
    );

    const subscriptionId = subscriptionRef.id;
    console.log('✅ Abonnement créé avec ID:', subscriptionId);

    // 6. ENVOYER LE LIEN D'INVITATION DIRECTEMENT VIA L'API TELEGRAM
    let inviteLink = null;
    let notificationSent = false;
    
    if (subscriberTelegramId && telegramGroupId) {
      try {
        console.log('🤖 Envoi du lien via API Telegram...');
        
        const botToken = process.env.TELEGRAM_BOT_TOKEN || "8526096119:AAE4gLXvCR7QxC7M6KL9XZuYIax8woKzyng";
        
        // Créer un lien d'invitation
        const inviteResponse = await fetch(
          `https://api.telegram.org/bot${botToken}/createChatInviteLink`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              chat_id: telegramGroupId,
              member_limit: 1,
              expire_date: Math.floor(Date.now() / 1000) + (24 * 60 * 60),
              name: `Abonnement ${groupName}`
            })
          }
        );
        
        const inviteData = await inviteResponse.json();
        
        if (inviteData.ok && inviteData.result.invite_link) {
          inviteLink = inviteData.result.invite_link;
          
          // Envoyer le message à l'utilisateur
          const messageResponse = await fetch(
            `https://api.telegram.org/bot${botToken}/sendMessage`,
            {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                chat_id: subscriberTelegramId,
                text: `🎉 *Félicitations !*\n\n` +
                      `Votre abonnement à *${groupName}* a été activé avec succès !\n\n` +
                      `💰 Montant: ${price} XAF\n` +
                      `📅 Durée: ${subscriptionType}\n\n` +
                      `Cliquez sur le bouton ci-dessous pour rejoindre le groupe (valable 24h) :`,
                parse_mode: 'Markdown',
                reply_markup: {
                  inline_keyboard: [[
                    {
                      text: "🚀 Rejoindre le groupe",
                      url: inviteLink
                    }
                  ]]
                }
              })
            }
          );
          
          const messageData = await messageResponse.json();
          
          if (messageData.ok) {
            notificationSent = true;
            console.log('📨 Notification envoyée avec succès');
            
            // Mettre à jour l'abonnement avec le lien
            await updateDoc(subscriptionRef, {
              botInviteLink: inviteLink,
              invitedAt: serverTimestamp(),
              updatedAt: serverTimestamp(),
              inviteLinkExpires: new Date(Date.now() + 24 * 60 * 60 * 1000)
            });
          }
        }
      } catch (telegramError) {
        console.warn('⚠️ Erreur envoi via API Telegram:', telegramError);
      }
    }

    // 7. Retourner la réponse
    return NextResponse.json({
      success: true,
      subscriptionId: subscriptionId,
      message: 'Abonnement créé avec succès',
      groupName: groupName,
      price: price,
      subscriberTelegramId: subscriberTelegramId,
      telegramGroupId: telegramGroupId,
      inviteLink: inviteLink,
      notificationSent: notificationSent,
      addedToGroup: false,
      metadata: {
        groupId: body.groupId,
        paymentTransactionId: body.paymentTransactionId,
        subscriptionType: subscriptionType
      }
    });

  } catch (error: any) {
    console.error('❌ Erreur création abonnement:', error);
    console.error('Stack:', error.stack);
    
    return NextResponse.json(
      { 
        success: false,
        error: 'Erreur création abonnement',
        details: error.message
      },
      { status: 500 }
    );
  }
}


// GET pour récupérer un abonnement - VERSION CORRIGÉE
export async function GET(request: NextRequest) {
  try {
    if (!db) {
      return NextResponse.json(
        { success: false, error: 'Base de données non disponible' },
        { status: 500 }
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const subscriptionId = searchParams.get('subscriptionId') || searchParams.get('id');
    const telegramUserId = searchParams.get('telegramUserId');

    console.log('🔍 Recherche abonnement avec:', {
      subscriptionId,
      telegramUserId,
      searchParams: Object.fromEntries(searchParams.entries())
    });

    if (subscriptionId) {
      // Récupérer un abonnement spécifique
      const subscriptionRef = doc(db, 'telegram_subscriptions', subscriptionId);
      const subscriptionDoc = await getDoc(subscriptionRef);
      
      if (!subscriptionDoc.exists()) {
        console.log(`❌ Abonnement ${subscriptionId} non trouvé`);
        return NextResponse.json(
          { success: false, error: 'Abonnement non trouvé' },
          { status: 404 }
        );
      }
      
      const data = subscriptionDoc.data();
      console.log(`✅ Abonnement trouvé:`, {
        id: subscriptionDoc.id,
        groupName: data.groupName,
        status: data.status
      });
      
      // Convertir les timestamps Firestore en ISO
      const responseData = {
        id: subscriptionDoc.id,
        ...data,
        startDate: data.startDate?.toDate?.()?.toISOString() || data.startDate,
        endDate: data.endDate?.toDate?.()?.toISOString() || data.endDate,
        createdAt: data.createdAt?.toDate?.()?.toISOString() || data.createdAt,
        updatedAt: data.updatedAt?.toDate?.()?.toISOString() || data.updatedAt
      };
      
      return NextResponse.json({
        success: true,
        subscription: responseData
      });
    } else if (telegramUserId) {
      // Rechercher tous les abonnements de cet utilisateur
      const subscriptionsRef = collection(db, 'telegram_subscriptions');
      const q = query(
        subscriptionsRef,
        where('subscriberTelegramId', '==', telegramUserId),
        where('status', '==', 'active')
      );
      
      const snapshot = await getDocs(q);
      const subscriptions = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        startDate: doc.data().startDate?.toDate?.()?.toISOString() || doc.data().startDate,
        endDate: doc.data().endDate?.toDate?.()?.toISOString() || doc.data().endDate,
        createdAt: doc.data().createdAt?.toDate?.()?.toISOString() || doc.data().createdAt,
        updatedAt: doc.data().updatedAt?.toDate?.()?.toISOString() || doc.data().updatedAt
      }));
      
      return NextResponse.json({
        success: true,
        subscriptions: subscriptions,
        count: subscriptions.length
      });
    } else {
      return NextResponse.json(
        { success: false, error: 'Paramètres de recherche requis' },
        { status: 400 }
      );
    }
  } catch (error: any) {
    console.error('❌ Erreur récupération abonnement:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Erreur interne du serveur',
        details: error.message 
      },
      { status: 500 }
    );
  }
}