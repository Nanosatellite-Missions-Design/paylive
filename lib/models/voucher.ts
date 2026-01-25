export interface Voucher {
  id: string;
  code: string; // Code unique (ex: "SUMMER20")
  discountType: 'percentage' | 'fixed'; // Pourcentage ou montant fixe
  discountValue: number; // 20 pour 20% ou 500 pour 500 XAF
  minPurchaseAmount?: number; // Montant minimum d'achat
  maxDiscountAmount?: number; // Réduction max (pour les %)
  validFrom: Date;
  validUntil: Date;
  maxUses: number; // Nombre max d'utilisations
  currentUses: number; // Utilisations actuelles
  userIds?: string[]; // Restreint à certains utilisateurs
  telegramGroupIds?: string[]; // Restreint à certains groupes Telegram
  productTypes?: string[]; // Types de produits applicables
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface VoucherApplication {
  voucherId: string;
  code: string;
  originalAmount: number;
  discountAmount: number;
  finalAmount: number;
  appliedAt: Date;
  userId?: string;
  transactionId?: string;
  telegramGroupId?: string;
}