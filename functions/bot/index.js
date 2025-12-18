// const { Telegraf } = require('telegraf');
// const { initializeApp } = require('firebase/app');
// const { 
//   getFirestore, 
//   collection, 
//   query, 
//   where, 
//   getDocs, 
//   getDoc, 
//   doc,
//   updateDoc,
//   serverTimestamp,
//   Timestamp
// } = require('firebase/firestore');

// // Configuration Firebase
// const firebaseConfig = {
//   apiKey: "AIzaSyB5g7s0q2eR4WXOp7OlKJNpXW0TRbFX9PM",
//   authDomain: "paylive-cd9a1.firebaseapp.com",
//   projectId: "paylive-cd9a1",
//   storageBucket: "paylive-cd9a1.firebasestorage.app",
//   messagingSenderId: "163452827765",
//   appId: "1:163452827765:web:ee5cd11c4ee0497dcda03c"
// };

// console.log('🔧 Configuration Firebase pour bot');

// // Initialiser Firebase
// let db;
// try {
//   const app = initializeApp(firebaseConfig);
//   db = getFirestore(app);
//   console.log('✅ Firebase initialisé avec succès dans le bot');
// } catch (error) {
//   console.error('❌ Erreur initialisation Firebase bot:', error.message);
// }

// const BOT_TOKEN = "8526096119:AAE4gLXvCR7QxC7M6KL9XZuYIax8woKzyng";
// const bot = new Telegraf(BOT_TOKEN);

// // ========== FONCTIONS UTILITAIRES ==========

// /**
//  * Envoie un message de rappel d'expiration à un utilisateur
//  */
// async function sendExpirationReminder(telegramUserId, subscriptionData) {
//   try {
//     if (!telegramUserId) {
//       console.warn('⚠️ ID Telegram manquant pour l\'envoi de rappel');
//       return false;
//     }

//     const endDate = subscriptionData.endDate?.toDate?.() || new Date(subscriptionData.endDate);
//     const daysLeft = Math.ceil((endDate - new Date()) / (1000 * 60 * 60 * 24));
//     const groupName = subscriptionData.groupName || 'le groupe';
//     const price = subscriptionData.price || '?';

//     const message = `🔔 *Rappel d'abonnement*\n\n` +
//       `Votre abonnement à *${groupName}* expire dans ${daysLeft} jour(s).\n\n` +
//       `💰 Prix: ${price} XAF\n` +
//       `📅 Date d'expiration: ${endDate.toLocaleDateString('fr-FR')}\n\n` +
//       `Pour renouveler votre abonnement, cliquez sur le bouton ci-dessous :`;

//     const paymentLink = `https://paylivecm.shop/telegram?telegramGroupId=${subscriptionData.telegramGroupId}&telegramUserId=${telegramUserId}`;

//     await bot.telegram.sendMessage(
//       telegramUserId,
//       message,
//       {
//         parse_mode: 'Markdown',
//         reply_markup: {
//           inline_keyboard: [[
//             { text: "🔄 Renouveler l'abonnement", url: paymentLink }
//           ]]
//         }
//       }
//     );

//     console.log(`📨 Rappel envoyé à ${telegramUserId} (expire dans ${daysLeft} jours)`);
//     return true;
//   } catch (error) {
//     if (error.response?.error_code === 403) {
//       console.warn(`⚠️ Utilisateur ${telegramUserId} a bloqué le bot`);
//     } else {
//       console.error(`❌ Erreur envoi rappel à ${telegramUserId}:`, error.message);
//     }
//     return false;
//   }
// }

// /**
//  * Envoie une notification d'expiration (abonnement expiré)
//  */
// async function sendExpirationNotification(telegramUserId, subscriptionData) {
//   try {
//     if (!telegramUserId) return false;

//     const groupName = subscriptionData.groupName || 'le groupe';
//     const price = subscriptionData.price || '?';

//     const message = `❌ *Abonnement expiré*\n\n` +
//       `Votre abonnement à *${groupName}* a expiré.\n\n` +
//       `💰 Prix: ${price} XAF\n` +
//       `📅 Date d'expiration: Passée\n\n` +
//       `Pour continuer à accéder au groupe, renouvelez votre abonnement :`;

//     const paymentLink = `https://paylivecm.shop/telegram?telegramGroupId=${subscriptionData.telegramGroupId}&telegramUserId=${telegramUserId}`;

//     await bot.telegram.sendMessage(
//       telegramUserId,
//       message,
//       {
//         parse_mode: 'Markdown',
//         reply_markup: {
//           inline_keyboard: [[
//             { text: "🔄 Renouveler l'abonnement", url: paymentLink }
//           ]]
//         }
//       }
//     );

//     console.log(`📨 Notification d'expiration envoyée à ${telegramUserId}`);
//     return true;
//   } catch (error) {
//     console.error(`❌ Erreur envoi notification expiration:`, error.message);
//     return false;
//   }
// }

// /**
//  * Retire un utilisateur d'un groupe Telegram
//  */
// async function removeUserFromGroup(telegramGroupId, telegramUserId) {
//   try {
//     await bot.telegram.banChatMember(telegramGroupId, telegramUserId);
//     console.log(`🚫 Utilisateur ${telegramUserId} retiré du groupe ${telegramGroupId}`);
//     return true;
//   } catch (error) {
//     console.error(`❌ Erreur retrait utilisateur ${telegramUserId}:`, error.message);
//     return false;
//   }
// }

// // ========== FONCTION POUR ENVOYER UN LIEN D'INVITATION ==========

// async function sendInviteLink({ telegramUserId, telegramGroupId, groupName, price, subscriptionType, subscriptionId }) {
//   try {
//     console.log(`🤖 Envoi du lien pour ${telegramUserId} vers ${telegramGroupId}`);
    
