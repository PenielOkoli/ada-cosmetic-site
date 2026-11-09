const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const ts = require("typescript");

// Compile the actual TypeScript sources in memory. No external submissions,
// credentials, build output, or changes to the source files are needed.
function application(fetchImpl = async () => Response.json({ ok: true })) {
  const cache = new Map();
  let forwardedHeaders;
  const env = { NODE_ENV: "production", VERCEL: "1", SITE_URL: "https://gardin-cosmetics.vercel.app" };
  function load(relative) {
    const filename = path.resolve(__dirname, "..", relative);
    if (cache.has(filename)) return cache.get(filename);
    const exports = {};
    cache.set(filename, exports);
    const code = ts.transpileModule(fs.readFileSync(filename, "utf8"), {
      compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
    }).outputText;
    vm.runInNewContext(code, {
      exports, process: { env }, Buffer, crypto: require("node:crypto").webcrypto,
      Headers, Request, Response, URL, TextDecoder, Uint8Array, AbortSignal,
      setTimeout, clearTimeout, fetch: fetchImpl,
      require(id) {
        if (id === "next/server") return { NextResponse: {
          json: (body, init) => Response.json(body, init),
          next: (init) => { forwardedHeaders = init.request.headers; return new Response(); },
        } };
        if (id.startsWith("node:")) return require(id);
        if (id.startsWith("@/")) return load(`src/${id.slice(2)}.ts`);
        if (id.startsWith(".")) return load(path.relative(path.resolve(__dirname, ".."), path.resolve(path.dirname(filename), `${id}.ts`)));
        throw new Error(`Unexpected import ${id}`);
      },
    }, { filename });
    return exports;
  }
  return { load, env, get forwardedHeaders() { return forwardedHeaders; } };
}

const details = { name: " Test Gardin ", whatsapp: "+90 555 123 4567", email: " test@example.com " };
function request(body = details, headers = {}) {
  return new Request("https://gardin-cosmetics.vercel.app/api/subscribe", {
    method: "POST", headers: { Origin: "https://gardin-cosmetics.vercel.app", "Content-Type": "application/json", "x-vercel-forwarded-for": "192.0.2.1", ...headers },
    body: typeof body === "string" ? body : JSON.stringify(body),
  });
}

test("only a configured origin is accepted, not lookalikes or forged Host headers", () => {
  const app = application();
  const { hasAllowedOrigin } = app.load("src/lib/waitlist-security.ts");
  assert.equal(hasAllowedOrigin(request()), true);
  assert.equal(hasAllowedOrigin(request(details, { Origin: "https://gardin-cosmetics.vercel.app.evil.example", Host: "gardin-cosmetics.vercel.app" })), false);
  assert.equal(hasAllowedOrigin(request(details, { Origin: "null" })), false);
  assert.equal(hasAllowedOrigin(request(details, { Origin: "" })), false);
  assert.equal(hasAllowedOrigin(request(details, { "Sec-Fetch-Site": "cross-site" })), false);
  assert.equal(hasAllowedOrigin(new Request("https://attacker.example", { headers: { Origin: "https://attacker.example" } })), false);
  app.env.VERCEL_URL = "gardin-preview.vercel.app";
  assert.equal(hasAllowedOrigin(request(details, { Origin: "https://gardin-preview.vercel.app" })), true);
});

test("valid submissions forward only the three customer fields to the fixed Formspree endpoint", async () => {
  const calls = [];
  const app = application(async (url, options) => { calls.push({ url, options }); return Response.json({ ok: true }); });
  const route = app.load("src/app/api/subscribe/route.ts");
  const response = await route.POST(request({ ...details, website: "" }));
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { ok: true });
  assert.equal(response.headers.get("Cache-Control"), "private, no-store, max-age=0");
  assert.equal(calls.length, 1);
  assert.equal(calls[0].url, "https://formspree.io/f/mbgdykbk");
  assert.deepEqual(JSON.parse(calls[0].options.body), { name: "Test Gardin", whatsapp: "+90 555 123 4567", email: "test@example.com" });
  assert.equal(calls[0].options.redirect, "error");
});

test("invalid origins, unsupported media types, encoding, and malformed JSON never reach Formspree", async () => {
  let calls = 0;
  const app = application(async () => { calls++; return Response.json({ ok: true }); });
  const route = app.load("src/app/api/subscribe/route.ts");
  for (const [req, status] of [
    [request(details, { Origin: "https://evil.example" }), 403],
    [request(details, { "Content-Type": "text/plain" }), 415],
    [request(details, { "Content-Encoding": "gzip" }), 415],
    [request("not json"), 400],
  ]) assert.equal((await route.POST(req)).status, status);
  assert.equal(calls, 0);
});

