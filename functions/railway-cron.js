// railway-cron.js - Point d'entrée pour le cron Railway
const { checkExpiringSubscriptions } = require('./cron/subscriptionReminders');

async function main() {
  console.log(`[${new Date().toISOString()}] 🚀 Démarrage du cron depuis Railway...`);
  try {
    const result = await checkExpiringSubscriptions();
    console.log(`[${new Date().toISOString()}] ✅ Cron terminé avec succès:`, JSON.stringify(result));
    process.exit(0); // Succès
  } catch (error) {
    console.error(`[${new Date().toISOString()}] ❌ Cron échoué:`, error);
    process.exit(1); // Échec
  }
}

// Exécute si appelé directement
if (require.main === module) {
  main();
}

module.exports = main;