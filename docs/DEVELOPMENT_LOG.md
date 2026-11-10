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

## 2026-11-09 — Cartoon workshop introduction and layout refinement

Added a lightweight SVG/CSS opening sequence featuring a cartoon operator at an enclosed CNC laser cutter. The cutting head traces the original Fastrack mark on a steel sheet. The first visit in a browser session shows the introduction for at least 2.4 seconds while the homepage initializes, with a 5.5-second maximum and a short fade. Skip, Escape and a footer replay control are available. Direct section links and reduced-motion first visits bypass the introduction; session storage is optional. The page is inert during the introduction, scroll locking is restored afterwards, and the hero text entrance waits for the overlay to leave.

Corrected the visible spacing between “Steel” and “to”. The mobile navigation now closes with Escape, on outside interaction, on desktop resize and when selecting the quote action; its toggle identifies the controlled navigation. Existing automated tests pass (11/11). The production build passes with the existing shared Three.js chunk-size warning. Local desktop browser checks verified the opening, automatic reveal, replay, Skip, Escape, restored scrolling, theme switch and no page-width overflow. The managed test browser uses the existing WebGL fallback; that check does not validate the native 3D renderer.

Live 390×844 review identified a pinned-scene width measured while the introductory overlay hid the scrollbar. Restore the scrollbar behind the fading overlay and refresh the scroll trigger before the page is revealed, so its pin spacer follows the restored content width. Added explicit mobile headline word spacing. The laser head starts inside the machine and is clipped to the guarded cutting window during initialization and motion.

## 2026-11-09 — Show the workshop intro on every reload

Changed the introduction to appear on every document load and browser refresh, including URLs that open a specific section. Removed the session-storage and section-link exclusions. The introduction still waits for the homepage scene or its fallback, with the existing bounded duration, Skip, Escape and replay controls. Reduced-motion settings show the static illustration while the page prepares. Normal navigation between sections does not restart the intro.

## 2026-11-09 — Compact loading popup and six animation options

Replaced the full-screen workshop introduction with a 360 × 290 px loading card over the visible website. Removed the marketing headlines and the “From a spark to something exceptional” slogan. The card shows the brand, animation and loading indicator, with automatic dismissal, Skip and Escape. It appears on every document load as before, waits for the scene or fallback (1.8-second minimum / 4.5-second ceiling), and restores page access, scrolling and the pinned scene after dismissal. Reduced motion uses a static illustration and a shorter minimum.

Added six lightweight SVG/CSS animations: laser workshop, steel folding, welding sparks, shelf assembly, rotating cabinet and logo trace. The footer opens a comparison popup; `?loading-options=1` opens it directly. Each card previews the actual compact popup. Selection is validated and stored locally for this browser; unavailable storage does not block loading. The comparison has keyboard focus handling, a responsive two-column mobile layout, and unique SVG IDs when multiple illustrations are displayed.

Validation: 11 existing tests and production build pass. Desktop browser review confirmed all six previews render and dismiss, selection appears on reload, the slogan is absent, Escape restores page access and scroll locking, and there are no application console errors. Browser-extension metadata warnings and the pre-existing WebGL fallback are environment limitations; the original 3D scene is unchanged.

Published 390 × 844 mobile review confirmed all six options fit inside the comparison card and the actual loading popup remains compact. Corrected the footer navigation to wrap after the added replay/options controls, preventing page-width overflow on narrow screens. The existing Three.js soft-shadow deprecation warning is unchanged.

## 2026-11-09 — Selected logo loader without a close button

Made Logo trace the default loading animation and removed the visible close/skip button from the loading card. Updated the preference version so prior comparison choices do not override the newly selected logo default. Automatic dismissal, the maximum loading timeout, reduced-motion support and Escape remain available. The comparison dialog retains its own navigation controls.

## 2026-11-09 — Integrated page loading and forged-steel brand reveal

Replaced the modal loader with a decorative reveal inside the hero and a two-pixel page loading line. The original company mark assembles from five steel bands, with a brushed-metal gradient and a light sweep. The header, main content, navigation and quote actions are interactive from the first render. There is no backdrop, close button, body scroll lock, focus trap or inert page. The short decorative sequence does not delay access to content.

The loading line tracks three settled resources: document fonts, the hero fallback image (including decode or error), and the manufacturing scene's first frame or fallback. It fades when those settle. An eight-second safeguard removes lingering enhancement indicators without representing failed resources as completed. Below-the-fold equipment continues loading independently. Reduced-motion visitors see a static mark. The footer's Replay opening control returns to the hero and replays the decorative effect; the obsolete animation selector is no longer in the visitor flow.

Validation: all 11 existing tests pass; production build passes with the pre-existing Three.js chunk-size warning. Desktop browser checks verified the integrated reveal, automatic retirement of the loading line, no dialog/inert state or scroll locking, working product navigation during the animation, and no new application console errors after correcting a sibling React key collision. Existing WebGL fallback behavior remains supported.

## 2026-11-09 — Centred logo over a blurred website

Moved the animated steel logo out of the hero and into the centre of the viewport. The actual website stays visible underneath a transparent layer with a 10 px background blur. The logo has no enclosing card, panel, border or close button. A small line below the logo reflects the existing page-readiness checkpoints. The blur and logo fade out automatically after the page is ready and the short logo assembly completes; a maximum timeout and reduced-motion support remain in place.

