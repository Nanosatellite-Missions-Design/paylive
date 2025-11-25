// import { AllocationBreakdown } from "./types"
// import { ContributionCategory } from "./types"

export const MEMBERSHIP_PRICING = {
    registrationFee: 15000,
    votingFee: 65000,
    currency: "XAF",
}

// Taux de change approximatifs (basés sur les devises des pays PawaPay)
export const CURRENCY_RATES = {
  XAF: 1, // Référence
  XOF: 1, // Même valeur que XAF (union monétaire)
  CDF: 2.16, // 1 XAF = ~2.16 CDF (Congo)
  KES: 0.16, // 1 XAF = ~0.16 KES (Kenya)
  RWF: 1.81, // 1 XAF = ~1.81 RWF (Rwanda)
  UGX: 1.48, // 1 XAF = ~1.48 UGX (Ouganda)
  ZMW: 0.026, // 1 XAF = ~0.026 ZMW (Zambie)
  SLE: 0.0058, // 1 XAF = ~0.0058 SLE (Sierra Leone)
  EUR: 0.0015, // 1 XAF = ~0.0015 EUR
  USD: 0.0016, // 1 XAF = ~0.0016 USD
};

// Fonction pour convertir un montant XAF vers une devise cible
export function convertXAFToCurrency(amountXAF: number, targetCurrency: string): number {
  const rate = CURRENCY_RATES[targetCurrency as keyof typeof CURRENCY_RATES] || 1;
  const converted = amountXAF * rate;
  
  // Arrondir différemment selon la devise
  if (targetCurrency === 'XAF' || targetCurrency === 'XOF' || targetCurrency === 'CDF') {
    return Math.round(converted); // Arrondir à l'unité pour les francs
  } else {
    return Math.round(converted * 100) / 100; // Arrondir à 2 décimales pour les autres
  }
}

// Fonction pour convertir d'une devise vers XAF
export function convertCurrencyToXAF(amount: number, sourceCurrency: string): number {
  const rate = CURRENCY_RATES[sourceCurrency as keyof typeof CURRENCY_RATES] || 1;
  return Math.round(amount / rate);
}

// Obtenir la devise d'un pays
export function getCurrencyForCountry(countryCode: string): string {
  const currencyMap: { [key: string]: string } = {
    BEN: "XOF",
    BFA: "XOF", 
    CIV: "XOF",
    SEN: "XOF", // West Africa CFA
    CMR: "XAF",
    COD: "CDF",
    COG: "XAF",
    GAB: "XAF", // Central Africa
    KEN: "KES",
    RWA: "RWF", 
    UGA: "UGX",
    ZMB: "ZMW", // East/South Africa
    SLE: "SLE", // Sierra Leone
  };
  return currencyMap[countryCode] || "XAF";
}

// Fonction pour obtenir les symboles des devises
export function getCurrencySymbol(currency: string): string {
  const symbols: { [key: string]: string } = {
    XAF: 'FCFA',
    XOF: 'FCFA', 
    CDF: 'FC',
    KES: 'KSh',
    RWF: 'RF',
    UGX: 'USh',
    ZMW: 'K',
    SLE: 'Le',
    EUR: '€',
    USD: '$'
  };
  return symbols[currency] || currency;
}

// Fonction pour formater l'affichage avec symbole
export function formatCurrencyWithSymbol(amount: number, currency: string): string {
  const symbol = getCurrencySymbol(currency);
  return `${amount.toLocaleString()} ${symbol}`;
}

/**
 * Calculate allocation breakdown based on category and amount
 *
 * Mission: 75% mission, 25% functioning
 * Training: 90% training, 10% functioning
 * Open: 30% mission, 45% training, 25% functioning
 */
// export function calculateAllocation(category: ContributionCategory, amount: number): AllocationBreakdown {
//     let mission = 0
//     let training = 0
//     let functioning = 0

//     switch (category) {
//         case "Mission":
//             mission = amount * 0.75
//             functioning = amount * 0.25
//             break
//         case "Training":
//             training = amount * 0.9
//             functioning = amount * 0.1
//             break
//         case "Open":
//             mission = amount * 0.3
//             training = amount * 0.45
//             functioning = amount * 0.25
//             break
//     }

//     return {
//         mission: Math.round(mission * 100) / 100,
//         training: Math.round(training * 100) / 100,
//         functioning: Math.round(functioning * 100) / 100,
//     }
// }

export const XAF_TO_EUR_RATE = 655.957 // 1 EUR = 655.957 XAF (taux fixe CFA)

export function formatCurrency(amount: number, currency = "XAF"): string {
    if (currency === "XAF" || currency === "XOF") {
        return `${amount.toLocaleString()} FCFA`
    } else if (currency === "USD") {
        return `$${amount.toLocaleString()}`
    } else if (currency === "EUR") {
        return `€${amount.toLocaleString()}`
    } else if (currency === "CDF") {
        return `${amount.toLocaleString()} FC`
    } else if (currency === "KES") {
        return `KSh ${amount.toLocaleString()}`
    } else if (currency === "RWF") {
        return `RF ${amount.toLocaleString()}`
    } else if (currency === "UGX") {
        return `USh ${amount.toLocaleString()}`
    } else if (currency === "ZMW") {
        return `K ${amount.toLocaleString()}`
    } else if (currency === "SLE") {
        return `Le ${amount.toLocaleString()}`
    }
    return `${amount.toLocaleString()} ${currency}`
}

export function formatDualCurrency(amountXAF: number): string {
    const amountEUR = Math.round((amountXAF / XAF_TO_EUR_RATE) * 100) / 100
    return `${amountXAF.toLocaleString()} XAF | ${amountEUR.toLocaleString()} EUR`
}

export function convertEURtoXAF(amountEUR: number): number {
    return Math.round(amountEUR * XAF_TO_EUR_RATE)
}

export function convertXAFtoEUR(amountXAF: number): number {
    return Math.round((amountXAF / XAF_TO_EUR_RATE) * 100) / 100
}
// Ajoutez cette fonction à la fin du fichier
export function formatLocalDisplay(amountXAF: number, countryCode: string): string {
  const targetCurrency = getCurrencyForCountry(countryCode);
  const localAmount = convertXAFToCurrency(amountXAF, targetCurrency);
  return formatCurrencyWithSymbol(localAmount, targetCurrency);
}