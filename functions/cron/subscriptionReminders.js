// const { initializeApp } = require('firebase/app');
// const { 
//   getFirestore, 
//   collection, 
//   query, 
//   where, 
//   getDocs, 
//   updateDoc,
//   doc,
//   Timestamp 
// } = require('firebase/firestore');

// // Configuration Firebase IDENTIQUE à celle du bot
// const firebaseConfig = {
//   apiKey: "AIzaSyB5g7s0q2eR4WXOp7OlKJNpXW0TRbFX9PM",
//   authDomain: "paylive-cd9a1.firebaseapp.com",
//   projectId: "paylive-cd9a1",
//   storageBucket: "paylive-cd9a1.firebasestorage.app",
//   messagingSenderId: "163452827765",
//   appId: "1:163452827765:web:ee5cd11c4ee0497dcda03c"
// };

// const BOT_TOKEN = "8526096119:AAE4gLXvCR7QxC7M6KL9XZuYIax8woKzyng";

// /**
//  * Fonction principale pour vérifier les abonnements expirants
//  */
// async function checkExpiringSubscriptions() {
//   try {
//     console.log('🔄 Début de la vérification des abonnements expirants...');
    
//     // Initialiser Firebase avec le SDK client (pas Admin)
//     const app = initializeApp(firebaseConfig);
//     const db = getFirestore(app);
    
//     const now = new Date();
//     const twoDaysFromNow = new Date(now);
//     twoDaysFromNow.setDate(now.getDate() + 2);
    
//     // 1. Rechercher les abonnements actifs qui expirent dans les 2 prochains jours
//     const subscriptionsRef = collection(db, 'telegram_subscriptions');
//     const q = query(
//       subscriptionsRef,
//       where('status', '==', 'active')
//     );
    
//     const snapshot = await getDocs(q);
//     console.log(`📊 ${snapshot.size} abonnements actifs trouvés`);
    
//     let remindersSent = 0;
//     let expiredHandled = 0;
    
//     for (const docSnap of snapshot.docs) {
//       const subscription = docSnap.data();
//       const subscriptionId = docSnap.id;
      
//       // Convertir la date d'expiration
//       let endDate;
//       if (subscription.endDate && subscription.endDate.toDate) {
//         endDate = subscription.endDate.toDate();
//       } else if (subscription.endDate) {
//         endDate = new Date(subscription.endDate);
//       } else {
//         console.warn(`⚠️ Pas de date d'expiration pour l'abonnement ${subscriptionId}`);
//         continue;
//       }
      
//       const daysLeft = Math.ceil((endDate - now) / (1000 * 60 * 60 * 24));
//       const telegramUserId = subscription.subscriberTelegramId;
      
//       if (!telegramUserId) {
//         console.log(`⚠️ Pas d'ID Telegram pour l'abonnement ${subscriptionId}`);
//         continue;
//       }
      
//       console.log(`📅 Abonnement ${subscriptionId}: ${daysLeft} jours restants`);
      
//       // 2. Si l'abonnement expire dans 2 jours, envoyer un rappel
//       if (daysLeft === 2 && !subscription.reminderSent2Days) {
//         try {
//           await sendTelegramReminder(telegramUserId, subscription, daysLeft);
          
//           // Marquer que le rappel a été envoyé
//           await updateDoc(docSnap.ref, {
//             reminderSent2Days: true,
//             reminderSent2DaysAt: Timestamp.fromDate(now),
//             lastReminderSent: Timestamp.fromDate(now)
//           });
          
//           remindersSent++;
//           console.log(`✅ Rappel 2 jours envoyé à ${telegramUserId}`);
//         } catch (error) {
//           console.error(`❌ Erreur envoi rappel à ${telegramUserId}:`, error.message);
//         }
//       }
      
//       // 3. Si l'abonnement expire aujourd'hui, envoyer une notification
//       else if (daysLeft === 0 && !subscription.reminderSentToday) {
//         try {
//           await sendTelegramReminder(telegramUserId, subscription, 0);
          