//     if (!telegramUserId || !telegramGroupId) {
//       throw new Error('Données manquantes pour l\'invitation');
//     }

//     // 1. Créer un lien d'invitation valable 24h
//     const inviteLink = await bot.telegram.createChatInviteLink(
//       telegramGroupId,
//       {
//         member_limit: 1,
//         expire_date: Math.floor(Date.now() / 1000) + (24 * 60 * 60),
//         name: `Abonnement ${groupName || ''}`
//       }
//     );
    
//     console.log(`🔗 Lien créé: ${inviteLink.invite_link}`);
    
//     // 2. Envoyer le message à l'utilisateur
//     const message = await bot.telegram.sendMessage(
//       telegramUserId,
//       `🎉 *Félicitations !*\n\n` +
//       `Votre abonnement à *${groupName || 'le groupe'}* a été activé avec succès !\n\n` +
//       `💰 Montant: ${price || '?'} XAF\n` +
//       `📅 Durée: ${subscriptionType || '30 jours'}\n\n` +
//       `Cliquez sur le bouton ci-dessous pour rejoindre le groupe (valable 24h) :`,
//       {
//         parse_mode: 'Markdown',
//         reply_markup: {
//           inline_keyboard: [[
//             {
//               text: "🚀 Rejoindre le groupe",
//               url: inviteLink.invite_link
//             }
//           ]]
//         }
//       }
//     );
    
//     console.log(`📨 Message envoyé à ${telegramUserId}`);
    
//     // 3. Mettre à jour Firestore
//     if (subscriptionId && db) {
//       try {
//         const subscriptionRef = doc(db, 'telegram_subscriptions', subscriptionId);
//         await updateDoc(subscriptionRef, {
//           botInviteLink: inviteLink.invite_link,
//           invitedAt: serverTimestamp(),
//           updatedAt: serverTimestamp(),
//           inviteLinkExpires: Timestamp.fromDate(new Date(Date.now() + 24 * 60 * 60 * 1000))
//         });
//         console.log(`📝 Abonnement ${subscriptionId} mis à jour avec le lien`);
//       } catch (dbError) {
//         console.warn('⚠️ Erreur mise à jour DB:', dbError);
//       }
//     }
    
//     return {
//       success: true,
//       inviteLink: inviteLink.invite_link,
//       messageId: message.message_id
//     };
    
//   } catch (error) {
//     console.error('❌ Erreur envoi lien:', error.message);
//     throw error;
//   }
// }

// // ========== GESTION DES NOUVEAUX MEMBRES ==========

// bot.on('new_chat_members', async (ctx) => {
//   try {
//     const chatId = ctx.chat.id.toString();
//     const newMembers = ctx.message.new_chat_members;
    
//     console.log(`👥 Nouveaux membres dans ${chatId}:`, newMembers.length);

//     for (const member of newMembers) {
//       // Ignorer le bot lui-même
//       if (member.id === ctx.botInfo.id) {
//         console.log('🤖 Bot ajouté, ignoré');
//         continue;
//       }

//       await verifyMemberAccess(ctx, chatId, member);
//     }
//   } catch (error) {
//     console.error('❌ Erreur new_chat_members:', error.message);
//   }
// });

// async function verifyMemberAccess(ctx, chatId, member) {
//   const telegramUserId = member.id.toString();
//   const username = member.username || member.first_name || `ID:${telegramUserId}`;
  
//   console.log(`🔍 Vérification ${username} (${telegramUserId}) dans ${chatId}`);

//   if (!db) {
//     console.log('⚠️ Firebase non disponible, impossible de vérifier');
//     return;
//   }

//   try {
//     const subscriptionsRef = collection(db, 'telegram_subscriptions');
//     const q = query(
//       subscriptionsRef,
//       where('telegramGroupId', '==', chatId),
//       where('subscriberTelegramId', '==', telegramUserId)
//     );
    
//     const snapshot = await getDocs(q);
    
//     let validSubscription = null;
    
//     // Filtrer manuellement pour le statut 'active' et non expiré
//     snapshot.forEach(doc => {
//       const data = doc.data();
//       if (data.status === 'active') {
//         const endDate = data.endDate?.toDate?.() || new Date(data.endDate);
//         if (endDate > new Date()) {
//           validSubscription = { id: doc.id, ...data };
//         } else {
//           // Abonnement expiré, le marquer comme tel
//           updateDoc(doc.ref, {
//             status: 'expired',
//             expiredAt: serverTimestamp()
//           });
//         }
//       }
//     });
    
//     if (!validSubscription) {
//       console.log(`❌ ${username} n'a pas d'abonnement actif`);
      
//       try {
//         // Retirer l'utilisateur
//         await ctx.telegram.banChatMember(chatId, telegramUserId);
        
//         console.log(`🚫 ${username} retiré du groupe`);
        
//         // Envoyer message avec lien d'achat
//         const paymentLink = `https://paylivecm.shop/telegram?telegramGroupId=${chatId}&telegramUserId=${telegramUserId}`;
        
//         try {
//           await bot.telegram.sendMessage(
//             telegramUserId,
//             `❌ *Accès refusé*\n\n` +
//             `Vous avez été retiré du groupe car vous n'avez pas d'abonnement actif.\n\n` +
//             `💰 Pour rejoindre ce groupe, achetez un abonnement ici :\n` +
//             `${paymentLink}`,
//             {
//               parse_mode: 'Markdown',
//               reply_markup: {
//                 inline_keyboard: [[
//                   { text: "💰 Acheter un abonnement", url: paymentLink }
//                 ]]
//               }
//             }
//           );
          
