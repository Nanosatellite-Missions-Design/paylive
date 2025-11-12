import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';

        const   YOUR_EXISTING_BACKEND_URL  = "https://bookhub-backend-production-64db.up.railway.app/api/";
const PAWAPAY_BASE_URL = "https://api.sandbox.pawapay.io/v2";

const  PAWAPAY_API_BASE= 'https://api.pawapay.io/payouts';
const PAWAPAY_AUTH_HEADER = `Bearer eyJraWQiOiIxIiwiYWxnIjoiRVMyNTYifQ.eyJ0dCI6IkFBVCIsInN1YiI6IjgxOSIsIm1hdiI6IjEiLCJleHAiOjIwNjIwNzc0NzgsImlhdCI6MTc0NjU0NDY3OCwicG0iOiJEQUYsUEFGIiwianRpIjoiMzkwMjA4Y2UtOTFhYy00Njg3LTlhMDItNmQxYjdlMDAwZWZkIn0.HCamwQRaGe3UkJD3RH5qVxs7pWaiqVfp6PtXNoy4aMST2nsvWkja0KpOX8eucxrZljU5BCaqdqgm7rvVjNMQSw`;


export async function POST(req: NextRequest) {
  try {
    const { amount, phoneNumber, provider, customerId, countryCode, currency } = await req.json();
    
    console.log("📤 Données reçues:", { amount, phoneNumber, provider, customerId, countryCode, currency });

    // Validation
    if (!amount || !phoneNumber || !provider || !customerId) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const payoutId = uuidv4();

    // ✅ STRUCTURE EXACTE selon documentation PawaPay
    const payload = {
      payoutId: payoutId,
      amount: String(amount), // ✅ String simple, pas d'objet
      currency: currency || "XAF", // ✅ Au niveau racine
      recipient: {
        type: "MMO", // ✅ "MMO" pas "MSISDN"
        accountDetails: { // ✅ accountDetails pas address
          phoneNumber: phoneNumber.replace('+', ''), // ✅ Sans le +
          provider: provider // ✅ Le provider directement ici
        }
      }
    };

    console.log("📤 Payload envoyé à PawaPay:", payload);

    const response = await fetch(`${YOUR_EXISTING_BACKEND_URL}/payouts`, {
      method: 'POST',
      headers: {
        'Authorization': PAWAPAY_AUTH_HEADER,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("❌ Erreur PawaPay:", errorText);
      return NextResponse.json({ 
        error: 'PawaPay payout request failed', 
        details: errorText 
      }, { status: 500 });
    }

    const data = await response.json();
    console.log("✅ Réponse PawaPay:", data);

    return NextResponse.json({ 
      ...data, 
      payoutId: payoutId 
    });

  } catch (error) {
    console.error('❌ POST /payouts error:', error);
    return NextResponse.json({ 
      error: 'Internal Server Error', 
      details: (error as Error).message 
    }, { status: 500 });
  }
}
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const payoutId = searchParams.get('payoutId');

    if (!payoutId) {
      return NextResponse.json({ error: 'Missing payoutId in query' }, { status: 400 });
    }

    // ✅ UTILISEZ VOTRE SERVEUR EXPRESS POUR LES GET AUSSI
    const response = await fetch(`${YOUR_EXISTING_BACKEND_URL}/payouts/${payoutId}`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Erreur GET via serveur Express:', errorText);
      return NextResponse.json({ 
        error: 'Failed to fetch payout status', 
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