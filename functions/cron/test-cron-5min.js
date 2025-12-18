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

const BOT_TOKEN = "8526096119:AAE4gLXvCR7QxC7M6KL9XZuYIax8woKzyng";

// Configuration Firebase
const firebaseConfig = {
  apiKey: "AIzaSyB5g7s0q2eR4WXOp7OlKJNpXW0TRbFX9PM",
  authDomain: "paylive-cd9a1.firebaseapp.com",
  projectId: "paylive-cd9a1",
  storageBucket: "paylive-cd9a1.firebasestorage.app",
  messagingSenderId: "163452827765",
  appId: "1:163452827765:web:ee5cd11c4ee0497dcda03c"
};

/**
 * TEST SPÉCIAL 5 MINUTES
 * Modifie temporairement la date d'expiration pour tester dans 5 min
 */
async function testCronjobWith5Minutes() {
  console.log('🕐 DÉBUT TEST 5 MINUTES 🕐');
  
  try {
    // 1. Initialiser Firebase
    const app = initializeApp(firebaseConfig);
    const db = getFirestore(app);
    console.log('✅ Firebase initialisé');
    
    // 2. Récupérer l'abonnement de test
    const subscriptionId = 'HrOBab7CtStxam9i1YRC';
    const subscriptionRef = doc(db, 'telegram_subscriptions', subscriptionId);
    
    console.log('📋 Abonnement de test:', subscriptionId);
    
    // 3. MODIFIER TEMPORAIREMENT LA DATE D'EXPIRATION
    // Mettre expiration dans 5 minutes
    const now = new Date();
    const newExpiration = new Date(now);
    newExpiration.setMinutes(now.getMinutes() + 5);
    
    console.log(`📅 Maintenant: ${now.toLocaleString('fr-FR')}`);
    console.log(`📅 Nouvelle expiration: ${newExpiration.toLocaleString('fr-FR')}`);
    
    // Sauvegarder l'ancienne date pour restaurer plus tard
    const oldExpiration = new Date('2025-12-21T12:19:00Z');
    
    await updateDoc(subscriptionRef, {
      endDate: Timestamp.fromDate(newExpiration),
      originalEndDate: Timestamp.fromDate(oldExpiration), // Sauvegarde
      reminderSent2Days: false, // Réinitialiser pour test
      reminderSentToday: false,
      status: 'active' // S'assurer qu'il est actif
    });
    
    console.log('✅ Date d\'expiration modifiée à +5 minutes');
    console.log('⏳ Attente 6 minutes pour voir le cronjob agir...');
    
    // 4. Lancer le cronjob immédiatement
    await checkExpiringSubscriptions();
    
    // 5. Attendre 1 minute et re-vérifier
    console.log('⏳ Attente 1 minute...');
    await delay(60 * 1000);
    
    await checkExpiringSubscriptions();
    
    // 6. Attendre encore 5 minutes (total 6) pour expiration
    console.log('⏳ Attente 5 minutes supplémentaires pour expiration...');
    await delay(5 * 60 * 1000);
    
    await checkExpiringSubscriptions();
    
    // 7. RESTAURER LA DATE ORIGINALE
    console.log('🔄 Restauration de la date d\'expiration originale...');
    await updateDoc(subscriptionRef, {
      endDate: Timestamp.fromDate(oldExpiration),
      updatedAt: Timestamp.fromDate(new Date())
    });
    
    console.log('✅ Date originale restaurée');
    console.log('🎉 TEST TERMINÉ !');
    
  } catch (error) {
    console.error('❌ Erreur test:', error);
  }
}

/**
 * Version modifiée du cronjob pour test 5 minutes
 */
