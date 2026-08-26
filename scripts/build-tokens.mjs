import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const TOKENS_PATH = path.join(ROOT, "design-tokens.json");
const T = JSON.parse(fs.readFileSync(TOKENS_PATH, "utf8"));

const P = T.palette;
const C = {
  void: P["void"],
  surface: P.surface,
  shadow: P.shadowCrimson,
  blood: P.blood,
  domain: P.domain,
  rim: P.rim,
  peak: P.peak,
};
const PALETTE_HEX_SET = new Set(Object.values(P).map((v) => v.toUpperCase()));
const DISPLAY_FONT = T.typography.display.family;
const MONO_FONT = T.typography.mono.family;
const SPL = {
  hold: T.motion.hold.keySplines,
  snap: T.motion.snap.keySplines,
  slow: T.motion.slowReveal.keySplines,
  settle: "0.25 0 0.25 1",
};
const CMP = T.composition;
const ID = T.identity;

const snap8 = (v) => Math.round(v / 8) * 8;
const f = (n) => Number(Number(n).toFixed(3)).toString();

function an(attributeName, values, opts) {
  const { begin, dur, kt = null, ks = null, discrete = false, fill = "freeze" } = opts;
  let extra = "";
  if (ks) extra += ` keyTimes="${kt}" keySplines="${ks}" calcMode="spline"`;
  else if (discrete) extra += ` calcMode="discrete"`;
  else if (kt) extra += ` keyTimes="${kt}"`;
  return `<animate attributeName="${attributeName}" values="${values}" begin="${f(begin)}s" dur="${f(dur)}s"${extra} fill="${fill}"/>`;
}

function anT(type, values, opts) {
  const { begin, dur, kt = null, ks = null, discrete = false } = opts;
  let extra = "";
  if (ks) extra += ` keyTimes="${kt}" keySplines="${ks}" calcMode="spline"`;
  else if (discrete) extra += ` calcMode="discrete"`;
  return `<animateTransform attributeName="transform" type="${type}" values="${values}" begin="${f(begin)}s" dur="${f(dur)}s"${extra} fill="freeze"/>`;
}

function svgDoc(viewBoxW, viewBoxH, body, title, desc) {
  return [
    `<?xml version="1.0" encoding="UTF-8"?>`,
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${viewBoxW} ${viewBoxH}" width="${viewBoxW}" height="${viewBoxH}" role="img" aria-labelledby="tt dd">`,
    `<title id="tt">${title}</title>`,
    `<desc id="dd">${desc}</desc>`,
    body,
    `</svg>`,
  ].join("\n");
}

function toriiD(cx, w, lintelY, baseY) {
  // Proper torii silhouette: two slender uprights near the OUTER edges running to
  // the ground, an overhanging top beam (kasagi) with a gentle upward sweep, and a
  // second tie-beam (nuki) below it. This is what separates a gate from a table —
  // the beam overhangs the pillars, the pillars are tall/slender and lean inward,
  // and there are two stacked horizontals, not one slab with a riser.
  const half = snap8(w / 2); // half the pillar-outer span
  const overhang = snap8(w * 0.2); // kasagi overhang beyond the pillars
  const pillarW = 16; // slender uprights
  const lean = 6; // inward lean of the pillar tops
  const kTop = snap8(lintelY); // kasagi upper edge
  const kBot = kTop + 14; // kasagi thickness
  const nTop = kBot + 12; // gap, then the nuki (tie beam)
  const nBot = nTop + 9;
  const nHalf = half - 2; // nuki spans just inside the pillar outers
  const loB = cx - half,
    liB = cx - half + pillarW; // left pillar base x-range
  const roB = cx + half,
    riB = cx + half - pillarW; // right pillar base x-range
  const loT = loB + lean,
    liT = liB + lean; // left pillar top (leans in)
  const roT = roB - lean,
    riT = riB - lean; // right pillar top (leans in)
  return (
    // kasagi: overhanging top beam, gentle upward sweep (concave underside)
    `M${cx - half - overhang} ${kTop + 6} Q${cx} ${kTop - 6} ${cx + half + overhang} ${kTop + 6} ` +
    `L${cx + half + overhang} ${kBot + 2} Q${cx} ${kBot - 4} ${cx - half - overhang} ${kBot + 2} Z ` +
    // nuki: lower tie beam
    `M${cx - nHalf} ${nTop} H${cx + nHalf} V${nBot} H${cx - nHalf} Z ` +
    // left pillar (leans inward toward the top)
    `M${loT} ${kBot} L${liT} ${kBot} L${liB} ${baseY} L${loB} ${baseY} Z ` +
    // right pillar
    `M${riT} ${kBot} L${roT} ${kBot} L${roB} ${baseY} L${riB} ${baseY} Z`
  );
}

const ENV = (() => {
  const horizon = CMP.envHorizonY;
  return {
    ground: `M0 ${horizon} H960 V${horizon + 8} H0 Z M96 448 H864 V456 H96 Z M224 472 H736 V480 H224 Z`,
    toriiMain: toriiD(480, 168, 348, horizon),
    toriiL: toriiD(248, 144, 320, horizon),
    toriiR: toriiD(712, 144, 320, horizon),
  };
})();

function shardD(len, w) {
  return `M${-(w + 8)} -8 L${-w} ${-(len - 16)} L0 ${-(len + 20)} L${w} ${-(len - 24)} L${w + 8} -8 Z`;
}

const HANDS = {
  anchor: CMP.handsAnchor,
  pivot: CMP.handsPivot,
  right: {
    silhouette:
      "M -0.5 8 Q 3 -1.5 12 -1.5 Q 19.5 -1.5 20.5 10 L 23.5 56 Q 25 68 31 76 Q 40 84 46 94 Q 59 103 62.5 122 Q 65 139 63 153 Q 58 169 48 182 L 43 199 Q 41.5 210 40 220 Q 37 235 30 243 Q 26 247.5 25 252 L 24 292 L 2.5 292 L 1 218 Q -0.5 212 0 208 Q 4.6 190 5.4 170 Q 6 150 3.8 137 Q 1.6 130.5 -0.5 129 L -0.5 58 Z",
    nails: "M 7 2 Q 11 -2 16 3 L 17 13 Q 12 17 8 14 Z M 2 211 Q 6 206.5 11 209.5 L 10 219.5 Q 5 222.5 3 218.5 Z",
    details:
      "M 0 12 L 0.3 127 M 26 70 Q 32 86 35 98 M 41 98 Q 47 112 50 126 M 54 122 Q 58 133 59 144 M 9 200 Q 19 210 29 211 M 0.8 216 L 1 288",
  },
  left: {
    silhouette:
      "M 0.5 9 Q -3 -0.5 -12 -0.5 Q -19 -0.5 -20 11 L -23 58 Q -24.5 70 -30 78 Q -39 86 -45 96 Q -58 105 -61 124 Q -64 141 -62 155 Q -57 171 -47 184 L -42 201 Q -40.5 212 -39 222 Q -36 237 -29 245 Q -25 249 -24 254 L -23 290 L -2.5 290 L -1 220 Q 0.5 213 -0.5 210 Q -4.2 192 -5 172 Q -5.6 152 -3.4 139 Q -1.4 132 0.8 131 L 0.8 60 Z",
    nails: "M -16 2 Q -11 -3 -7 1 L -8 13 Q -13 17 -17 13 Z M -2 213 Q -6 208.5 -11 211.5 L -10 221.5 Q -5 224.5 -3 220.5 Z",
    details:
      "M -26 72 Q -32 88 -34 100 M -40 100 Q -46 114 -49 128 M -53 124 Q -57 135 -58 146 M -8 202 Q -17 212 -27 213",
  },
};

// Presentation presets for the (sacred, reference-derived) seal geometry. Geometry is
// never touched here — only fill/rim/contrast. "hero" gives the silhouette a luminous
// filled body + thick bright rim so it reads as the focal subject at README/mobile scale;
// "review" preserves the flat neutral-background look for geometry inspection.
function handStyle(preset) {
  if (preset === "review")
    return { fillL: C.shadow, fillR: C.shadow, rim: C.rim, rimW: 1.75, rimO: 0.9, nail: C.blood, nailO: 0.5, detail: C.blood, detailO: 0.4, detailW: 1.5 };
  // Dark-etched detail lines (shadow) over the lit fill make the finger divisions read;
  // bright thick rim keeps the whole silhouette crisp against the void.
  return { fillL: "url(#handCoreL)", fillR: "url(#handCoreR)", rim: C.rim, rimW: 3, rimO: 1, nail: C.rim, nailO: 0.92, detail: C.shadow, detailO: 1, detailW: 2.6 };
}

