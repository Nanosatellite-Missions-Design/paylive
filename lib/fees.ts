// // lib/fees.ts

// // Commission plateforme (4%) sur les ventes
// export const PLATFORM_COMMISSION_RATE = 0.04; // 4%

// // Frais PawaPay pour les retraits
// export const PAWAPAY_WITHDRAWAL_FEE_PERCENTAGE = 0.02; // 2%

// /**
//  * Calcule le montant net après commission plateforme
//  */
// export const calculateNetAmount = (grossAmount: number): number => {
//   if (!grossAmount || grossAmount <= 0) return 0;
//   return grossAmount * (1 - PLATFORM_COMMISSION_RATE);
// };

// /**
//  * Calcule les frais de commission plateforme
//  */
// export const calculatePlatformFee = (grossAmount: number): number => {
//   if (!grossAmount || grossAmount <= 0) return 0;
//   return grossAmount * PLATFORM_COMMISSION_RATE;
// };

// /**
//  * Formate l'affichage des montants
//  */
// export const formatCurrency = (amount: number, currency: string = "XAF") => {
//   return `${currency} ${Math.floor(amount).toLocaleString()}`;
// };
// lib/fees.ts

// Commission plateforme (4%) sur TOUT argent entrant
export const PLATFORM_COMMISSION_RATE = 0.04; // 4%
export const PLATFORM_FEE_PERCENTAGE = PLATFORM_COMMISSION_RATE;

/**
 * Calcule le montant net APRÈS commission plateforme (ce que reçoit le créateur)
 */
export const calculateNetAfterFee = (grossAmount: number): number => {
  if (!grossAmount || grossAmount <= 0) return 0;
  const netAmount = grossAmount * (1 - PLATFORM_COMMISSION_RATE);
  return Math.floor(netAmount); // Arrondi à l'entier
};

/**
 * Calcule la commission plateforme
 */
export const calculatePlatformFee = (grossAmount: number): number => {
  if (!grossAmount || grossAmount <= 0) return 0;
  const fee = grossAmount * PLATFORM_COMMISSION_RATE;
  return Math.ceil(fee); // Arrondi au supérieur pour être sûr
};