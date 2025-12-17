// // /app/api/telegram/create-group/route.ts
// import { NextRequest, NextResponse } from 'next/server';

// // IMPORTANT: Utilise le service account via les variables d'environnement
// const admin = require('firebase-admin');

// // Initialisation conditionnelle
// if (!admin.apps.length) {
//   try {
//     admin.initializeApp({
//       credential: admin.credential.cert({
//         projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
//         clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
//         // Le private key doit être formaté correctement
//         privateKey: process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, '\n'),
//       }),
//     });
//     console.log('Firebase Admin initialisé avec succès');
//   } catch (error: any) {
//     console.error('Erreur initialisation Firebase Admin:', error.message);
//   }
// }

// const db = admin.firestore();
// const FieldValue = admin.firestore.FieldValue;

// export async function POST(req: NextRequest) {
//   try {
//     const body = await req.json();
//     console.log('Données reçues:', body);

//     const {
//       creatorUid,
//       creatorName,
//       name,
//       description,
//       price,
//       subscriptionType,
//       telegramGroupId,
//       welcomeMessage,
//       maxMembers = 100,
//       isPublic = false,
//       autoRemoveExpired = true
//     } = body;

//     // Validation
//     if (!creatorUid || !telegramGroupId || !price) {
//       return NextResponse.json(
//         { error: 'Champs manquants requis' },
//         { status: 400 }
//       );
//     }

//     // 1. Créer le document dans telegram_groups (collection globale)
//     const groupRef = db.collection('telegram_groups').doc();
//     const groupData = {
//       id: groupRef.id,
//       creator_uid: creatorUid,
//       creator_name: creatorName,
//       name,
//       description,
//       price: parseFloat(price),
//       subscription_type: subscriptionType,
//       telegram_chat_id: telegramGroupId,
//       welcome_message: welcomeMessage || 'Bienvenue dans le groupe !',
//       max_members: parseInt(maxMembers),
//       current_members: 0,
//       is_public: isPublic,
//       auto_remove_expired: autoRemoveExpired,
//       bot_is_admin: false, // À vérifier plus tard
//       status: 'active',
//       created_at: FieldValue.serverTimestamp(),
//       updated_at: FieldValue.serverTimestamp()
//     };

//     await groupRef.set(groupData);

//     // 2. Créer aussi un produit dans la sous-collection de l'utilisateur (optionnel)
//     const userProductRef = db.collection(`users/${creatorUid}/products`).doc();
//     await userProductRef.set({
//       id: userProductRef.id,
//       name,
//       description,
//       price: parseFloat(price),
//       category: 'telegram_group',
//       productType: 'telegram_group',
//       telegram_group_id: groupRef.id,
//       status: 'available',
//       created_at: FieldValue.serverTimestamp(),
//       updated_at: FieldValue.serverTimestamp()
//     });

//     // 3. Initialiser les stats
//     const statsRef = db.collection(`telegram_groups/${groupRef.id}/stats`).doc('overview');
//     await statsRef.set({
//       total_earnings: 0,
//       active_subscriptions: 0,
//       total_subscriptions: 0,
//       monthly_recurring_revenue: 0,
//       created_at: FieldValue.serverTimestamp()
//     });

//     return NextResponse.json({
//       success: true,
//       groupId: groupRef.id,
//       message: 'Groupe créé avec succès'
//     });

//   } catch (error: any) {
//     console.error('Erreur création groupe Telegram:', error);
//     return NextResponse.json(
//       { error: 'Erreur serveur', details: error.message },
//       { status: 500 }
//     );
//   }
// }