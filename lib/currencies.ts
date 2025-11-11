// lib/currencies.ts

export interface CurrencyInfo {
  code: string;
  name: string;
  symbol: string;
  countries: string[];
}

export const CURRENCIES: CurrencyInfo[] = [
  {
    code: "XAF",
    name: "Central African CFA Franc",
    symbol: "FCFA",
    countries: ["CMR", "GAB", "CAF", "COG", "TCD", "GNQ", "BEN", "BFA", "CIV", "MLI", "NER", "SEN", "TGO"]
  },
  {
    code: "XOF",
    name: "West African CFA Franc", 
    symbol: "CFA",
    countries: ["BEN", "BFA", "CIV", "MLI", "NER", "SEN", "TGO"]
  },
  {
    code: "GHS",
    name: "Ghanaian Cedi",
    symbol: "GH₵",
    countries: ["GHA"]
  },
  {
    code: "KES",
    name: "Kenyan Shilling",
    symbol: "KSh",
    countries: ["KEN"]
  },
  {
    code: "RWF",
    name: "Rwandan Franc",
    symbol: "FRw",
    countries: ["RWA"]
  },
  {
    code: "UGX",
    name: "Ugandan Shilling",
    symbol: "USh",
    countries: ["UGA"]
  },
  {
    code: "TZS",
    name: "Tanzanian Shilling",
    symbol: "TSh",
    countries: ["TZA"]
  },
  {
    code: "ZMW",
    name: "Zambian Kwacha",
    symbol: "ZK",
    countries: ["ZMB"]
  },
  {
    code: "NGN",
    name: "Nigerian Naira",
    symbol: "₦",
    countries: ["NGA"]
  },
  {
    code: "CDF",
    name: "Congolese Franc",
    symbol: "FC",
    countries: ["COD"]
  },
  {
    code: "SLL",
    name: "Sierra Leonean Leone",
    symbol: "Le",
    countries: ["SLE"]
  },
  {
    code: "GNF",
    name: "Guinean Franc",
    symbol: "FG",
    countries: ["GIN"]
  },
  {
    code: "MRU",
    name: "Mauritanian Ouguiya",
    symbol: "UM",
    countries: ["MRT"]
  }
];

export const getCurrencyByCountry = (countryCode: string): string => {
  const currency = CURRENCIES.find(currency => 
    currency.countries.includes(countryCode)
  );
  return currency?.code || "XAF"; // Fallback à XAF
};

export const getCurrencySymbol = (currencyCode: string): string => {
  const currency = CURRENCIES.find(c => c.code === currencyCode);
  return currency?.symbol || currencyCode;
};

export const getCurrencyName = (currencyCode: string): string => {
  const currency = CURRENCIES.find(c => c.code === currencyCode);
  return currency?.name || currencyCode;
};