//           await updateDoc(docSnap.ref, {
//             reminderSentToday: true,
//             reminderSentTodayAt: Timestamp.fromDate(now),
//             lastReminderSent: Timestamp.fromDate(now)
//           });
          
//           remindersSent++;
//           console.log(`✅ Notification jour J envoyée à ${telegramUserId}`);
//         } catch (error) {
//           console.error(`❌ Erreur envoi notification jour J:`, error.message);
//         }
//       }
      
//       // 4. Si l'abonnement est expiré (jours négatifs), le marquer comme expiré
//       else if (daysLeft < 0 && subscription.status === 'active') {
//         try {
//           // Marquer comme expiré
//           await updateDoc(docSnap.ref, {
//             status: 'expired',
//             expiredAt: Timestamp.fromDate(now),
//             updatedAt: Timestamp.fromDate(now)
//           });
          
//           console.log(`📝 Abonnement ${subscriptionId} marqué comme expiré`);
          
//           // Envoyer notification d'expiration
//           await sendExpirationNotification(telegramUserId, subscription);
          
//           expiredHandled++;
//         } catch (error) {
//           console.error(`❌ Erreur traitement expiration:`, error.message);
//         }
//       }
//     }
    
//     console.log(`\n📈 RÉSUMÉ:`);
//     console.log(`✅ Rappels envoyés: ${remindersSent}`);
//     console.log(`📝 Abonnements expirés traités: ${expiredHandled}`);
//     console.log(`🎯 Vérification terminée à ${new Date().toLocaleTimeString()}`);
    
//     return {
//       success: true,
//       remindersSent,
//       expiredHandled,
//       totalChecked: snapshot.size
//     };
    
//   } catch (error) {
//     console.error('❌ Erreur critique dans checkExpiringSubscriptions:', error);
//     throw error;
//   }
// }

// /**
//  * Envoie un rappel Telegram à un utilisateur
//  */
// async function sendTelegramReminder(telegramUserId, subscription, daysLeft) {
//   try {
//     const groupName = subscription.groupName || 'le groupe';
//     const price = subscription.price || '?';
//     const endDate = subscription.endDate?.toDate?.() || new Date(subscription.endDate);
//     let message = '';
    
//     if (daysLeft === 2) {
//       message = `🔔 *Rappel d'abonnement*\n\n` +
//         `Votre abonnement à *${groupName}* expire dans 2 jours.\n\n` +
//         `💰 Prix: ${price} XAF\n` +
//         `📅 Date d'expiration: ${endDate.toLocaleDateString('fr-FR')}\n\n` +
//         `Pour renouveler votre abonnement, cliquez sur le bouton ci-dessous :`;
//     } else if (daysLeft === 0) {
//       message = `⚠️ *Dernier jour d'abonnement*\n\n` +
//         `Votre abonnement à *${groupName}* expire aujourd'hui !\n\n` +
//         `💰 Prix: ${price} XAF\n` +
//         `📅 Date d'expiration: AUJOURD'HUI\n\n` +
//         `Renouvelez maintenant pour ne pas perdre l'accès :`;
//     }
    
//     const paymentLink = `https://paylivecm.shop/telegram?telegramGroupId=${subscription.telegramGroupId}&telegramUserId=${telegramUserId}`;
    
//     const response = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
//       method: 'POST',
//       headers: { 'Content-Type': 'application/json' },
//       body: JSON.stringify({
//         chat_id: telegramUserId,
//         text: message,
//         parse_mode: 'Markdown',
//         reply_markup: {
//           inline_keyboard: [[
//             { text: "🔄 Renouveler l'abonnement", url: paymentLink }
//           ]]
//         }
//       })
//     });
    
//     const data = await response.json();
    
//     if (!data.ok) {
//       if (data.error_code === 403) {
//         console.warn(`⚠️ Utilisateur ${telegramUserId} a bloqué le bot`);
//       } else {
//         throw new Error(`Telegram API error: ${data.description}`);
//       }
//     }
    