function handInnerGeometry(preset) {
  const s = handStyle(preset);
  return [
    `<path d="${HANDS.left.silhouette}" fill="${s.fillL}" stroke="${s.rim}" stroke-width="${s.rimW}" stroke-opacity="${s.rimO}" stroke-linejoin="round"/>`,
    `<path d="${HANDS.right.silhouette}" fill="${s.fillR}" stroke="${s.rim}" stroke-width="${s.rimW}" stroke-opacity="${s.rimO}" stroke-linejoin="round"/>`,
    `<path d="${HANDS.left.nails} ${HANDS.right.nails}" fill="${s.nail}" fill-opacity="${s.nailO}" stroke="none"/>`,
    `<path d="${HANDS.left.details} ${HANDS.right.details}" fill="none" stroke="${s.detail}" stroke-width="${s.detailW}" stroke-opacity="${s.detailO}" stroke-linecap="round"/>`,
  ].join("");
}

// Absolute canvas coordinates of the three contact clusters after poster placement.
function posterContacts() {
  const h = CMP.poster.hand;
  const map = (p) => ({ x: h.cx + p[0] * h.scale, y: h.topY + p[1] * h.scale });
  return { apex: map(h.localContacts.apex), middle: map(h.localContacts.middle), thumb: map(h.localContacts.thumb) };
}

// Place the seal at its poster position with uniform scale (proportions preserved).
function handPlaced({ preset, opacity } = {}) {
  const h = CMP.poster.hand;
  const op = opacity == null ? "" : ` opacity="${opacity}"`;
  return `<g id="seal-geometry"${op}><g transform="translate(${h.cx} ${h.topY}) scale(${f(h.scale)})">${handInnerGeometry(preset)}</g></g>`;
}

function handSealAnimated() {
  const s = T.seal;
  const h = CMP.poster.hand;
  // pivot the overshoot/settle about the seal's visual centre
  const px = h.cx;
  const py = h.topY + 150 * h.scale;
  return [
    `<g id="seal-geometry">`,
    `<g transform="translate(${px} ${py})">`,
    `<g id="seal-reveal">`,
    anT("scale", "1.07;0.985;1", { begin: s.revealBegin, dur: s.settleDur, kt: "0;0.5;1", ks: `${SPL.snap};${SPL.settle}` }),
    `<g transform="translate(${-px} ${-py})">`,
    `<g id="hands" opacity="0">`,
    `<g transform="translate(${h.cx} ${h.topY}) scale(${f(h.scale)})">`,
    handInnerGeometry("hero"),
    `</g>`,
    an("opacity", "0;1", { begin: s.revealBegin, dur: s.revealCutDur, kt: "0;0.001", discrete: true }),
    `</g>`,
    `</g>`,
    `</g>`,
    `</g>`,
    `</g>`,
  ].join("");
}

function defsShared({ forStatic }) {
  return [
    `<radialGradient id="voidGrad" cx="50%" cy="42%" r="78%">`,
    `<stop offset="0%" stop-color="${C.surface}"/>`,
    `<stop offset="100%" stop-color="${C.void}"/>`,
    `</radialGradient>`,
    `<radialGradient id="vigGrad" cx="50%" cy="46%" r="74%">`,
    `<stop offset="0%" stop-color="${C.void}" stop-opacity="0"/>`,
    `<stop offset="68%" stop-color="${C.void}" stop-opacity="0.26"/>`,
    `<stop offset="100%" stop-color="${C.void}" stop-opacity="0.82"/>`,
    `</radialGradient>`,
    `<radialGradient id="pressGrad" cx="50%" cy="52%" r="60%">`,
    `<stop offset="0%" stop-color="${C.blood}" stop-opacity="0.92"/>`,
    `<stop offset="58%" stop-color="${C.shadow}" stop-opacity="0.36"/>`,
    `<stop offset="100%" stop-color="${C.shadow}" stop-opacity="0"/>`,
    `</radialGradient>`,
    `<linearGradient id="fogGrad" x1="0" y1="0" x2="0" y2="1">`,
    `<stop offset="0%" stop-color="${C.shadow}" stop-opacity="0"/>`,
    `<stop offset="100%" stop-color="${C.shadow}" stop-opacity="0.85"/>`,
    `</linearGradient>`,
    `<linearGradient id="horizonGrad" x1="0" y1="0" x2="1" y2="0">`,
    `<stop offset="0%" stop-color="${C.blood}" stop-opacity="0"/>`,
    `<stop offset="50%" stop-color="${C.blood}" stop-opacity="0.85"/>`,
    `<stop offset="100%" stop-color="${C.blood}" stop-opacity="0"/>`,
    `</linearGradient>`,
    `<linearGradient id="wordGrad" x1="0" y1="0" x2="0" y2="1">`,
    `<stop offset="0%" stop-color="${C.rim}"/>`,
    `<stop offset="100%" stop-color="${C.domain}"/>`,
    `</linearGradient>`,
    // Reference-derived seal body: each hand is lit from its OUTER side and falls to
    // shadow at the inner (center) edge, so a dark cleft forms where the two palms meet —
    // this is what makes the silhouette read as TWO interlocked hands rather than one blob
    // at README/mobile scale. userSpaceOnUse in the hand's LOCAL coord space; the right
    // hand occupies +x, the left −x, so their bright ends point outward in opposite dirs.
    `<linearGradient id="handCoreR" gradientUnits="userSpaceOnUse" x1="70" y1="34" x2="-2" y2="150">`,
    `<stop offset="0%" stop-color="${C.rim}"/>`,
    `<stop offset="50%" stop-color="${C.domain}"/>`,
    `<stop offset="84%" stop-color="${C.blood}"/>`,
    `<stop offset="100%" stop-color="${C.shadow}"/>`,
    `</linearGradient>`,
    `<linearGradient id="handCoreL" gradientUnits="userSpaceOnUse" x1="-70" y1="34" x2="2" y2="150">`,
    `<stop offset="0%" stop-color="${C.rim}"/>`,
    `<stop offset="50%" stop-color="${C.domain}"/>`,
    `<stop offset="84%" stop-color="${C.blood}"/>`,
    `<stop offset="100%" stop-color="${C.shadow}"/>`,
    `</linearGradient>`,
    // Directional cursed-energy shard (base transparent -> incandescent rim tip).
    // Shared by the animated burst and the static poster's residual energy.
    `<linearGradient id="shardGrad" x1="0" y1="1" x2="0" y2="0">`,
    `<stop offset="0%" stop-color="${C.domain}" stop-opacity="0"/>`,
    `<stop offset="40%" stop-color="${C.blood}" stop-opacity="0.5"/>`,
    `<stop offset="100%" stop-color="${C.rim}"/>`,
    `</linearGradient>`,
  ].join("");
}

function filtersAnimated() {
  return [
    `<filter id="glowPeak" x="-120%" y="-120%" width="340%" height="340%">`,
    `<feGaussianBlur stdDeviation="7" result="b"/>`,
    `<feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>`,
    `</filter>`,
    `<filter id="shardWarp" x="-40%" y="-40%" width="180%" height="180%">`,
    `<feTurbulence type="fractalNoise" baseFrequency="0.012 0.045" numOctaves="2" seed="13" result="n"/>`,
    `<feDisplacementMap in="SourceGraphic" in2="n" scale="26" xChannelSelector="R" yChannelSelector="G"/>`,
    `</filter>`,
    `<filter id="hazeWarp" x="-20%" y="-20%" width="140%" height="140%">`,
    `<feTurbulence type="fractalNoise" baseFrequency="0.012 0.045" numOctaves="2" seed="7" result="n"/>`,
    `<feDisplacementMap in="SourceGraphic" in2="n" scale="0" xChannelSelector="R" yChannelSelector="G">${an(
      "scale",
      "0;11;13;0",
      { begin: 4.1, dur: 1.4, kt: "0;0.5;0.86;1", ks: `${SPL.slow};${SPL.hold};${SPL.snap}` }
    )}</feDisplacementMap>`,
    `</filter>`,
  ].join("");
}

