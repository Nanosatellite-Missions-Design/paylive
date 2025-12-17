// functions/bot/server.js
const express = require('express');
const bot = require('./index'); // Importe ton bot existant
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware pour parser le JSON (important pour Telegram)
app.use(express.json());

// C'est LA ligne magique : elle connecte Express au bot Telegraf
app.use(bot.webhookCallback('/'));

// Route santé pour vérifier que le serveur tourne
app.get('/', (req, res) => {
  res.send('🤖 PayLive Bot est en ligne sur Railway!');
});

// Démarre le serveur
app.listen(PORT, () => {
  console.log(`🚀 Serveur bot démarré sur le port ${PORT}`);
});