//     return true;
//   } catch (error) {
//     console.error(`❌ Erreur envoi Telegram:`, error.message);
//     return false;
//   }
// }

// /**
//  * Envoie une notification d'expiration
//  */
// async function sendExpirationNotification(telegramUserId, subscription) {
//   try {
//     const groupName = subscription.groupName || 'le groupe';
//     const price = subscription.price || '?';
    
//     const message = `❌ *Abonnement expiré*\n\n` +
//       `Votre abonnement à *${groupName}* a expiré.\n\n` +
//       `💰 Prix: ${price} XAF\n` +
//       `📅 Date d'expiration: Passée\n\n` +
//       `Pour continuer à accéder au groupe, renouvelez votre abonnement :`;
    
//     const paymentLink = `https://paylivecm.shop/telegram?telegramGroupId=${subscription.telegramGroupId}&telegramUserId=${telegramUserId}`;
    
//     const response = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
//       method: 'POST',
//       headers: { 'Content-Type': 'application/json' },
//       body: JSON.stringify({
//         chat_id: telegramUserId,
//         text: message,
//         parse_mode: 'Markdown',
//         reply_markup: {
//           inline_keyboard: [[
//             { text: "🔄 Renouveler l'abonnement", url: paymentLink }
//           ]]
//         }
//       })
//     });
    
//     const data = await response.json();
    
//     if (!data.ok && data.error_code !== 403) {
//       throw new Error(`Telegram API error: ${data.description}`);
//     }
    
//     return true;
//   } catch (error) {
//     console.error(`❌ Erreur envoi notification expiration:`, error.message);
//     return false;
//   }
// }

// // Exécution directe pour les tests
// if (require.main === module) {
//   console.log('🚀 Exécution directe du cronjob...');
//   checkExpiringSubscriptions()
//     .then(result => {
//       console.log('✅ Cronjob terminé avec succès');
//       console.log('Result:', result);
//       process.exit(0);
//     })
//     .catch(error => {
//       console.error('❌ Erreur lors de l\'exécution:', error);
//       process.exit(1);
//     });
// }

// module.exports = {
//   checkExpiringSubscriptions,
//   sendTelegramReminder,
//   sendExpirationNotification
// };

const { initializeApp } = require('firebase/app');
const { 
  getFirestore, 
  collection, 
  query, 
  where, 
  getDocs, 
  updateDoc,
  doc,
  Timestamp 
} = require('firebase/firestore');

// Configuration Firebase
const firebaseConfig = {
  apiKey: "AIzaSyB5g7s0q2eR4WXOp7OlKJNpXW0TRbFX9PM",
  authDomain: "paylive-cd9a1.firebaseapp.com",
  projectId: "paylive-cd9a1",
  storageBucket: "paylive-cd9a1.firebasestorage.app",
  messagingSenderId: "163452827765",
  appId: "1:163452827765:web:ee5cd11c4ee0497dcda03c"
};

const BOT_TOKEN = "8526096119:AAE4gLXvCR7QxC7M6KL9XZuYIax8woKzyng";

/**
 * Fonction principale pour vérifier les abonnements expirants - VERSION CORRIGÉE
 */