function environmentStatic({ edgeStrokeOpacity, fogOpacities }) {
  const [fogA, fogB] = fogOpacities;
  return [
    `<g id="environment">`,
    `<path d="${ENV.ground}" fill="${C.shadow}" fill-opacity="0.85"/>`,
    `<path d="${ENV.toriiMain}" fill="${C.shadow}"/>`,
    `<path d="${ENV.toriiL}" fill="${C.shadow}" fill-opacity="0.8"/>`,
    `<path d="${ENV.toriiR}" fill="${C.shadow}" fill-opacity="0.8"/>`,
    `<path id="env-edges" d="${ENV.toriiMain} ${ENV.toriiL} ${ENV.toriiR}" fill="none" stroke="${C.rim}" stroke-width="2" stroke-opacity="${edgeStrokeOpacity}"/>`,
    `</g>`,
    `<rect x="0" y="${CMP.fogBandY}" width="960" height="108" fill="url(#fogGrad)" opacity="${fogA}"/>`,
    `<rect x="0" y="464" width="960" height="76" fill="url(#fogGrad)" opacity="${fogB}"/>`,
  ].join("");
}

// ── Poster layer ────────────────────────────────────────────────────────────
// Hero and static fallback share ONE composition: the reference-derived seal is
// the focal subject; the shrine is reduced to two dim flanking gates that never
// cross the silhouette; a crimson halo lifts the hand off the void; energy stays
// controlled and directional. This is the fix for the "weak at README scale" gap.

function shrineFrameGeom() {
  const sf = CMP.poster.shrineFrame;
  return {
    sf,
    L: toriiD(sf.left.cx, sf.left.w, sf.left.lintelY, sf.left.baseY),
    R: toriiD(sf.right.cx, sf.right.w, sf.right.lintelY, sf.right.baseY),
  };
}

function shrineFrameStatic() {
  const { sf, L, R } = shrineFrameGeom();
  return [
    `<path d="${ENV.ground}" fill="${C.shadow}" fill-opacity="0.5"/>`,
    `<g id="shrine">`,
    `<path d="${L}" fill="${C.shadow}" fill-opacity="${sf.fillOpacity}"/>`,
    `<path d="${R}" fill="${C.shadow}" fill-opacity="${sf.fillOpacity}"/>`,
    `<path d="${L} ${R}" fill="none" stroke="${C.domain}" stroke-width="2" stroke-opacity="${sf.edgeOpacity}"/>`,
    `</g>`,
    `<rect x="0" y="${CMP.envHorizonY - 2}" width="960" height="4" fill="url(#horizonGrad)" opacity="0.3"/>`,
    `<rect x="0" y="${CMP.fogBandY}" width="960" height="108" fill="url(#fogGrad)" opacity="0.26"/>`,
  ].join("");
}

function shrineFrameAnimated() {
  const { sf, L, R } = shrineFrameGeom();
  return [
    `<path d="${ENV.ground}" fill="${C.shadow}" fill-opacity="0.5" opacity="0">${an("opacity", "0;1", { begin: 4.1, dur: 0.8, kt: "0;1", ks: SPL.slow })}</path>`,
    `<g id="shrine" opacity="0">`,
    `<path d="${L}" fill="${C.shadow}" fill-opacity="${sf.fillOpacity}"/>`,
    `<path d="${R}" fill="${C.shadow}" fill-opacity="${sf.fillOpacity}"/>`,
    an("opacity", "0;0.05", { begin: 0.5, dur: 1.4, kt: "0;1", ks: SPL.slow }),
    an("opacity", "0.05;1", { begin: 4.1, dur: 0.8, kt: "0;1", ks: SPL.slow }),
    `</g>`,
    `<path d="${L} ${R}" fill="none" stroke="${C.domain}" stroke-width="2" pathLength="100" stroke-dasharray="100" stroke-dashoffset="100" stroke-opacity="0">${an("stroke-dashoffset", "100;0", { begin: 4.1, dur: 0.8, kt: "0;1", ks: SPL.slow })}${an("stroke-opacity", `0;${sf.edgeOpacity}`, { begin: 4.1, dur: 0.8, kt: "0;1", ks: SPL.slow })}</path>`,
    `<rect x="0" y="${CMP.envHorizonY - 2}" width="960" height="4" fill="url(#horizonGrad)" opacity="0">${an("opacity", "0;0.3", { begin: 4.1, dur: 0.8, kt: "0;1", ks: SPL.slow })}</rect>`,
    `<rect x="0" y="${CMP.fogBandY}" width="960" height="108" fill="url(#fogGrad)" opacity="0">${an("opacity", "0;0.26", { begin: 4.1, dur: 0.8, kt: "0;1", ks: SPL.slow })}${anT("translate", "0 0;10 0", { begin: 4.1, dur: 1.4, kt: "0;1", ks: SPL.slow })}</rect>`,
  ].join("");
}

function domainHalo(opacity) {
  const h = CMP.poster.halo;
  return `<ellipse cx="${h.cx}" cy="${h.cy}" rx="${h.rx}" ry="${h.ry}" fill="url(#pressGrad)" opacity="${opacity}"/>`;
}

// Residual controlled energy for the static poster — asymmetric, emitted from the
// real contact geometry. This MATCHES the animated end-state: an apex eruption plus
// the two middle-contact side shards that persist (energy.shards[3],[4]). No
// downward thumb energy in the hold — it fired at impact and dissipated — so the
// lower identity lockup stays pristine (hierarchy: wordmark reads clean).
const POSTER_SHARDS = [
  { at: "apex", rotate: -20, distance: 300, length: 150, idx: 1, progress: 0.92, op: 0.9 },
  { at: "apex", rotate: 34, distance: 150, length: 96, idx: 2, progress: 0.85, op: 0.78 },
  { at: "apex", rotate: -58, distance: 132, length: 82, idx: 0, progress: 0.8, op: 0.7 },
  { at: "middle", rotate: -75, distance: 190, length: 80, idx: 3, progress: 0.9, op: 0.6 },
  { at: "middle", rotate: 80, distance: 170, length: 70, idx: 4, progress: 0.9, op: 0.55 },
];

function posterShards() {
  const c = posterContacts();
  return [
    `<g id="energy" filter="url(#shardWarp)">`,
    ...POSTER_SHARDS.map((s) => {
      const o = c[s.at];
      return `<g transform="translate(${f(o.x)} ${f(o.y)}) rotate(${s.rotate})"><g transform="translate(0 ${f(-s.distance * s.progress)})" opacity="${s.op}"><path d="${shardD(s.length, 6 + s.idx * 2)}" fill="url(#shardGrad)"/></g></g>`;
    }),
    `</g>`,
  ].join("");
}

function posterFlash() {
  const c = posterContacts();
  return `<circle cx="${f(c.apex.x)}" cy="${f(c.apex.y)}" r="11" fill="${C.peak}" filter="url(#glowPeak)" opacity="0.95"/>`;
}

function identityLockupStatic() {
  const lk = CMP.poster.lockup;
  const stLS = T.typography.mono.subtextLetterSpacing;
  return [
    `<g id="identity">`,
    `<path d="M${480 - lk.ruleHalfWidth} ${lk.ruleY} H${480 + lk.ruleHalfWidth}" stroke="${C.rim}" stroke-width="2" opacity="0.85"/>`,
    `<text x="480" y="${lk.wordmarkBaseline}" text-anchor="middle" font-family="${DISPLAY_FONT}" font-size="${lk.wordmarkSize}" letter-spacing="${lk.wordmarkLetterSpacing}" fill="url(#wordGrad)" stroke="${C.rim}" stroke-width="2" paint-order="stroke" stroke-linejoin="miter">${ID.wordmark}</text>`,
    `<text x="480" y="${lk.subtextBaseline}" text-anchor="middle" font-family="${MONO_FONT}" font-size="${lk.subtextSize}" letter-spacing="${stLS}" fill="${C.rim}" opacity="0.9">${ID.subtext}</text>`,
    `</g>`,
  ].join("");
}