Restored temporary background inertness, keyboard focus handling and scroll locking while the loading layer is shown. Page access and scrolling are restored on exit, and the manufacturing scene is refreshed after the scrollbar returns. Footer replay uses the same centred loading layer. Removed the decorative logo from the manufacturing scene and removed the top-edge loading strip.

## 2026-11-09 — Single graphite theme and homepage layout refinement

Reviewed the earlier source version fee9b61 and the current light/dark presentation. Chose the existing graphite, stainless-steel and emerald design system for a consistent page and header. The document now declares dark styling before first paint; removed the theme switch, legacy light-mode rules and saved-theme bootstrap so a previously saved light preference cannot introduce a mismatched header or unreadable controls.

Kept the original headline, navigation, two primary actions, five-stage manufacturing story and 3D assets. Set the headline in three readable lines, restored clear word spacing, removed the separate clipped-line text animation, aligned the header into brand/navigation/quote columns, and added height-aware desktop sizing. Mobile uses balanced action widths and five visible stage labels in a compact two-row rail. Added a width observer and scheduled resize refresh for the pinned scene, which previously retained stale desktop dimensions after viewport changes.

The approved loading implementation is unchanged: PageLoading, BrandReveal, its stylesheet, page readiness and focus/scroll handling retain their pre-change SHA-256 hashes. Local desktop checks verified the dark palette, readable form fields/options, quote navigation, the centred blur loader and automatic return to the page, with no application console errors. All 11 existing tests and the production build pass; the existing shared Three.js chunk-size warning remains.

Visual comparison: preserved the original visible copy and section order; retained the original graphite/emerald palette; removed the light header and redundant theme control; reduced four heading lines to three; retained the exact manufacturing assets and steel treatment; improved button/rail separation and mobile stage visibility. These are deliberate refinements of the existing design system, with no new imagery or sections.

Published responsive review verified 768 × 1024, 390 × 844, 1366 × 768 and 1280 × 650 without page-width overflow or stale pin dimensions. Buttons clear the stage rail at each size; all five mobile labels fit. Mobile navigation opens and closes on selection, product and quote links navigate correctly, and dark form text remains readable. The fixed dark theme overrides a previously saved light preference. Made the essential hero text and actions immediately visible after the approved loader, avoiding a second opacity-based text entrance while retaining the manufacturing, navigation and control motion.


## 2026-11-09 — Launch optimisation within the approved scope

Kept the graphite theme and approved centred blur loader; its five implementation/readiness files retain their previous SHA-256 hashes. Converted the five font weights to WOFF2 Latin/extended-Latin subsets (481,852 → 81,072 bytes) and six existing fallback photos to WebP (1,509,943 → 373,902 bytes). Hero fallback remains eager and is preloaded; process/equipment/gallery images wait until within 400 px. Equipment-list UI code loads only when opened.

Added a shared rendering budget: mobile, coarse-pointer, data-saving and lower-resource devices use 30 fps, 1.25 pixel ratio, 512 px shadows, fewer hero sparks and no MSAA. Desktop uses up to 60 fps, 1.5 pixel ratio and 1024 px shadows. Existing offscreen/hidden-tab suspension, reduced-motion handling, 3D models, camera controls and configuration behavior are retained. Replaced the removed PCFSoftShadowMap setting with PCFShadowMap. These are deterministic budgets and asset savings, not real-device performance scores.

Centralised verified public phone/email and added a lightweight company map-search link for Sharjah without a street-address commitment. Added generated title/description, canonical, social metadata, LocalBusiness data, robots.txt, sitemap.xml and a useful no-JavaScript fallback. Private preview remains private and noindex; SITE_URL and SITE_INDEXABLE configure an approved future public build. Quotation delivery, uploads, new project content, machine specifications and PDF generation remain pending MD approval. See docs/LAUNCH_READINESS.md.

Validation: all 17 tests and production build pass; diff check and static asset references pass. Local browser review verified automatic loader exit, deferred offscreen requests, equipment-list lazy loading and list-to-enquiry handoff, readable contact layout and consistent metadata. Fixed an existing non-HTTPS-preview failure by falling back to unique local row IDs when crypto.randomUUID is unavailable. The local managed browser uses the existing WebGL fallback; live native 3D checks supplement this before handoff. Only extension metadata errors remained in the final local console review. The existing shared Three.js build-size warning remains.


## 2026-11-10 — Slower mobile manufacturing journey

Extended the phone/touch-only scroll sequence from 2.7 viewport heights to 6.5 stable pin heights, with at least 4,800 px of travel. Increased mobile scrub smoothing from 0.6 to 1.2 seconds, giving the five manufacturing stages more time to read and observe. Desktop retains its 3.6 viewport-height distance and 0.6-second scrub. Native scrolling, stage geometry, reduced-motion behavior, direct product/enquiry navigation and the approved logo loading files are unchanged.

Used GSAP matchMedia so pacing is rebuilt and cleaned up when the screen crosses between phone and desktop layouts. Mobile distance follows the existing 100svh pin rather than the changing browser-toolbar viewport height. The touch-only query also covers phones in landscape. All 17 existing tests, the production build and diff check pass. Local browser review confirmed one active pin and the original desktop distance; published phone-size scrolling is checked before handoff.