async function checkExpiringSubscriptions() {
  try {
    console.log('🔄 Début de la vérification des abonnements expirants...');
    console.log(`📅 Date/heure du système: ${new Date().toLocaleString('fr-FR')}`);
    
    // Initialiser Firebase
    const app = initializeApp(firebaseConfig);
    const db = getFirestore(app);
    
    const now = new Date();
    
    // 1. Rechercher TOUS les abonnements actifs
    const subscriptionsRef = collection(db, 'telegram_subscriptions');
    const q = query(subscriptionsRef, where('status', '==', 'active'));
    
    const snapshot = await getDocs(q);
    console.log(`📊 ${snapshot.size} abonnement(s) actif(s) trouvé(s)`);
    
    let remindersSent = 0;
    let expiredHandled = 0;
    let todayRemindersSent = 0;
    
    for (const docSnap of snapshot.docs) {
      const subscription = docSnap.data();
      const subscriptionId = docSnap.id;
      
      // Convertir la date d'expiration
      let endDate;
      if (subscription.endDate && subscription.endDate.toDate) {
        endDate = subscription.endDate.toDate();
      } else if (subscription.endDate) {
        endDate = new Date(subscription.endDate);
      } else {
        console.warn(`⚠️ Pas de date d'expiration pour ${subscriptionId}`);
        continue;
      }
      
      const telegramUserId = subscription.subscriberTelegramId;
      const groupName = subscription.groupName || 'Groupe inconnu';
      
      if (!telegramUserId) {
        console.warn(`⚠️ Pas d'ID Telegram pour ${subscriptionId} (${groupName})`);
        continue;
      }
      
      // Calculer les jours restants (arrondi à l'entier supérieur)
      const timeDiff = endDate - now;
      const daysLeft = Math.ceil(timeDiff / (1000 * 60 * 60 * 24));
      
      console.log(`\n📊 Abonnement ${subscriptionId}:`);
      console.log(`   📍 Groupe: ${groupName}`);
      console.log(`   👤 Utilisateur: ${telegramUserId}`);
      console.log(`   📅 Expire le: ${endDate.toLocaleDateString('fr-FR')}`);
      console.log(`   ⏳ Jours restants: ${daysLeft}`);
      
      // 2. RAPPEL 2 JOURS AVANT : Utiliser une logique plus robuste
      if (daysLeft === 2 && !subscription.reminderSent2Days) {
        try {
          console.log(`   🔔 ACTION: Envoi rappel 2 jours avant expiration`);
          
          await sendTelegramReminder(telegramUserId, subscription, 2);
          
          // Marquer que le rappel a été envoyé
          await updateDoc(docSnap.ref, {
            reminderSent2Days: true,
            reminderSent2DaysAt: Timestamp.fromDate(now),
            lastReminderSent: Timestamp.fromDate(now),
            updatedAt: Timestamp.fromDate(now)
          });
          
          remindersSent++;
          console.log(`   ✅ Rappel 2 jours envoyé à ${telegramUserId}`);
        } catch (error) {
          console.error(`   ❌ Erreur envoi rappel 2 jours:`, error.message);
        }
      }
      
      // 3. RAPPEL JOUR J (0 jours restants)
      else if (daysLeft === 0 && !subscription.reminderSentToday) {
        try {
          console.log(`   ⚠️ ACTION: Envoi rappel jour J (expiration aujourd'hui)`);
          
          await sendTelegramReminder(telegramUserId, subscription, 0);
          
          await updateDoc(docSnap.ref, {
            reminderSentToday: true,
            reminderSentTodayAt: Timestamp.fromDate(now),
            lastReminderSent: Timestamp.fromDate(now),
            updatedAt: Timestamp.fromDate(now)
          });
          
          todayRemindersSent++;
          console.log(`   ✅ Rappel jour J envoyé à ${telegramUserId}`);
        } catch (error) {
          console.error(`   ❌ Erreur envoi rappel jour J:`, error.message);
        }
      }
      
      // 4. TRAITEMENT DES ABONNEMENTS EXPIRÉS
      else if (daysLeft < 0 && subscription.status === 'active') {
        try {
          console.log(`   ❌ ACTION: Abonnement EXPIRÉ (${daysLeft} jours)`);
          
          // 1. D'abord, marquer comme expiré dans Firestore
          await updateDoc(docSnap.ref, {
            status: 'expired',
            expiredAt: Timestamp.fromDate(now),
            updatedAt: Timestamp.fromDate(now),
            // Conserver les autres champs
            endDate: subscription.endDate, // Garder la date originale
            lastReminderSent: Timestamp.fromDate(now)
          });
          
          console.log(`   📝 Statut mis à jour: active → expired`);
          
          // 2. Ensuite, envoyer la notification d'expiration
          await sendExpirationNotification(telegramUserId, subscription);
          
          console.log(`   📨 Notification d'expiration envoyée`);
          
          // 3. Optionnel: Retirer immédiatement l'utilisateur du groupe
          // Décommente cette section si tu veux que le cronjob retire l'utilisateur
          /*
          if (subscription.telegramGroupId) {
            try {
              await removeUserFromGroup(subscription.telegramGroupId, telegramUserId);
              console.log(`   🚫 Utilisateur retiré du groupe`);
            } catch (removeError) {
              console.error(`   ⚠️ Erreur retrait utilisateur:`, removeError.message);
            }
          }
          */
          
          expiredHandled++;
        } catch (error) {
          console.error(`   ❌ Erreur traitement expiration:`, error.message);
        }
      }
      else {
        console.log(`   📭 Aucune action requise pour cet abonnement`);
      }
    }
    
    console.log(`\n📈 RÉSUMÉ FINAL:`);
    console.log(`✅ Rappels 2 jours envoyés: ${remindersSent}`);
    console.log(`⚠️  Rappels jour J envoyés: ${todayRemindersSent}`);
    console.log(`❌ Abonnements expirés traités: ${expiredHandled}`);
    console.log(`👁️  Abonnements vérifiés: ${snapshot.size}`);
    console.log(`🎯 Vérification terminée à ${new Date().toLocaleTimeString('fr-FR')}`);
    
    return {
      success: true,
      remindersSent,
      todayRemindersSent,
      expiredHandled,
      totalChecked: snapshot.size
    };
    
  } catch (error) {
    console.error('❌ Erreur critique dans checkExpiringSubscriptions:', error);
    throw error;
  }
}

