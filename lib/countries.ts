// Pawapay supported countries with their mobile money providers
export interface CountryProvider {
  code: string;
  name: string;
  dialCode: string;
  flag?: string;
  providers: {
    id: string;
    name: string;
  }[];
}
export interface Provider {
  id: string;
  name: string;
}

export interface Country {
  code: string;
  name: string;
  dialCode: string;
  flag?: string;
  providers: Provider[];
}

export const PAWAPAY_COUNTRIES: CountryProvider[] = [
    {
        code: "BEN",
        name: "Benin",
        dialCode: "+229",
        flag: "https://static-content.pawapay.io/country_flags/ben.svg",
        providers: [
            { id: "MOOV_BEN", name: "Moov" },
            { id: "MTN_MOMO_BEN", name: "MTN" },
        ],
    },
    {
        code: "BFA",
        name: "Burkina Faso",
        dialCode: "+226",
        flag: "https://static-content.pawapay.io/country_flags/bfa.svg",
        providers: [
            { id: "MOOV_BFA", name: "Moov" },
            { id: "ORANGE_BFA", name: "Orange" },
        ],
    },
    {
        code: "CIV",
        name: "Ivory Coast",
        dialCode: "+225",
        flag: "https://static-content.pawapay.io/country_flags/civ.svg",
        providers: [
            { id: "MTN_MOMO_CIV", name: "MTN" },
            { id: "ORANGE_CIV", name: "Orange" },
        ],
    },
    {
        code: "CMR",
        name: "Cameroon",
        dialCode: "+237",
        flag: "https://static-content.pawapay.io/country_flags/cmr.svg",
        providers: [
            { id: "MTN_MOMO_CMR", name: "MTN" },
            { id: "ORANGE_CMR", name: "Orange" },
        ],
    },
    {
        code: "COD",
        name: "Democratic Republic of the Congo",
        dialCode: "+243",
        flag: "https://static-content.pawapay.io/country_flags/cod.svg",
        providers: [
            { id: "AIRTEL_COD", name: "Airtel" },
            { id: "ORANGE_COD", name: "Orange" },
            { id: "VODACOM_MPESA_COD", name: "Vodacom" },
        ],
    },
    {
        code: "COG",
        name: "Congo",
        dialCode: "+242",
        flag: "https://static-content.pawapay.io/country_flags/cog.svg",
        providers: [
            { id: "AIRTEL_COG", name: "Airtel" },
            { id: "MTN_MOMO_COG", name: "MTN" },
        ],
    },
    {
        code: "GAB",
        name: "Gabon",
        dialCode: "+241",
        flag: "https://static-content.pawapay.io/country_flags/gab.svg",
        providers: [
            { id: "AIRTEL_GAB", name: "Airtel" },
        ],
    },
    {
        code: "KEN",
        name: "Kenya",
        dialCode: "+254",
        flag: "https://static-content.pawapay.io/country_flags/ken.svg",
        providers: [
            { id: "MPESA_KEN", name: "Safaricom" },
        ],
    },
    {
        code: "RWA",
        name: "Rwanda",
        dialCode: "+250",
        flag: "https://static-content.pawapay.io/country_flags/rwa.svg",
        providers: [
            { id: "AIRTEL_RWA", name: "Airtel" },
            { id: "MTN_MOMO_RWA", name: "MTN" },
        ],
    },
    {
        code: "SEN",
        name: "Senegal",
        dialCode: "+221",
        flag: "https://static-content.pawapay.io/country_flags/sen.svg",
        providers: [
            { id: "FREE_SEN", name: "Free" },
            { id: "ORANGE_SEN", name: "Orange" },
        ],
    },
    {
        code: "SLE",
        name: "Sierra Leone",
        dialCode: "+232",
        flag: "https://static-content.pawapay.io/country_flags/sle.svg",
        providers: [
            { id: "ORANGE_SLE", name: "Orange" },
        ],
    },
    {
        code: "UGA",
        name: "Uganda",
        dialCode: "+256",
        flag: "https://static-content.pawapay.io/country_flags/uga.svg",
        providers: [
            { id: "AIRTEL_OAPI_UGA", name: "Airtel" },
            { id: "MTN_MOMO_UGA", name: "MTN" },
        ],
    },
    {
        code: "ZMB",
        name: "Zambia",
        dialCode: "+260",
        flag: "https://static-content.pawapay.io/country_flags/zmb.svg",
        providers: [
            { id: "MTN_MOMO_ZMB", name: "MTN" },
            { id: "ZAMTEL_ZMB", name: "Zamtel" },
        ],
    },
];

export function getCountryByCode(code: string): CountryProvider | undefined {
    return PAWAPAY_COUNTRIES.find((c) => c.code === code)
}

export function getProvidersByCountry(countryCode: string) {
    const country = getCountryByCode(countryCode)
    return country?.providers || []
}

// Fetch all countries from REST Countries API
export async function getAllCountries(): Promise<Country[]> {
  try {
    const response = await fetch('https://restcountries.com/v3.1/all?fields=cca2,name,idd,flags,currencies');
    
    if (!response.ok) {
      throw new Error('Failed to fetch countries');
    }
    
    const countriesData = await response.json();
    
    // Transform the API data to our Country format
    const countries: Country[] = countriesData.map((country: any) => {
      // Get dial code (remove any formatting)
      let dialCode = '+1'; // default
      if (country.idd?.root && country.idd.suffixes?.[0]) {
        dialCode = country.idd.root + country.idd.suffixes[0];
      } else if (country.idd?.root) {
        dialCode = country.idd.root;
      }
      
      // Get currency code
      let currency = 'USD'; // default
      if (country.currencies) {
        const currencyCode = Object.keys(country.currencies)[0];
        if (currencyCode) {
          currency = currencyCode;
        }
      }
      
      return {
        code: country.cca2,
        name: country.name.common,
        dialCode: dialCode,
        flag: country.flags.png, // Use PNG flag URL
        currency: currency,
        providers: [] // Empty for non-PawaPay countries
      };
    });
    
    // Sort countries alphabetically by name
    return countries.sort((a, b) => a.name.localeCompare(b.name));
    
  } catch (error) {
    console.error('Error fetching countries from API:', error);
    
    // Fallback to a basic list if API fails
    return getFallbackCountries();
  }
}

// Fallback countries in case API fails
function getFallbackCountries(): Country[] {
  const fallbackCountries: Country[] = [
    // Major countries as fallback
    { code: "US", name: "United States", dialCode: "+1", flag: "🇺🇸", providers: [] },
    { code: "GB", name: "United Kingdom", dialCode: "+44", flag: "🇬🇧", providers: [] },
    { code: "FR", name: "France", dialCode: "+33", flag: "🇫🇷", providers: [] },
    { code: "DE", name: "Germany", dialCode: "+49", flag: "🇩🇪", providers: [] },
    { code: "CA", name: "Canada", dialCode: "+1", flag: "🇨🇦", providers: [] },
    { code: "AU", name: "Australia", dialCode: "+61", flag: "🇦🇺", providers: [] },
    { code: "JP", name: "Japan", dialCode: "+81", flag: "🇯🇵", providers: [] },
    { code: "CN", name: "China", dialCode: "+86", flag: "🇨🇳",  providers: [] },
    { code: "IN", name: "India", dialCode: "+91", flag: "🇮🇳",  providers: [] },
    { code: "BR", name: "Brazil", dialCode: "+55", flag: "🇧🇷", providers: [] },
    // Include all PawaPay countries in fallback
    ...PAWAPAY_COUNTRIES
  ];
  
  return fallbackCountries.sort((a, b) => a.name.localeCompare(b.name));
}

