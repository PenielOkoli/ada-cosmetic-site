import { createHash } from "node:crypto";

export class InputError extends Error {
  constructor(public status: number, message: string) { super(message); }
}

export function hasAllowedOrigin(request: Request) {
  const origin = request.headers.get("origin");
  if (!origin || request.headers.get("sec-fetch-site") === "cross-site") return false;
  const allowed = new Set(["https://gardin-cosmetics.vercel.app"]);
  if (process.env.SITE_URL) allowed.add(new URL(process.env.SITE_URL).origin);
  if (process.env.VERCEL_URL) allowed.add(new URL(`https://${process.env.VERCEL_URL}`).origin);
  if (process.env.NODE_ENV !== "production") {
    const local = new URL(request.url);
    if (["localhost", "127.0.0.1", "[::1]"].includes(local.hostname)) allowed.add(local.origin);
  }
  return allowed.has(origin);
}

export async function readLimitedJson(request: Request) {
  const sizeLimit = 4096;
  const length = request.headers.get("content-length");
  if (length && (!/^\d+$/.test(length) || Number(length) > sizeLimit)) throw new InputError(413, "This request is too large.");
  if (!request.body) throw new InputError(400, "Please check your details and try again.");
  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let received = 0;
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => { reject(new InputError(408, "The request timed out. Please try again.")); void reader.cancel(); }, 5000);
  });
  try {
    while (true) {
      const { done, value } = await Promise.race([reader.read(), timeout]);
      if (done) break;
      received += value.byteLength;
      if (received > sizeLimit) { void reader.cancel(); throw new InputError(413, "This request is too large."); }
      chunks.push(value);
    }
    const body = new Uint8Array(received);
    let offset = 0;
    for (const chunk of chunks) { body.set(chunk, offset); offset += chunk.byteLength; }
    return JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(body)) as unknown;
  } catch (error) {
    if (error instanceof InputError) throw error;
    throw new InputError(400, "Please check your details and try again.");
  } finally { clearTimeout(timer); reader.releaseLock(); }
}

export function validateSubscriber(value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new InputError(400, "Please check your details and try again.");
  const data = value as Record<string, unknown>;
  if (Object.keys(data).some(key => !["name", "whatsapp", "email", "website"].includes(key))) throw new InputError(400, "Please check your details and try again.");
  if (data.website !== undefined && (typeof data.website !== "string" || data.website.length > 200)) throw new InputError(400, "Please check your details and try again.");
  if (data.website) return null; // Honeypot: do not forward bots or reveal the trap.
  const name = typeof data.name === "string" ? data.name.trim() : "";
  const whatsapp = typeof data.whatsapp === "string" ? data.whatsapp.trim() : "";
  const email = typeof data.email === "string" ? data.email.trim() : "";
  if (name.length < 2 || name.length > 200 || /[\p{Cc}<>]/u.test(name)) throw new InputError(400, "Please enter your full name.");
  if (whatsapp.length > 32 || !/^\+?[\d\s()\-]+$/.test(whatsapp) || !/^\d{7,15}$/.test(whatsapp.replace(/\D/g, ""))) throw new InputError(400, "Please enter a valid WhatsApp number.");
  if (email.length > 254 || /[\p{Cc}<>]/u.test(email) || !/^\S+@\S+\.\S+$/.test(email)) throw new InputError(400, "Please enter a valid email address.");
  return { name, whatsapp, email };
}

// Best-effort per-process protection, NOT a distributed serverless/WAF limit.
const buckets = new Map<string, { count: number; expires: number }>();
export function takeRateLimit(key: string, limit: number, windowMs: number, now = Date.now()) {
  for (const [id, bucket] of buckets) if (bucket.expires <= now) buckets.delete(id);
  const id = createHash("sha256").update(key).digest("hex");
  let bucket = buckets.get(id);
  if (!bucket) {
    if (buckets.size >= 5000) return 60;
    bucket = { count: 0, expires: now + windowMs };
    buckets.set(id, bucket);
  }
  if (bucket.count >= limit) return Math.max(1, Math.ceil((bucket.expires - now) / 1000));
  bucket.count++;
  return 0;
}