//           console.log(`📨 Message d'achat envoyé à ${username}`);
//         } catch (msgError) {
//           console.error('⚠️ Impossible d\'envoyer message:', msgError.message);
//         }
//       } catch (kickError) {
//         console.error('❌ Erreur retrait:', kickError.message);
//       }
//     } else {
//       console.log(`✅ ${username} a un abonnement actif`);
      
//       // Mettre à jour l'abonnement
//       await updateDoc(doc(db, 'telegram_subscriptions', validSubscription.id), {
//         addedToGroup: true,
//         addedAt: serverTimestamp(),
//         updatedAt: serverTimestamp(),
//         lastAccessAt: serverTimestamp()
//       });
      
//       // Message de bienvenue dans le groupe
//       try {
//         await ctx.reply(`👋 Bienvenue ${member.first_name || ''} ! Profite bien du groupe !`);
//       } catch (welcomeError) {
//         // Ignorer l'erreur de message
//       }
//     }
//   } catch (error) {
//     console.error('❌ Erreur vérification:', error.message);
//   }
// }

// // ========== COMMANDES UTILISATEUR ==========

// bot.start(async (ctx) => {
//   console.log(`📨 /start de ${ctx.from.id} (@${ctx.from.username || 'no-username'})`);
  
//   const args = ctx.startPayload ? ctx.startPayload.split('_') : [];
  
//   if (args[0] === 'join' && args[1]) {
//     const subscriptionId = args[1];
//     await handleJoinFromLink(ctx, subscriptionId);
//   } else {
//     await ctx.reply(
//       `👋 Bonjour ${ctx.from.first_name || ''} ! Je suis le bot PayLive.\n\n` +
//       `Je gère les accès aux groupes Telegram payants.\n\n` +
//       `📌 Commandes disponibles:\n` +
//       `/status - Voir mes abonnements\n` +
//       `❓ Besoin d'aide ? Contactez @PayLiveSupport`,
//       { parse_mode: 'Markdown' }
//     );
//   }
// });

// async function handleJoinFromLink(ctx, subscriptionId) {
//   try {
//     console.log(`🔗 Utilisateur ${ctx.from.id} essaie de rejoindre avec subscription: ${subscriptionId}`);
    
//     if (!db) {
//       throw new Error('Base de données non disponible');
//     }

//     const subscriptionRef = doc(db, 'telegram_subscriptions', subscriptionId);
//     const subscriptionDoc = await getDoc(subscriptionRef);
    
//     if (!subscriptionDoc.exists()) {
//       await ctx.reply(
//         `❌ *Abonnement introuvable*\n\n` +
//         `Contactez le support avec cet ID: \`${subscriptionId}\``,
//         { parse_mode: 'Markdown' }
//       );
//       return;
//     }

//     const subscription = subscriptionDoc.data();
    
//     if (subscription.status !== 'active') {
//       await ctx.reply(
//         `❌ *Abonnement inactif*\n\n` +
//         `Cet abonnement n'est pas actif.\n` +
//         `Contactez le support pour plus d'informations.`,
//         { parse_mode: 'Markdown' }
//       );
//       return;
//     }

//     const now = new Date();
//     if (subscription.endDate && subscription.endDate.toDate() < now) {
//       await ctx.reply(
//         `❌ *Abonnement expiré*\n\n` +
//         `Cet abonnement a expiré.\n` +
//         `Renouvelez votre abonnement pour continuer à accéder au groupe.`,
//         { parse_mode: 'Markdown' }
//       );
//       return;
//     }

//     const expectedTelegramId = subscription.subscriberTelegramId;
//     if (expectedTelegramId && expectedTelegramId !== ctx.from.id.toString()) {
//       await ctx.reply(
//         `❌ *ID Telegram non correspondant*\n\n` +
//         `Cet abonnement est lié à un autre compte Telegram.\n` +
//         `Utilisez le compte Telegram lié à cet abonnement.`,
//         { parse_mode: 'Markdown' }
//       );
//       return;
//     }

//     if (subscription.botInviteLink) {
//       await ctx.reply(
//         `🔗 *Lien d'invitation*\n\n` +
//         `Cliquez sur le bouton ci-dessous pour rejoindre le groupe ${subscription.groupName || ''} :`,
//         {
//           parse_mode: 'Markdown',
//           reply_markup: {
//             inline_keyboard: [[
//               { text: "🚀 Rejoindre le groupe", url: subscription.botInviteLink }
//             ]]
//           }
//         }
//       );
//     } else {
//       await ctx.reply(
//         `⏳ *Génération du lien en cours...*\n\n` +
//         `Veuillez patienter, nous préparons votre accès au groupe.`,
//         { parse_mode: 'Markdown' }
//       );
      
//       await sendInviteLink({
//         telegramUserId: ctx.from.id.toString(),
//         telegramGroupId: subscription.telegramGroupId,
//         groupName: subscription.groupName,
//         price: subscription.price,
//         subscriptionType: subscription.subscriptionType,
//         subscriptionId: subscriptionId
//       });
      
//       await ctx.reply(
//         `✅ *Lien envoyé !*\n\n` +
//         `Vérifiez vos messages privés avec le bot pour obtenir le lien d'invitation.`,
//         { parse_mode: 'Markdown' }
//       );
//     }

//   } catch (error) {
//     console.error('❌ Erreur handleJoinFromLink:', error.message);
//     await ctx.reply(
//       `❌ *Erreur*\n\n` +
//       `Une erreur est survenue: ${error.message}\n\n` +
//       `Contactez le support avec cet ID: \`${subscriptionId}\``,
//       { parse_mode: 'Markdown' }
//     );
//   }
// }

// bot.command('status', async (ctx) => {
//   try {
//     if (!db) {
//       return ctx.reply('❌ Base de données non disponible.');
//     }

//     const telegramUserId = ctx.from.id.toString();
    