/**
 * Envoie un rappel Telegram à un utilisateur - VERSION AMÉLIORÉE
 */
async function sendTelegramReminder(telegramUserId, subscription, daysLeft) {
  try {
    const groupName = subscription.groupName || 'le groupe';
    const price = subscription.price || '?';
    const endDate = subscription.endDate?.toDate?.() || new Date(subscription.endDate);
    
    let message = '';
    
    if (daysLeft === 2) {
      message = `🔔 *Rappel d'abonnement*\n\n` +
        `Votre abonnement à *${groupName}* expire dans 2 jours.\n\n` +
        `💰 Prix: ${price} XAF\n` +
        `📅 Date d'expiration: ${endDate.toLocaleDateString('fr-FR')}\n\n` +
        `Pour renouveler votre abonnement, cliquez sur le bouton ci-dessous :`;
    } else if (daysLeft === 0) {
      message = `⚠️ *Dernier jour d'abonnement*\n\n` +
        `Votre abonnement à *${groupName}* expire aujourd'hui !\n\n` +
        `💰 Prix: ${price} XAF\n` +
        `📅 Date d'expiration: AUJOURD'HUI\n\n` +
        `Renouvelez maintenant pour ne pas perdre l'accès :`;
    } else {
      // Fallback pour d'autres valeurs
      message = `ℹ️ *Information d'abonnement*\n\n` +
        `Votre abonnement à *${groupName}* expire dans ${daysLeft} jour(s).\n\n` +
        `💰 Prix: ${price} XAF\n` +
        `📅 Date d'expiration: ${endDate.toLocaleDateString('fr-FR')}\n\n` +
        `Pour renouveler votre abonnement, cliquez ci-dessous :`;
    }
    
    // Construire le lien de paiement avec l'ID Firestore du groupe
    let paymentLink;
    const firestoreGroupId = subscription.groupId;
    
    if (firestoreGroupId) {
      paymentLink = `https://paylivecm.shop/telegram/${firestoreGroupId}?telegramUserId=${telegramUserId}`;
    } else {
      // Fallback à l'ancien format
      paymentLink = `https://paylivecm.shop/telegram?telegramGroupId=${subscription.telegramGroupId}&telegramUserId=${telegramUserId}`;
    }
    
    console.log(`   🔗 Lien de paiement généré: ${paymentLink}`);
    
    const response = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: telegramUserId,
        text: message,
        parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: [[
            { text: "🔄 Renouveler l'abonnement", url: paymentLink }
          ]]
        }
      })
    });
    
    const data = await response.json();
    
    if (!data.ok) {
      if (data.error_code === 403) {
        console.warn(`   ⚠️ Utilisateur ${telegramUserId} a bloqué le bot`);
      } else {
        throw new Error(`Telegram API error: ${data.description}`);
      }
    } else {
      console.log(`   📨 Message envoyé avec succès (Message ID: ${data.result.message_id})`);
    }
    
    return true;
  } catch (error) {
    console.error(`   ❌ Erreur envoi Telegram à ${telegramUserId}:`, error.message);
    return false;
  }
}

