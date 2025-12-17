// // functions/bot/simple-bot.js
// const { Telegraf } = require('telegraf');

// const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN);

// // Commande /start
// bot.start((ctx) => {
//   ctx.reply(
//     `👋 Bonjour ${ctx.from.first_name}!\n\n` +
//     `Je suis le bot PayLive qui vous aide à monétiser votre groupe Telegram.\n\n` +
//     `📌 Commandes disponibles :\n` +
//     `/setup - Configurer un nouveau groupe payant\n` +
//     `/help - Aide et informations\n` +
//     `/id - Obtenir l'ID de ce groupe`
//   );
// });

// // Commande /setup
// bot.command('setup', (ctx) => {
//   ctx.reply(
//     `⚙️ Configuration d'un groupe payant\n\n` +
//     `1. Créez ou ouvrez votre groupe sur Telegram\n` +
//     `2. Ajoutez-moi au groupe (@PayLiveBot)\n` +
//     `3. Donnez-moi les droits d'administrateur\n` +
//     `4. Envoyez /id dans le groupe pour obtenir l'ID\n\n` +
//     `Ensuite, allez sur PayLive pour créer votre groupe payant :\n` +
//     `🌐 ${process.env.NEXT_PUBLIC_SITE_URL}/dashboard/products`
//   );
// });

// // Commande /id
// bot.command('id', (ctx) => {
//   const chatId = ctx.chat.id;
//   const isGroup = ctx.chat.type === 'group' || ctx.chat.type === 'supergroup';
  
//   if (isGroup) {
//     ctx.reply(
//       `📋 Informations de ce groupe :\n\n` +
//       `ID du groupe : \`${chatId}\`\n` +
//       `Nom : ${ctx.chat.title}\n\n` +
//       `Copiez cet ID et utilisez-le sur PayLive pour configurer votre groupe payant.`
//     );
//   } else {
//     ctx.reply(
//       `⚠️ Cette commande fonctionne uniquement dans un groupe.\n\n` +
//       `Ajoutez-moi à votre groupe et envoyez /id pour obtenir l'ID.`
//     );
//   }
// });

// // Gestion des messages privés
// bot.on('message', (ctx) => {
//   if (ctx.chat.type === 'private') {
//     // Si l'utilisateur envoie son numéro de téléphone
//     if (ctx.message.contact) {
//       const phone = ctx.message.contact.phone_number;
//       ctx.reply(
//         `📞 Numéro enregistré : ${phone}\n\n` +
//         `Un administrateur PayLive vous contactera bientôt pour vous aider à configurer votre groupe.`
//       );
//     }
    
//     // Si l'utilisateur envoie un message texte
//     if (ctx.message.text && !ctx.message.text.startsWith('/')) {
//       ctx.reply(
//         `Pour configurer un groupe payant :\n` +
//         `1. Utilisez /setup pour les instructions\n` +
//         `2. Créez votre groupe sur PayLive\n` +
//         `3. Ajoutez-moi à votre groupe\n\n` +
//         `Besoin d'aide ? Contactez le support : @PayLiveSupport`
//       );
//     }
//   }
// });

// // Exporter le handler
// exports.handler = async (event) => {
//   try {
//     await bot.handleUpdate(JSON.parse(event.body));
//     return { statusCode: 200 };
//   } catch (error) {
//     console.error('Bot error:', error);
//     return { statusCode: 500 };
//   }
// };