//     const subscriptionsRef = collection(db, 'telegram_subscriptions');
//     const q = query(
//       subscriptionsRef,
//       where('subscriberTelegramId', '==', telegramUserId)
//     );
    
//     const snapshot = await getDocs(q);
    
//     if (snapshot.empty) {
//       return ctx.reply(
//         `📭 *Aucun abonnement*\n\n` +
//         `Vous n'avez pas d'abonnements.\n` +
//         `Visitez https://paylivecm.shop pour vous abonner à un groupe.`,
//         { parse_mode: 'Markdown' }
//       );
//     }

//     let message = `📊 *Vos abonnements*\n\n`;
    
//     snapshot.forEach((doc, index) => {
//       const data = doc.data();
//       const isActive = data.status === 'active';
//       const endDate = data.endDate?.toDate?.() || new Date(data.endDate);
//       const daysLeft = Math.ceil((endDate - new Date()) / (1000 * 60 * 60 * 24));
      
//       message += `*${index + 1}. ${data.groupName || 'Groupe'}*\n`;
//       message += `   • Statut: ${isActive ? '✅ Actif' : '❌ ' + (data.status || 'Inactif')}\n`;
//       message += `   • Prix: ${data.price || '?'} XAF\n`;
      
//       if (isActive) {
//         if (daysLeft > 0) {
//           message += `   • Expire dans: ${daysLeft} jour(s)\n`;
//         } else {
//           message += `   • ⚠️ Expiré aujourd'hui\n`;
//         }
//         message += `   • Accès: ${data.addedToGroup ? '✅ Dans le groupe' : '🔗 Lien disponible'}\n`;
        
//         if (data.botInviteLink && !data.addedToGroup) {
//           message += `   • Lien: [Rejoindre](${data.botInviteLink})\n`;
//         }
//       }
      
//       message += `\n`;
//     });

//     await ctx.reply(message, { 
//       parse_mode: 'Markdown',
//       disable_web_page_preview: true 
//     });

//   } catch (error) {
//     console.error('❌ Erreur commande status:', error);
//     ctx.reply('❌ Erreur. Réessayez plus tard.');
//   }
// });

// bot.command('remind', async (ctx) => {
//   try {
//     await ctx.reply(
//       `🔔 *Gestion des rappels*\n\n` +
//       `Je vous enverrai automatiquement des rappels :\n` +
//       `• 2 jours avant l'expiration de votre abonnement\n` +
//       `• Le jour de l'expiration\n\n` +
//       `Ces rappels sont automatiques et gratuits !`,
//       { parse_mode: 'Markdown' }
//     );
//   } catch (error) {
//     console.error('❌ Erreur commande remind:', error);
//   }
// });

// bot.command('help', async (ctx) => {
//   await ctx.reply(
//     `🆘 *Aide PayLive Bot*\n\n` +
//     `• Pour rejoindre un groupe: Achetez sur https://paylivecm.shop\n` +
//     `• Vous recevrez un lien d'invitation par message privé\n` +
//     `• Vérifiez vos abonnements avec /status\n` +
//     `📧 Support: @PayLiveSupport`,
//     { parse_mode: 'Markdown' }
//   );
// });

// bot.command('getid', async (ctx) => {
//   try {
//     if (ctx.chat.type === 'private') {
//       return ctx.reply('ℹ️ Cette commande ne fonctionne que dans les groupes.');
//     }

//     const groupId = ctx.chat.id.toString();
    
//     await ctx.reply(
//       `📋 *Informations du Groupe*\n\n` +
//       `*Nom:* ${ctx.chat.title || 'Non disponible'}\n` +
//       `*ID:* \`${groupId}\`\n\n` +
//       `📝 *Copiez cet ID et utilisez-le sur PayLive pour créer votre groupe payant.*`,
//       { parse_mode: 'Markdown' }
//     );
    
//     console.log(`✅ ID groupe envoyé: ${groupId}`);

//   } catch (error) {
//     console.error('❌ Erreur commande getid:', error.message);
//     ctx.reply('❌ Erreur. Assurez-vous que je suis administrateur.');
//   }
// });

// // ========== DÉMARRAGE ========== ancien v

// // bot.launch({
// //   polling: {
// //     timeout: 30,
// //     limit: 100,
// //     allowedUpdates: ['message', 'chat_member']
// //   }
// // })
// // .then(() => {
// //   console.log('🤖 Bot démarré avec succès!');
// //   console.log('📡 Mode: Vérification des nouveaux membres + Rappels automatiques');
// // })
// // .catch((error) => {
// //   console.error('❌ Erreur démarrage bot:', error);
// // });

// // // Arrêt propre
// // process.once('SIGINT', () => {
// //   console.log('👋 Arrêt du bot (SIGINT)...');
// //   bot.stop('SIGINT');
// //   process.exit(0);
// // });

// // process.once('SIGTERM', () => {
// //   console.log('👋 Arrêt du bot (SIGTERM)...');
// //   bot.stop('SIGTERM');
// //   process.exit(0);
// // });
// // ===nouvel v 
//  bot.launch({
//     polling: {
//       timeout: 30,
//       limit: 100,
//       allowedUpdates: ['message', 'chat_member']
//     }
//   })
//   .then(() => {
//     console.log('🤖 Bot démarré en mode polling (développement local)!');
//     console.log('📡 Mode: Vérification des nouveaux membres + Rappels automatiques');
//     console.log('⚠️ Note: En production, utilisez server.js pour le mode webhook');
//   })
//   .catch((error) => {
//     console.error('❌ Erreur démarrage bot:', error);
//   });

//   // Arrêt propre
//   process.once('SIGINT', () => {
//     console.log('👋 Arrêt du bot (SIGINT)...');
//     bot.stop('SIGINT');
//     process.exit(0);
//   });

