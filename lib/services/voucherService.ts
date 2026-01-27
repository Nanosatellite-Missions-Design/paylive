import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  query, 
  where, 
  updateDoc,
  increment,
  addDoc,
  serverTimestamp,
  Timestamp
} from 'firebase/firestore';
import { initializeApp, getApps } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

// Configuration Firebase IDENTIQUE à vos autres fichiers
const firebaseConfig = {
  apiKey: "AIzaSyB5g7s0q2eR4WXOp7OlKJNpXW0TRbFX9PM",
  authDomain: "paylive-cd9a1.firebaseapp.com",
  projectId: "paylive-cd9a1",
  storageBucket: "paylive-cd9a1.firebasestorage.app",
  messagingSenderId: "163452827765",
  appId: "1:163452827765:web:ee5cd11c4ee0497dcda03c"
};

// Initialiser Firebase une seule fois
let db: any = null;

const getDb = () => {
  if (!db) {
    try {
      const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);
      db = getFirestore(app);
      console.log('✅ Firebase initialisé dans voucherService');
    } catch (error) {
      console.error('❌ Erreur initialisation Firebase:', error);
    }
  }
  return db;
};

export class VoucherService {
  
  // Vérifier et appliquer un code de réduction
  static async validateAndApplyVoucher(
    code: string, 
    amount: number, 
    userId?: string,
    telegramGroupId?: string,
    productType?: string
  ): Promise<{
    valid: boolean;
    discountAmount: number;
    finalAmount: number;
    voucher?: any;
    error?: string;
  }> {
    try {
      console.log('🔍 Validation voucher:', { code, amount, userId, telegramGroupId, productType });

      const db = getDb();
      if (!db) {
        throw new Error('Base de données non disponible');
      }

      // 1. Récupérer le voucher
      const vouchersRef = collection(db, 'vouchers');
      
      try {
        const q = query(
          vouchersRef,
          where('code', '==', code.toUpperCase().trim()),
          where('isActive', '==', true)
        );
        
        const snapshot = await getDocs(q);
        
        if (snapshot.empty) {
          return { 
            valid: false, 
            discountAmount: 0, 
            finalAmount: amount,
            error: 'Code de réduction invalide' 
          };
        }
        
        const voucherDoc = snapshot.docs[0];
        const voucherData = voucherDoc.data();
        
        // 2. Vérifier la validité temporelle
        const now = new Date();
        const validFrom = voucherData.validFrom?.toDate ? voucherData.validFrom.toDate() : new Date(voucherData.validFrom);
        const validUntil = voucherData.validUntil?.toDate ? voucherData.validUntil.toDate() : new Date(voucherData.validUntil);
        
        if (now < validFrom) {
          return { 
            valid: false, 
            discountAmount: 0, 
            finalAmount: amount,
            error: 'Ce code n\'est pas encore valide' 
          };
        }
        
        if (now > validUntil) {
          return { 
            valid: false, 
            discountAmount: 0, 
            finalAmount: amount,
            error: 'Ce code a expiré' 
          };
        }
        
        // 3. Vérifier le nombre d'utilisations
        if (voucherData.currentUses >= voucherData.maxUses) {
          return { 
            valid: false, 
            discountAmount: 0, 
            finalAmount: amount,
            error: 'Ce code a atteint son nombre maximum d\'utilisations' 
          };
        }
        
        // 4. Vérifier le montant minimum
        if (voucherData.minPurchaseAmount && amount < voucherData.minPurchaseAmount) {
          return { 
            valid: false, 
            discountAmount: 0, 
            finalAmount: amount,
            error: `Montant minimum requis: ${voucherData.minPurchaseAmount} XAF` 
          };
        }
        
        // 5. Vérifier les restrictions utilisateur
        if (voucherData.userIds && voucherData.userIds.length > 0 && userId) {
          if (!voucherData.userIds.includes(userId)) {
            return { 
              valid: false, 
              discountAmount: 0, 
              finalAmount: amount,
              error: 'Ce code n\'est pas valide pour votre compte' 
            };
          }
        }
        
        // 6. Vérifier les restrictions Telegram
        if (voucherData.telegramGroupIds && voucherData.telegramGroupIds.length > 0 && telegramGroupId) {
          if (!voucherData.telegramGroupIds.includes(telegramGroupId)) {
            return { 
              valid: false, 
              discountAmount: 0, 
              finalAmount: amount,
              error: 'Ce code n\'est pas valide pour ce groupe' 
            };
          }
        }
        
        // 7. Vérifier les types de produits
        if (voucherData.productTypes && voucherData.productTypes.length > 0 && productType) {
          if (!voucherData.productTypes.includes(productType)) {
            return { 
              valid: false, 
              discountAmount: 0, 
              finalAmount: amount,
              error: 'Ce code n\'est pas valide pour ce type de produit' 
            };
          }
        }
        
        // 8. Calculer la réduction
        let discountAmount = 0;
        
        if (voucherData.discountType === 'percentage') {
          discountAmount = (amount * voucherData.discountValue) / 100;
          
          // Appliquer la limite max de réduction
          if (voucherData.maxDiscountAmount && discountAmount > voucherData.maxDiscountAmount) {
            discountAmount = voucherData.maxDiscountAmount;
          }
        } else if (voucherData.discountType === 'fixed') {
          discountAmount = voucherData.discountValue;
        }
        
        // S'assurer que la réduction ne dépasse pas le montant
        discountAmount = Math.min(discountAmount, amount);
        
        const finalAmount = amount - discountAmount;
        
        // 9. Mettre à jour le compteur d'utilisations
        await updateDoc(doc(db, 'vouchers', voucherDoc.id), {
          currentUses: increment(1),
          updatedAt: serverTimestamp()
        });
        
        // 10. Enregistrer l'application du voucher
        await this.recordVoucherUsage(
          voucherDoc.id, 
          code, 
          amount, 
          discountAmount, 
          finalAmount, 
          userId,
          undefined,
          telegramGroupId
        );
        
        return {
          valid: true,
          discountAmount,
          finalAmount,
          voucher: {
            id: voucherDoc.id,
            ...voucherData
          }
        };
        
      } catch (firestoreError: any) {
        // Si la collection n'existe pas encore
        console.log('⚠️ Collection vouchers vide ou erreur:', firestoreError.message);
        return { 
          valid: false, 
          discountAmount: 0, 
          finalAmount: amount,
          error: 'Code invalide' 
        };
      }
      
    } catch (error: any) {
      console.error('❌ Erreur validation voucher:', error);
      return { 
        valid: false, 
        discountAmount: 0, 
        finalAmount: amount,
        error: error.message || 'Erreur lors de la validation du code' 
      };
    }
  }
  
// Modifier la méthode recordVoucherUsage
// static async recordVoucherUsage(
//   voucherId: string,
//   code: string,
//   originalAmount: number,
//   discountAmount: number,
//   finalAmount: number,
//   userId?: string,
//   transactionId?: string,
//   telegramGroupId?: string
// ): Promise<void> {
//   try {
//     const db = getDb();
//     if (!db) return;
    
//     const usageData = {
//       voucherId: voucherId || 'unknown_voucher', // 🔧 CORRECTION ICI
//       code: code.toUpperCase().trim(),
//       originalAmount,
//       discountAmount,
//       finalAmount,
//       userId,
//       transactionId,
//       telegramGroupId,
//       appliedAt: serverTimestamp()
//     };
    
//     await addDoc(collection(db, 'voucher_applications'), usageData);
//     console.log('✅ Utilisation voucher enregistrée:', usageData);
//   } catch (error) {
//     console.error('❌ Erreur enregistrement usage voucher:', error);
//   }
// }

static async recordVoucherUsage(
  voucherId: string,
  code: string,
  originalAmount: number,
  discountAmount: number,
  finalAmount: number,
  userId?: string,
  transactionId?: string,
  telegramGroupId?: string
): Promise<void> {
  try {
    const db = getDb();
    if (!db) {
      console.warn('⚠️ Base de données non disponible pour enregistrer voucher usage');
      return;
    }
    
    // 🔧 CORRECTION: Créer un objet avec des valeurs par défaut
    const usageData: any = {
      voucherId: voucherId || 'unknown_voucher',
      code: (code || '').toUpperCase().trim(),
      originalAmount: originalAmount || 0,
      discountAmount: discountAmount || 0,
      finalAmount: finalAmount || 0,
      appliedAt: serverTimestamp()
    };
    
    // Ajouter les champs optionnels seulement s'ils sont définis
    if (userId !== undefined && userId !== null) {
      usageData.userId = userId;
    }
    
    if (transactionId !== undefined && transactionId !== null) {
      usageData.transactionId = transactionId;
    }
    
    if (telegramGroupId !== undefined && telegramGroupId !== null) {
      usageData.telegramGroupId = telegramGroupId;
    }
    
    // 🔧 CORRECTION: Filtrer les valeurs undefined
    const cleanUsageData = Object.keys(usageData).reduce((acc, key) => {
      if (usageData[key] !== undefined) {
        acc[key] = usageData[key];
      }
      return acc;
    }, {} as any);
    
    console.log('📝 Enregistrement usage voucher:', cleanUsageData);
    
    await addDoc(collection(db, 'voucher_applications'), cleanUsageData);
    console.log('✅ Utilisation voucher enregistrée');
    
  } catch (error: any) {
    console.error('❌ Erreur enregistrement usage voucher:', error.message);
    // Ne pas throw pour ne pas bloquer le flow principal
  }
}
  
