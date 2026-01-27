import { NextRequest, NextResponse } from 'next/server';
import { initializeApp, getApps } from 'firebase/app';
import { 
  getFirestore, 
  collection, 
  addDoc, 
  serverTimestamp, 
  Timestamp,
  updateDoc,
  query,
  where,
  getDocs
} from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyB5g7s0q2eR4WXOp7OlKJNpXW0TRbFX9PM",
  authDomain: "paylive-cd9a1.firebaseapp.com",
  projectId: "paylive-cd9a1",
  storageBucket: "paylive-cd9a1.firebasestorage.app",
  messagingSenderId: "163452827765",
  appId: "1:163452827765:web:ee5cd11c4ee0497dcda03c"
};

const getDb = () => {
  const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);
  return getFirestore(app);
};

// Même fonction que dans l'API Telegram Subscriptions
const calculateEndDate = (subscriptionType: string): Date => {
  const now = new Date();
  const endDate = new Date(now);
  
  switch (subscriptionType) {
    case 'trois_jours': endDate.setDate(now.getDate() + 3); break;
    case 'hebdomadaire': endDate.setDate(now.getDate() + 7); break;
    case 'mensuelle': endDate.setDate(now.getDate() + 30); break;
    case 'trimestrielle': endDate.setDate(now.getDate() + 90); break;
    case 'annuelle': endDate.setFullYear(now.getFullYear() + 1); break;
    case 'one_time': endDate.setDate(now.getDate() + 30); break;
    default:
      const days = parseInt(subscriptionType);
      endDate.setDate(now.getDate() + (!isNaN(days) ? days : 30));
  }
  return endDate;
};

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    console.log('📦 Création abonnement gratuit - Données reçues:', JSON.stringify(body, null, 2));
    
    const { 
      groupId, 
      telegramGroupId, 
      groupName, 
      subscriberTelegramId,
      subscriptionType = 'one_time',
      voucherCode 
    } = body;
    
    if (!groupId || !subscriberTelegramId) {
      console.error('❌ Données manquantes:', { groupId, subscriberTelegramId });
      return NextResponse.json(
        { success: false, error: 'groupId et subscriberTelegramId requis' },
        { status: 400 }
      );
    }
    
    const db = getDb();
    
    // 🔍 DEBUG COMPLET DE LA RECHERCHE
    console.log('🔍 Début recherche creatorUid pour groupId:', groupId);
    
    // 1. Chercher dans telegram_groups
    console.log('🔍 Étape 1: Recherche dans collection telegram_groups');
    const groupsRef = collection(db, 'telegram_groups');
    const groupQuery = query(groupsRef, where('groupId', '==', groupId));
    const groupSnapshot = await getDocs(groupQuery);
    
    console.log(`📊 Résultat telegram_groups: ${groupSnapshot.size} documents trouvés`);
    
    if (!groupSnapshot.empty) {
      const groupData = groupSnapshot.docs[0].data();
      console.log('✅ Données trouvées dans telegram_groups:', {
        id: groupSnapshot.docs[0].id,
        ...groupData
      });
      
      const creatorUid = groupData.creatorUid || groupData.uid;
      console.log('🎯 CreatorUid extrait:', creatorUid);
      
      // CONTINUER AVEC LA CRÉATION DE L'ABONNEMENT
      return await createSubscription(db, {
        ...body,
        creatorUid,
        source: 'telegram_groups'
      });
    }
    
    // 2. Chercher dans les sous-collections users/telegram_groups
    console.log('🔍 Étape 2: Recherche dans sous-collections utilisateurs');
    const usersRef = collection(db, 'users');
    const usersSnapshot = await getDocs(usersRef);
    
    console.log(`📊 Nombre total d'utilisateurs à scanner: ${usersSnapshot.size}`);
    
    for (const [index, userDoc] of usersSnapshot.docs.entries()) {
      const userId = userDoc.id;
      console.log(`🔍 Scan utilisateur ${index + 1}/${usersSnapshot.size}: ${userId}`);
      
      try {
        const userGroupsRef = collection(db, `users/${userId}/telegram_groups`);
        const userGroupQuery = query(userGroupsRef, where('groupId', '==', groupId));
        const userGroupSnapshot = await getDocs(userGroupQuery);
        
        if (!userGroupSnapshot.empty) {
          const groupData = userGroupSnapshot.docs[0].data();
          console.log('✅ Groupe trouvé chez utilisateur:', {
            userId,
            groupName: groupData.name,
            telegramGroupId: groupData.telegramGroupId,
            data: groupData
          });
          
          // CONTINUER AVEC LA CRÉATION DE L'ABONNEMENT
          return await createSubscription(db, {
            ...body,
            creatorUid: userId,
            source: `user_subcollection_${userId}`
          });
        }
      } catch (error) {
        console.log(`ℹ️ Utilisateur ${userId} n'a pas de sous-collection telegram_groups`);
      }
    }
    
    // 3. Chercher dans une autre collection possible
    console.log('🔍 Étape 3: Recherche dans d\'autres collections possibles');
    
    // Essayer dans la collection 'groups'
    const groupsAltRef = collection(db, 'groups');
    const groupsAltQuery = query(groupsAltRef, where('groupId', '==', groupId));
    const groupsAltSnapshot = await getDocs(groupsAltQuery);
    
    console.log(`📊 Résultat collection 'groups': ${groupsAltSnapshot.size} documents`);
    
    if (!groupsAltSnapshot.empty) {
      const groupData = groupsAltSnapshot.docs[0].data();
      const creatorUid = groupData.creatorUid || groupData.uid || groupData.userId;
      console.log('✅ Groupe trouvé dans collection "groups":', {
        creatorUid,
        ...groupData
      });
      
      return await createSubscription(db, {
        ...body,
        creatorUid,
        source: 'groups_collection'
      });
    }
    
    // 4. Liste de toutes les collections disponibles pour debug
    console.log('🔍 Étape 4: Scan des collections disponibles');
    
    // Note: En production, vous ne pouvez pas lister toutes les collections
    // Mais pour le debug, on peut chercher dans des collections connues
    
    const knownCollections = [
      'telegram_groups',
      'groups', 
      'user_groups',
      'channels',
      'telegram_channels'
    ];
    
    for (const collName of knownCollections) {
      try {
        const collRef = collection(db, collName);
        const collQuery = query(collRef, where('groupId', '==', groupId));
        const collSnapshot = await getDocs(collQuery);
        
        if (!collSnapshot.empty) {
          console.log(`✅ Groupe trouvé dans collection "${collName}":`, {
            count: collSnapshot.size,
            firstDoc: collSnapshot.docs[0].data()
          });
          
          const groupData = collSnapshot.docs[0].data();
          const creatorUid = groupData.creatorUid || groupData.uid || groupData.userId || groupData.ownerId;
          
          if (creatorUid) {
            return await createSubscription(db, {
              ...body,
              creatorUid,
              source: collName
            });
          }
        }
      } catch (error) {
        // Collection n'existe pas, continuer
      }
    }
    
    console.log('❌ Groupe non trouvé dans aucune collection connue:', groupId);
    return NextResponse.json({
      success: false,
      error: `Groupe ${groupId} non trouvé dans la base de données`,
      debug: {
        searchedCollections: ['telegram_groups', 'groups', 'users/*/telegram_groups'],
        suggestions: 'Le groupe peut être stocké dans une collection différente'
      }
    }, { status: 404 });
    
  } catch (error: any) {
    console.error('❌ Erreur création abonnement:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error.message,
        stack: error.stack 
      },
      { status: 500 }
    );
  }
}