//   process.once('SIGTERM', () => {
//     console.log('👋 Arrêt du bot (SIGTERM)...');
//     bot.stop('SIGTERM');
//     process.exit(0);
//   });

// // ========== EXPORT DES FONCTIONS POUR LE CRONJOB ==========

// module.exports = { 
//   bot, 
//   sendInviteLink,
//   sendExpirationReminder,
//   sendExpirationNotification,
//   removeUserFromGroup
// };
const { Telegraf } = require('telegraf');
const { initializeApp } = require('firebase/app');
const { 
  getFirestore, 
  collection, 
  query, 
  where, 
  getDocs, 
  getDoc, 
  doc,
  updateDoc,
  serverTimestamp,
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

console.log('🔧 Configuration Firebase pour bot');

// Initialiser Firebase
let db;
try {
  const app = initializeApp(firebaseConfig);
  db = getFirestore(app);
  console.log('✅ Firebase initialisé avec succès dans le bot');
} catch (error) {
  console.error('❌ Erreur initialisation Firebase bot:', error.message);
}

const BOT_TOKEN = "8526096119:AAE4gLXvCR7QxC7M6KL9XZuYIax8woKzyng";
const bot = new Telegraf(BOT_TOKEN);

// ========== FONCTIONS UTILITAIRES ==========

/**
 * Trouve l'ID Firestore du groupe à partir de l'ID Telegram
 */
async function getFirestoreGroupId(telegramGroupId) {
  try {
    if (!db) {
      console.error('❌ Firebase non disponible');
      return null;
    }

    const groupsRef = collection(db, 'telegram_groups');
    const q = query(
      groupsRef,
      where('telegramGroupId', '==', telegramGroupId)
    );
    
    const snapshot = await getDocs(q);
    
    if (!snapshot.empty) {
      const groupDoc = snapshot.docs[0];
      console.log(`✅ Groupe Firestore trouvé: ${groupDoc.id} pour Telegram ID: ${telegramGroupId}`);
      return groupDoc.id;
    }
    
    console.warn(`⚠️ Aucun groupe Firestore trouvé pour Telegram ID: ${telegramGroupId}`);
    return null;
  } catch (error) {
    console.error('❌ Erreur recherche groupe Firestore:', error.message);
    return null;
  }
}

/**
 * Envoie un message de rappel d'expiration à un utilisateur
 */
async function sendExpirationReminder(telegramUserId, subscriptionData) {
  try {
    if (!telegramUserId) {
      console.warn('⚠️ ID Telegram manquant pour l\'envoi de rappel');
      return false;
    }

    const endDate = subscriptionData.endDate?.toDate?.() || new Date(subscriptionData.endDate);
    const daysLeft = Math.ceil((endDate - new Date()) / (1000 * 60 * 60 * 24));
    const groupName = subscriptionData.groupName || 'le groupe';
    const price = subscriptionData.price || '?';

    const message = `🔔 *Rappel d'abonnement*\n\n` +
      `Votre abonnement à *${groupName}* expire dans ${daysLeft} jour(s).\n\n` +
      `💰 Prix: ${price} XAF\n` +
      `📅 Date d'expiration: ${endDate.toLocaleDateString('fr-FR')}\n\n` +
      `Pour renouveler votre abonnement, cliquez sur le bouton ci-dessous :`;

    // Obtenir l'ID Firestore du groupe
    const firestoreGroupId = await getFirestoreGroupId(subscriptionData.telegramGroupId);
    
    let paymentLink;
    if (firestoreGroupId) {
      // Utiliser l'ID Firestore
      paymentLink = `https://paylivecm.shop/telegram/${firestoreGroupId}?telegramUserId=${telegramUserId}`;
    } else {
      // Fallback: utiliser l'ancien format avec telegramGroupId
      paymentLink = `https://paylivecm.shop/telegram?telegramGroupId=${subscriptionData.telegramGroupId}&telegramUserId=${telegramUserId}`;
    }

    await bot.telegram.sendMessage(
      telegramUserId,
      message,
      {
        parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: [[
            { text: "🔄 Renouveler l'abonnement", url: paymentLink }
          ]]
        }
      }
    );

    console.log(`📨 Rappel envoyé à ${telegramUserId} (expire dans ${daysLeft} jours) avec lien: ${paymentLink}`);
    return true;
  } catch (error) {
    if (error.response?.error_code === 403) {
      console.warn(`⚠️ Utilisateur ${telegramUserId} a bloqué le bot`);
    } else {
      console.error(`❌ Erreur envoi rappel à ${telegramUserId}:`, error.message);
    }
    return false;
  }
}

/**
 * Envoie une notification d'expiration (abonnement expiré)
 */
async function sendExpirationNotification(telegramUserId, subscriptionData) {
  try {
    if (!telegramUserId) return false;

    const groupName = subscriptionData.groupName || 'le groupe';
    const price = subscriptionData.price || '?';

    const message = `❌ *Abonnement expiré*\n\n` +
      `Votre abonnement à *${groupName}* a expiré.\n\n` +
      `💰 Prix: ${price} XAF\n` +
      `📅 Date d'expiration: Passée\n\n` +
      `Pour continuer à accéder au groupe, renouvelez votre abonnement :`;

    // Obtenir l'ID Firestore du groupe
    const firestoreGroupId = await getFirestoreGroupId(subscriptionData.telegramGroupId);
    
    let paymentLink;
    if (firestoreGroupId) {
      // Utiliser l'ID Firestore
      paymentLink = `https://paylivecm.shop/telegram/${firestoreGroupId}?telegramUserId=${telegramUserId}`;
    } else {
      // Fallback: utiliser l'ancien format avec telegramGroupId
      paymentLink = `https://paylivecm.shop/telegram?telegramGroupId=${subscriptionData.telegramGroupId}&telegramUserId=${telegramUserId}`;
    }

    await bot.telegram.sendMessage(
      telegramUserId,
      message,
      {
        parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: [[
            { text: "🔄 Renouveler l'abonnement", url: paymentLink }
          ]]
        }
      }
    );

    console.log(`📨 Notification d'expiration envoyée à ${telegramUserId} avec lien: ${paymentLink}`);
    return true;
  } catch (error) {
    console.error(`❌ Erreur envoi notification expiration:`, error.message);
    return false;
  }
}

