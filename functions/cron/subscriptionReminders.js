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

       // ========== PARTIE 2 : ESSAIS GRATUITS ==========
    console.log('\n🎁 PARTIE 2 : Essais gratuits');
    
    const trialResults = await checkExpiredTrials(); // Appel de la nouvelle fonction
    const trialReminders = await checkTrialsExpiringSoon(); // Rappels 2 jours avant
    
    console.log(`\n📈 RÉSUMÉ FINAL:`);
    console.log(`✅ Rappels 2 jours envoyés: ${remindersSent}`);
    console.log(`⚠️  Rappels jour J envoyés: ${todayRemindersSent}`);
    console.log(`❌ Abonnements expirés traités: ${expiredHandled}`);
    console.log(`👁️  Abonnements vérifiés: ${snapshot.size}`);

        console.log(`\n🎁 ESSAIS GRATUITS:`);
    console.log(`   ❌ Essais expirés traités: ${trialResults.expiredTrials || 0}`);
    console.log(`   📨 Notifications essais envoyées: ${trialResults.notificationsSent || 0}`);
    console.log(`   🔔 Rappels essais envoyés: ${trialReminders}`);
    console.log(`   👁️  Essais vérifiés: ${trialResults.totalTrials || 0}`);
    console.log(`🎯 Vérification terminée à ${new Date().toLocaleTimeString('fr-FR')}`);
    
    return {
      success: true,
      remindersSent,
      todayRemindersSent,
      expiredHandled,
      totalChecked: snapshot.size,
           // Résultats essais gratuits
      expiredTrials: trialResults.expiredTrials || 0,
      trialNotificationsSent: trialResults.notificationsSent || 0,
      trialRemindersSent: trialReminders,
      totalTrialsChecked: trialResults.totalTrials || 0
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

/**
 * Vérifie et gère les essais gratuits expirés
 */
async function checkExpiredTrials() {
  try {
    console.log('\n🎁 Début de la vérification des essais gratuits...');
    
    const app = initializeApp(firebaseConfig);
    const db = getFirestore(app);
    
    // 1. Chercher tous les essais actifs
    const subscriptionsRef = collection(db, 'telegram_subscriptions');
    const q = query(subscriptionsRef, where('status', '==', 'trial'));
    
    const snapshot = await getDocs(q);
    console.log(`📊 ${snapshot.size} essai(s) gratuit(s) actif(s) trouvé(s)`);
    
    let expiredTrials = 0;
    let notificationsSent = 0;
    const now = new Date();
    
    for (const docSnap of snapshot.docs) {
      const data = docSnap.data();
      const subscriptionId = docSnap.id;
      
      // Convertir la date de fin d'essai
      let trialEndDate;
      if (data.trialEndDate && data.trialEndDate.toDate) {
        trialEndDate = data.trialEndDate.toDate();
      } else if (data.trialEndDate) {
        trialEndDate = new Date(data.trialEndDate);
      } else {
        console.warn(`⚠️ Pas de date de fin d'essai pour ${subscriptionId}`);
        continue;
      }
      
      const telegramUserId = data.subscriberTelegramId;
      const groupName = data.groupName || 'Groupe inconnu';
      
      if (!telegramUserId) {
        console.warn(`⚠️ Pas d'ID Telegram pour l'essai ${subscriptionId}`);
        continue;
      }
      
      // Vérifier si l'essai est expiré
      if (trialEndDate < now) {
        expiredTrials++;
        console.log(`\n⏰ Essai expiré: ${subscriptionId}`);
        console.log(`   📍 Groupe: ${groupName}`);
        console.log(`   👤 Utilisateur: ${telegramUserId}`);
        console.log(`   📅 Essai expiré le: ${trialEndDate.toLocaleString('fr-FR')}`);
        
        try {
          // 1. Mettre à jour le statut dans Firestore
          await updateDoc(doc(db, 'telegram_subscriptions', subscriptionId), {
            status: 'trial_expired',
            expiredAt: Timestamp.fromDate(now),
            updatedAt: Timestamp.fromDate(now),
            lastReminderSent: Timestamp.fromDate(now)
          });
          
          console.log(`   📝 Statut mis à jour: trial → trial_expired`);
          
          // 2. Envoyer notification à l'utilisateur
          const notificationSent = await sendTrialExpiredNotification(telegramUserId, data);
          if (notificationSent) {
            notificationsSent++;
            console.log(`   📨 Notification envoyée`);
          }
          
          // 3. Retirer l'utilisateur du groupe (optionnel - se fera automatiquement au prochain join)
          // Le bot le kickera quand il essaiera de rejoindre à nouveau
          
        } catch (error) {
          console.error(`   ❌ Erreur traitement essai expiré:`, error.message);
        }
      } else {
        // Calculer jours restants pour info
        const daysLeft = Math.ceil((trialEndDate - now) / (1000 * 60 * 60 * 24));
        console.log(`   ✅ Essai ${subscriptionId}: ${daysLeft} jour(s) restant(s)`);
      }
    }
    
    console.log(`\n🎁 RÉSUMÉ ESSAIS GRATUITS:`);
    console.log(`✅ Essais expirés traités: ${expiredTrials}`);
    console.log(`📨 Notifications envoyées: ${notificationsSent}`);
    console.log(`👁️  Essais vérifiés: ${snapshot.size}`);
    
    return {
      expiredTrials,
      notificationsSent,
      totalTrials: snapshot.size
    };
    
  } catch (error) {
    console.error('❌ Erreur vérification essais:', error);
    throw error;
  }
}

/**
 * Envoie une notification d'expiration d'essai
 */
async function sendTrialExpiredNotification(telegramUserId, subscription) {
  try {
    const groupName = subscription.groupName || 'le groupe';
    
    const message = `🎁 *Votre essai gratuit a expiré*\n\n` +
      `Votre accès gratuit à *${groupName}* est terminé.\n\n` +
      `Pour continuer à profiter du groupe, abonnez-vous maintenant :`;
    
    // Construire le lien de paiement
    let paymentLink;
    
    // Essayer avec l'ID Firestore d'abord
    if (subscription.groupId) {
      paymentLink = `https://paylivecm.shop/telegram/${subscription.groupId}?telegramUserId=${telegramUserId}`;
    } else {
      // Fallback avec l'ID Telegram
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
            { text: "💰 S'abonner", url: paymentLink }
          ]]
        }
      })
    });
    
    const data = await response.json();
    
    if (!data.ok) {
      if (data.error_code === 403) {
        console.warn(`   ⚠️ Utilisateur ${telegramUserId} a bloqué le bot`);
        return false;
      } else {
        throw new Error(`Telegram API error: ${data.description}`);
      }
    } else {
      console.log(`   📨 Message envoyé (ID: ${data.result.message_id})`);
      return true;
    }
    
  } catch (error) {
    console.error(`   ❌ Erreur envoi notification essai:`, error.message);
    return false;
  }
}