  // Créer un nouveau voucher (pour l'admin)
  static async createVoucher(voucherData: any): Promise<string> {
    try {
      const db = getDb();
      if (!db) {
        throw new Error('Base de données non disponible');
      }

      // Préparer les données du voucher
      const voucher = {
        code: (voucherData.code || '').toUpperCase().trim(),
        discountType: voucherData.discountType || 'percentage',
        discountValue: Number(voucherData.discountValue) || 0,
        minPurchaseAmount: voucherData.minPurchaseAmount ? Number(voucherData.minPurchaseAmount) : 0,
        maxDiscountAmount: voucherData.maxDiscountAmount ? Number(voucherData.maxDiscountAmount) : 0,
        validFrom: Timestamp.fromDate(voucherData.validFrom ? new Date(voucherData.validFrom) : new Date()),
        validUntil: Timestamp.fromDate(voucherData.validUntil ? new Date(voucherData.validUntil) : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)),
        maxUses: Number(voucherData.maxUses) || 100,
        currentUses: 0,
        userIds: Array.isArray(voucherData.userIds) ? voucherData.userIds : 
                (voucherData.userIds ? voucherData.userIds.split(',').map((id: string) => id.trim()).filter((id: string) => id) : []),
        telegramGroupIds: Array.isArray(voucherData.telegramGroupIds) ? voucherData.telegramGroupIds :
                         (voucherData.telegramGroupIds ? voucherData.telegramGroupIds.split(',').map((id: string) => id.trim()).filter((id: string) => id) : []),
        productTypes: Array.isArray(voucherData.productTypes) ? voucherData.productTypes :
                     (voucherData.productTypes ? voucherData.productTypes.split(',').map((type: string) => type.trim()).filter((type: string) => type) : 
                     ['normal', 'telegram_subscription']),
        isActive: true,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };
      
      console.log('📝 Création du voucher avec données:', voucher);
      
      const docRef = await addDoc(collection(db, 'vouchers'), voucher);
      console.log('✅ Voucher créé avec ID:', docRef.id);
      return docRef.id;
      
    } catch (error: any) {
      console.error('❌ Erreur création voucher:', error);
      throw new Error(`Erreur création: ${error.message}`);
    }
  }
  
  // Récupérer tous les vouchers (admin)
  static async getAllVouchers(): Promise<any[]> {
    try {
      const db = getDb();
      if (!db) {
        console.error('❌ Base de données non disponible');
        return [];
      }

      const snapshot = await getDocs(collection(db, 'vouchers'));
      const vouchers = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          // Convertir les Timestamps en string ISO
          validFrom: data.validFrom?.toDate ? data.validFrom.toDate().toISOString() : data.validFrom,
          validUntil: data.validUntil?.toDate ? data.validUntil.toDate().toISOString() : data.validUntil,
          createdAt: data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : data.createdAt,
          updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate().toISOString() : data.updatedAt
        };
      });
      
      console.log(`✅ ${vouchers.length} vouchers récupérés`);
      return vouchers;
      
    } catch (error: any) {
      // Si la collection n'existe pas, retourner tableau vide
      console.log('📝 Collection vouchers vide ou inexistante:', error.message);
      return [];
    }
  }
  
  // Activer/désactiver un voucher
  static async toggleVoucher(voucherId: string): Promise<boolean> {
    try {
      const db = getDb();
      if (!db) {
        throw new Error('Base de données non disponible');
      }

      const voucherRef = doc(db, 'vouchers', voucherId);
      const voucherDoc = await getDoc(voucherRef);
      
      if (!voucherDoc.exists()) {
        throw new Error('Voucher non trouvé');
      }
      
      const currentStatus = voucherDoc.data().isActive;
      
      await updateDoc(voucherRef, {
        isActive: !currentStatus,
        updatedAt: serverTimestamp()
      });
      
      console.log(`✅ Voucher ${voucherId} ${!currentStatus ? 'activé' : 'désactivé'}`);
      return !currentStatus;
    } catch (error: any) {
      console.error('❌ Erreur toggle voucher:', error);
      throw error;
    }
  }
  
  // Créer un voucher de test pour initialiser la collection
  static async createTestVoucher(): Promise<void> {
    try {
      const testVoucherData = {
        code: "WELCOME10",
        discountType: "percentage",
        discountValue: 10,
        minPurchaseAmount: 1000,
        maxDiscountAmount: 5000,
        maxUses: 1000,
        currentUses: 0,
        userIds: [],
        telegramGroupIds: [],
        productTypes: ['normal', 'telegram_subscription'],
        isActive: true
      };
      
      await this.createVoucher(testVoucherData);
      console.log('✅ Voucher de test créé avec succès');
    } catch (error) {
      console.error('❌ Erreur création voucher de test:', error);
    }
  }



  // new methods for the 100% vouchers
  // Ajouter cette méthode à la classe VoucherService
