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

// Configuration Firebase IDENTIQUE à celle du bot
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
 * Fonction principale pour vérifier les abonnements expirants
 */
async function checkExpiringSubscriptions() {
  try {
    console.log('🔄 Début de la vérification des abonnements expirants...');
    
    // Initialiser Firebase avec le SDK client (pas Admin)
    const app = initializeApp(firebaseConfig);
    const db = getFirestore(app);
    
    const now = new Date();
    const twoDaysFromNow = new Date(now);
    twoDaysFromNow.setDate(now.getDate() + 2);
    
    // 1. Rechercher les abonnements actifs qui expirent dans les 2 prochains jours
    const subscriptionsRef = collection(db, 'telegram_subscriptions');
    const q = query(
      subscriptionsRef,
      where('status', '==', 'active')
    );
    
    const snapshot = await getDocs(q);
    console.log(`📊 ${snapshot.size} abonnements actifs trouvés`);
    
    let remindersSent = 0;
    let expiredHandled = 0;
    
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
        console.warn(`⚠️ Pas de date d'expiration pour l'abonnement ${subscriptionId}`);
        continue;
      }
      
      const daysLeft = Math.ceil((endDate - now) / (1000 * 60 * 60 * 24));
      const telegramUserId = subscription.subscriberTelegramId;
      
      if (!telegramUserId) {
        console.log(`⚠️ Pas d'ID Telegram pour l'abonnement ${subscriptionId}`);
        continue;
      }
      
      console.log(`📅 Abonnement ${subscriptionId}: ${daysLeft} jours restants`);
      
      // 2. Si l'abonnement expire dans 2 jours, envoyer un rappel
      if (daysLeft === 2 && !subscription.reminderSent2Days) {
        try {
          await sendTelegramReminder(telegramUserId, subscription, daysLeft);
          
          // Marquer que le rappel a été envoyé
          await updateDoc(docSnap.ref, {
            reminderSent2Days: true,
            reminderSent2DaysAt: Timestamp.fromDate(now),
            lastReminderSent: Timestamp.fromDate(now)
          });
          
          remindersSent++;
          console.log(`✅ Rappel 2 jours envoyé à ${telegramUserId}`);
        } catch (error) {
          console.error(`❌ Erreur envoi rappel à ${telegramUserId}:`, error.message);
        }
      }
      
      // 3. Si l'abonnement expire aujourd'hui, envoyer une notification
      else if (daysLeft === 0 && !subscription.reminderSentToday) {
        try {
          await sendTelegramReminder(telegramUserId, subscription, 0);
          
          await updateDoc(docSnap.ref, {
            reminderSentToday: true,
            reminderSentTodayAt: Timestamp.fromDate(now),
            lastReminderSent: Timestamp.fromDate(now)
          });
          
          remindersSent++;
          console.log(`✅ Notification jour J envoyée à ${telegramUserId}`);
        } catch (error) {
          console.error(`❌ Erreur envoi notification jour J:`, error.message);
        }
      }
      
      // 4. Si l'abonnement est expiré (jours négatifs), le marquer comme expiré
      else if (daysLeft < 0 && subscription.status === 'active') {
        try {
          // Marquer comme expiré
          await updateDoc(docSnap.ref, {
            status: 'expired',
            expiredAt: Timestamp.fromDate(now),
            updatedAt: Timestamp.fromDate(now)
          });
          
          console.log(`📝 Abonnement ${subscriptionId} marqué comme expiré`);
          
          // Envoyer notification d'expiration
          await sendExpirationNotification(telegramUserId, subscription);
          
          expiredHandled++;
        } catch (error) {
          console.error(`❌ Erreur traitement expiration:`, error.message);
        }
      }
    }
    
    console.log(`\n📈 RÉSUMÉ:`);
    console.log(`✅ Rappels envoyés: ${remindersSent}`);
    console.log(`📝 Abonnements expirés traités: ${expiredHandled}`);
    console.log(`🎯 Vérification terminée à ${new Date().toLocaleTimeString()}`);
    
    return {
      success: true,
      remindersSent,
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
    
    const paymentLink = `https://paylivecm.shop/telegram?telegramGroupId=${subscription.telegramGroupId}&telegramUserId=${telegramUserId}`;
    
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
        console.warn(`⚠️ Utilisateur ${telegramUserId} a bloqué le bot`);
      } else {
        throw new Error(`Telegram API error: ${data.description}`);
      }
    }
    
    return true;
  } catch (error) {
    console.error(`❌ Erreur envoi Telegram:`, error.message);
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
    
    const message = `❌ *Abonnement expiré*\n\n` +
      `Votre abonnement à *${groupName}* a expiré.\n\n` +
      `💰 Prix: ${price} XAF\n` +
      `📅 Date d'expiration: Passée\n\n` +
      `Pour continuer à accéder au groupe, renouvelez votre abonnement :`;
    
    const paymentLink = `https://paylivecm.shop/telegram?telegramGroupId=${subscription.telegramGroupId}&telegramUserId=${telegramUserId}`;
    
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
    }
    
    return true;
  } catch (error) {
    console.error(`❌ Erreur envoi notification expiration:`, error.message);
    return false;
  }
}

// Exécution directe pour les tests
if (require.main === module) {
  console.log('🚀 Exécution directe du cronjob...');
  checkExpiringSubscriptions()
    .then(result => {
      console.log('✅ Cronjob terminé avec succès');
      console.log('Result:', result);
      process.exit(0);
    })
    .catch(error => {
      console.error('❌ Erreur lors de l\'exécution:', error);
      process.exit(1);
    });
}

module.exports = {
  checkExpiringSubscriptions,
  sendTelegramReminder,
  sendExpirationNotification
};