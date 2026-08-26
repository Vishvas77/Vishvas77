# HAND-SEAL GEOMETRY GATE — CLEARED

Status: **REFERENCE_DERIVED.** The provisional placeholder has been fully replaced by hand
geometry reconstructed from the four-shot reference set (`analysis/reference/`). The seal
status token is `REFERENCE_DERIVED`; both hero SVGs carry the reference-derived paths.

## Reference inventory

| Shot | File | Use |
| --- | --- | --- |
| 01 front | `01_front_handseal.png` | silhouette authority |
| 02 three-quarter | `02_threequarter_handseal.png` | depth / occlusion order (right hand biased +1 front at seam) |
| 03 side | `03_side_handseal.png` | stacking / palm depth proportions |
| 04 contact close-up | `04_fingertip_contact_closeup.png` | six-point contact map (2 index + 2 middle + 2 thumb) |

## Extraction → implementation mapping

- Pressed prayer seal, fingers up; solid mass with hairline center seam (hands overlap ~1
  unit at centerline; seam painted as interior crease line, never an open gap)
- Lens negative space: top vertex ≈ 61–63% H · bottom vertex at thumb contact · width ≈ 10%
  of structure width
- Index tower: pair ≈ 28% of width, nailed tips at apex; middle contact ≈ 22% H below apex
- Knuckle ridge (folded ring/pinky): widest zone at ≈ 62–68% H; blade-like taper into palm
- Thumb pair: tip-to-tip pad contact at 1.0 H; masses wrap under inside the palm envelope
  (no lateral protrusion)
- Wrist column: paired, near-touching, ≈ 33% of max width total
- H : W = 211 : 134 ≈ 0.64 (ref ≈ 0.63–0.67)
- Asymmetry: independent left/right paths, ±1–3 unit deltas on tip heights, ridge widths,
  lens width, wrist lengths

## Render-inspection iteration log (neutral-gray renders in this directory)

| Pass | Verdict vs ref 01 | Defects found on render | Fix |
| --- | --- | --- | --- |
| v1 | FAIL | lens ~18% wide × 53% H dominating frame; deep finger notches made "stacked blobs"; matchstick wrists | rebuilt contour |
| v3 | FAIL | lens still too wide; open gray seam slot between index pair; thumb "ears"; onion-shaped bulge | seam overlap + painted crease; smooth flare |
| v5 | CLOSE | knuckle bulge too high/round; slow taper; thumb ears persist | two-stage flare, faster cut-in, in-envelope thumb wrap |
| v6 | **PASS** | — | final geometry |

## Contact anchors (tokenized, consumed by energy/flash placement)

- apex (480, 116) · middle (480, 166) · thumb (480, 327) — see `composition.contacts` in
  `design-tokens.json`

## Known accepted deltas

- Finger ridge undulation on the outer contour is hinted via interior detail lines rather
  than silhouette cuts — deliberate: reads correctly at hero display scale (~183 px tall)
  where silhouette notches would turn to noise.
- Side/3-4 depth cues are baked into draw order and asymmetry only; the hero composition is
  frontal by design (authority: ref 01).

Review artifacts: `hand-seal-review-clean.svg/.png`, `hand-seal-review-annotated.svg/.png`.