static async process100PercentVoucher(
  voucherData: any,
  paymentData: any,
  userId?: string,
  telegramData?: {
    groupId?: string;
    telegramGroupId?: string;
    groupName?: string;
    subscriberTelegramId?: string;
    subscriberTelegramUsername?: string;
    subscriberName?: string;
    subscriberEmail?: string;
    creatorUid?: string;
    subscriptionType?: string;
  }
): Promise<{
  success: boolean;
  transactionId?: string;
  subscriptionId?: string;
  error?: string;
}> {
  try {
    console.log('🎫 Traitement voucher 100%:', { voucherData, paymentData, telegramData });

    const db = getDb();
    if (!db) {
      throw new Error('Base de données non disponible');
    }

    // Générer un ID de transaction unique
    const transactionId = `free_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Si c'est un paiement Telegram
    if (telegramData && telegramData.groupId) {
      return await this.createFreeTelegramSubscription(
        transactionId,
        paymentData,
        telegramData,
        voucherData
      );
    } else {
      // Si c'est un paiement normal
      return await this.createFreeTransaction(
        transactionId,
        paymentData,
        userId,
        voucherData
      );
    }
    
  } catch (error: any) {
    console.error('❌ Erreur traitement voucher 100%:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

// Méthode pour créer un abonnement Telegram gratuit
private static async createFreeTelegramSubscription(
  transactionId: string,
  paymentData: any,
  telegramData: any,
  voucherData: any
): Promise<{
  success: boolean;
  transactionId: string;
  subscriptionId?: string;
  inviteLink?: string;
  error?: string;
}> {
  try {
    const db = getDb();
    const { addDoc, collection, serverTimestamp, Timestamp, updateDoc } = await import('firebase/firestore');

    // VÉRIFIER ET CORRIGER LES DONNÉES OBLIGATOIRES
    if (!telegramData.groupId || !telegramData.telegramGroupId || !telegramData.subscriberTelegramId) {
      throw new Error('Données Telegram incomplètes');
    }

    // 🔧 CORRECTION: Récupérer le creatorUid depuis le groupe si non fourni
    let creatorUid = telegramData.creatorUid;
    
    if (!creatorUid) {
      try {
        // Essayer de récupérer le creatorUid depuis la collection des groupes
        const { query, where, getDocs } = await import('firebase/firestore');
        const groupsRef = collection(db, 'telegram_groups');
        const groupQuery = query(groupsRef, where('groupId', '==', telegramData.groupId));
        const groupSnapshot = await getDocs(groupQuery);
        
        if (!groupSnapshot.empty) {
          const groupData = groupSnapshot.docs[0].data();
          creatorUid = groupData.creatorUid || groupData.uid;
          console.log('🔍 CreatorUid récupéré depuis le groupe:', creatorUid);
        }
      } catch (groupError) {
        console.warn('⚠️ Impossible de récupérer creatorUid:', groupError);
      }
    }

    // Calculer la date d'expiration
    const calculateEndDate = (subscriptionType: string): Date => {
      const now = new Date();
      const endDate = new Date(now);
      
      switch (subscriptionType) {
        case 'trois_jours': endDate.setDate(now.getDate() + 3); break;
        case 'hebdomadaire': endDate.setDate(now.getDate() + 7); break;
        case 'mensuelle': endDate.setDate(now.getDate() + 30); break;
        case 'trimestrielle': endDate.setDate(now.getDate() + 90); break;
        case 'annuelle': endDate.setFullYear(now.getFullYear() + 1); break;
        case 'one_time': endDate.setDate(now.getDate() + 30); break;
        default:
          const days = parseInt(subscriptionType);
          endDate.setDate(now.getDate() + (!isNaN(days) ? days : 30));
      }
      return endDate;
    };

    const now = new Date();
    const endDate = calculateEndDate(telegramData.subscriptionType || 'one_time');

    // 🔧 CORRECTION: Créer l'objet avec des valeurs par défaut pour éviter undefined
    const subscriptionData: any = {
      // Données de base (avec valeurs par défaut)
      groupId: telegramData.groupId || '',
      telegramGroupId: telegramData.telegramGroupId || '',
      groupName: telegramData.groupName || paymentData.product || 'Groupe Telegram',
      creatorUid: creatorUid || null, // 🔧 Peut être null mais pas undefined
      
      // Informations abonné (avec valeurs par défaut)
      subscriberUid: null,
      subscriberTelegramId: telegramData.subscriberTelegramId || '',
      subscriberTelegramUsername: telegramData.subscriberTelegramUsername || null,
      subscriberName: telegramData.subscriberName || "Utilisateur Telegram",
      subscriberEmail: telegramData.subscriberEmail || null,
      
      // Paiement (gratuit avec voucher 100%)
      price: 0,
      originalPrice: paymentData.originalAmount || 0,
      discountAmount: paymentData.discountAmount || 0,
      voucherCode: voucherData.code || '',
      paymentTransactionId: transactionId,
      subscriptionType: telegramData.subscriptionType || 'one_time',
      paymentAmount: 0,
      
      // Statut
      status: 'active',
      startDate: Timestamp.fromDate(now),
      endDate: Timestamp.fromDate(endDate),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      addedToGroup: false,
      botInviteLink: null,
      paymentConfirmed: true,
      paymentMethod: 'voucher_100_percent',
      
      // Métadonnées
      fromBot: false,
      source: 'frontend_voucher_100',
      voucherApplied: true,
      voucherType: '100_percent',
      isFreeSubscription: true
    };

    console.log('📝 Création abonnement gratuit Telegram:', {
      groupId: subscriptionData.groupId,
      telegramGroupId: subscriptionData.telegramGroupId,
      subscriberTelegramId: subscriptionData.subscriberTelegramId,
      creatorUid: subscriptionData.creatorUid
    });

    // 🔧 CORRECTION: Filtrer les valeurs undefined avant l'ajout
    const cleanSubscriptionData = Object.keys(subscriptionData).reduce((acc, key) => {
      if (subscriptionData[key] !== undefined) {
        acc[key] = subscriptionData[key];
      } else {
        acc[key] = null; // Remplacer undefined par null
      }
      return acc;
    }, {} as any);

    const subscriptionRef = await addDoc(
      collection(db, 'telegram_subscriptions'),
      cleanSubscriptionData
    );

    const subscriptionId = subscriptionRef.id;
    console.log('✅ Abonnement gratuit créé avec ID:', subscriptionId);

    // 🔧 CORRECTION: Enregistrer aussi une transaction pour le tracking
    try {
      const transactionData = {
        userId: creatorUid || 'unknown_creator',
        amount: 0,
        originalAmount: paymentData.originalAmount || 0,
        discountAmount: paymentData.discountAmount || 0,
        finalAmount: 0,
        currency: 'XAF',
        status: 'completed',
        paymentMethod: 'voucher_100_percent',
        paymentGateway: 'none',
        transactionId: transactionId,
        voucherCode: voucherData.code || '',
        product: `Abonnement Telegram: ${telegramData.groupName || 'Groupe'}`,
        productId: telegramData.groupId,
        metadata: {
          type: 'telegram_subscription',
          groupId: telegramData.groupId,
          telegramGroupId: telegramData.telegramGroupId,
          subscriptionId: subscriptionId,
          voucher100Percent: true
        },
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        completedAt: serverTimestamp(),
        isFreeTransaction: true,
        freeTransactionSource: 'telegram_100_percent_voucher'
      };

      await addDoc(collection(db, 'transactions'), transactionData);
      console.log('✅ Transaction gratuite enregistrée pour Telegram');
    } catch (transactionError) {
      console.warn('⚠️ Erreur création transaction:', transactionError);
      // Ne pas bloquer si échec de création transaction
    }

    // 🎯 AJOUTER L'UTILISATEUR AU GROUPE TELEGRAM
    let inviteLink = null;
    let userAdded = false;
    
    if (telegramData.telegramGroupId && telegramData.subscriberTelegramId) {
      try {
        const botToken = process.env.TELEGRAM_BOT_TOKEN || "8526096119:AAE4gLXvCR7QxC7M6KL9XZuYIax8woKzyng";
        
        console.log('🤖 Tentative d\'ajout au groupe Telegram:', {
          chat_id: telegramData.telegramGroupId,
          user_id: telegramData.subscriberTelegramId
        });

        // 1. Créer un lien d'invitation
        const inviteResponse = await fetch(
          `https://api.telegram.org/bot${botToken}/createChatInviteLink`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              chat_id: telegramData.telegramGroupId,
              member_limit: 1,
              expire_date: Math.floor(Date.now() / 1000) + (24 * 60 * 60), // 24h
              name: `Abonnement gratuit ${telegramData.groupName || 'Groupe'}`
            })
          }
        );
        
        const inviteData = await inviteResponse.json();
        
        if (inviteData.ok && inviteData.result.invite_link) {
          inviteLink = inviteData.result.invite_link;
          
          // 2. Envoyer le lien à l'utilisateur
          const messageResponse = await fetch(
            `https://api.telegram.org/bot${botToken}/sendMessage`,
            {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                chat_id: telegramData.subscriberTelegramId,
                text: `🎁 *OFFRE 100% GRATUITE !*\n\n` +
                      `Votre abonnement à *${telegramData.groupName || 'le groupe'}* a été activé !\n\n` +
                      `💰 Montant: 0 XAF (100% offert)\n` +
                      `🎫 Code promo: ${voucherData.code || 'VOUCHER'}\n` +
                      `📅 Durée: ${this.formatSubscriptionType(telegramData.subscriptionType || 'one_time')}\n` +
                      `📆 Expire le: ${endDate.toLocaleDateString('fr-FR')}\n\n` +
                      `Cliquez sur ce lien pour rejoindre le groupe (valable 24h) :\n` +
                      `${inviteLink}\n\n` +
                      `ℹ️ Si le lien ne fonctionne pas, contactez l'administrateur du groupe.`,
                parse_mode: 'Markdown'
              })
            }
          );
          
          const messageData = await messageResponse.json();
          if (messageData.ok) {
            console.log('📨 Notification Telegram envoyée avec succès');
            userAdded = true;
            
            // 3. Mettre à jour l'abonnement
            await updateDoc(subscriptionRef, {
              botInviteLink: inviteLink,
              invitedAt: serverTimestamp(),
              updatedAt: serverTimestamp(),
              inviteLinkExpires: Timestamp.fromDate(new Date(Date.now() + 24 * 60 * 60 * 1000)),
              addedToGroup: true,
              lastNotificationSent: serverTimestamp()
            });
            
            console.log('✅ Utilisateur ajouté au groupe Telegram');
            
            // 4. Essayer d'ajouter directement l'utilisateur au groupe
            try {
              const addUserResponse = await fetch(
                `https://api.telegram.org/bot${botToken}/addChatMember`,
                {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    chat_id: telegramData.telegramGroupId,
                    user_id: parseInt(telegramData.subscriberTelegramId),
                    can_send_messages: true,
                    can_send_media_messages: true,
                    can_send_other_messages: true
                  })
                }
              );
              
              const addUserData = await addUserResponse.json();
              if (addUserData.ok) {
                console.log('✅ Utilisateur ajouté directement au groupe');
              } else {
                console.log('ℹ️ Lien d\'invitation envoyé, ajout direct non nécessaire');
              }
            } catch (addUserError) {
              console.log('ℹ️ Méthode addChatMember non disponible, lien d\'invitation suffisant');
            }
          } else {
            console.warn('⚠️ Erreur envoi message Telegram:', messageData);
          }
        } else {
          console.warn('⚠️ Impossible de créer le lien d\'invitation:', inviteData);
        }
      } catch (telegramError: any) {
        console.warn('⚠️ Erreur API Telegram:', telegramError.message);
        // Même en cas d'erreur Telegram, l'abonnement est créé
      }
    } else {
      console.warn('⚠️ Données Telegram insuffisantes pour envoyer l\'invitation');
    }

    return {
      success: true,
      transactionId,
      subscriptionId,
      inviteLink: inviteLink || undefined
    };

  } catch (error: any) {
    console.error('❌ Erreur création abonnement gratuit Telegram:', error);
    throw error;
  }
}

