# Fastrack Metallic — Engineered in Steel

**From Raw Steel to Extraordinary Engineering.**

A portable React/Vite website with a continuous, scroll-controlled manufacturing story, interactive process demonstrations and a native 3D product showroom.

## Run on your computer

Install Node.js 22.12 or newer (Node 24 LTS recommended), then open this folder in a terminal:

```bash
npm ci
npm run dev
```

Open the local URL printed by Vite. Use `npm run build` to create `dist/`, `npm run preview` to inspect the production build, and `npm test` for the production-cycle and enquiry checks. On Windows you can run `scripts/start-windows.ps1` from PowerShell. No application secret, API key or database is needed for this preview.

## Continue in Codex

Open this complete project folder in Codex or your editor with the Codex extension. Paste the prompt in `docs/CODEX_CONTINUE.md`. Read `AGENTS.md`, `docs/PROJECT_BRIEF.md`, `docs/ROADMAP.md` and the current `docs/SESSION_HANDOFF.md` first.

The original AGENTS/brief text describes the earlier starter baseline. `docs/SESSION_HANDOFF.md` records what has since been recovered and implemented. Original source and supplied conversations remain under `reference/`; do not overwrite them.

## Implemented

- Six-stage GSAP ScrollTrigger homepage: raw panel → original-logo laser trace → punching → two press-brake bends → welding/assembly → finished cabinet concept. The same primary-panel mesh persists; additional components enter separately.
- Direct stage selection, pause, skip, mouse lighting response, reduced-motion stage selection and static WebGL fallback.
- Four independent photo-layer process demonstrations. Every cycle finishes a piece, retracts the tool, ejects the piece downward, then loads a fresh blank. Mouse/touch/keyboard guidance, pause/reset, sound off.
- Six representative native3D product families with orbit/touch/keyboard rotation, three lighting setups, exploded views, brushed/satin finish comparison and product-specific cabinet doors, display lights or sink water.
- Product category filters, scroll reveals, quick process widget and product-to-enquiry handoff.
- Reviewable local enquiry draft, copy/download and mailto handoff. No automatic transmission or backend lead capture.

## Requirements review

See [the complete requirements review](docs/REQUIREMENTS_REVIEW.md) for what is implemented, partial and pending, [new feature proposals](docs/NEW_FEATURE_IDEAS.md) for priorities, and [file integrity results](docs/FILE_REVIEW.json) for the supplied-file checks. The entire production brief is not complete.

## What is conceptual

Models and process scenes illustrate the business; they are not approved CAD files, a physical manufacturing simulation or verified equipment specifications. Production release still needs company-reviewed product content, approved CAD/GLB assets, imagery rights confirmation and a validated enquiry endpoint. See `docs/KNOWN_LIMITATIONS.md`.

## Files

| Path                               | Purpose                                                                        |
| ---------------------------------- | ------------------------------------------------------------------------------ |
| `src/components/`                  | Native accessible UI, page sections and widget                                 |
| `src/lib/manufacturing-scene.ts`   | Continuous Three.js manufacturing scene                                        |
| `src/lib/journey-state.mjs`        | Pure stage/folding state                                                       |
| `src/lib/*-animation.ts`           | Photo-layer machine engines                                                    |
| `src/lib/workpiece-cycle.mjs`      | Shared work/eject/load clock                                                   |
| `src/lib/product-models.ts`        | Procedural product geometry                                                    |
| `src/lib/product-viewer-engine.ts` | Lighting, orbit, finish and assembly                                           |
| `public/images/`, `public/fonts/`  | All runtime media, locally included                                            |
| `docs/design/`                     | Four design concepts and implementation contract                               |
| `reference/`                       | Original starter, recovered site source, supplied chat exports and legacy HTML |
| `docs/ASSET_MANIFEST.json`         | Asset paths, hashes, sizes and provenance                                      |

## GitHub and personal-device setup

Repository: [Jaisu7/Fasttrack-website-](https://github.com/Jaisu7/Fasttrack-website-).

Clone the complete project on your personal device:

```powershell
git clone https://github.com/Jaisu7/Fasttrack-website-.git
cd Fasttrack-website-
npm ci
npm test
npm run dev
```

Open this folder in Codex and paste `docs/CODEX_CONTINUE.md` to continue with the preserved project context. See `docs/GITHUB_SETUP.md` for the two-device workflow. Source, images/fonts, animation code, procedural models, design concepts, original references and supplied chat exports are included. Installed dependencies, build output and credentials are excluded.

`PORTABLE_EXPORT.json` records the original portable ZIP snapshot; documentation has since been updated for this confirmed repository. See `docs/GITHUB_IMPORT.md` for provenance.

The ChatGPT-hosted preview uses `.openai/hosting.json`. It is unrelated to the official `fasttrackmi.com` domain. This work does not authorize changing that domain or your preview audience.
