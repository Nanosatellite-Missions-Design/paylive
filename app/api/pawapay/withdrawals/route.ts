import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';

const PAWAPAY_API_BASE = 'https://api.pawapay.io/payouts';
const PAWAPAY_AUTH_HEADER = `Bearer eyJraWQiOiIxIiwiYWxnIjoiRVMyNTYifQ.eyJ0dCI6IkFBVCIsInN1YiI6IjgxOSIsIm1hdiI6IjEiLCJleHAiOjIwNjIwNzc0NzgsImlhdCI6MTc0NjU0NDY3OCwicG0iOiJEQUYsUEFGIiwianRpIjoiMzkwMjA4Y2UtOTFhYy00Njg3LTlhMDItNmQxYjdlMDAwZWZkIn0.HCamwQRaGe3UkJD3RH5qVxs7pWaiqVfp6PtXNoy4aMST2nsvWkja0KpOX8eucxrZljU5BCaqdqgm7rvVjNMQSw`;

export async function POST(req: NextRequest) {
  try {
    const { amount, phoneNumber, provider, customerId } = await req.json();
    console.log({ amount, phoneNumber, provider });

    if (!amount || !phoneNumber || !provider || !customerId) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const newPayoutId = uuidv4();

    const payload = {
      payoutId: newPayoutId,
      amount: amount,
      currency: "XAF",
      correspondent: provider === 'mtn' ? 'MTN_MOMO_CMR' : 'ORANGE_CMR',
      recipient: {
        type: "MSISDN",
        address: {
          value: `237${phoneNumber}`
        }
      },
      customerTimestamp: new Date().toISOString(),
      statementDescription: "Testing payLive",
      country: "CMR",
      metadata: [
        {
          fieldName: "reason",
          fieldValue: "payLive Withdrawal"
        },
        {
          fieldName: "customerId",
          fieldValue: customerId,
          isPII: true
        }
      ]
    };
    console.log(payload)

    const response = await fetch(PAWAPAY_API_BASE, {
      method: 'POST',
      headers: {
        'Authorization': PAWAPAY_AUTH_HEADER,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const errorText = await response.text();
      return NextResponse.json({ error: 'PawaPay payout request failed', details: errorText }, { status: 500 });
    }

    const data = await response.json();

    return NextResponse.json({ ...data, payoutId: newPayoutId });
  } catch (error) {
    console.error('POST /payouts error:', error);
    return NextResponse.json({ error: 'Internal Server Error', details: (error as Error).message }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const payoutId = searchParams.get('payoutId');

    if (!payoutId) {
      return NextResponse.json({ error: 'Missing payoutId in query' }, { status: 400 });
    }

    const response = await fetch(`${PAWAPAY_API_BASE}/${payoutId}`, {
      method: 'GET',
      headers: {
        Authorization: PAWAPAY_AUTH_HEADER,
        Accept: 'application/json',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      return NextResponse.json({ error: 'Failed to fetch payout status', details: errorText }, { status: 500 });
    }

    const data = await response.json();

    return NextResponse.json(data);
  } catch (error) {
    console.error('GET /payouts error:', error);
    return NextResponse.json({ error: 'Internal Server Error', details: (error as Error).message }, { status: 500 });
  }
}