// Méthode pour créer une transaction normale gratuite
private static async createFreeTransaction(
  transactionId: string,
  paymentData: any,
  userId?: string,
  voucherData?: any
): Promise<{
  success: boolean;
  transactionId: string;
  error?: string;
}> {
  try {
    const db = getDb();
    const { addDoc, collection, serverTimestamp } = await import('firebase/firestore');

    // 🔧 CORRECTION ICI : Enlever productId ou lui donner une valeur par défaut
    const transactionData = {
      userId: userId,
      amount: 0,
      originalAmount: paymentData.originalAmount || 0,
      discountAmount: paymentData.originalAmount || 0,
      finalAmount: 0,
      currency: 'XAF',
      status: 'completed',
      paymentMethod: 'voucher_100_percent',
      paymentGateway: 'none',
      transactionId: transactionId,
      voucherCode: voucherData?.code || null,
      product: paymentData.product,
      // 🔧 SOIT ENLEVER productId, SOIT LUI DONNER UNE VALEUR PAR DÉFAUT
      productId: paymentData.productId || 'free_product', // Valeur par défaut
      metadata: paymentData.metadata || {},
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      completedAt: serverTimestamp(),
      paymentDetails: {
        type: 'voucher_100_percent',
        voucherApplied: true,
        discountType: 'percentage',
        discountValue: 100,
        voucherCode: voucherData?.code || null
      },
      // 🔧 AJOUTER UN CHAMP POUR IDENTIFIER LES TRANSACTIONS GRATUITES
      isFreeTransaction: true,
      freeTransactionSource: '100_percent_voucher'
    };

    console.log('📝 Création transaction gratuite:', transactionData);

    // Enregistrer dans la collection transactions
    await addDoc(collection(db, 'transactions'), transactionData);

    // Enregistrer l'utilisation du voucher
    if (voucherData) {
      await this.recordVoucherUsage(
        voucherData.id,
        voucherData.code,
        paymentData.originalAmount || 0,
        paymentData.originalAmount || 0,
        0,
        userId,
        transactionId
      );
    }

    console.log('✅ Transaction gratuite créée avec ID:', transactionId);

    return {
      success: true,
      transactionId
    };

  } catch (error: any) {
    console.error('❌ Erreur création transaction gratuite:', error);
    throw error;
  }
}

// Méthode utilitaire pour formater le type d'abonnement
private static formatSubscriptionType(type: string): string {
  switch (type) {
    case 'trois_jours': return '3 jours';
    case 'hebdomadaire': return '7 jours';
    case 'mensuelle': return '30 jours';
    case 'trimestrielle': return '3 mois';
    case 'annuelle': return '1 an';
    case 'one_time': return '30 jours';
    default: return type;
  }
}
}