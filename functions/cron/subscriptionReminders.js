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
 * Fonction principale pour vérifier les abonnements expirants - LOGIQUE AMÉLIORÉE
 */
async function checkExpiringSubscriptions() {
  try {
    console.log('🔄 Début de la vérification des abonnements...');
    console.log(`📅 Date/heure: ${new Date().toLocaleString('fr-FR')}`);
    
    // Initialiser Firebase
    const app = initializeApp(firebaseConfig);
    const db = getFirestore(app);
    
    const now = new Date();
    const nowMs = now.getTime();
    
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
      
      // ========== LOGIQUE AMÉLIORÉE ==========
      const endDateMs = endDate.getTime();
      const isExpired = endDateMs < nowMs;  // Vrai si la date est passée
      
      // Pour le rappel 2 jours avant - tolérance de 26h pour compenser l'exécution à 9h
      const twoDaysMs = 2 * 24 * 60 * 60 * 1000;
      const twoDaysBeforeMax = twoDaysMs;
      const twoDaysBeforeMin = twoDaysMs - (26 * 60 * 60 * 1000); // 2 jours - 26h = 22h avant expiration
      
      const timeUntilExpiration = endDateMs - nowMs;
      const isTwoDaysBefore = timeUntilExpiration <= twoDaysBeforeMax && timeUntilExpiration > twoDaysBeforeMin;
      
      // Pour le rappel jour J - même jour calendaire ET pas encore expiré
      const isSameDay = endDate.toDateString() === now.toDateString();
      const isTodayNotExpired = isSameDay && !isExpired;
      
      // Calculer jours restants pour affichage
      const daysLeft = Math.ceil((endDateMs - nowMs) / (1000 * 60 * 60 * 24));
      
      console.log(`\n📊 Abonnement ${subscriptionId}:`);
      console.log(`   📍 Groupe: ${groupName}`);
      console.log(`   👤 Utilisateur: ${telegramUserId}`);
      console.log(`   📅 Expire le: ${endDate.toLocaleString('fr-FR')}`);
      console.log(`   ⏳ Jours restants: ${daysLeft}`);
      console.log(`   ❓ Est expiré: ${isExpired}`);
      console.log(`   ❓ 2 jours avant: ${isTwoDaysBefore} (dans ${Math.floor(timeUntilExpiration/1000/3600)}h)`);
      console.log(`   ❓ Même jour: ${isSameDay}`);
      console.log(`   ❓ Aujourd'hui non expiré: ${isTodayNotExpired}`);
      
      // 2. RAPPEL 2 JOURS AVANT
      if (isTwoDaysBefore && !subscription.reminderSent2Days) {
        try {
          console.log(`   🔔 ACTION: Envoi rappel 2 jours avant expiration`);
          
          await sendTelegramReminder(telegramUserId, subscription, 2);
          
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
      
      // 3. RAPPEL JOUR J (si expiration aujourd'hui mais pas encore)
      else if (isTodayNotExpired && !subscription.reminderSentToday) {
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
      else if (isExpired && subscription.status === 'active') {
        try {
          console.log(`   ❌ ACTION: Abonnement EXPIRÉ`);
          
          // 1. Marquer comme expiré dans Firestore
          await updateDoc(docSnap.ref, {
            status: 'expired',
            expiredAt: Timestamp.fromDate(now),
            updatedAt: Timestamp.fromDate(now),
            lastReminderSent: Timestamp.fromDate(now)
          });
          
          console.log(`   📝 Statut mis à jour: active → expired`);
          
          // 2. Envoyer la notification d'expiration
          await sendExpirationNotification(telegramUserId, subscription);
          console.log(`   📨 Notification d'expiration envoyée`);
          
          // 3. Retirer l'utilisateur du groupe (kick)
          if (subscription.telegramGroupId) {
            try {
              await kickUserFromGroup(subscription.telegramGroupId, telegramUserId);
              console.log(`   🚫 Utilisateur kické du groupe`);
            } catch (kickError) {
              if (kickError.message.includes('USER_NOT_PARTICIPANT')) {
                console.log(`   ⚠️ Utilisateur n'est plus dans le groupe`);
              } else if (kickError.message.includes('chat not found')) {
                console.log(`   ⚠️ Groupe introuvable, peut-être supprimé`);
              } else {
                console.error(`   ⚠️ Erreur kick utilisateur:`, kickError.message);
              }
            }
          }
          
          expiredHandled++;
        } catch (error) {
          console.error(`   ❌ Erreur traitement expiration:`, error.message);
        }
      } else {
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
 * Envoie un rappel Telegram à un utilisateur
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
    }
    
    // Construire le lien de paiement
    const firestoreGroupId = subscription.groupId;
    let paymentLink;
    
    if (firestoreGroupId) {
      paymentLink = `https://paylivecm.shop/telegram/${firestoreGroupId}?telegramUserId=${telegramUserId}`;
    } else {
      paymentLink = `https://paylivecm.shop/telegram?telegramGroupId=${subscription.telegramGroupId}&telegramUserId=${telegramUserId}`;
    }
    
    console.log(`   🔗 Lien généré: ${paymentLink}`);
    
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
      console.log(`   📨 Message envoyé (ID: ${data.result.message_id})`);
    }
    
    return true;
  } catch (error) {
    console.error(`   ❌ Erreur envoi Telegram:`, error.message);
    return false;
  }
}

/**
 * Envoie une notification d'expiration
 */
async function sendExpirationNotification(telegramUserId, subscription) {
  try {
    const groupName = subscription.groupName || 'le groupe';
    const price = subscription.price || '?';
    const endDate = subscription.endDate?.toDate?.() || new Date(subscription.endDate);
    
    const message = `❌ *Abonnement expiré*\n\n` +
      `Votre abonnement à *${groupName}* a expiré.\n\n` +
      `💰 Prix: ${price} XAF\n` +
      `📅 Date d'expiration: ${endDate.toLocaleDateString('fr-FR')}\n\n` +
      `Pour continuer à accéder au groupe, renouvelez votre abonnement :`;
    
    const firestoreGroupId = subscription.groupId;
    let paymentLink;
    
    if (firestoreGroupId) {
      paymentLink = `https://paylivecm.shop/telegram/${firestoreGroupId}?telegramUserId=${telegramUserId}`;
    } else {
      paymentLink = `https://paylivecm.shop/telegram?telegramGroupId=${subscription.telegramGroupId}&telegramUserId=${telegramUserId}`;
    }
    
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
      console.log(`   📨 Notification envoyée (ID: ${data.result.message_id})`);
    }
    
    return true;
  } catch (error) {
    console.error(`❌ Erreur envoi notification expiration:`, error.message);
    return false;
  }
}

/**
 * Kick un utilisateur d'un groupe Telegram (ban temporaire de 30 secondes)
 */
async function kickUserFromGroup(telegramGroupId, telegramUserId) {
  try {
    // Ban pour 30 secondes seulement (équivalent à un kick)
    const untilDate = Math.floor(Date.now() / 1000) + 30;
    
    const response = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/banChatMember`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: telegramGroupId,
        user_id: telegramUserId,
        until_date: untilDate,
        revoke_messages: false
      })
    });
    
    const data = await response.json();
    
    if (!data.ok) {
      // Si l'utilisateur n'est pas dans le groupe, ce n'est pas une erreur grave
      if (data.description.includes('USER_NOT_PARTICIPANT')) {
        console.log(`   ℹ️ Utilisateur ${telegramUserId} n'est pas dans le groupe ${telegramGroupId}`);
        return true;
      }
      if (data.description.includes('chat not found')) {
        console.log(`   ⚠️ Groupe ${telegramGroupId} introuvable`);
        return true;
      }
      throw new Error(`Telegram API error: ${data.description}`);
    }
    
    console.log(`   ✅ Utilisateur ${telegramUserId} kické du groupe ${telegramGroupId} (ban 30s)`);
    
    // Optionnel : Débannir après 35 secondes pour permettre la réinscription
    setTimeout(async () => {
      try {
        await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/unbanChatMember`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: telegramGroupId,
            user_id: telegramUserId,
            only_if_banned: true
          })
        });
        console.log(`   🔄 Utilisateur ${telegramUserId} débanni automatiquement`);
      } catch (unbanError) {
        // Ignorer les erreurs de débannissement
      }
    }, 35000); // 35 secondes
    
    return true;
  } catch (error) {
    console.error(`❌ Erreur kick utilisateur ${telegramUserId}:`, error.message);
    throw error;
  }
}

/**
 * Vérifie les abonnements qui devraient recevoir un rappel aujourd'hui
 * (Fonction auxiliaire pour debug)
 */
async function debugCheckReminders() {
  try {
    console.log('🔍 Début du debug des rappels...');
    
    const app = initializeApp(firebaseConfig);
    const db = getFirestore(app);
    
    const now = new Date();
    const nowMs = now.getTime();
    
    const subscriptionsRef = collection(db, 'telegram_subscriptions');
    const q = query(subscriptionsRef, where('status', '==', 'active'));
    
    const snapshot = await getDocs(q);
    
    console.log(`📊 ${snapshot.size} abonnements actifs à vérifier`);
    
    for (const docSnap of snapshot.docs) {
      const subscription = docSnap.data();
      const endDate = subscription.endDate?.toDate?.() || new Date(subscription.endDate);
      const endDateMs = endDate.getTime();
      
      const timeUntilExpiration = endDateMs - nowMs;
      const daysLeft = Math.ceil(timeUntilExpiration / (1000 * 60 * 60 * 24));
      
      const twoDaysMs = 2 * 24 * 60 * 60 * 1000;
      const isTwoDaysBefore = timeUntilExpiration <= twoDaysMs && timeUntilExpiration > 0;
      
      console.log(`\n${subscription.groupName || 'Sans nom'}:`);
      console.log(`  - Expire: ${endDate.toLocaleString('fr-FR')}`);
      console.log(`  - Jours restants: ${daysLeft}`);
      console.log(`  - Heures restantes: ${Math.floor(timeUntilExpiration/1000/3600)}h`);
      console.log(`  - 2 jours avant? ${isTwoDaysBefore}`);
      console.log(`  - Rappel déjà envoyé? ${subscription.reminderSent2Days ? 'OUI' : 'NON'}`);
    }
    
    return snapshot.size;
  } catch (error) {
    console.error('❌ Erreur debug:', error);
    return 0;
  }
}

// Exécution directe pour les tests
if (require.main === module) {
  console.log('🚀 Exécution directe du cronjob...');
  
  // Pour debug: node -e "require('./functions/cron').debugCheckReminders()"
  const args = process.argv.slice(2);
  if (args.includes('--debug')) {
    debugCheckReminders()
      .then(() => {
        console.log('✅ Debug terminé');
        process.exit(0);
      })
      .catch(error => {
        console.error('❌ Debug échoué:', error);
        process.exit(1);
      });
  } else {
    checkExpiringSubscriptions()
      .then(result => {
        console.log('\n🎉 Cronjob terminé avec succès!');
        console.log('Résumé:', JSON.stringify(result, null, 2));
        process.exit(0);
      })
      .catch(error => {
        console.error('\n💥 Cronjob échoué:', error);
        process.exit(1);
      });
  }
}

module.exports = {
  checkExpiringSubscriptions,
  sendTelegramReminder,
  sendExpirationNotification,
  kickUserFromGroup,
  debugCheckReminders
};