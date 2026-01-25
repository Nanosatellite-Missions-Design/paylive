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
  Timestamp
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

// Fonction pour calculer la date d'expiration
const calculateEndDate = (subscriptionType: string): Date => {
  const now = new Date();
  const endDate = new Date(now);
  
  // Convertir les différents types en jours
  switch (subscriptionType) {
    case 'trois_jours':
      endDate.setDate(now.getDate() + 3);
      break;
    case 'hebdomadaire':
      endDate.setDate(now.getDate() + 7);
      break;
    case 'mensuelle':
      endDate.setDate(now.getDate() + 30);
      break;
    case 'trimestrielle':
      endDate.setDate(now.getDate() + 90); // 3 mois
      break;
    case 'annuelle':
      endDate.setFullYear(now.getFullYear() + 1);
      break;
    case 'one_time':
      endDate.setDate(now.getDate() + 30); // 30 jours par défaut
      break;
    default:
      // Si c'est un nombre de jours (ex: "30", "7")
      const days = parseInt(subscriptionType);
      if (!isNaN(days)) {
        endDate.setDate(now.getDate() + days);
      } else {
        endDate.setDate(now.getDate() + 30); // Valeur par défaut
      }
  }
  
  console.log(`📅 Calcul date d'expiration: ${subscriptionType} → ${endDate.toISOString()}`);
  return endDate;
};