async function checkExpiringSubscriptions() {
  try {
    console.log('\n🔄 DÉBUT VÉRIFICATION CRONJOB');
    const now = new Date();
    console.log(`📊 Heure de vérification: ${now.toLocaleString('fr-FR')}`);
    
    const app = initializeApp(firebaseConfig);
    const db = getFirestore(app);
    
    // Rechercher les abonnements actifs
    const subscriptionsRef = collection(db, 'telegram_subscriptions');
    const q = query(subscriptionsRef, where('status', '==', 'active'));
    
    const snapshot = await getDocs(q);
    console.log(`📈 ${snapshot.size} abonnement(s) actif(s) trouvé(s)`);
    
    for (const docSnap of snapshot.docs) {
      const subscription = docSnap.data();
      const subscriptionId = docSnap.id;
      
      let endDate;
      if (subscription.endDate && subscription.endDate.toDate) {
        endDate = subscription.endDate.toDate();
      } else if (subscription.endDate) {
        endDate = new Date(subscription.endDate);
      } else {
        console.warn(`⚠️ Pas de date d'expiration pour ${subscriptionId}`);
        continue;
      }
      
      // Calculer en MINUTES pour le test
      const minutesLeft = Math.ceil((endDate - now) / (1000 * 60));
      
      console.log(`\n📊 Abonnement ${subscriptionId}:`);
      console.log(`   Nom du groupe: ${subscription.groupName || 'Non spécifié'}`);
      console.log(`   Expire le: ${endDate.toLocaleString('fr-FR')}`);
      console.log(`   Minutes restantes: ${minutesLeft} min`);
      console.log(`   ID Telegram: ${subscription.subscriberTelegramId || 'Non spécifié'}`);
      
      // LOGIQUE MODIFIÉE POUR TEST 5 MINUTES:
      // - Rappel "2 jours" = 2 minutes
      // - Rappel "aujourd'hui" = 0 minutes
      
      if (minutesLeft === 2 && !subscription.reminderSent2Days) {
        console.log(`   ⚠️ ACTION: Envoyer rappel "2 minutes avant"`);
        console.log(`   📨 (Simulation) Message à ${subscription.subscriberTelegramId}:`);
        console.log(`   "Votre abonnement expire dans 2 minutes!"`);
        
        // Marquer comme envoyé
        await updateDoc(docSnap.ref, {
          reminderSent2Days: true,
          reminderSent2DaysAt: Timestamp.fromDate(now)
        });
      }
      
      else if (minutesLeft === 0 && !subscription.reminderSentToday) {
        console.log(`   ⚠️ ACTION: Envoyer rappel "expiration maintenant"`);
        console.log(`   📨 (Simulation) Message à ${subscription.subscriberTelegramId}:`);
        console.log(`   "Votre abonnement expire MAINTENANT!"`);
        
        await updateDoc(docSnap.ref, {
          reminderSentToday: true,
          reminderSentTodayAt: Timestamp.fromDate(now)
        });
      }
      
      else if (minutesLeft < 0) {
        console.log(`   ❌ ACTION: Abonnement EXPIRÉ (${minutesLeft} minutes)`);
        console.log(`   🚫 (Simulation) Retirer utilisateur du groupe`);
        console.log(`   📝 Marquer comme expiré dans Firestore`);
        
        // Marquer comme expiré
        await updateDoc(docSnap.ref, {
          status: 'expired',
          expiredAt: Timestamp.fromDate(now),
          updatedAt: Timestamp.fromDate(now)
        });
        
        // ENVOYER LA REQUÊTE RÉELLE AU BOT POUR RETIRER L'UTILISATEUR
        await sendRealRemoveRequest(
          subscription.telegramGroupId, 
          subscription.subscriberTelegramId
        );
      }
    }
    
    console.log('✅ Vérification terminée\n');
    
  } catch (error) {
    console.error('❌ Erreur vérification:', error.message);
  }
}

/**
 * Envoie une requête RÉELLE au bot pour retirer un utilisateur
 */
async function sendRealRemoveRequest(telegramGroupId, telegramUserId) {
  try {
    if (!telegramGroupId || !telegramUserId) {
      console.log('   ⚠️ IDs manquants, impossible de retirer');
      return;
    }
    
    console.log(`   🤖 Envoi requête au bot pour retirer ${telegramUserId} du groupe ${telegramGroupId}`);
    
    // URL de l'API du bot (si déployé)
    // OU utiliser directement l'API Telegram
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
    
    if (data.ok) {
      console.log(`   ✅ Utilisateur ${telegramUserId} retiré avec succès!`);
    } else {
      console.log(`   ❌ Erreur retrait: ${data.description}`);
    }
    
  } catch (error) {
    console.log(`   ⚠️ Erreur requête bot: ${error.message}`);
  }
}

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Lancer le test
if (require.main === module) {
  testCronjobWith5Minutes();
}

module.exports = { testCronjobWith5Minutes };