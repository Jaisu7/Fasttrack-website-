# Development record —2026-11-07

## Result

Continued from the supplied React/Vite handoff and recovered the earlier private Site source. Implemented a continuous native3D manufacturing homepage, corrected independent workpiece cycles, retained the six-product showroom and created a portable Windows/Codex/GitHub handoff. Original reference hashes match. No official-domain or audience changes.

## Validation observed

| Check | Result / evidence |
| --- | --- |
| Production build | `npm run build` passes; Vite builds all dynamically split engines. Shared Three.js chunk approximately150KB gzip; base application approximately72KB gzip, stylesheet approximately6KB gzip. These are bundle sizes, not measured Core Web Vitals. |
| Behavioral tests | `npm test`:5 passing tests for six stage shortcuts, monotonic folds, bounded long-running workpiece clock, complete exit before blank entry and enquiry encoding/destination. |
| Reference preservation | Original AGENTS.md, PROJECT_BRIEF.md, original roadmap copy, legacy HTML and7 imported reference files verified by SHA256. |
| Preview identity | Live private preview title `Fastrack Metallic | Engineered in Steel`; meaningful complete page, no framework overlay. |
| Native3D desktop | Connected Chrome1920×945 and1536×1024: renderer ready, actual original-logo contours; same primary-panel identifier; progress1 reached showroom with12 punched openings and both folds1.000. |
| Stage navigation | Explore process reaches laser progress.25; finished stage becomes cabinet; final Explore Products link reaches catalog. Final shortcut moved slightly before pin release to retain framing. |
| Showroom controls | Native scene datasets and visible selected labels confirm worktable exploded view, warm lighting, satin finish; cabinet doors reach operation.999 with expanded framing; display LEDs and sink water switch; 360° changes azimuth from.620 to.479. |
| Pause / reset | Managed preview process reset restarts clock. Paused bending clock remains1.163 across separate observations, with bend angle6.7 unchanged. |
| Enquiry | Native required-field validation blocks incomplete entry. Completed sample creates reviewable local draft with exact company mailto target; no email was sent. |
| Responsive |390×844 mobile hero screenshot: readable title/actions, compressed menu/header, horizontal stage rail, no page overflow.1536 desktop overflow false after resize settled. |
| Console | No app errors/warnings in connected desktop check. Managed browser only showed extension-metadata errors unrelated to app; its WebGL-disabled fallback rendered correctly. |
| Inspection limits | Browser responsive-menu follow-up timed out at the connector; menu interaction is not claimed as a completed live check. Cross-browser/real-phone testing and full low-end performance audit remain. |

## Design comparison

Four section concepts are in `docs/design/`. Native1536×1024 hero and current1920×945 product rendering were captured via connected Browser; concept and implementation were opened together with `view_image`. Mobile390×844 was also inspected. See `design/FIDELITY_LEDGER.md` for concrete comparisons/deviations. Internal QA screenshots are not source assets and are excluded from the portable package.

## Fixes made during review

- Explicit Vite preview host allowlist for managed QA.
- Correct production-cycle exit/loading timing; completed marks travel with their workpiece. Manual traces clear before a fresh blank enters.
- Original curved emblem replaces image-generated concept logos.
- Darkened native scene surroundings and improved procedural brushed grain; initial plinth remains before the machine bed enters.
- Fixed accessible requirement selection and exact headline spacing.
- GSAP uses explicit from/to progress on refresh; reduced-motion changes no longer destroy and recreate the active WebGL canvas.
- Product showroom uses neutral studio lighting and optional satin material roughness; operation/assembly framing preserved.

## Deliberate limits

No approved CAD imports, verified technical specs or production backend enquiry endpoint were available. Models remain clearly representative. No static UI screenshot is shipped as a functional page. Native animations are source code, not standalone GIF/video exports. GitHub destination URL is still pending.


## 2026-11-08 — Homepage and capabilities
Added Explore Our Products and Discuss Your Project homepage actions. Reworked the four process panels with typical applications, material review guidance and process-specific enquiry handoff. Desktop shows visual left/details right; mobile stacks the visual first. Interactive guidance remains available in a disclosure. Product showroom files remain unchanged. No numerical manufacturing claims or automatic enquiry delivery added.


## 2026-11-08 — Steel editorial motion refinement
Reference research: https://www.awwwards.com/sites/q-industrial (home 3D motion and service interactions); https://www.awwwards.com/sites/terminal-industries (scrolling, storytelling, animation). Adapted principles within the established design, without copying assets or adding dependencies.
Added staggered hero lines, process panel entrances, section reveals, navigation underlines, CTA arrow feedback, a reading progress line and large process typography. Native scrolling and reduced-motion preference are preserved. Product component/model/configuration files remain unchanged. Content stays visible when the motion enhancement is unavailable.


## 2026-11-08 — Finished assembly turntable
Replaced the small side-to-side showroom sway with continuous full rotation of the assembled unit. Rotation begins after welding and door installation complete, accelerates gently with the finished reveal, and respects pause, offscreen suspension, reset and reduced motion. At full reveal one revolution takes approximately 26 seconds.


## 2026-11-08 — Dark/light contrast correction
Confirmed on the live site that light-theme action buttons inherited a dark background while retaining dark text. Introduced paired button foreground/background/hover tokens, with separate dark hero tokens. Corrected the enquiry arrow colour, native dropdown options, process status/disclosure colours, draft surfaces and workshop menu states. Body now explicitly uses theme foreground/background; corrected footer copyright encoding. Product functionality is unchanged.


## 2026-11-08 — Clean process panels and open finished cabinet
Removed the visible demo instruction disclosure, cycle counter, production steps and technical status text; retained a concise screen-reader keyboard hint. Finished cabinet doors open outward to approximately 63 degrees after welding and installation complete, exposing the shelf while the assembly rotates. Reduced motion shows the finished open pose.