// Static-safe filter set (no <animate> children): glow for the apex flash, warp for shards.
function filtersStatic() {
  return [
    `<filter id="glowPeak" x="-120%" y="-120%" width="340%" height="340%">`,
    `<feGaussianBlur stdDeviation="7" result="b"/>`,
    `<feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>`,
    `</filter>`,
    `<filter id="shardWarp" x="-40%" y="-40%" width="180%" height="180%">`,
    `<feTurbulence type="fractalNoise" baseFrequency="0.012 0.045" numOctaves="2" seed="13" result="n"/>`,
    `<feDisplacementMap in="SourceGraphic" in2="n" scale="26" xChannelSelector="R" yChannelSelector="G"/>`,
    `</filter>`,
  ].join("");
}

function posterComposition() {
  return [
    `<rect x="0" y="0" width="960" height="540" fill="url(#voidGrad)"/>`,
    domainHalo(0.72),
    shrineFrameStatic(),
    handPlaced({ preset: "hero" }),
    posterShards(),
    posterFlash(),
    identityLockupStatic(),
    `<rect x="0" y="0" width="960" height="540" fill="url(#vigGrad)" pointer-events="none"/>`,
  ].join("\n");
}

function energyAnimated() {
  const c = posterContacts();
  const OY = { 116: "apex", 166: "middle", 327: "thumb" };
  const shards = T.energy.shards.map((s, i) => {
    const o = c[OY[s.oy]] ?? c.apex;
    const d = shardD(s.length, 6 + i * 2);
    const persist = s.travel >= 0.5; // long slow shards linger as residual domain energy
    const offDur = s.fadeDur ?? 0.12;
    const offBegin = s.fadeBegin ?? s.begin + s.travel - offDur + 0.06;
    return [
      `<g transform="translate(${f(o.x)} ${f(o.y)}) rotate(${s.rotate})">`,
      `<g opacity="0">`,
      `<path d="${d}" fill="url(#shardGrad)"/>`,
      anT("translate", `0 0;0 ${-s.distance}`, { begin: s.begin, dur: s.travel, kt: "0;1", ks: SPL.snap }),
      an("opacity", "0;1", { begin: s.begin, dur: 0.08, kt: "0;1", ks: SPL.snap }),
      persist ? "" : an("opacity", "1;0", { begin: offBegin, dur: offDur, kt: "0;1", ks: SPL.snap }),
      `</g>`,
      `</g>`,
    ].join("");
  });

  const flash = (pt, begin, dur, maxR) =>
    `<circle cx="${f(pt.x)}" cy="${f(pt.y)}" r="4" fill="${C.peak}" filter="url(#glowPeak)" opacity="0">${an("opacity", "0;1;0", { begin, dur, kt: "0;0.15;1", ks: `${SPL.snap};0.3 0 0.7 1` })}${an("r", `3;${maxR}`, { begin, dur, kt: "0;1", ks: SPL.snap })}</circle>`;

  const impact = T.timeline.find((b) => b.beat === "CONTACT_IMPACT").start;
  const flashes = [flash(c.apex, impact, 0.3, 20), flash(c.thumb, impact + 0.07, 0.28, 14)].join("");

  const waveD = "M 3 -15 L 14 -8 L 11 -1 L 17 6 L 5 13 L -4 10 L -13 14 L -15 3 L -9 -4 L -13 -10 Z";
  const wave = (pt, begin, dur, maxScale, maxOpacity) =>
    `<g transform="translate(${f(pt.x)} ${f(pt.y)})"><g opacity="0"><path d="${waveD}" fill="none" stroke="${C.rim}" stroke-width="2"/>${anT("scale", `0.3;${maxScale}`, { begin, dur, kt: "0;1", ks: SPL.snap })}${an("opacity", `${maxOpacity};0`, { begin, dur, kt: "0;1", ks: SPL.snap })}</g></g>`;

  const waves = [wave(c.apex, impact, 0.32, 2.2, 0.9), wave(c.thumb, impact + 0.07, 0.3, 1.6, 0.8)].join("");

  return [
    `<g id="energy">`,
    `<g id="shard-field" filter="url(#shardWarp)">${shards.join("")}</g>`,
    waves,
    flashes,
    `</g>`,
  ].join("");
}

function domainAnimated() {
  const h = CMP.poster.halo;
  return [
    `<g id="domain" filter="url(#hazeWarp)">`,
    `<ellipse cx="${h.cx}" cy="${h.cy}" rx="${h.rx}" ry="${h.ry}" fill="url(#pressGrad)" opacity="0">${an(
      "opacity",
      "0;0.5;0.44;0.72;0.62",
      {
        begin: 0.5,
        dur: 5.0,
        kt: "0;0.28;0.62;0.72;1",
        ks: `${SPL.slow};${SPL.hold};${SPL.snap};${SPL.slow}`,
      }
    )}${an("rx", `${h.rx};${h.rx + 56}`, { begin: 4.1, dur: 0.8, kt: "0;1", ks: SPL.slow })}${an("ry", `${h.ry};${h.ry + 44}`, { begin: 4.1, dur: 0.8, kt: "0;1", ks: SPL.slow })}</ellipse>`,
    `</g>`,
  ].join("");
}

// Identity resolves into the dedicated lower lockup (composition.poster.lockup) so
// the wordmark never crosses the seal silhouette. Reveal beats unchanged; persists.
function identityAnimated() {
  const lk = CMP.poster.lockup;
  const stLS = T.typography.mono.subtextLetterSpacing;
  return [
    `<g id="identity">`,
    `<g transform="translate(480 ${lk.wordmarkBaseline})">`,
    `<g>`,
    anT("scale", `0.9;${T.motion.impact.overshootScale};${T.motion.impact.settleScale}`, { begin: 5.9, dur: 0.5, kt: "0;0.4;1", ks: `${SPL.snap};${SPL.settle}` }),
    `<g opacity="0">`,
    `<text x="0" y="0" text-anchor="middle" font-family="${DISPLAY_FONT}" font-size="${lk.wordmarkSize}" letter-spacing="${lk.wordmarkLetterSpacing}" fill="url(#wordGrad)" stroke="${C.rim}" stroke-width="2" paint-order="stroke" stroke-linejoin="miter">${ID.wordmark}</text>`,
    an("opacity", "0;1", { begin: 5.9, dur: 0.12, kt: "0;1", ks: SPL.snap }),
    an("stroke", `${C.peak};${C.peak};${C.rim}`, { begin: 5.9, dur: 0.35, kt: "0;0.3;1", ks: `${SPL.hold};${SPL.snap}` }),
    `</g>`,
    `</g>`,
    `</g>`,
    `<g transform="translate(480 ${lk.ruleY})">`,
    `<g>`,
    anT("scale", "0 1;1 1", { begin: 6.08, dur: 0.14, kt: "0;1", ks: SPL.snap }),
    `<g opacity="0">`,
    `<path d="M-${lk.ruleHalfWidth} 0 H${lk.ruleHalfWidth}" stroke="${C.rim}" stroke-width="2"/>`,
    an("opacity", "0;0.85", { begin: 6.08, dur: 0.08, kt: "0;1", ks: SPL.snap }),
    `</g>`,
    `</g>`,
    `</g>`,
    `<circle cx="480" cy="${lk.ruleY}" r="2.5" fill="${C.peak}" filter="url(#glowPeak)" opacity="0">${an("opacity", "0;1", { begin: 5.82, dur: 0.08, kt: "0;1", ks: SPL.snap })}${an("opacity", "1;0", { begin: 6.04, dur: 0.18, kt: "0;1", ks: SPL.snap })}${an("r", "2;5", { begin: 5.82, dur: 0.4, kt: "0;1", ks: SPL.settle })}</circle>`,
    `<text x="480" y="${lk.subtextBaseline}" text-anchor="middle" font-family="${MONO_FONT}" font-size="${lk.subtextSize}" letter-spacing="${stLS}" fill="${C.rim}" opacity="0">${ID.subtext}${an("opacity", "0;0.9", { begin: 6.3, dur: 0.65, kt: "0;1", ks: SPL.slow })}</text>`,
    `</g>`,
  ].join("");
}

