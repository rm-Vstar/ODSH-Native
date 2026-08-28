// scripts/build.mjs - emit runtime JS artifact for the OpenClaw plugin entry
// The plugin entry is erasable-TypeScript (src/index.ts, nearly pure ESM JS), so the
// runtime artifact carries the SAME defineToolPlugin product (register included) as the
// source. Import specifiers are remapped ./runtime|./services -> ../src/runtime|services
// so they resolve from dist/.
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, "..");
const src = join(root, "src", "index.ts");
const dist = join(root, "dist", "index.js");
mkdirSync(join(root, "dist"), { recursive: true });

let js = readFileSync(src, "utf8")
  .replace(/from "\.\/runtime\//g, 'from "../src/runtime/')
  .replace(/from "\.\/services\//g, 'from "../src/services/');
writeFileSync(dist, js);
execFileSync(process.execPath, ["--experimental-strip-types", "--check", dist]);
console.log("dist/index.js written + syntax OK");
