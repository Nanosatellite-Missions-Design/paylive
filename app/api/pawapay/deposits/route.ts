import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';

export async function POST(req: NextRequest) {
  try {
    const { amount, currentUrl, product } = await req.json();
    console.log({amount, currentUrl, product})

    if (!amount) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    const newDepositId = uuidv4();

    const payload = {
        depositId: newDepositId,
        returnUrl: currentUrl,
        customerMessage: `Achat payLive ${product}`.slice(0, 22),
        amountDetails: {
            amount: String(amount),
            currency: "XAF"
        },
        country: "CMR",
        language: "FR",
        reason: `Achat ${product}`
    }

    const response = await fetch("https://api.pawapay.io/v2/paymentpage", {
      method: 'POST',
      headers: {
        'Authorization': `Bearer eyJraWQiOiIxIiwiYWxnIjoiRVMyNTYifQ.eyJ0dCI6IkFBVCIsInN1YiI6IjgxOSIsIm1hdiI6IjEiLCJleHAiOjIwNjIwNzc0NzgsImlhdCI6MTc0NjU0NDY3OCwicG0iOiJEQUYsUEFGIiwianRpIjoiMzkwMjA4Y2UtOTFhYy00Njg3LTlhMDItNmQxYjdlMDAwZWZkIn0.HCamwQRaGe3UkJD3RH5qVxs7pWaiqVfp6PtXNoy4aMST2nsvWkja0KpOX8eucxrZljU5BCaqdqgm7rvVjNMQSw`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const errorText = await response.text();

      return NextResponse.json({ error: 'PawaPay request failed', details: errorText }, { status: 500 });
    }

    const data = await response.json();

    return NextResponse.json({ ...data, depositId: newDepositId });
  } catch (error) {
    console.error('Server error:', error);
    return NextResponse.json({ error: 'Internal Server Error', details: (error as Error).message }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const depositId = searchParams.get('depositId');

    if (!depositId) {
      return NextResponse.json({ error: 'Missing depositId in query' }, { status: 400 });
    }

    const response = await fetch(`https://api.pawapay.io/deposits/${depositId}`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer eyJraWQiOiIxIiwiYWxnIjoiRVMyNTYifQ.eyJ0dCI6IkFBVCIsInN1YiI6IjgxOSIsIm1hdiI6IjEiLCJleHAiOjIwNjIwNzc0NzgsImlhdCI6MTc0NjU0NDY3OCwicG0iOiJEQUYsUEFGIiwianRpIjoiMzkwMjA4Y2UtOTFhYy00Njg3LTlhMDItNmQxYjdlMDAwZWZkIn0.HCamwQRaGe3UkJD3RH5qVxs7pWaiqVfp6PtXNoy4aMST2nsvWkja0KpOX8eucxrZljU5BCaqdqgm7rvVjNMQSw`,
        Accept: 'application/json',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      // console.error('PawaPay GET error:', errorText);
      return NextResponse.json({ error: 'Failed to fetch deposit status', details: errorText }, { status: 500 });
    }

    const data = await response.json();

    return NextResponse.json(data);
  } catch (error) {
    console.error('GET error:', error);
    return NextResponse.json({ error: 'Internal Server Error', details: (error as Error).message }, { status: 500 });
  }
}