/**
 * Retire un utilisateur d'un groupe Telegram
 */
async function removeUserFromGroup(telegramGroupId, telegramUserId) {
  try {
    await bot.telegram.banChatMember(telegramGroupId, telegramUserId);
    console.log(`🚫 Utilisateur ${telegramUserId} retiré du groupe ${telegramGroupId}`);
    return true;
  } catch (error) {
    console.error(`❌ Erreur retrait utilisateur ${telegramUserId}:`, error.message);
    return false;
  }
}

// ========== FONCTION POUR ENVOYER UN LIEN D'INVITATION ==========

async function sendInviteLink({ telegramUserId, telegramGroupId, groupName, price, subscriptionType, subscriptionId }) {
  try {
    console.log(`🤖 Envoi du lien pour ${telegramUserId} vers ${telegramGroupId}`);
    
    if (!telegramUserId || !telegramGroupId) {
      throw new Error('Données manquantes pour l\'invitation');
    }

    // 1. Créer un lien d'invitation valable 24h
    const inviteLink = await bot.telegram.createChatInviteLink(
      telegramGroupId,
      {
        member_limit: 1,
        expire_date: Math.floor(Date.now() / 1000) + (24 * 60 * 60),
        name: `Abonnement ${groupName || ''}`
      }
    );
    
    console.log(`🔗 Lien créé: ${inviteLink.invite_link}`);
    
    // 2. Envoyer le message à l'utilisateur
    const message = await bot.telegram.sendMessage(
      telegramUserId,
      `🎉 *Félicitations !*\n\n` +
      `Votre abonnement à *${groupName || 'le groupe'}* a été activé avec succès !\n\n` +
      `💰 Montant: ${price || '?'} XAF\n` +
      `📅 Durée: ${subscriptionType || '30 jours'}\n\n` +
      `Cliquez sur le bouton ci-dessous pour rejoindre le groupe (valable 24h) :`,
      {
        parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: [[
            {
              text: "🚀 Rejoindre le groupe",
              url: inviteLink.invite_link
            }
          ]]
        }
      }
    );
    
    console.log(`📨 Message envoyé à ${telegramUserId}`);
    
    // 3. Mettre à jour Firestore
    if (subscriptionId && db) {
      try {
        const subscriptionRef = doc(db, 'telegram_subscriptions', subscriptionId);
        await updateDoc(subscriptionRef, {
          botInviteLink: inviteLink.invite_link,
          invitedAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
          inviteLinkExpires: Timestamp.fromDate(new Date(Date.now() + 24 * 60 * 60 * 1000))
        });
        console.log(`📝 Abonnement ${subscriptionId} mis à jour avec le lien`);
      } catch (dbError) {
        console.warn('⚠️ Erreur mise à jour DB:', dbError);
      }
    }
    
    return {
      success: true,
      inviteLink: inviteLink.invite_link,
      messageId: message.message_id
    };
    
  } catch (error) {
    console.error('❌ Erreur envoi lien:', error.message);
    throw error;
  }
}

// ========== GESTION DES NOUVEAUX MEMBRES ==========

bot.on('new_chat_members', async (ctx) => {
  try {
    const chatId = ctx.chat.id.toString();
    const newMembers = ctx.message.new_chat_members;
    
    console.log(`👥 Nouveaux membres dans ${chatId}:`, newMembers.length);

    for (const member of newMembers) {
      // Ignorer le bot lui-même
      if (member.id === ctx.botInfo.id) {
        console.log('🤖 Bot ajouté, ignoré');
        continue;
      }

      await verifyMemberAccess(ctx, chatId, member);
    }
  } catch (error) {
    console.error('❌ Erreur new_chat_members:', error.message);
  }
});