test("JSON request limits work with or without a declared content length", async () => {
  const { readLimitedJson } = application().load("src/lib/waitlist-security.ts");
  await assert.rejects(readLimitedJson(request("{}", { "Content-Length": "5000" })), error => error.status === 413);
  await assert.rejects(readLimitedJson(request(JSON.stringify({ name: "a".repeat(5000) }))), error => error.status === 413);
  assert.equal((await readLimitedJson(request())).email, details.email);
});

test("validation rejects unexpected fields, control characters, wrong types, and oversized values", () => {
  const { validateSubscriber } = application().load("src/lib/waitlist-security.ts");
  for (const invalid of [null, [], {}, { ...details, name: [] }, { ...details, admin: true }, { ...details, name: "a".repeat(201) }, { ...details, name: "Bad\nHeader" }, { ...details, name: "<script>" }, { ...details, whatsapp: "-------" }, { ...details, whatsapp: "1".repeat(16) }, { ...details, email: "bad" }, { ...details, email: "a@b.com\r\nBcc:x@y.com" }]) {
    assert.throws(() => validateSubscriber(invalid), error => error.status === 400);
  }
  assert.equal(validateSubscriber({ ...details, name: "Çağla O’Neil" }).name, "Çağla O’Neil");
});

test("honeypot submissions are acknowledged without forwarding personal details", async () => {
  let calls = 0;
  const app = application(async () => { calls++; return Response.json({ ok: true }); });
  const response = await app.load("src/app/api/subscribe/route.ts").POST(request({ ...details, website: "https://spam.example" }));
  assert.equal(response.status, 200);
  assert.equal(calls, 0);
});

test("repeated email submissions return 429 with Retry-After even across different IPs", async () => {
  const route = application().load("src/app/api/subscribe/route.ts");
  for (let i = 0; i < 3; i++) assert.equal((await route.POST(request())).status, 200);
  const response = await route.POST(request(details, { "x-vercel-forwarded-for": "192.0.2.99" }));
  assert.equal(response.status, 429);
  assert.ok(Number(response.headers.get("Retry-After")) > 0);
});

test("IP limits do not trust a user-supplied x-forwarded-for header", async () => {
  const route = application().load("src/app/api/subscribe/route.ts");
  for (let i = 0; i < 10; i++) assert.equal((await route.POST(request({ ...details, email: `test${i}@example.com` }, { "x-forwarded-for": `192.0.2.${i}` }))).status, 200);
  assert.equal((await route.POST(request())).status, 429);
});

test("rate limit buckets expire", () => {
  const { takeRateLimit } = application().load("src/lib/waitlist-security.ts");
  assert.equal(takeRateLimit("example", 1, 1000, 0), 0);
  assert.equal(takeRateLimit("example", 1, 1000, 100), 1);
  assert.equal(takeRateLimit("example", 1, 1000, 1000), 0);
});

test("provider rejection and network errors cannot cause a false success or leak details", async () => {
  for (const fetchImpl of [async () => ({ ok: false }), async () => Response.json({ ok: false }), async () => new Response("<html>not a confirmation</html>"), async () => { throw new Error("private upstream details"); }]) {
    const route = application(fetchImpl).load("src/app/api/subscribe/route.ts");
    const response = await route.POST(request());
    assert.equal(response.status, 502);
    const result = await response.json();
    assert.equal(result.ok, undefined);
    assert.ok(!result.error.includes("private upstream"));
  }
});

test("production script CSP uses nonces, blocks embedding, and does not permit unsafe script execution", () => {
  const { contentSecurityPolicy } = application().load("src/lib/security-policy.ts");
  const policy = contentSecurityPolicy("nonce-for-test", false);
  assert.match(policy, /script-src 'self' 'nonce-nonce-for-test' 'strict-dynamic';/);
  assert.ok(!policy.includes("unsafe-eval"));
  assert.match(policy, /frame-ancestors 'none'/);
  assert.match(policy, /object-src 'none'/);
  assert.match(policy, /upgrade-insecure-requests/);
  assert.ok(contentSecurityPolicy("dev", true).includes("unsafe-eval"));
});

test("proxy generates fresh nonces and overwrites attacker-provided CSP/nonce headers", () => {
  const app = application();
  const { proxy } = app.load("src/proxy.ts");
  const headers = new Headers({ "x-nonce": "attacker", "Content-Security-Policy": "script-src *" });
  const first = proxy({ headers });
  const firstNonce = app.forwardedHeaders.get("x-nonce");
  assert.notEqual(firstNonce, "attacker");
  assert.ok(first.headers.get("Content-Security-Policy").includes(`'nonce-${firstNonce}'`));
  assert.equal(first.headers.get("Content-Security-Policy"), app.forwardedHeaders.get("Content-Security-Policy"));
  assert.match(first.headers.get("Cache-Control"), /no-store/);
  proxy({ headers });
  assert.notEqual(app.forwardedHeaders.get("x-nonce"), firstNonce);
});
