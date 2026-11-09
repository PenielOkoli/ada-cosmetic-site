import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { createServer } from "node:net";
import { once } from "node:events";
import { setTimeout as delay } from "node:timers/promises";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const socket = createServer();
socket.listen(0, "127.0.0.1");
await once(socket, "listening");
const port = socket.address().port;
await new Promise(resolve => socket.close(resolve));
const origin = `http://127.0.0.1:${port}`;
const child = spawn(process.execPath, [require.resolve("next/dist/bin/next"), "start", "--hostname", "127.0.0.1", "--port", String(port)], {
  stdio: ["ignore", "pipe", "pipe"], env: { ...process.env, NODE_ENV: "production" },
});
let output = "";
child.stdout.on("data", chunk => { output = (output + chunk).slice(-4000); });
child.stderr.on("data", chunk => { output = (output + chunk).slice(-4000); });
child.on("error", error => { output += error.message; });

try {
  let page;
  for (let attempt = 0; attempt < 60; attempt++) {
    if (child.exitCode !== null) throw new Error(`Server exited before ready: ${output}`);
    try { page = await fetch(origin, { signal: AbortSignal.timeout(3000) }); if (page.ok) break; } catch { /* Retry startup, not a user submission. */ }
    await delay(500);
  }
  assert.equal(page?.status, 200, output);
  const html = await page.text();
  const csp = page.headers.get("content-security-policy");
  const nonce = csp?.match(/'nonce-([^']+)'/)?.[1];
  assert.ok(nonce, "HTML must have a nonce CSP");
  assert.ok(!csp.includes("unsafe-eval"));
  assert.match(csp, /frame-ancestors 'none'/);
  assert.equal(page.headers.get("x-frame-options"), "DENY");
  assert.equal(page.headers.get("x-content-type-options"), "nosniff");
  assert.equal(page.headers.get("strict-transport-security"), "max-age=31536000");
  assert.equal(page.headers.get("x-powered-by"), null);
  assert.match(page.headers.get("cache-control"), /no-store/);
  assert.ok(html.includes("30th Oct, 2026"));
  assert.ok(html.includes('name="website"'));
  assert.ok(html.includes("https://fonts.googleapis.com/css2?family=DM+Sans"), "Brand font stylesheet must survive production bundling");
  assert.ok(html.includes("family=Playfair+Display"));
  assert.ok(html.includes("family=Parisienne"));
  const scripts = [...html.matchAll(/<script\b([^>]*)>/g)];
  assert.ok(scripts.length > 0);
  for (const [, attributes] of scripts) assert.ok(attributes.includes(`nonce="${nonce}"`), "Every Next.js script must match its response nonce");
  const stylesheetUrls = [...html.matchAll(/<link\b([^>]+)>/g)]
    .filter(([, attributes]) => /rel="stylesheet"/.test(attributes))
    .map(([, attributes]) => attributes.match(/href="([^"]+)"/)?.[1])
    .filter(url => url?.startsWith("/_next/"));
  assert.ok(stylesheetUrls.length > 0, "The production page must serve its compiled styles");
  let compiledStyles = "";
  for (const url of stylesheetUrls) {
    const stylesheet = await fetch(new URL(url.replaceAll("&amp;", "&"), origin));
    assert.equal(stylesheet.status, 200);
    compiledStyles += await stylesheet.text();
  }
  // Production minification strips the Tailwind version banner; inspect output.
  assert.ok(/@layer theme\b/.test(compiledStyles), "Compiled Tailwind theme layer is missing");
  assert.ok(/@layer utilities\b/.test(compiledStyles), "Compiled Tailwind utilities layer is missing");
  assert.ok(/--pink:\s*#ffa2b9/.test(compiledStyles), "Brand pink changed in production CSS");
  assert.ok(/--forest:\s*#15372d/.test(compiledStyles), "Brand green changed in production CSS");
  assert.ok(compiledStyles.includes(".sr-only"));
  assert.ok(!/@tailwind\s/.test(compiledStyles));
  const second = await fetch(origin);
  assert.notEqual(second.headers.get("content-security-policy")?.match(/'nonce-([^']+)'/)?.[1], nonce);
  await second.body.cancel();

  const post = (body, originHeader = "https://gardin-cosmetics.vercel.app") => fetch(`${origin}/api/subscribe`, {
    method: "POST", headers: { "Content-Type": "application/json", Origin: originHeader }, body: JSON.stringify(body),
  });
  assert.equal((await post({}, "https://attacker.example")).status, 403);
  assert.equal((await post({})).status, 400);
  assert.equal((await post({ name: "x".repeat(5000) })).status, 413);
  // A filled honeypot is deliberately NOT forwarded to Formspree.
  const bot = await post({ website: "https://spam.example" });
  assert.equal(bot.status, 200);
  assert.deepEqual(await bot.json(), { ok: true });
  assert.match(bot.headers.get("cache-control"), /no-store/);

  const image = await fetch(`${origin}/_next/image?url=%2Fimages%2Fgardin-portrait-solo-clean.png&w=640&q=75`, { headers: { Accept: "image/webp" } });
  assert.equal(image.status, 200);
  assert.match(image.headers.get("content-type"), /image\/webp/);
  await image.body.cancel();
  assert.equal((await fetch(`${origin}/_next/image?url=https%3A%2F%2Fexample.com%2Fimage.png&w=640&q=75`)).status, 400);
  console.log("PASS: production HTTP headers, fresh CSP nonces on every rendered script, compiled Tailwind 4/brand styles, no-store HTML, preserved date/form, blocked unsafe submissions, local image optimization, and blocked remote image sources. No real signup sent.");
} finally {
  const stopped = once(child, "exit").catch(() => {});
  child.kill();
  await Promise.race([stopped, delay(5000)]);
}
