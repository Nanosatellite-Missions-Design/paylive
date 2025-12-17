const { onRequest } = require('firebase-functions/v2/https');
const { bot } = require('./bot/index');

// Webhook pour Telegram
exports.telegramBot = onRequest(async (req, res) => {
  try {
    await bot.handleUpdate(req.body, res);
  } catch (error) {
    console.error('Erreur webhook:', error);
    res.status(200).end();
  }
});

// Fonction pour lancer le bot en polling (développement)
exports.startBot = onRequest(async (req, res) => {
  try {
    await bot.launch();
    res.send('Bot démarré avec succès');
  } catch (error) {
    console.error('Erreur démarrage bot:', error);
    res.status(500).send('Erreur');
  }
});