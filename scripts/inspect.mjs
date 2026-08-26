// Live-scale inspection harness. Renders any SVG at README/mobile widths.
// Usage: node scripts/inspect.mjs <svgPath> [outPrefix] [w1,w2,...]
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const [, , svgArg, prefixArg, widthsArg] = process.argv;
if (!svgArg) {
  console.error("usage: node scripts/inspect.mjs <svgPath> [outPrefix] [w1,w2]");
  process.exit(2);
}
const widths = (widthsArg ? widthsArg.split(",") : ["1200", "960", "768", "600", "375"]).map(Number);
const svgPath = path.resolve(ROOT, svgArg);
const svg = fs.readFileSync(svgPath, "utf8");
const prefix = prefixArg || path.basename(svgArg).replace(/\.svg$/, "");
const outDir = path.join(ROOT, "analysis/live");
fs.mkdirSync(outDir, { recursive: true });

const mod = await import("@resvg/resvg-js");
const Resvg = mod.Resvg ?? mod.default?.Resvg;

for (const w of widths) {
  const resvg = new Resvg(svg, {
    fitTo: { mode: "width", value: w },
    background: "#0d1117", // GitHub dark canvas, to judge real contrast on-page
    font: { loadSystemFonts: true, defaultFontFamily: "Arial" },
  });
  const rendered = resvg.render();
  const png = rendered.asPng();
  const out = path.join(outDir, `${prefix}-${w}.png`);
  fs.writeFileSync(out, png);
  console.log(`${prefix}-${w}.png  ${rendered.width}x${rendered.height}  ${(png.length / 1024).toFixed(1)} KB`);
}
