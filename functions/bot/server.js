// // functions/bot/server.js
// const express = require('express');
// const bot = require('./index'); // Importe ton bot existant
// const app = express();
// const PORT = process.env.PORT || 3000;

// // Middleware pour parser le JSON (important pour Telegram)
// app.use(express.json());

// // C'est LA ligne magique : elle connecte Express au bot Telegraf
// app.use(bot.webhookCallback('/'));

// // Route santé pour vérifier que le serveur tourne
// app.get('/', (req, res) => {
//   res.send('🤖 PayLive Bot est en ligne sur Railway!');
// });

// // Démarre le serveur
// app.listen(PORT, () => {
//   console.log(`🚀 Serveur bot démarré sur le port ${PORT}`);
// });
// functions/bot/simple-server.js
const express = require('express');

console.log('🚀 Chargement du bot...');

// Import simple
const botModule = require('./index.js');
const bot = botModule.bot || botModule;

const app = express();
const PORT = process.env.PORT || 8080;

// Middleware simple
app.use(express.json());

// Routes
app.get('/', (req, res) => {
  res.send('🤖 PayLive Bot est en ligne!');
});

app.get('/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

// Webhook endpoint - ESSAYEZ CES DEUX OPTIONS

// OPTION A: Route spécifique avec token
const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || "8526096119:AAE4gLXvCR7QxC7M6KL9XZuYIax8woKzyng";
const WEBHOOK_PATH = `/telegram/${BOT_TOKEN}`;

app.post(WEBHOOK_PATH, (req, res) => {
  console.log('📨 Update reçu');
  bot.handleUpdate(req.body, res);
});

// OPTION B: Route générique
app.post('/webhook', (req, res) => {
  console.log('📨 Update reçu (route générique)');
  bot.handleUpdate(req.body, res);
});

// OPTION C: Route racine pour webhook
app.post('/', (req, res) => {
  console.log('📨 Update reçu (route racine)');
  bot.handleUpdate(req.body, res);
});

// Démarrer
app.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ Serveur en ligne sur port ${PORT}`);
  console.log(`🌐 URLs de test:`);
  console.log(`   - https://paylive-backup-production.up.railway.app/`);
  console.log(`   - https://paylive-backup-production.up.railway.app/health`);
  console.log(`🔗 Webhooks configurés:`);
  console.log(`   - POST https://paylive-backup-production.up.railway.app${WEBHOOK_PATH}`);
  console.log(`   - POST https://paylive-backup-production.up.railway.app/webhook`);
  console.log(`   - POST https://paylive-backup-production.up.railway.app/`);
});