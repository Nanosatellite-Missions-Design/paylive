
// // server.js - Revised and explicit version
// const express = require('express');

// console.log('🚀 Chargement du bot...');

// const botModule = require('./index.js');
// const bot = botModule.bot || botModule;

// const app = express();
// const PORT = process.env.PORT || 8080;

// // 1. It's crucial to parse JSON for webhook body (some setups need it)
// app.use(express.json());

// const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || "8526096119:AAE4gLXvCR7QxC7M6KL9XZuYIax8woKzyng";
// const WEBHOOK_PATH = `/telegram/${BOT_TOKEN}`;

// // 2. HEALTH ROUTES: Keep these first
// app.get('/', (req, res) => {
//   res.send('🤖 PayLive Bot est en ligne!');
// });
// app.get('/health', (req, res) => {
//   res.json({ status: 'ok', time: new Date().toISOString() });
// });

// // 3. THE CRITICAL WEBHOOK ROUTE
// // Use app.post() to explicitly handle POST requests to the webhook path.
// // The 'webhookCallback' middleware must be called as a function.
// app.post(WEBHOOK_PATH, (req, res) => {
//   // Optional: Log the incoming request for debugging
//   console.log(`📨 Update reçu sur ${WEBHOOK_PATH}`);
//   // Pass the request to Telegraf's handler
//   return bot.webhookCallback(WEBHOOK_PATH)(req, res);
// });

// // 4. Start the server
// app.listen(PORT, '0.0.0.0', () => {
//   console.log(`✅ Serveur actif sur le port ${PORT}`);
//   console.log(`🔗 Vérifiez l'endpoint manuellement :`);
//   console.log(`   curl -X POST https://paylive-backup-production.up.railway.app${WEBHOOK_PATH}`);
//   console.log(`🌐 Webhook pour Telegram : https://paylive-backup-production.up.railway.app${WEBHOOK_PATH}`);
// });
const express = require('express');
const https = require('https');

console.log('🚀 Chargement du bot...');

const botModule = require('./index.js');
const bot = botModule.bot || botModule;

const app = express();
const PORT = process.env.PORT || 8080;

app.use(express.json());

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || "8526096119:AAE4gLXvCR7QxC7M6KL9XZuYIax8woKzyng";
const WEBHOOK_PATH = `/telegram/${BOT_TOKEN}`;

// URL de ton app sur Railway
const WEBHOOK_URL = `https://paylive-backup-production.up.railway.app${WEBHOOK_PATH}`;

/**
 * Configure le webhook automatiquement au démarrage
 */
async function setupWebhook() {
  return new Promise((resolve, reject) => {
    console.log(`🔄 Configuration du webhook vers : ${WEBHOOK_URL}`);
    
    const data = JSON.stringify({ url: WEBHOOK_URL });
    
    const options = {
      hostname: 'api.telegram.org',
      port: 443,
      path: `/bot${BOT_TOKEN}/setWebhook`,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': data.length
      }
    };

    const req = https.request(options, (res) => {
      let responseBody = '';
      
      res.on('data', (chunk) => {
        responseBody += chunk;
      });
      
      res.on('end', () => {
        console.log('📡 Réponse configuration webhook:', responseBody);
        resolve(JSON.parse(responseBody));
      });
    });

    req.on('error', (error) => {
      console.error('❌ Erreur configuration webhook:', error.message);
      reject(error);
    });

    req.write(data);
    req.end();
  });
}

/**
 * Vérifie l'état du webhook
 */
async function checkWebhookStatus() {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'api.telegram.org',
      port: 443,
      path: `/bot${BOT_TOKEN}/getWebhookInfo`,
      method: 'GET'
    };

    const req = https.request(options, (res) => {
      let responseBody = '';
      
      res.on('data', (chunk) => {
        responseBody += chunk;
      });
      
      res.on('end', () => {
        const result = JSON.parse(responseBody);
        if (result.ok) {
          console.log('✅ Webhook configuré sur:', result.result.url);
          console.log('📊 Updates en attente:', result.result.pending_update_count);
        } else {
          console.error('❌ Erreur vérification webhook:', result.description);
        }
        resolve(result);
      });
    });

    req.on('error', (error) => {
      console.error('❌ Erreur requête webhook:', error.message);
      reject(error);
    });

    req.end();
  });
}

// 1. ROUTES SANTÉ
app.get('/', (req, res) => {
  res.send('🤖 PayLive Bot est en ligne!');
});

app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    time: new Date().toISOString(),
    webhook_url: WEBHOOK_URL,
    bot: bot.botInfo ? bot.botInfo.username : 'Initializing...'
  });
});

// 2. ROUTE POUR FORCER LA RECONFIGURATION DU WEBHOOK
app.get('/setup-webhook', async (req, res) => {
  try {
    const result = await setupWebhook();
    res.json({ success: true, result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 3. ROUTE POUR VÉRIFIER LE WEBHOOK
app.get('/check-webhook', async (req, res) => {
  try {
    const result = await checkWebhookStatus();
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 4. WEBHOOK PRINCIPAL POUR TELEGRAM
app.post(WEBHOOK_PATH, (req, res) => {
  console.log(`📨 Update reçu sur ${WEBHOOK_PATH}`);
  return bot.webhookCallback(WEBHOOK_PATH)(req, res);
});

// 5. DÉMARRAGE DU SERVEUR AVEC CONFIGURATION AUTOMATIQUE
app.listen(PORT, '0.0.0.0', async () => {
  console.log(`✅ Serveur actif sur le port ${PORT}`);
  console.log(`🌐 Webhook URL: ${WEBHOOK_URL}`);
  
  // Configurer le webhook au démarrage
  try {
    await setupWebhook();
    await checkWebhookStatus();
  } catch (error) {
    console.error('⚠️ Problème configuration webhook, mais le serveur continue...');
  }
});