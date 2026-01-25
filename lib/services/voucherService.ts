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
  
  // Enregistrer l'utilisation d'un voucher
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
      if (!db) return;
      
      const usageData = {
        voucherId,
        code: code.toUpperCase().trim(),
        originalAmount,
        discountAmount,
        finalAmount,
        userId,
        transactionId,
        telegramGroupId,
        appliedAt: serverTimestamp()
      };
      
      await addDoc(collection(db, 'voucher_applications'), usageData);
      console.log('✅ Utilisation voucher enregistrée:', usageData);
    } catch (error) {
      console.error('❌ Erreur enregistrement usage voucher:', error);
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
}