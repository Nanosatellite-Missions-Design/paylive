export interface Voucher {
  id: string;
  code: string;
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  minPurchaseAmount?: number;
  maxDiscountAmount?: number;
  validFrom: Date | string;
  validUntil: Date | string;
  maxUses: number;
  currentUses: number;
  userIds?: string[];
  telegramGroupIds?: string[];
  productTypes?: string[];
  isActive: boolean;
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface VoucherValidationResult {
  valid: boolean;
  discountAmount: number;
  finalAmount: number;
  voucher?: Voucher;
  error?: string;
}