function buildHeroAnimated() {
  const c = CMP.center;
  const body = [
    `<defs>`,
    defsShared({ forStatic: false }),
    filtersAnimated(),
    `</defs>`,
    `<rect x="0" y="0" width="960" height="540" fill="url(#voidGrad)"/>`,
    `<g id="scene">`,
    `<g transform="translate(${c.x} ${c.y})">`,
    `<g id="collapse-scale">`,
    anT("scale", "1;0.965", { begin: 5.5, dur: 0.24, kt: "0;1", ks: SPL.snap }),
    `<g transform="translate(${-c.x} ${-c.y})">`,
    `<g id="scene-jitter">${anT("translate", "0 0;0.7 0.3;-0.6 0.4;0.5 -0.3;-0.7 0.2;0.6 0.5;-0.5 -0.3;0 0", { begin: 0.6, dur: 1.25, discrete: true })}`,
    domainAnimated(),
    shrineFrameAnimated(),
    handSealAnimated(),
    energyAnimated(),
    `</g>`,
    `</g>`,
    `</g>`,
    `</g>`,
    `</g>`,
    identityAnimated(),
    `<rect x="0" y="0" width="960" height="540" fill="url(#vigGrad)" pointer-events="none"/>`,
  ].join("\n");

  return svgDoc(
    960,
    540,
    body,
    `${ID.wordmark} — domain expansion activation sequence`,
    `Seven-second SMIL sequence: void, crimson pressure, reference-derived hand seal snapping in as the focal subject, contact flash, directional energy from the contact geometry, shrine gates framing, cinematic hold, gentle collapse, and the VISHVAS77 identity lockup — resolving to a persistent poster end-state. No JavaScript.`
  );
}

function buildHeroStatic() {
  const body = [
    `<defs>`,
    defsShared({ forStatic: true }),
    filtersStatic(),
    `</defs>`,
    posterComposition(),
  ].join("\n");

  return svgDoc(
    960,
    540,
    body,
    `${ID.wordmark} — identity poster (static)`,
    `Renderer-independent static poster: the reference-derived hand seal as the focal subject over crimson domain pressure, dim flanking shrine gates, controlled residual energy from the contact geometry, and the VISHVAS77 identity lockup. Contains zero animation elements.`
  );
}

function buildShrine() {
  const body = [
    `<defs>`,
    defsShared({ forStatic: true }),
    `</defs>`,
    `<rect x="0" y="0" width="960" height="540" fill="url(#voidGrad)"/>`,
    environmentStatic({ edgeStrokeOpacity: 0.85, fogOpacities: [0.3, 0.26] }),
    `<ellipse cx="480" cy="560" rx="520" ry="180" fill="url(#pressGrad)" opacity="0.3"/>`,
    `<rect x="0" y="${CMP.envHorizonY - 2}" width="960" height="4" fill="url(#horizonGrad)" opacity="0.4"/>`,
    `<rect x="0" y="0" width="960" height="540" fill="url(#vigGrad)" pointer-events="none"/>`,
  ].join("\n");

  return svgDoc(960, 540, body, `Shrine environment`, `Token-generated shrine environment geometry shared with the hero composition.`);
}

function hexPoints(cx, cy, r) {
  const pts = [];
  for (let i = 0; i < 6; i++) {
    const a = (Math.PI / 180) * (60 * i - 90);
    pts.push(`${f(cx + r * Math.cos(a))},${f(cy + r * Math.sin(a))}`);
  }
  return pts.join(" ");
}

function buildDivider(variant) {
  const isArc = variant === "arc";
  const h = 64;
  const midY = h / 2;

  const lineGrad = [
    `<linearGradient id="lg-l" x1="0" y1="0" x2="1" y2="0">`,
    `<stop offset="0%" stop-color="${C.domain}" stop-opacity="0"/>`,
    `<stop offset="100%" stop-color="${C.rim}" stop-opacity="0.9"/>`,
    `</linearGradient>`,
    `<linearGradient id="lg-r" x1="0" y1="0" x2="1" y2="0">`,
    `<stop offset="0%" stop-color="${C.rim}" stop-opacity="0.9"/>`,
    `<stop offset="100%" stop-color="${C.domain}" stop-opacity="0"/>`,
    `</linearGradient>`,
  ].join("");

  const node = isArc
    ? [
        `<g transform="translate(480 ${midY}) rotate(45)">`,
        `<rect x="-13" y="-13" width="26" height="26" fill="none" stroke="${C.rim}" stroke-width="2"/>`,
        `<rect x="-21" y="-21" width="42" height="42" fill="none" stroke="${C.domain}" stroke-width="1" stroke-dasharray="6 5" opacity="0.7"/>`,
        `</g>`,
        `<circle cx="480" cy="${midY}" r="3" fill="${C.peak}"/>`,
      ].join("")
    : [
        `<polygon points="${hexPoints(480, midY, 17)}" fill="${C.surface}" stroke="${C.rim}" stroke-width="2"/>`,
        `<polygon points="${hexPoints(480, midY, 25)}" fill="none" stroke="${C.domain}" stroke-width="1" stroke-dasharray="7 6" opacity="0.65"/>`,
        `<circle cx="480" cy="${midY}" r="3" fill="${C.peak}"/>`,
      ].join("");

  const gap = isArc ? 56 : 48;
  const body = [
    `<defs>${lineGrad}</defs>`,
    `<path d="M32 ${midY} H${480 - gap}" stroke="url(#lg-l)" stroke-width="1.5"/>`,
    `<path d="M${480 + gap} ${midY} H928" stroke="url(#lg-r)" stroke-width="1.5"/>`,
    node,
  ].join("");

  return svgDoc(960, h, body, isArc ? `Arc divider` : `Primary divider`, `Token-generated section divider (${variant}).`);
}

function buildWordmarkStandalone() {
  const wmSize = T.typography.display.wordmarkSize;
  const wmLS = T.typography.display.wordmarkLetterSpacing;
  const body = [
    `<defs>`,
    defsShared({ forStatic: true }),
    `</defs>`,
    `<text x="480" y="138" text-anchor="middle" font-family="${DISPLAY_FONT}" font-size="${wmSize}" letter-spacing="${wmLS}" fill="url(#wordGrad)" stroke="${C.peak}" stroke-width="2.5" paint-order="stroke" stroke-linejoin="miter">${ID.wordmark}</text>`,
    `<path d="M${480 - CMP.tickHalfWidth} 174 H${480 + CMP.tickHalfWidth}" stroke="${C.rim}" stroke-width="2" opacity="0.9"/>`,
  ].join("");

  return svgDoc(960, 240, body, `${ID.wordmark} wordmark`, `Standalone token-generated identity wordmark. Transparent background, dark-context optimized.`);
}

function buildSpine() {
  const h = 112;
  const midY = 44;
  const xs = [128, 304, 480, 656, 832];
  const labels = ["PROJECT", "TECHNOLOGY", "PROBLEM", "RESULT", "EVIDENCE"];
  const parts = [];
  for (let i = 0; i < 4; i++) {
    parts.push(`<path d="M${xs[i] + 16} ${midY} H${xs[i + 1] - 16}" stroke="${C.domain}" stroke-width="1.5" stroke-opacity="0.55"/>`);
    const mx = snap8((xs[i] + xs[i + 1]) / 2);
    parts.push(`<path d="M${mx - 4} ${midY - 6} L${mx + 4} ${midY} L${mx - 4} ${midY + 6}" fill="none" stroke="${C.rim}" stroke-width="2"/>`);
  }
  xs.forEach((x, i) => {
    const last = i === xs.length - 1;
    parts.push(`<g transform="translate(${x} ${midY}) rotate(45)"><rect x="-11" y="-11" width="22" height="22" fill="${C.surface}" stroke="${last ? C.rim : C.domain}" stroke-width="2"/></g>`);
    parts.push(`<circle cx="${x}" cy="${midY}" r="3" fill="${last ? C.peak : C.blood}"/>`);
    parts.push(`<text x="${x}" y="92" text-anchor="middle" font-family="${MONO_FONT}" font-size="24" letter-spacing="2" fill="${last ? C.rim : C.domain}">${labels[i]}</text>`);
  });
  const body = parts.join("\n");
  return svgDoc(960, h, body, `Project evidence spine`, `Token-generated connector: PROJECT to TECHNOLOGY to PROBLEM to RESULT to EVIDENCE. Shared visual spine for all evidence-bearing sections.`);
}

