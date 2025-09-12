// app/api/send-sms/route.ts
import { NextResponse } from "next/server";

const API_KEY = "f7aaa21041c186f2";
const SECRET_KEY = "fedd7af0";
const CALLER_ID = "PayLive";

export async function POST(req: Request) {
  try {
    const { to, body } = await req.json();

    if (!to || !body) {
      return NextResponse.json(
        { error: 'Missing "to" or "body"' },
        { status: 400 }
      );
    }

    const encodedMessage = encodeURIComponent(body);
    const smsUrl = `http://sms.avssarl.com:4324/sendtext?apikey=${API_KEY}&secretkey=${SECRET_KEY}&callerID=${CALLER_ID}&toUser=${to}&messageContent=${encodedMessage}`;

    const smsResponse = await fetch(smsUrl);

    if (!smsResponse.ok) {
      throw new Error("Failed to send SMS");
    }

    const responseText = await smsResponse.text();

    return NextResponse.json({ success: true, response: responseText });
  } catch (error: any) {
    console.error("SMS API Error:", error);
    return NextResponse.json({ error: "Failed to send SMS" }, { status: 500 });
  }
}