// Fonction séparée pour créer l'abonnement
async function createSubscription(db: any, data: any) {
  const {
    groupId,
    telegramGroupId,
    groupName,
    creatorUid,
    subscriberTelegramId,
    subscriptionType,
    voucherCode,
    originalAmount,
    discountAmount,
    source
  } = data;
  
  console.log('🎯 Création abonnement avec:', {
    groupId,
    creatorUid,
    source,
    telegramGroupId,
    subscriberTelegramId
  });
  
  const { addDoc, collection, serverTimestamp, Timestamp, updateDoc } = await import('firebase/firestore');
  
  const now = new Date();
  const endDate = calculateEndDate(subscriptionType);
  
  const subscriptionData = {
    groupId,
    telegramGroupId: telegramGroupId || null,
    groupName: groupName || 'Groupe Telegram',
    creatorUid,
    subscriberTelegramId,
    subscriberTelegramUsername: data.subscriberTelegramUsername || null,
    subscriberName: data.subscriberName || "Utilisateur Telegram",
    subscriberEmail: data.subscriberEmail || null,
    price: 0,
    originalPrice: originalAmount || 0,
    discountAmount: discountAmount || 0,
    voucherCode: voucherCode || null,
    paymentTransactionId: `free_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    subscriptionType,
    paymentAmount: 0,
    status: 'active',
    startDate: Timestamp.fromDate(now),
    endDate: Timestamp.fromDate(endDate),
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    addedToGroup: false,
    botInviteLink: null,
    paymentConfirmed: true,
    paymentMethod: 'voucher_100_percent',
    fromBot: false,
    source: 'voucher_100_percent',
    voucherApplied: true,
    isFreeSubscription: true,
    debug_source: source
  };
  
  const subscriptionRef = await addDoc(
    collection(db, 'telegram_subscriptions'),
    subscriptionData
  );
  
  const subscriptionId = subscriptionRef.id;
  console.log('✅ Abonnement créé avec ID:', subscriptionId);
  
  // ENVOYER LE LIEN TELEGRAM
  let inviteLink = null;
  if (telegramGroupId && subscriberTelegramId) {
    try {
      const botToken = process.env.TELEGRAM_BOT_TOKEN || "8526096119:AAE4gLXvCR7QxC7M6KL9XZuYIax8woKzyng";
      
      console.log('🤖 Envoi invitation Telegram:', {
        chat_id: telegramGroupId,
        user_id: subscriberTelegramId
      });
      
      const inviteResponse = await fetch(
        `https://api.telegram.org/bot${botToken}/createChatInviteLink`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: telegramGroupId,
            member_limit: 1,
            expire_date: Math.floor(Date.now() / 1000) + (24 * 60 * 60),
            name: `Abonnement gratuit ${groupName}`
          })
        }
      );
      
      const inviteData = await inviteResponse.json();
      console.log('📡 Réponse API Telegram (invite):', inviteData);
      
      if (inviteData.ok && inviteData.result.invite_link) {
        inviteLink = inviteData.result.invite_link;
        
        // Envoyer le message
        const messageResponse = await fetch(
          `https://api.telegram.org/bot${botToken}/sendMessage`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              chat_id: subscriberTelegramId,
              text: `🎁 *OFFRE 100% GRATUITE !*\n\n` +
                    `Votre abonnement à *${groupName}* a été activé !\n\n` +
                    `💰 Montant: 0 XAF (100% offert)\n` +
                    `🎫 Code promo: ${voucherCode || 'VOUCHER'}\n` +
                    `📅 Durée: ${subscriptionType}\n` +
                    `📆 Expire le: ${endDate.toLocaleDateString('fr-FR')}\n\n` +
                    `Cliquez ici pour rejoindre le groupe :\n` +
                    `${inviteLink}`,
              parse_mode: 'Markdown'
            })
          }
        );
        
        const messageData = await messageResponse.json();
        console.log('📡 Réponse API Telegram (message):', messageData);
        
        if (messageData.ok) {
          await updateDoc(subscriptionRef, {
            botInviteLink: inviteLink,
            invitedAt: serverTimestamp(),
            addedToGroup: true,
            lastNotificationSent: serverTimestamp()
          });
          
          console.log('✅ Notification Telegram envoyée');
        }
      }
    } catch (telegramError: any) {
      console.warn('⚠️ Erreur Telegram:', telegramError.message);
    }
  } else {
    console.warn('⚠️ Impossible d\'envoyer Telegram: telegramGroupId ou subscriberTelegramId manquant');
  }
  
  return NextResponse.json({
    success: true,
    subscriptionId,
    transactionId: subscriptionData.paymentTransactionId,
    inviteLink,
    message: 'Abonnement créé avec succès',
    debug: {
      creatorUidSource: source
    }
  });
}