function buildBadge(entry) {
  const url = new URL(entry.url);
  if (url.host !== "github.com") throw new Error(`badge repo url must be github.com: ${entry.url}`);
  const slash = entry.repo.indexOf("/");
  const owner = slash > 0 ? entry.repo.slice(0, slash) : "";
  const name = slash > 0 ? entry.repo.slice(slash + 1) : entry.repo;
  const nameSize = Math.max(5, Math.min(11, Math.floor(92 / (name.length * 0.62))));
  const body = [
    `<defs>`,
    `<linearGradient id="hexGrad" x1="0" y1="0" x2="1" y2="1">`,
    `<stop offset="0%" stop-color="${C.rim}"/>`,
    `<stop offset="100%" stop-color="${C.domain}"/>`,
    `</linearGradient>`,
    `</defs>`,
    `<polygon points="${hexPoints(80, 92, 76)}" fill="${C.surface}" fill-opacity="0.94" stroke="url(#hexGrad)" stroke-width="3"/>`,
    `<polygon points="${hexPoints(80, 92, 64)}" fill="none" stroke="${C.domain}" stroke-width="1" stroke-dasharray="7 6" opacity="0.7"/>`,
    `<text x="80" y="88" text-anchor="middle" font-family="${DISPLAY_FONT}" font-size="24" letter-spacing="2" fill="${C.rim}">${entry.rank}</text>`,
    owner ? `<text x="80" y="116" text-anchor="middle" font-family="${MONO_FONT}" font-size="9" letter-spacing="1" fill="${C.domain}" opacity="0.85">${owner}</text>` : "",
    `<text x="80" y="${owner ? 132 : 126}" text-anchor="middle" font-family="${MONO_FONT}" font-size="${nameSize}" fill="${C.domain}">${name}</text>`,
  ].join("");

  return svgDoc(160, 184, body, entry.rank, `Evidence-linked rank badge for ${entry.repo}.`);
}

async function rasterizePng(svgString, outPath, width) {
  const mod = await import("@resvg/resvg-js");
  const Resvg = mod.Resvg ?? mod.default?.Resvg;
  if (!Resvg) throw new Error("@resvg/resvg-js loaded but Resvg export not found");
  const resvg = new Resvg(svgString, {
    fitTo: { mode: "width", value: width },
    font: { loadSystemFonts: true, defaultFontFamily: "Arial" },
  });
  const rendered = resvg.render();
  const png = rendered.asPng();
  fs.writeFileSync(outPath, png);
  return { width: rendered.width, height: rendered.height, bytes: png.length };
}

function writeAsset(relPath, content) {
  const abs = path.join(ROOT, relPath);
  fs.mkdirSync(path.dirname(abs), { recursive: true });
  fs.writeFileSync(abs, content);
  return abs;
}

async function cmdBuild(argv) {
  const badgesIdx = argv.indexOf("--badges");
  let badgeEntries = null;
  if (badgesIdx !== -1) {
    const manifestPath = path.resolve(ROOT, argv[badgesIdx + 1]);
    badgeEntries = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
  }

  const heroAnimated = buildHeroAnimated();
  const heroStatic = buildHeroStatic();
  const shrine = buildShrine();
  const dividerPrimary = buildDivider("primary");
  const dividerArc = buildDivider("arc");
  const wordmark = buildWordmarkStandalone();
  const spine = buildSpine();

  writeAsset("assets/hero/hero-animated.svg", heroAnimated);
  writeAsset("assets/hero/hero-static.svg", heroStatic);
  writeAsset("assets/domain/shrine.svg", shrine);
  writeAsset("assets/separators/divider-primary.svg", dividerPrimary);
  writeAsset("assets/separators/divider-arc.svg", dividerArc);
  writeAsset("assets/identity/vishvas77-wordmark.svg", wordmark);
  writeAsset("assets/separators/spine-evidence.svg", spine);

  const pngInfo = await rasterizePng(heroStatic, path.join(ROOT, "assets/hero/hero-static.png"), T.budgets.pngStatic.exportWidth);

  let badgeCount = 0;
  if (badgeEntries) {
    for (const entry of badgeEntries) {
      writeAsset(`assets/badges/${entry.repo.replace("/", "__")}.svg`, buildBadge(entry));
      badgeCount++;
    }
  }

  console.log("BUILD COMPLETE");
  console.log(`  assets/hero/hero-animated.svg     ${(Buffer.byteLength(heroAnimated) / 1024).toFixed(1)} KB`);
  console.log(`  assets/hero/hero-static.svg       ${(Buffer.byteLength(heroStatic) / 1024).toFixed(1)} KB`);
  console.log(`  assets/hero/hero-static.png       ${pngInfo.width}x${pngInfo.height} ${(pngInfo.bytes / 1024).toFixed(1)} KB`);
  console.log(`  assets/domain/shrine.svg`);
  console.log(`  assets/separators/divider-{primary,arc}.svg`);
  console.log(`  assets/identity/vishvas77-wordmark.svg`);
  console.log(`  badges emitted: ${badgeCount}${badgeEntries ? "" : " (evidence-linked policy: supply --badges manifest with real repos)"}`);
}

