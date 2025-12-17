import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';

export async function POST(req: NextRequest) {
  try {
    const { amount, currency, countryCode, mobileProviderId, phoneNumber } = await req.json();
    const YOUR_EXISTING_BACKEND_DEPOSIT_URL = "https://bookhub-backend-production-64db.up.railway.app/api/deposits";

    console.log("📦 Données reçues du frontend:", { 
      amount, 
      countryCode, 
      mobileProviderId, 
      phoneNumber,
      currency
    });

    // Validation des champs requis
    if (!amount || !countryCode || !mobileProviderId || !phoneNumber) {
      return NextResponse.json({ 
        error: "Champs de paiement manquants" 
      }, { status: 400 });
    }

    const newDepositId = uuidv4();

    // ✅ STRUCTURE EXACTE selon documentation Pawapay
    const payload = {
        depositId: newDepositId,
        amount: String(amount), // ✅ "amount" à la racine (pas dans amountDetails)
        currency: currency,        // ✅ "currency" à la racine
        payer: {
            type: "MMO",
            accountDetails: {
                phoneNumber: phoneNumber.replace('+', ''), // ✅ Sans le "+"
                provider: mobileProviderId.toUpperCase().replace('-', '_')
            }
        }
    };

    console.log("🔄 Payload Pawapay CORRECT:", JSON.stringify(payload, null, 2));

    const response = await fetch(YOUR_EXISTING_BACKEND_DEPOSIT_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.PAWAPAY_API_KEY}`,
        'X-Project': "paylive",
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Erreur Pawapay:', {
        status: response.status,
        statusText: response.statusText,
        details: errorText
      });
      
      return NextResponse.json({ 
        error: 'Erreur lors de la requête Pawapay', 
        details: errorText 
      }, { status: 500 });
    }

    const data = await response.json();
    console.log("✅ Réponse Pawapay réussie:", data);

    return NextResponse.json({ 
      success: true,
      depositId: newDepositId,
      data: data 
    });

  } catch (error) {
    console.error('❌ Erreur serveur:', error);
    return NextResponse.json({ 
      error: 'Erreur interne du serveur', 
      details: (error as Error).message 
    }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const depositId = searchParams.get('depositId');

    if (!depositId) {
      return NextResponse.json({ error: 'Missing depositId in query' }, { status: 400 });
    }

    const response = await fetch(`https://bookhub-backend-production-64db.up.railway.app/api/deposits/${depositId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${process.env.PAWAPAY_API_KEY}`,
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Erreur GET Pawapay:', errorText);
      return NextResponse.json({ 
        error: 'Failed to fetch deposit status', 
        details: errorText 
      }, { status: 500 });
    }

    const data = await response.json();
    return NextResponse.json(data);

  } catch (error) {
    console.error('GET error:', error);
    return NextResponse.json({ 
      error: 'Internal Server Error', 
      details: (error as Error).message 
    }, { status: 500 });
  }
}