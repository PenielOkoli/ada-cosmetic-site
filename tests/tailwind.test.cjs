const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const postcss = require("postcss");
const tailwind = require("@tailwindcss/postcss");

const root = path.resolve(__dirname, "..");
const sourcePath = path.join(root, "src/app/globals.css");

test("Tailwind 4 and its PostCSS integration are upgraded together", async () => {
  const pkg = JSON.parse(fs.readFileSync(path.join(root, "package.json"), "utf8"));
  const { default: config } = await import("../postcss.config.mjs");
  assert.match(pkg.devDependencies.tailwindcss, /^4\./);
  assert.equal(pkg.devDependencies.tailwindcss, pkg.devDependencies["@tailwindcss/postcss"]);
  assert.deepEqual(Object.keys(config.plugins), ["@tailwindcss/postcss"]);
  assert.equal(pkg.devDependencies.autoprefixer, undefined);
  assert.equal(fs.existsSync(path.join(root, "tailwind.config.ts")), false);
});

test("Tailwind 4 compiles the real stylesheet and preserves brand, responsive, and accessibility rules", async () => {
  const source = fs.readFileSync(sourcePath, "utf8");
  assert.ok(source.includes('@import "tailwindcss" source("../")'));
  assert.ok(!/@tailwind\s+(base|components|utilities)/.test(source));
  const result = await postcss([tailwind({ optimize: false })]).process(source, { from: sourcePath });
  assert.equal(result.warnings().length, 0);
  assert.ok(!/@tailwind\s/.test(result.css));
  assert.ok(!/@import\s+["']tailwindcss/.test(result.css));
  const declarations = [];
  result.root.walkDecls(declaration => declarations.push(declaration));
  const has = (selector, property, value) => declarations.some(declaration => declaration.parent.selector === selector && declaration.prop === property && declaration.value === value);
  assert.ok(has(":root", "--pink", "#ffa2b9"));
  assert.ok(has(":root", "--forest", "#15372d"));
  assert.ok(has(".hero-video", "filter", "blur(6px)"));
  assert.ok(has(".hero-cta", "background", "var(--pink)"));
  assert.ok(has(".form-row button", "min-height", "3.5rem"));
  assert.ok(has(".form-details input::placeholder, .form-row input::placeholder", "color", "#9ca3af"));
  const breakpoints = [];
  result.root.walkAtRules("media", rule => breakpoints.push(rule.params));
  assert.ok(breakpoints.includes("(min-width:640px)"));
  assert.ok(breakpoints.includes("(min-width:1024px)"));
  assert.ok(breakpoints.includes("(prefers-reduced-motion:reduce)"));
  assert.ok(has(".sr-only", "position", "absolute"));
});