function analyzeSvgString(svgString) {
  const paths = (svgString.match(/<path[\s>]/g) || []).length;
  const filters = (svgString.match(/<filter[\s>]/g) || []).length;
  const anims = (svgString.match(/<animate[\s>]/g) || []).length;
  const forbidden = [];
  for (const needle of T.budgets.forbidden) {
    if (needle === 'calcMode="linear"') {
      if (/calcMode\s*=\s*"linear"/i.test(svgString)) forbidden.push(needle);
      continue;
    }
    if (needle.includes("href") || needle.includes("url")) {
      const re = needle.includes("href") ? /\b(?:href|xlink:href)\s*=\s*"(?!#)/g : /url\(\s*(?!['"]?#)/g;
      if (re.test(svgString)) forbidden.push(needle);
      continue;
    }
    if (svgString.toLowerCase().includes(needle.toLowerCase())) forbidden.push(needle);
  }
  const hexes = [...new Set((svgString.match(/#[0-9a-fA-F]{6}\b/g) || []).map((h) => h.toUpperCase()))];
  const paletteViolations = hexes.filter((h) => !PALETTE_HEX_SET.has(h));
  const peakRefs = (svgString.match(new RegExp(C.peak, "gi")) || []).length;
  return { paths, filters, anims, forbidden, paletteViolations, peakRefs };
}

function smilBoundaries(svgString) {
  const times = new Set([0]);
  const re = /begin="([\d.]+)s"\s+dur="([\d.]+)s"/g;
  let m;
  while ((m = re.exec(svgString))) {
    times.add(parseFloat(m[1]));
    times.add(parseFloat((parseFloat(m[1]) + parseFloat(m[2])).toFixed(3)));
  }
  return [...times].sort((a, b) => a - b);
}

function checkSmilStoryboard(svgString) {
  const tol = 0.15;
  const times = smilBoundaries(svgString);
  const results = [];
  for (const beat of T.timeline) {
    for (const target of [beat.start, beat.end]) {
      const nearest = times.reduce((best, t) => (Math.abs(t - target) < Math.abs(best - target) ? t : best), Infinity);
      results.push({ beat: beat.beat, boundary: target, nearestSmil: nearest, delta: f(Math.abs(nearest - target)), ok: Math.abs(nearest - target) <= tol });
    }
  }
  return results;
}

function pngDims(buf) {
  if (buf.length < 24 || buf.toString("ascii", 12, 16) !== "IHDR") return null;
  return { width: buf.readUInt32BE(16), height: buf.readUInt32BE(20) };
}

function cmdValidate() {
  const report = { generatedAt: new Date().toISOString(), tokensVersion: T.meta.version, suites: {}, overall: "PASS" };
  const fail = (where, msg) => {
    report.overall = "FAIL";
    (report.failures = report.failures || []).push(`[${where}] ${msg}`);
  };

  const targets = {
    "assets/hero/hero-animated.svg": { budgets: T.budgets.heroAnimated, expectAnim: true },
    "assets/hero/hero-static.svg": { budgets: T.budgets.heroStatic, expectAnim: false },
    "assets/domain/shrine.svg": { budgets: T.budgets.heroStatic, expectAnim: false },
    "assets/separators/divider-primary.svg": { budgets: T.budgets.heroStatic, expectAnim: false },
    "assets/separators/divider-arc.svg": { budgets: T.budgets.heroStatic, expectAnim: false },
    "assets/separators/spine-evidence.svg": { budgets: T.budgets.heroStatic, expectAnim: false },
    "assets/identity/vishvas77-wordmark.svg": { budgets: T.budgets.heroStatic, expectAnim: false },
  };

  const rebuilt = {
    "assets/hero/hero-animated.svg": buildHeroAnimated(),
    "assets/hero/hero-static.svg": buildHeroStatic(),
    "assets/domain/shrine.svg": buildShrine(),
    "assets/separators/divider-primary.svg": buildDivider("primary"),
    "assets/separators/divider-arc.svg": buildDivider("arc"),
    "assets/separators/spine-evidence.svg": buildSpine(),
    "assets/identity/vishvas77-wordmark.svg": buildWordmarkStandalone(),
  };

  report.suites.assets = {};
  for (const [rel, spec] of Object.entries(targets)) {
    const abs = path.join(ROOT, rel);
    const info = { exists: fs.existsSync(abs) };
    if (!info.exists) {
      fail("assets", `${rel} missing — run "node scripts/build-tokens.mjs"`);
      report.suites.assets[rel] = info;
      continue;
    }
    const disk = fs.readFileSync(abs, "utf8");
    info.bytes = Buffer.byteLength(disk);
    Object.assign(info, analyzeSvgString(disk));
    info.syncWithTokens = disk === rebuilt[rel];
    if (!info.syncWithTokens) fail("sync", `${rel} differs from token build — regenerate (hand-edits are forbidden)`);
    if (info.bytes > spec.budgets.maxBytes) fail("budget", `${rel} ${info.bytes}B > ${spec.budgets.maxBytes}B`);
    if (info.paths > spec.budgets.maxPaths) fail("budget", `${rel} ${info.paths} paths > ${spec.budgets.maxPaths}`);
    if (info.filters > spec.budgets.maxFilters) fail("budget", `${rel} ${info.filters} filters > ${spec.budgets.maxFilters}`);
    if (spec.expectAnim && info.anims === 0) fail("smil", `${rel} expected SMIL animation, found none`);
    if (!spec.expectAnim && info.anims > 0) fail("static-purity", `${rel} must contain zero animation elements, found ${info.anims}`);
    if (!spec.expectAnim && info.peakRefs > 2) fail("palette-budget", `${rel} references --peak ${info.peakRefs}x in a single static frame (max 2)`);
    if (info.forbidden.length) fail("forbidden", `${rel} contains forbidden constructs: ${info.forbidden.join(", ")}`);
    if (info.paletteViolations.length) fail("tokens", `${rel} uses non-token colors: ${info.paletteViolations.join(", ")}`);
    report.suites.assets[rel] = info;
  }

  const heroRel = "assets/hero/hero-animated.svg";
  const heroDisk = fs.existsSync(path.join(ROOT, heroRel)) ? fs.readFileSync(path.join(ROOT, heroRel), "utf8") : "";
  report.suites.smilStoryboard = heroDisk ? checkSmilStoryboard(heroDisk) : [];
  if (heroDisk) {
    for (const r of report.suites.smilStoryboard.filter((r) => !r.ok)) {
      fail("smil-storyboard", `boundary ${r.boundary}s of "${r.beat}" unmatched (nearest SMIL event ${r.nearestSmil}s)`);
    }
  }

  const pngRel = "assets/hero/hero-static.png";
  const pngAbs = path.join(ROOT, pngRel);
  const pngInfo = { exists: fs.existsSync(pngAbs) };
  if (pngInfo.exists) {
    const buf = fs.readFileSync(pngAbs);
    pngInfo.bytes = buf.length;
    const dims = pngDims(buf);
    pngInfo.width = dims ? dims.width : null;
    pngInfo.height = dims ? dims.height : null;
    if (!dims) fail("png", `${pngRel} is not a readable PNG`);
    if (dims && dims.width < T.budgets.pngStatic.minRenderedWidth) fail("png", `${pngRel} width ${dims.width} < ${T.budgets.pngStatic.minRenderedWidth}`);
    if (buf.length > T.budgets.pngStatic.maxBytes) fail("png", `${pngRel} ${buf.length}B > ${T.budgets.pngStatic.maxBytes}B`);
  } else {
    fail("png", `${pngRel} missing — run build`);
  }
  report.suites.png = pngInfo;

  const readmeRel = "README.md";
  const readmeAbs = path.join(ROOT, readmeRel);
  if (fs.existsSync(readmeAbs)) {
    const md = fs.readFileSync(readmeAbs, "utf8");
    const refs = [...new Set(md.match(/assets\/[A-Za-z0-9_\-\.\/]+\.(?:svg|png)/g) || [])];
    report.suites.readme = { imageRefs: refs };
    if (!refs.includes("assets/hero/hero-animated.svg")) fail("readme", "hero-animated.svg is not embedded in README");
    for (const ref of refs) {
      if (!fs.existsSync(path.join(ROOT, ref))) fail("readme", `broken image reference: ${ref}`);
    }
  } else {
    fail("readme", `${readmeRel} missing`);
  }

  report.suites.gates = {
    handSeal: T.seal.status,
    sources: T.seal.sources,
    badges: T.badges.policy,
  };

  const outDir = path.join(ROOT, "analysis/measurements");
  fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(path.join(outDir, "validation-report.json"), JSON.stringify(report, null, 2));

  const lines = [];
  lines.push(`VALIDATION ${report.overall} — ${report.generatedAt} (tokens v${report.tokensVersion})`);
  for (const [rel, info] of Object.entries(report.suites.assets)) {
    lines.push(`${rel}: bytes=${info.bytes} paths=${info.paths}/${targets[rel].budgets.maxPaths} filters=${info.filters}/${targets[rel].budgets.maxFilters} anims=${info.anims} peakRefs=${info.peakRefs} sync=${info.syncWithTokens} violations=${JSON.stringify(info.paletteViolations)} forbidden=${JSON.stringify(info.forbidden)}`);
  }
  lines.push(`smil storyboard coverage: ${report.suites.smilStoryboard.filter((r) => r.ok).length}/${report.suites.smilStoryboard.length} boundaries within ±0.15s`);
  lines.push(`png: ${JSON.stringify(report.suites.png)}`);
  if (report.suites.readme) lines.push(`readme image refs: ${JSON.stringify(report.suites.readme.imageRefs)}`);
  lines.push(`gates: ${JSON.stringify(report.suites.gates, null, 2)}`);
  if (report.failures) lines.push(`FAILURES:\n${report.failures.map((x) => " - " + x).join("\n")}`);
  fs.writeFileSync(path.join(outDir, "validation-report.txt"), lines.join("\n"));
  console.log(lines.join("\n"));

  if (report.overall !== "PASS") process.exit(1);
}

function buildHandSealReview({ annotated }) {
  const a = HANDS.anchor;
  const body = [
    `<rect x="0" y="0" width="960" height="540" fill="#808080"/>`,
    `<g transform="translate(${a.x} ${a.y})">${handInnerGeometry("review")}</g>`,
    annotated ? [
      `<line x1="${a.x}" y1="24" x2="${a.x}" y2="520" stroke="#000" stroke-width="1" stroke-dasharray="8 6"/>`,
      `<line x1="200" y1="${CMP.contacts.apex.y}" x2="760" y2="${CMP.contacts.apex.y}" stroke="#000" stroke-width="1" stroke-dasharray="4 6"/>`,
      `<line x1="200" y1="${CMP.contacts.thumb.y}" x2="760" y2="${CMP.contacts.thumb.y}" stroke="#000" stroke-width="1" stroke-dasharray="4 6"/>`,
      Object.values(CMP.contacts).map((p) => `<circle cx="${p.x}" cy="${p.y}" r="7" fill="none" stroke="#000" stroke-width="1.5"/><circle cx="${p.x}" cy="${p.y}" r="1.5" fill="#000"/>`).join(""),
      `<rect x="414" y="112" width="133" height="298" fill="none" stroke="#000" stroke-width="1" stroke-dasharray="5 5"/>`,
      `<text x="570" y="${a.y + 100}" font-family="Arial" font-size="14" fill="#000">H = ${CMP.contacts.thumb.y - CMP.contacts.apex.y}</text>`,
      `<text x="570" y="${a.y + 120}" font-family="Arial" font-size="14" fill="#000">W = 134</text>`,
      `<text x="570" y="${a.y + 140}" font-family="Arial" font-size="13" fill="#000">contacts: apex/middle/thumb</text>`,
    ].join("") : "",
  ].join("\n");
  return svgDoc(960, 540, body, `Hand seal static review${annotated ? " (annotated)" : ""}`, `Neutral-background review render of the reference-derived hand-seal geometry.`);
}

async function cmdReview() {
  const outDir = path.join(ROOT, "analysis/comparisons");
  fs.mkdirSync(outDir, { recursive: true });
  for (const variant of ["clean", "annotated"]) {
    const svg = buildHandSealReview({ annotated: variant === "annotated" });
    const base = `hand-seal-review-${variant}`;
    writeAsset(`analysis/comparisons/${base}.svg`, svg);
    const info = await rasterizePng(svg, path.join(outDir, `${base}.png`), 960);
    console.log(`${base}.png ${info.width}x${info.height} ${(info.bytes / 1024).toFixed(1)} KB`);
  }
}

function freezeShrine(fillMul, edgeOp) {
  const { sf, L, R } = shrineFrameGeom();
  return [
    `<path d="${ENV.ground}" fill="${C.shadow}" fill-opacity="${f(0.5 * fillMul)}"/>`,
    `<path d="${L}" fill="${C.shadow}" fill-opacity="${f(sf.fillOpacity * fillMul)}"/>`,
    `<path d="${R}" fill="${C.shadow}" fill-opacity="${f(sf.fillOpacity * fillMul)}"/>`,
    `<path d="${L} ${R}" fill="none" stroke="${C.domain}" stroke-width="2" stroke-opacity="${edgeOp}"/>`,
  ].join("");
}

function freezeFog(a, b) {
  return [
    `<rect x="0" y="${CMP.fogBandY}" width="960" height="108" fill="url(#fogGrad)" opacity="${a}"/>`,
    `<rect x="0" y="464" width="960" height="76" fill="url(#fogGrad)" opacity="${b}"/>`,
  ].join("");
}

function freezeHorizon(op) {
  return `<rect x="0" y="${CMP.envHorizonY - 2}" width="960" height="4" fill="url(#horizonGrad)" opacity="${op}"/>`;
}

function freezeShardP(c, at, rotate, distance, length, idx, progress, op) {
  const o = c[at];
  return `<g transform="translate(${f(o.x)} ${f(o.y)}) rotate(${rotate})"><g transform="translate(0 ${f(-distance * progress)})" opacity="${op}"><path d="${shardD(length, 6 + idx * 2)}" fill="url(#shardGrad)"/></g></g>`;
}

function freezeFlash(pt, r, op) {
  return `<circle cx="${f(pt.x)}" cy="${f(pt.y)}" r="${r}" fill="${C.peak}" filter="url(#glowPeak)" opacity="${op}"/>`;
}

function freezeWave(pt, scale, op) {
  return `<g transform="translate(${f(pt.x)} ${f(pt.y)}) scale(${scale})" opacity="${op}"><path d="M 3 -15 L 14 -8 L 11 -1 L 17 6 L 5 13 L -4 10 L -13 14 L -15 3 L -9 -4 L -13 -10 Z" fill="none" stroke="${C.rim}" stroke-width="2"/></g>`;
}

function buildFreezeFrame(name) {
  const bg = `<rect x="0" y="0" width="960" height="540" fill="url(#voidGrad)"/>`;
  const vig = `<rect x="0" y="0" width="960" height="540" fill="url(#vigGrad)" pointer-events="none"/>`;
  const defs = `<defs>${defsShared({ forStatic: false })}${filtersAnimated()}</defs>`;
  const hands = (op) => handPlaced({ preset: "hero", opacity: op });
  const c = posterContacts();
  const sf = CMP.poster.shrineFrame;
  // residual/hold energy shards, poster-space — matches the animated end-state
  // (apex eruption + a persisting middle-contact side shard). No downward thumb
  // energy, so the identity lockup stays clean in the hold/collapse/identity frames.
  const holdShards = (op) => [
    freezeShardP(c, "apex", -20, 300, 150, 1, 0.92, op),
    freezeShardP(c, "middle", 80, 170, 70, 4, 0.9, op * 0.7),
  ].join("");

  const scenes = {
    "1-void": [bg],
    "2-reveal": [bg, domainHalo(0.5), freezeShrine(0.1, 0), hands(1)],
    "3-contact": [bg, domainHalo(0.45), freezeShrine(0.1, 0), hands(1), freezeWave(c.apex, 1.4, 0.5), freezeWave(c.thumb, 1.1, 0.45), freezeFlash(c.apex, 14, 1), freezeFlash(c.thumb, 10, 0.9)],
    "4-energy": [bg, domainHalo(0.6), freezeShrine(0.1, 0), hands(1),
      freezeShardP(c, "apex", -58, 132, 82, 0, 0.6, 0.9), freezeShardP(c, "apex", -20, 300, 150, 1, 0.55, 0.95), freezeShardP(c, "apex", 34, 150, 96, 2, 0.6, 0.9),
      freezeShardP(c, "thumb", 150, 150, 80, 5, 0.5, 0.85), freezeShardP(c, "thumb", -152, 122, 66, 6, 0.5, 0.8)],
    "5-environment": [bg, domainHalo(0.66), freezeShrine(1, sf.edgeOpacity), freezeFog(0.26, 0.22), freezeHorizon(0.3), hands(1)],
    "6-hold": [bg, domainHalo(0.72), freezeShrine(1, sf.edgeOpacity), freezeFog(0.26, 0.22), freezeHorizon(0.3), hands(1), holdShards(0.85), freezeFlash(c.apex, 11, 0.95)],
    "7-collapse": [bg, `<g transform="translate(480 270)"><g transform="scale(0.965)"><g transform="translate(-480 -270)">`, domainHalo(0.6), freezeShrine(0.7, sf.edgeOpacity * 0.7), freezeFog(0.16, 0.12), freezeHorizon(0.22), hands(1), holdShards(0.6), `</g></g></g>`],
    "8-identity": [bg, domainHalo(0.72), freezeShrine(1, sf.edgeOpacity), freezeFog(0.26, 0.22), freezeHorizon(0.3), hands(1), holdShards(0.8), freezeFlash(c.apex, 11, 0.95), identityLockupStatic()],
  };

  const body = [defs, ...(scenes[name] ?? []), vig].join("\n");
  return svgDoc(960, 540, body, `Freeze frame: ${name}`, `Phase-2 inspection freeze-frame (${name}).`);
}

async function cmdFrames() {
  const outDir = path.join(ROOT, "analysis/comparisons/frames");
  fs.mkdirSync(outDir, { recursive: true });
  for (const name of Object.keys({
    "1-void": 0, "2-reveal": 0, "3-contact": 0, "4-energy": 0,
    "5-environment": 0, "6-hold": 0, "7-collapse": 0, "8-identity": 0,
  })) {
    const svg = buildFreezeFrame(name);
    writeAsset(`analysis/comparisons/frames/${name}.svg`, svg);
    const info = await rasterizePng(svg, path.join(outDir, `${name}.png`), 1920);
    console.log(`${name}.png ${info.width}x${info.height} ${(info.bytes / 1024).toFixed(1)} KB`);
  }
}

const [, , mode, ...rest] = process.argv;
if (mode === "validate") {
  cmdValidate();
} else if (mode === "review") {
  await cmdReview();
} else if (mode === "frames") {
  await cmdFrames();
} else if (mode === undefined || mode === "build" || mode === "--badges") {
  await cmdBuild(mode === "--badges" ? ["--badges", ...rest] : rest);
} else {
  console.error(`unknown mode: ${mode}. usage: node scripts/build-tokens.mjs [build|--badges manifest.json|review|frames|validate]`);
  process.exit(2);
}
