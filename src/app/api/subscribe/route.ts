import { NextResponse } from "next/server";

const FORMSPREE_ENDPOINT = "https://formspree.io/f/mbgdykbk";

export async function POST(request: Request) {
  let data;
  try {
    data = await request.json();
  } catch {
    return NextResponse.json({ error: "Please check your details and try again." }, { status: 400 });
  }

  const name = typeof data?.name === "string" ? data.name.trim() : "";
  const whatsapp = typeof data?.whatsapp === "string" ? data.whatsapp.trim() : "";
  const email = typeof data?.email === "string" ? data.email.trim() : "";

  if (name.length < 2 || name.length > 200) {
    return NextResponse.json({ error: "Please enter your full name." }, { status: 400 });
  }
  if (!/^\+?[\d\s()\-]+$/.test(whatsapp) || !/^\d{7,15}$/.test(whatsapp.replace(/\D/g, ""))) {
    return NextResponse.json({ error: "Please enter a valid WhatsApp number." }, { status: 400 });
  }
  if (email.length > 254 || !/^\S+@\S+\.\S+$/.test(email)) {
    return NextResponse.json({ error: "Please enter a valid email address." }, { status: 400 });
  }

  try {
    const response = await fetch(FORMSPREE_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({ name, whatsapp, email }),
      cache: "no-store",
      signal: AbortSignal.timeout(15000),
    });

    if (!response.ok) {
      return NextResponse.json({ error: "We couldn’t join you to the waitlist. Please try again." }, { status: 502 });
    }

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Unable to reach the waitlist right now. Please try again." }, { status: 502 });
  }
}
