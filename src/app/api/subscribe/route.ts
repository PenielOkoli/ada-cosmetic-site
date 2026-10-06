import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const { name, whatsapp, email } = await request.json();
  console.log("GARDIN coming-soon subscriber:", { name, whatsapp, email });
  return NextResponse.json({ ok: true });
}