/**
 * Envoie une notification d'expiration - VERSION AMÉLIORÉE
 */
async function sendExpirationNotification(telegramUserId, subscription) {
  try {
    const groupName = subscription.groupName || 'le groupe';
    const price = subscription.price || '?';
    
    const message = `❌ *Abonnement expiré*\n\n` +
      `Votre abonnement à *${groupName}* a expiré.\n\n` +
      `💰 Prix: ${price} XAF\n` +
      `📅 Date d'expiration: Passée\n\n` +
      `Pour continuer à accéder au groupe, renouvelez votre abonnement :`;
    
    // Construire le lien de paiement
    let paymentLink;
    const firestoreGroupId = subscription.groupId;
    
    if (firestoreGroupId) {
      paymentLink = `https://paylivecm.shop/telegram/${firestoreGroupId}?telegramUserId=${telegramUserId}`;
    } else {
      paymentLink = `https://paylivecm.shop/telegram?telegramGroupId=${subscription.telegramGroupId}&telegramUserId=${telegramUserId}`;
    }
    
    console.log(`   🔗 Lien de renouvellement: ${paymentLink}`);
    
    const response = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: telegramUserId,
        text: message,
        parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: [[
            { text: "🔄 Renouveler l'abonnement", url: paymentLink }
          ]]
        }
      })
    });
    
    const data = await response.json();
    
    if (!data.ok && data.error_code !== 403) {
      throw new Error(`Telegram API error: ${data.description}`);
    } else if (data.ok) {
      console.log(`   📨 Notification d'expiration envoyée (Message ID: ${data.result.message_id})`);
    }
    
    return true;
  } catch (error) {
    console.error(`   ❌ Erreur envoi notification expiration:`, error.message);
    return false;
  }
}

/**
 * Fonction pour retirer un utilisateur d'un groupe Telegram
 * (Optionnel - à utiliser si tu veux que le cronjob retire directement)
 */
async function removeUserFromGroup(telegramGroupId, telegramUserId) {
  try {
    const response = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/banChatMember`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: telegramGroupId,
        user_id: telegramUserId,
        revoke_messages: false
      })
    });
    
    const data = await response.json();
    
    if (!data.ok) {
      throw new Error(`Telegram API error: ${data.description}`);
    }
    
    return true;
  } catch (error) {
    console.error(`❌ Erreur retrait utilisateur ${telegramUserId}:`, error.message);
    return false;
  }
}

// Exécution directe pour les tests
if (require.main === module) {
  console.log('🚀 Exécution directe du cronjob (mode test)...');
  checkExpiringSubscriptions()
    .then(result => {
      console.log('\n🎉 Cronjob terminé avec succès!');
      console.log('Résultat:', JSON.stringify(result, null, 2));
      process.exit(0);
    })
    .catch(error => {
      console.error('\n💥 Cronjob échoué:', error);
      process.exit(1);
    });
}

module.exports = {
  checkExpiringSubscriptions,
  sendTelegramReminder,
  sendExpirationNotification,
  removeUserFromGroup
};