// Fonction pour formater le type d'abonnement
const formatSubscriptionType = (type: string): string => {
  switch (type) {
    case 'trois_jours':
      return '3 jours';
    case 'hebdomadaire':
      return '7 jours';
    case 'mensuelle':
      return '30 jours';
    case 'trimestrielle':
      return '3 mois';
    case 'annuelle':
      return '1 an';
    case 'one_time':
      return '30 jours';
    default:
      return type;
  }
};
// new pot fucntion for vourchers
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

    // 1. VÉRIFIER SI UN ABONNEMENT EXISTE DÉJÀ
    const subscriberTelegramId = body.subscriberTelegramId || null;
    const telegramGroupId = body.telegramGroupId || null;
    const paymentTransactionId = body.paymentTransactionId;
    
    // Si fromBot est true, ignorer
    if (body.fromBot) {
      console.log('🤖 Requête du bot IGNORÉE - Abonnement déjà créé par frontend');
      return NextResponse.json({
        success: true,
        message: 'Abonnement déjà géré par frontend',
        alreadyHandled: true
      });
    }

    // 2. Données essentielles
    if (!body.groupId || !paymentTransactionId) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Données manquantes: groupId et paymentTransactionId sont requis' 
        },
        { status: 400 }
      );
    }

    // 3. Vérifier si un abonnement existe déjà pour cette transaction
    const existingSubscriptionsRef = collection(db, 'telegram_subscriptions');
    const existingQuery = query(
      existingSubscriptionsRef,
      where('paymentTransactionId', '==', paymentTransactionId)
    );
    
    const existingSnapshot = await getDocs(existingQuery);
    
    if (!existingSnapshot.empty) {
      console.log('⚠️ Abonnement existe déjà pour cette transaction');
      const existingDoc = existingSnapshot.docs[0];
      const existingData = existingDoc.data();
      
      return NextResponse.json({
        success: true,
        subscriptionId: existingDoc.id,
        message: 'Abonnement existant retourné',
        groupName: existingData.groupName,
        price: existingData.price,
        subscriberTelegramId: existingData.subscriberTelegramId,
        telegramGroupId: existingData.telegramGroupId,
        inviteLink: existingData.botInviteLink,
        notificationSent: false,
        addedToGroup: false,
        alreadyExists: true
      });
    }

    // 4. Récupérer les infos du groupe
    let groupName = body.groupName || "Groupe Telegram";
    let creatorUid = body.creatorUid || null;
    
    // MODIFIÉ ICI : Utiliser le montant après réduction si voucher appliqué
    let originalAmount = parseFloat(body.originalAmount?.toString() || body.paymentAmount?.toString() || body.price?.toString() || '0');
    let finalAmount = parseFloat(body.paymentAmount?.toString() || body.price?.toString() || '0');
    let discountAmount = body.discountAmount || 0;
    let voucherCode = body.voucherCode || null;
    
    // Si voucher appliqué, utiliser le montant final
    let price = body.voucherApplied ? finalAmount : originalAmount;
    
    let subscriptionType = body.subscriptionType || 'one_time';

    // 5. Calculer la date d'expiration
    const now = new Date();
    const endDate = calculateEndDate(subscriptionType);

    console.log('🔍 ID Telegram à enregistrer:', subscriberTelegramId);
    console.log(`💰 Prix: ${price} XAF (Original: ${originalAmount}, Réduction: ${discountAmount})`);
    console.log(`📅 Abonnement ${formatSubscriptionType(subscriptionType)} - Expire le: ${endDate.toISOString()}`);

    // 6. ENREGISTRER LE VOUCHER SI APPLIQUÉ
    if (voucherCode && discountAmount > 0) {
      try {
        console.log(`🎫 Enregistrement application voucher: ${voucherCode}`);
        
        // Récupérer le voucher pour obtenir son ID
        const vouchersRef = collection(db, 'vouchers');
        const voucherQuery = query(
          vouchersRef,
          where('code', '==', voucherCode.toUpperCase().trim())
        );
        
        const voucherSnapshot = await getDocs(voucherQuery);
        if (!voucherSnapshot.empty) {
          const voucherDoc = voucherSnapshot.docs[0];
          const voucherId = voucherDoc.id;
          
          // Enregistrer l'application
          const voucherUsageData = {
            voucherId: voucherId,
            code: voucherCode,
            originalAmount: originalAmount,
            discountAmount: discountAmount,
            finalAmount: price,
            userId: creatorUid,
            telegramGroupId: telegramGroupId,
            transactionId: paymentTransactionId,
            subscriptionType: subscriptionType,
            appliedAt: serverTimestamp()
          };
          
          await addDoc(collection(db, 'voucher_applications'), voucherUsageData);
          console.log('✅ Application voucher enregistrée pour abonnement Telegram');
        }
      } catch (voucherError: any) {
        console.warn('⚠️ Erreur enregistrement voucher pour abonnement:', voucherError);
        // Ne pas bloquer la création de l'abonnement si erreur voucher
      }
    }

    // 7. Créer l'abonnement dans Firestore
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
      originalPrice: originalAmount, // Nouveau champ
      discountAmount: discountAmount, // Nouveau champ
      voucherCode: voucherCode, // Nouveau champ
      paymentTransactionId: paymentTransactionId,
      subscriptionType: subscriptionType,
      paymentAmount: price,
      
      // Statut
      status: 'active',
      startDate: Timestamp.fromDate(now),
      endDate: Timestamp.fromDate(endDate),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      addedToGroup: false,
      botInviteLink: null,
      paymentConfirmed: true,
      
      // Métadonnées
      fromBot: false,
      source: 'frontend_payment',
      voucherApplied: !!voucherCode // Nouveau champ
    };

    console.log('📝 Création de l\'abonnement avec:', {
      groupName: groupName,
      price: price,
      originalPrice: originalAmount,
      discount: discountAmount,
      subscriberTelegramId: subscriberTelegramId,
      subscriptionType: subscriptionType,
      endDate: endDate.toISOString()
    });

    const subscriptionRef = await addDoc(
      collection(db, 'telegram_subscriptions'),
      subscriptionData
    );

    const subscriptionId = subscriptionRef.id;
    console.log('✅ Abonnement créé avec ID:', subscriptionId);

    // 8. ENVOYER LE LIEN D'INVITATION DIRECTEMENT VIA L'API TELEGRAM
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
          const messageText = `🎉 *Félicitations !*\n\n` +
            `Votre abonnement à *${groupName}* a été activé avec succès !\n\n` +
            `💰 Montant: ${price} XAF\n` +
            (discountAmount > 0 ? `🎫 Réduction appliquée: ${discountAmount} XAF\n` : '') +
            `📅 Durée: ${formatSubscriptionType(subscriptionType)}\n` +
            `📆 Expire le: ${endDate.toLocaleDateString('fr-FR')}\n\n` +
            `Cliquez sur le bouton ci-dessous pour rejoindre le groupe (valable 24h) :`;
          
          const messageResponse = await fetch(
            `https://api.telegram.org/bot${botToken}/sendMessage`,
            {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                chat_id: subscriberTelegramId,
                text: messageText,
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
              inviteLinkExpires: Timestamp.fromDate(new Date(Date.now() + 24 * 60 * 60 * 1000))
            });
          } else {
            console.warn('⚠️ Message Telegram non envoyé:', messageData);
          }
        } else {
          console.warn('⚠️ Impossible de créer le lien:', inviteData);
        }
      } catch (telegramError) {
        console.warn('⚠️ Erreur envoi via API Telegram:', telegramError);
      }
    }

    // 9. Retourner la réponse
    return NextResponse.json({
      success: true,
      subscriptionId: subscriptionId,
      message: 'Abonnement créé avec succès',
      groupName: groupName,
      price: price,
      originalPrice: originalAmount,
      discountAmount: discountAmount,
      subscriberTelegramId: subscriberTelegramId,
      telegramGroupId: telegramGroupId,
      subscriptionType: subscriptionType,
      formattedSubscriptionType: formatSubscriptionType(subscriptionType),
      endDate: endDate.toISOString(),
      inviteLink: inviteLink,
      notificationSent: notificationSent,
      addedToGroup: false,
      metadata: {
        groupId: body.groupId,
        paymentTransactionId: paymentTransactionId,
        subscriptionType: subscriptionType,
        voucherApplied: !!voucherCode,
        voucherCode: voucherCode
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

// export async function POST(request: NextRequest) {
//   try {
//     // Vérifier que Firebase est initialisé
//     if (!db) {
//       console.error('❌ Firebase non initialisé dans API');
//       return NextResponse.json(
//         { success: false, error: 'Base de données non disponible' },
//         { status: 500 }
//       );
//     }

//     const body = await request.json();
//     console.log('📦 Données reçues pour abonnement:', JSON.stringify(body, null, 2));

//     // 1. VÉRIFIER SI UN ABONNEMENT EXISTE DÉJÀ
//     const subscriberTelegramId = body.subscriberTelegramId || null;
//     const telegramGroupId = body.telegramGroupId || null;
//     const paymentTransactionId = body.paymentTransactionId;
    
//     // Si fromBot est true, c'est le bot qui essaie de créer un abonnement
//     // IGNORER cette requête car l'abonnement a déjà été créé par le frontend
//     if (body.fromBot) {
//       console.log('🤖 Requête du bot IGNORÉE - Abonnement déjà créé par frontend');
//       return NextResponse.json({
//         success: true,
//         message: 'Abonnement déjà géré par frontend',
//         alreadyHandled: true
//       });
//     }

//     // 2. Données essentielles
//     if (!body.groupId || !paymentTransactionId) {
//       return NextResponse.json(
//         { 
//           success: false,
//           error: 'Données manquantes: groupId et paymentTransactionId sont requis' 
//         },
//         { status: 400 }
//       );
//     }

//     // 3. Vérifier si un abonnement existe déjà pour cette transaction
//     const existingSubscriptionsRef = collection(db, 'telegram_subscriptions');
//     const existingQuery = query(
//       existingSubscriptionsRef,
//       where('paymentTransactionId', '==', paymentTransactionId)
//     );
    
//     const existingSnapshot = await getDocs(existingQuery);
    
//     if (!existingSnapshot.empty) {
//       console.log('⚠️ Abonnement existe déjà pour cette transaction, retourner celui existant');
//       const existingDoc = existingSnapshot.docs[0];
//       const existingData = existingDoc.data();
      
//       return NextResponse.json({
//         success: true,
//         subscriptionId: existingDoc.id,
//         message: 'Abonnement existant retourné',
//         groupName: existingData.groupName,
//         price: existingData.price,
//         subscriberTelegramId: existingData.subscriberTelegramId,
//         telegramGroupId: existingData.telegramGroupId,
//         inviteLink: existingData.botInviteLink,
//         notificationSent: false,
//         addedToGroup: false,
//         alreadyExists: true
//       });
//     }

//     // 4. Récupérer les infos du groupe
//     let groupName = body.groupName || "Groupe Telegram";
//     let creatorUid = body.creatorUid || null;
//     let price = parseFloat(body.paymentAmount?.toString() || body.price?.toString() || '0');
//     let subscriptionType = body.subscriptionType || 'one_time';

//     // 5. Calculer la date d'expiration
//     const now = new Date();
//     const endDate = calculateEndDate(subscriptionType);

//     console.log('🔍 ID Telegram à enregistrer:', subscriberTelegramId);
//     console.log(`📅 Abonnement ${formatSubscriptionType(subscriptionType)} - Expire le: ${endDate.toISOString()}`);

//     // 6. Créer l'abonnement dans Firestore
//     const subscriptionData = {
//       // Données de base
//       groupId: body.groupId,
//       telegramGroupId: telegramGroupId,
//       groupName: groupName,
//       creatorUid: creatorUid,
      
//       // Informations abonné
//       subscriberUid: body.subscriberUid || null,
//       subscriberTelegramId: subscriberTelegramId,
//       subscriberTelegramUsername: body.subscriberTelegramUsername || null,
//       subscriberName: body.subscriberName || "Utilisateur Telegram",
//       subscriberEmail: body.subscriberEmail || null,
      
//       // Paiement
//       price: price,
//       paymentTransactionId: paymentTransactionId,
//       subscriptionType: subscriptionType,
//       paymentAmount: price,
      
//       // Statut
//       status: 'active',
//       startDate: Timestamp.fromDate(now),
//       endDate: Timestamp.fromDate(endDate),
//       createdAt: serverTimestamp(),
//       updatedAt: serverTimestamp(),
//       addedToGroup: false,
//       botInviteLink: null,
//       paymentConfirmed: true,
      
//       // Métadonnées
//       fromBot: false,
//       source: 'frontend_payment'
//     };

//     console.log('📝 Création de l\'abonnement avec:', {
//       groupName: groupName,
//       price: price,
//       subscriberTelegramId: subscriberTelegramId,
//       telegramGroupId: telegramGroupId,
//       subscriptionType: subscriptionType,
//       endDate: endDate.toISOString()
//     });

//     const subscriptionRef = await addDoc(
//       collection(db, 'telegram_subscriptions'),
//       subscriptionData
//     );

//     const subscriptionId = subscriptionRef.id;
//     console.log('✅ Abonnement créé avec ID:', subscriptionId);

//     // 7. ENVOYER LE LIEN D'INVITATION DIRECTEMENT VIA L'API TELEGRAM
//     let inviteLink = null;
//     let notificationSent = false;
    
//     if (subscriberTelegramId && telegramGroupId) {
//       try {
//         console.log('🤖 Envoi du lien via API Telegram...');
        
//         const botToken = process.env.TELEGRAM_BOT_TOKEN || "8526096119:AAE4gLXvCR7QxC7M6KL9XZuYIax8woKzyng";
        
//         // Créer un lien d'invitation
//         const inviteResponse = await fetch(
//           `https://api.telegram.org/bot${botToken}/createChatInviteLink`,
//           {
//             method: 'POST',
//             headers: { 'Content-Type': 'application/json' },
//             body: JSON.stringify({
//               chat_id: telegramGroupId,
//               member_limit: 1,
//               expire_date: Math.floor(Date.now() / 1000) + (24 * 60 * 60),
//               name: `Abonnement ${groupName}`
//             })
//           }
//         );
        
//         const inviteData = await inviteResponse.json();
        
//         if (inviteData.ok && inviteData.result.invite_link) {
//           inviteLink = inviteData.result.invite_link;
          
//           // Envoyer le message à l'utilisateur
//           const messageResponse = await fetch(
//             `https://api.telegram.org/bot${botToken}/sendMessage`,
//             {
//               method: 'POST',
//               headers: { 'Content-Type': 'application/json' },
//               body: JSON.stringify({
//                 chat_id: subscriberTelegramId,
//                 text: `🎉 *Félicitations !*\n\n` +
//                       `Votre abonnement à *${groupName}* a été activé avec succès !\n\n` +
//                       `💰 Montant: ${price} XAF\n` +
//                       `📅 Durée: ${formatSubscriptionType(subscriptionType)}\n` +
//                       `📆 Expire le: ${endDate.toLocaleDateString('fr-FR')}\n\n` +
//                       `Cliquez sur le bouton ci-dessous pour rejoindre le groupe (valable 24h) :`,
//                 parse_mode: 'Markdown',
//                 reply_markup: {
//                   inline_keyboard: [[
//                     {
//                       text: "🚀 Rejoindre le groupe",
//                       url: inviteLink
//                     }
//                   ]]
//                 }
//               })
//             }
//           );
          
//           const messageData = await messageResponse.json();
          
//           if (messageData.ok) {
//             notificationSent = true;
//             console.log('📨 Notification envoyée avec succès');
            
//             // Mettre à jour l'abonnement avec le lien
//             await updateDoc(subscriptionRef, {
//               botInviteLink: inviteLink,
//               invitedAt: serverTimestamp(),
//               updatedAt: serverTimestamp(),
//               inviteLinkExpires: Timestamp.fromDate(new Date(Date.now() + 24 * 60 * 60 * 1000))
//             });
//           } else {
//             console.warn('⚠️ Message Telegram non envoyé:', messageData);
//           }
//         } else {
//           console.warn('⚠️ Impossible de créer le lien:', inviteData);
//         }
//       } catch (telegramError) {
//         console.warn('⚠️ Erreur envoi via API Telegram:', telegramError);
//       }
//     }

//     // 8. Retourner la réponse
//     return NextResponse.json({
//       success: true,
//       subscriptionId: subscriptionId,
//       message: 'Abonnement créé avec succès',
//       groupName: groupName,
//       price: price,
//       subscriberTelegramId: subscriberTelegramId,
//       telegramGroupId: telegramGroupId,
//       subscriptionType: subscriptionType,
//       formattedSubscriptionType: formatSubscriptionType(subscriptionType),
//       endDate: endDate.toISOString(),
//       inviteLink: inviteLink,
//       notificationSent: notificationSent,
//       addedToGroup: false,
//       metadata: {
//         groupId: body.groupId,
//         paymentTransactionId: paymentTransactionId,
//         subscriptionType: subscriptionType
//       }
//     });

//   } catch (error: any) {
//     console.error('❌ Erreur création abonnement:', error);
//     console.error('Stack:', error.stack);
    
//     return NextResponse.json(
//       { 
//         success: false,
//         error: 'Erreur création abonnement',
//         details: error.message
//       },
//       { status: 500 }
//     );
//   }
// }

// GET pour récupérer un abonnement

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
        status: data.status,
        subscriptionType: data.subscriptionType,
        endDate: data.endDate?.toDate?.()?.toISOString()
      });
      
      // Convertir les timestamps Firestore
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
        where('subscriberTelegramId', '==', telegramUserId)
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