async function verifyMemberAccess(ctx, chatId, member) {
  const telegramUserId = member.id.toString();
  const username = member.username || member.first_name || `ID:${telegramUserId}`;
  
  console.log(`🔍 Vérification ${username} (${telegramUserId}) dans ${chatId}`);

  if (!db) {
    console.log('⚠️ Firebase non disponible, impossible de vérifier');
    return;
  }

  try {
    const subscriptionsRef = collection(db, 'telegram_subscriptions');
    const q = query(
      subscriptionsRef,
      where('telegramGroupId', '==', chatId),
      where('subscriberTelegramId', '==', telegramUserId)
    );
    
    const snapshot = await getDocs(q);
    
    let validSubscription = null;
    
    // Filtrer manuellement pour le statut 'active' et non expiré
    snapshot.forEach(doc => {
      const data = doc.data();
      if (data.status === 'active') {
        const endDate = data.endDate?.toDate?.() || new Date(data.endDate);
        if (endDate > new Date()) {
          validSubscription = { id: doc.id, ...data };
        } else {
          // Abonnement expiré, le marquer comme tel
          updateDoc(doc.ref, {
            status: 'expired',
            expiredAt: serverTimestamp()
          });
        }
      }
    });
    
    if (!validSubscription) {
      console.log(`❌ ${username} n'a pas d'abonnement actif`);
      
      try {
        // Retirer l'utilisateur
        await ctx.telegram.banChatMember(chatId, telegramUserId);
        
        console.log(`🚫 ${username} retiré du groupe`);
        
        // Obtenir l'ID Firestore du groupe pour le lien
        const firestoreGroupId = await getFirestoreGroupId(chatId);
        
        let paymentLink;
        if (firestoreGroupId) {
          // Utiliser l'ID Firestore
          paymentLink = `https://paylivecm.shop/telegram/${firestoreGroupId}?telegramUserId=${telegramUserId}`;
        } else {
          // Fallback: utiliser l'ancien format
          paymentLink = `https://paylivecm.shop/telegram?telegramGroupId=${chatId}&telegramUserId=${telegramUserId}`;
        }
        
        try {
          await bot.telegram.sendMessage(
            telegramUserId,
            `❌ *Accès refusé*\n\n` +
            `Vous avez été retiré du groupe car vous n'avez pas d'abonnement actif.\n\n` +
            `💰 Pour rejoindre ce groupe, achetez un abonnement ici :\n` +
            `${paymentLink}`,
            {
              parse_mode: 'Markdown',
              reply_markup: {
                inline_keyboard: [[
                  { text: "💰 Acheter un abonnement", url: paymentLink }
                ]]
              }
            }
          );
          
          console.log(`📨 Message d'achat envoyé à ${username} avec lien: ${paymentLink}`);
        } catch (msgError) {
          console.error('⚠️ Impossible d\'envoyer message:', msgError.message);
        }
      } catch (kickError) {
        console.error('❌ Erreur retrait:', kickError.message);
      }
    } else {
      console.log(`✅ ${username} a un abonnement actif`);
      
      // Mettre à jour l'abonnement
      await updateDoc(doc(db, 'telegram_subscriptions', validSubscription.id), {
        addedToGroup: true,
        addedAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        lastAccessAt: serverTimestamp()
      });
      
      // Message de bienvenue dans le groupe
      try {
        await ctx.reply(`👋 Bienvenue ${member.first_name || ''} ! Profite bien du groupe !`);
      } catch (welcomeError) {
        // Ignorer l'erreur de message
      }
    }
  } catch (error) {
    console.error('❌ Erreur vérification:', error.message);
  }
}

// ========== COMMANDES UTILISATEUR ==========

bot.start(async (ctx) => {
  console.log(`📨 /start de ${ctx.from.id} (@${ctx.from.username || 'no-username'})`);
  
  const args = ctx.startPayload ? ctx.startPayload.split('_') : [];
  
  if (args[0] === 'join' && args[1]) {
    const subscriptionId = args[1];
    await handleJoinFromLink(ctx, subscriptionId);
  } else {
    await ctx.reply(
      `👋 Bonjour ${ctx.from.first_name || ''} ! Je suis le bot PayLive.\n\n` +
      `Je gère les accès aux groupes Telegram payants.\n\n` +
      `📌 Commandes disponibles:\n` +
      `/status - Voir mes abonnements\n` +
      `❓ Besoin d'aide ? Contactez @PayLiveSupport`,
      { parse_mode: 'Markdown' }
    );
  }
});

async function handleJoinFromLink(ctx, subscriptionId) {
  try {
    console.log(`🔗 Utilisateur ${ctx.from.id} essaie de rejoindre avec subscription: ${subscriptionId}`);
    
    if (!db) {
      throw new Error('Base de données non disponible');
    }

    const subscriptionRef = doc(db, 'telegram_subscriptions', subscriptionId);
    const subscriptionDoc = await getDoc(subscriptionRef);
    
    if (!subscriptionDoc.exists()) {
      await ctx.reply(
        `❌ *Abonnement introuvable*\n\n` +
        `Contactez le support avec cet ID: \`${subscriptionId}\``,
        { parse_mode: 'Markdown' }
      );
      return;
    }

    const subscription = subscriptionDoc.data();
    
    if (subscription.status !== 'active') {
      await ctx.reply(
        `❌ *Abonnement inactif*\n\n` +
        `Cet abonnement n'est pas actif.\n` +
        `Contactez le support pour plus d'informations.`,
        { parse_mode: 'Markdown' }
      );
      return;
    }

    const now = new Date();
    if (subscription.endDate && subscription.endDate.toDate() < now) {
      await ctx.reply(
        `❌ *Abonnement expiré*\n\n` +
        `Cet abonnement a expiré.\n` +
        `Renouvelez votre abonnement pour continuer à accéder au groupe.`,
        { parse_mode: 'Markdown' }
      );
      return;
    }

    const expectedTelegramId = subscription.subscriberTelegramId;
    if (expectedTelegramId && expectedTelegramId !== ctx.from.id.toString()) {
      await ctx.reply(
        `❌ *ID Telegram non correspondant*\n\n` +
        `Cet abonnement est lié à un autre compte Telegram.\n` +
        `Utilisez le compte Telegram lié à cet abonnement.`,
        { parse_mode: 'Markdown' }
      );
      return;
    }

    if (subscription.botInviteLink) {
      await ctx.reply(
        `🔗 *Lien d'invitation*\n\n` +
        `Cliquez sur le bouton ci-dessous pour rejoindre le groupe ${subscription.groupName || ''} :`,
        {
          parse_mode: 'Markdown',
          reply_markup: {
            inline_keyboard: [[
              { text: "🚀 Rejoindre le groupe", url: subscription.botInviteLink }
            ]]
          }
        }
      );
    } else {
      await ctx.reply(
        `⏳ *Génération du lien en cours...*\n\n` +
        `Veuillez patienter, nous préparons votre accès au groupe.`,
        { parse_mode: 'Markdown' }
      );
      
      await sendInviteLink({
        telegramUserId: ctx.from.id.toString(),
        telegramGroupId: subscription.telegramGroupId,
        groupName: subscription.groupName,
        price: subscription.price,
        subscriptionType: subscription.subscriptionType,
        subscriptionId: subscriptionId
      });
      
      await ctx.reply(
        `✅ *Lien envoyé !*\n\n` +
        `Vérifiez vos messages privés avec le bot pour obtenir le lien d'invitation.`,
        { parse_mode: 'Markdown' }
      );
    }

  } catch (error) {
    console.error('❌ Erreur handleJoinFromLink:', error.message);
    await ctx.reply(
      `❌ *Erreur*\n\n` +
      `Une erreur est survenue: ${error.message}\n\n` +
      `Contactez le support avec cet ID: \`${subscriptionId}\``,
      { parse_mode: 'Markdown' }
    );
  }
}