/**
 * Vérifie les essais qui expirent bientôt (2 jours avant)
 */
async function checkTrialsExpiringSoon() {
  try {
    console.log('\n⏳ Vérification des essais qui expirent bientôt...');
    
    const app = initializeApp(firebaseConfig);
    const db = getFirestore(app);
    
    const subscriptionsRef = collection(db, 'telegram_subscriptions');
    const q = query(subscriptionsRef, where('status', '==', 'trial'));
    
    const snapshot = await getDocs(q);
    
    let remindersSent = 0;
    const now = new Date();
    
    for (const docSnap of snapshot.docs) {
      const data = docSnap.data();
      const subscriptionId = docSnap.id;
      
      let trialEndDate;
      if (data.trialEndDate && data.trialEndDate.toDate) {
        trialEndDate = data.trialEndDate.toDate();
      } else if (data.trialEndDate) {
        trialEndDate = new Date(data.trialEndDate);
      } else {
        continue;
      }
      
      // Vérifier si l'essai expire dans 2 jours
      const timeUntilExpiration = trialEndDate.getTime() - now.getTime();
      const twoDaysMs = 2 * 24 * 60 * 60 * 1000;
      
      if (timeUntilExpiration > 0 && timeUntilExpiration <= twoDaysMs && !data.trialReminderSent) {
        try {
          console.log(`   🔔 Essai expire bientôt: ${subscriptionId}`);
          
          // Envoyer rappel
          const message = `⏰ *Votre essai gratuit expire bientôt*\n\n` +
            `Votre accès gratuit à *${data.groupName || 'le groupe'}* expire dans 2 jours.\n\n` +
            `Pour continuer à accéder au groupe, abonnez-vous avant l'expiration :`;
          
          let paymentLink;
          if (data.groupId) {
            paymentLink = `https://paylivecm.shop/telegram/${data.groupId}?telegramUserId=${data.subscriberTelegramId}`;
          } else {
            paymentLink = `https://paylivecm.shop/telegram?telegramGroupId=${data.telegramGroupId}&telegramUserId=${data.subscriberTelegramId}`;
          }
          
          await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              chat_id: data.subscriberTelegramId,
              text: message,
              parse_mode: 'Markdown',
              reply_markup: {
                inline_keyboard: [[
                  { text: "💰 S'abonner maintenant", url: paymentLink }
                ]]
              }
            })
          });
          
          // Marquer le rappel comme envoyé
          await updateDoc(doc(db, 'telegram_subscriptions', subscriptionId), {
            trialReminderSent: true,
            trialReminderSentAt: Timestamp.fromDate(now),
            updatedAt: Timestamp.fromDate(now)
          });
          
          remindersSent++;
          console.log(`   ✅ Rappel envoyé pour l'essai ${subscriptionId}`);
          
        } catch (error) {
          console.error(`   ❌ Erreur rappel essai:`, error.message);
        }
      }
    }
    
    console.log(`   📨 Rappels envoyés: ${remindersSent}`);
    return remindersSent;
    
  } catch (error) {
    console.error('❌ Erreur vérification essais bientôt expirés:', error);
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
  debugCheckReminders,
   checkExpiredTrials,
  sendTrialExpiredNotification,
  checkTrialsExpiringSoon
};