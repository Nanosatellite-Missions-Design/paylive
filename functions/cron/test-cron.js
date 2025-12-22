// test-cron.js - Script de test local CORRIGÉ
const { initializeApp } = require('firebase/app');
const { 
  getFirestore, 
  collection, 
  query, 
  where, 
  getDocs, 
  updateDoc,
  doc,
  Timestamp,
  getDoc // AJOUT IMPORT MANQUANT
} = require('firebase/firestore');

const firebaseConfig = {
  apiKey: "AIzaSyB5g7s0q2eR4WXOp7OlKJNpXW0TRbFX9PM",
  authDomain: "paylive-cd9a1.firebaseapp.com",
  projectId: "paylive-cd9a1",
  storageBucket: "paylive-cd9a1.firebasestorage.app",
  messagingSenderId: "163452827765",
  appId: "1:163452827765:web:ee5cd11c4ee0497dcda03c"
};

async function testCheckExpiringSubscriptions() {
  console.log('🧪 TEST LOCAL DE LA NOUVELLE FONCTION');
  console.log('='.repeat(50));
  
  try {
    const app = initializeApp(firebaseConfig);
    const db = getFirestore(app);
    
    const now = new Date();
    console.log(`📅 Date/heure du test: ${now.toLocaleString('fr-FR')}`);
    
    // Test spécifique sur l'abonnement problématique
    const testSubscriptionId = 'eO1Bo1arHwOzMXVtVrML';
    console.log(`\n🔍 Test sur l'abonnement: ${testSubscriptionId}`);
    
    // Récupérer l'abonnement
    const subscriptionRef = doc(db, 'telegram_subscriptions', testSubscriptionId);
    const subscriptionDoc = await getDoc(subscriptionRef);
    
    if (!subscriptionDoc.exists()) {
      console.log('❌ Abonnement non trouvé');
      return;
    }
    
    const subscription = subscriptionDoc.data();
    console.log(`✅ Abonnement trouvé: ${subscription.groupName || 'Sans nom'}`);
    
    // Convertir la date d'expiration
    let endDate;
    if (subscription.endDate && subscription.endDate.toDate) {
      endDate = subscription.endDate.toDate();
    } else if (subscription.endDate) {
      endDate = new Date(subscription.endDate);
    }
    
    console.log(`📅 Date d'expiration: ${endDate.toLocaleString('fr-FR')}`);
    console.log(`📊 Statut actuel: ${subscription.status}`);
    
    // ========== LOGIQUE CORRIGÉE ==========
    const endDateMs = endDate.getTime();
    const nowMs = now.getTime();
    const isExpired = endDateMs < nowMs;
    
    const twoDaysMs = 2 * 24 * 60 * 60 * 1000;
    const isTwoDaysBefore = (endDateMs - nowMs) <= twoDaysMs && (endDateMs - nowMs) > 0;
    
    const isSameDay = endDate.toDateString() === now.toDateString();
    
    const daysLeft = Math.ceil((endDateMs - nowMs) / (1000 * 60 * 60 * 24));
    
    console.log(`\n📊 ANALYSE:`);
    console.log(`   ⏳ Jours restants: ${daysLeft}`);
    console.log(`   ❓ Est expiré: ${isExpired ? '✅ OUI' : '❌ NON'}`);
    console.log(`   ❓ 2 jours avant: ${isTwoDaysBefore ? '✅ OUI' : '❌ NON'}`);
    console.log(`   ❓ Même jour: ${isSameDay ? '✅ OUI' : '❌ NON'}`);
    
    // Vérifier la condition
    if (isExpired && subscription.status === 'active') {
      console.log(`\n🚨 ACTION REQUISE: Marquer comme expiré`);
      console.log(`   Cette abonnement devrait être traité par le cronjob!`);
      
      // Demander confirmation pour exécuter réellement
      console.log(`\n🔧 Voulez-vous mettre à jour le statut en 'expired'?`);
      console.log(`   - Ancien statut: ${subscription.status}`);
      console.log(`   - Nouveau statut: expired`);
      console.log(`   - Notification: Envoyée à ${subscription.subscriberTelegramId}`);
      console.log(`   - Retrait du groupe: Oui`);
      
      // Pour exécuter réellement, mettez shouldExecute à true
      const shouldExecute = true; // Changez à true pour vraiment mettre à jour
      
      if (shouldExecute) {
        console.log(`\n⚡ EXÉCUTION RÉELLE:`);
        await updateDoc(subscriptionRef, {
          status: 'expired',
          expiredAt: Timestamp.fromDate(now),
          updatedAt: Timestamp.fromDate(now)
        });
        console.log(`✅ Statut réellement mis à jour`);
      } else {
        console.log(`\nℹ️ Simulation uniquement. Pour exécuter, mettez shouldExecute = true`);
      }
    } else {
      console.log(`\n📭 Aucune action requise (selon la nouvelle logique)`);
    }
    
  } catch (error) {
    console.error('❌ Erreur lors du test:', error.message);
  }
}

// Exécuter le test
testCheckExpiringSubscriptions();