bot.command('status', async (ctx) => {
  try {
    if (!db) {
      return ctx.reply('❌ Base de données non disponible.');
    }

    const telegramUserId = ctx.from.id.toString();
    
    const subscriptionsRef = collection(db, 'telegram_subscriptions');
    const q = query(
      subscriptionsRef,
      where('subscriberTelegramId', '==', telegramUserId)
    );
    
    const snapshot = await getDocs(q);
    
    if (snapshot.empty) {
      return ctx.reply(
        `📭 *Aucun abonnement*\n\n` +
        `Vous n'avez pas d'abonnements.\n` +
        `Visitez https://paylivecm.shop pour vous abonner à un groupe.`,
        { parse_mode: 'Markdown' }
      );
    }

    let message = `📊 *Vos abonnements*\n\n`;
    
    snapshot.forEach((doc, index) => {
      const data = doc.data();
      const isActive = data.status === 'active';
      const endDate = data.endDate?.toDate?.() || new Date(data.endDate);
      const daysLeft = Math.ceil((endDate - new Date()) / (1000 * 60 * 60 * 24));
      
      message += `*${index + 1}. ${data.groupName || 'Groupe'}*\n`;
      message += `   • Statut: ${isActive ? '✅ Actif' : '❌ ' + (data.status || 'Inactif')}\n`;
      message += `   • Prix: ${data.price || '?'} XAF\n`;
      
      if (isActive) {
        if (daysLeft > 0) {
          message += `   • Expire dans: ${daysLeft} jour(s)\n`;
        } else {
          message += `   • ⚠️ Expiré aujourd'hui\n`;
        }
        message += `   • Accès: ${data.addedToGroup ? '✅ Dans le groupe' : '🔗 Lien disponible'}\n`;
        
        if (data.botInviteLink && !data.addedToGroup) {
          message += `   • Lien: [Rejoindre](${data.botInviteLink})\n`;
        }
      }
      
      message += `\n`;
    });

    await ctx.reply(message, { 
      parse_mode: 'Markdown',
      disable_web_page_preview: true 
    });

  } catch (error) {
    console.error('❌ Erreur commande status:', error);
    ctx.reply('❌ Erreur. Réessayez plus tard.');
  }
});

bot.command('remind', async (ctx) => {
  try {
    await ctx.reply(
      `🔔 *Gestion des rappels*\n\n` +
      `Je vous enverrai automatiquement des rappels :\n` +
      `• 2 jours avant l'expiration de votre abonnement\n` +
      `• Le jour de l'expiration\n\n` +
      `Ces rappels sont automatiques et gratuits !`,
      { parse_mode: 'Markdown' }
    );
  } catch (error) {
    console.error('❌ Erreur commande remind:', error);
  }
});

bot.command('help', async (ctx) => {
  await ctx.reply(
    `🆘 *Aide PayLive Bot*\n\n` +
    `• Pour rejoindre un groupe: Achetez sur https://paylivecm.shop\n` +
    `• Vous recevrez un lien d'invitation par message privé\n` +
    `• Vérifiez vos abonnements avec /status\n` +
    `📧 Support: @PayLiveSupport`,
    { parse_mode: 'Markdown' }
  );
});

bot.command('getid', async (ctx) => {
  try {
    if (ctx.chat.type === 'private') {
      return ctx.reply('ℹ️ Cette commande ne fonctionne que dans les groupes.');
    }

    const groupId = ctx.chat.id.toString();
    
    await ctx.reply(
      `📋 *Informations du Groupe*\n\n` +
      `*Nom:* ${ctx.chat.title || 'Non disponible'}\n` +
      `*ID:* \`${groupId}\`\n\n` +
      `📝 *Copiez cet ID et utilisez-le sur PayLive pour créer votre groupe payant.*`,
      { parse_mode: 'Markdown' }
    );
    
    console.log(`✅ ID groupe envoyé: ${groupId}`);

  } catch (error) {
    console.error('❌ Erreur commande getid:', error.message);
    ctx.reply('❌ Erreur. Assurez-vous que je suis administrateur.');
  }
});

// ========== EXPORT DU BOT ==========
module.exports = { 
  bot, 
  sendInviteLink,
  sendExpirationReminder,
  sendExpirationNotification,
  removeUserFromGroup,
  getFirestoreGroupId // Exporté pour tests
};

// ========== MODE LOCAL SEULEMENT ==========
// Si exécuté directement (mode développement)
if (require.main === module) {
  console.log('⚠️ Mode développement local (polling)');
  
  bot.launch({
    polling: {
      timeout: 30,
      limit: 100,
      allowedUpdates: ['message', 'chat_member']
    }
  })
  .then(() => {
    console.log('🤖 Bot démarré en mode polling (développement local)');
  })
  .catch((error) => {
    console.error('❌ Erreur démarrage bot:', error);
  });

  // Arrêt propre
  process.once('SIGINT', () => {
    console.log('👋 Arrêt du bot (SIGINT)...');
    bot.stop('SIGINT');
    process.exit(0);
  });

  process.once('SIGTERM', () => {
    console.log('👋 Arrêt du bot (SIGTERM)...');
    bot.stop('SIGTERM');
    process.exit(0);
  });
}