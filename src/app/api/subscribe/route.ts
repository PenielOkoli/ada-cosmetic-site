import { NextResponse } from "next/server";
import { hasAllowedOrigin, InputError, readLimitedJson, takeRateLimit, validateSubscriber } from "@/lib/waitlist-security";

const FORMSPREE_ENDPOINT = "https://formspree.io/f/mbgdykbk";
export const runtime = "nodejs";

function reply(body: { ok?: boolean; error?: string }, status = 200, retryAfter = 0) {
  return NextResponse.json(body, { status, headers: {
    "Cache-Control": "private, no-store, max-age=0",
    ...(retryAfter ? { "Retry-After": String(retryAfter) } : {}),
  } });
}

export async function POST(request: Request) {
  try {
    if (!hasAllowedOrigin(request)) return reply({ error: "Please submit the form from the GARDIN website." }, 403);
    if (request.headers.get("content-type")?.split(";")[0].trim().toLowerCase() !== "application/json") return reply({ error: "Please submit a valid form." }, 415);
    if (request.headers.has("content-encoding")) return reply({ error: "Please submit a valid form." }, 415);
    // Only trust the client IP header Vercel sets, not arbitrary x-forwarded-for.
    const client = process.env.VERCEL === "1" ? request.headers.get("x-vercel-forwarded-for")?.split(",")[0].trim() : undefined;
    const ipWait = takeRateLimit(`ip:${client || "unverified-client"}`, 10, 600000);
    if (ipWait) return reply({ error: "Too many attempts. Please try again later." }, 429, ipWait);
    const subscriber = validateSubscriber(await readLimitedJson(request));
    if (!subscriber) return reply({ ok: true });
    const emailWait = takeRateLimit(`email:${subscriber.email.toLowerCase()}`, 3, 3600000);
    if (emailWait) return reply({ error: "Too many attempts. Please try again later." }, 429, emailWait);

    const response = await fetch(FORMSPREE_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify(subscriber),
      cache: "no-store",
      redirect: "error",
      signal: AbortSignal.timeout(15000),
    });
    if (!response.ok) return reply({ error: "We couldn’t join you to the waitlist. Please try again." }, 502);
    const result: unknown = await response.json();
    if (!result || typeof result !== "object" || !("ok" in result) || result.ok !== true) {
      return reply({ error: "We couldn’t join you to the waitlist. Please try again." }, 502);
    }
    return reply({ ok: true });
  } catch (error) {
    if (error instanceof InputError) return reply({ error: error.message }, error.status);
    // Never expose upstream errors or customer details to logs/clients.
    return reply({ error: "Unable to reach the waitlist right now. Please try again." }, 502);
  }
}
