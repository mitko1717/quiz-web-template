#!/usr/bin/env node
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const templateDir = path.resolve(__dirname, "..");

// Synced wholesale (template is source of truth; --delete propagates removals).
const SHARED_PATHS = ["src/app", "src/components", "src/hooks", "src/lib", "src/providers"];

// Never touched even inside shared paths — topic-specific or per-clone branding.
const EXCLUDES = [
  "--exclude=.DS_Store",
  "--exclude=i18n/",
  "--exclude=topic.config.ts",
  "--exclude=globals.css",
  "--exclude=favicon.ico",
  "--exclude=layout.tsx"
];

function syncOne(cloneDir) {
  if (!existsSync(cloneDir)) {
    console.log(`SKIP: ${cloneDir} (not found)`);
    return;
  }
  console.log(`=== Syncing -> ${cloneDir} ===`);
  for (const rel of SHARED_PATHS) {
    const src = path.join(templateDir, rel) + "/";
    const dest = path.join(cloneDir, rel) + "/";
    execFileSync("rsync", ["-av", "--delete", ...EXCLUDES, src, dest], { stdio: "inherit" });
  }
  console.log("");
}

const argPath = process.argv[2];

if (argPath) {
  syncOne(path.resolve(argPath));
} else {
  const clonesFile = path.join(__dirname, "clones.json");
  if (!existsSync(clonesFile)) {
    console.error("No scripts/clones.json found and no path given. Usage: node scripts/sync-template.mjs [clone-path]");
    process.exit(1);
  }
  const { clones } = JSON.parse(readFileSync(clonesFile, "utf8"));
  for (const clone of clones) syncOne(clone);
}

console.log("Done. For each clone:");
console.log("  cd <clone> && git status && git diff");
console.log("  npm run typecheck && npm run build");