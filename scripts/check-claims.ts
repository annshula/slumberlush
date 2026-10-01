/**
 * `npm run check:claims` — fails if customer-facing content uses absolute or
 * unsubstantiated claim language (docs/blueprint/01-brand.md §2). Run in CI.
 * Lines that *quote* a banned word to reject it (e.g. our standards page) are
 * allowed via the ALLOW list.
 */
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

const BANNED = [
  /\bpain[- ]?free\b/i,
  /\bpainless\b/i,
  /\bguaranteed?\b/i,
  /\bclinically (proven|tested)\b/i,
  /\bdermatologist[- ](approved|tested|recommended)\b/i,
  /\bFDA[- ]?(approved|registered|certified|documented)\b/i,
  /\bsafe for (all|everyone|every skin)\b/i,
  /\bpermanent(ly)?\b/i,
  /\bminimi[sz]es ingrown\b/i,
  /\b24 ?hrs? hydration\b/i,
  /\bmiracle\b/i,
  /\bonly \d+ left\b/i,
];

// Deliberate mentions: rejecting a claim, or legacy URL slugs.
const ALLOW = [/isn.t a guarantee/, /safe for everyone. If we/, /“guaranteed” or “clinically proven”/, /No miracle claims/, /We don&apos;t use words like/, /legacySlugs/, /“painless”/, /pain-free-hair-removal-(spray|cream)/, /promises that a product is\s*$/];

const ROOTS = ["src/content", "src/app", "src/components"];
const failures: string[] = [];

function walk(dir: string) {
  for (const name of readdirSync(dir)) {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) walk(path);
    else if (/\.(tsx?|mdx?)$/.test(name)) check(path);
  }
}

function check(file: string) {
  readFileSync(file, "utf8")
    .split(/\r?\n/)
    .forEach((line, i) => {
      if (line.trim().startsWith("//") || line.trim().startsWith("*")) return;
      if (ALLOW.some((a) => a.test(line))) return;
      for (const re of BANNED) if (re.test(line)) failures.push(`${file}:${i + 1}  ${re}  →  ${line.trim().slice(0, 120)}`);
    });
}

ROOTS.forEach(walk);

if (failures.length) {
  console.error(`✖ ${failures.length} claim issue(s):\n${failures.join("\n")}`);
  process.exit(1);
}
console.log("✔ no banned claim language found");
