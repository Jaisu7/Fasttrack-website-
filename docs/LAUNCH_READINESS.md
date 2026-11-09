# Launch optimisation

The existing private preview keeps its graphite theme, manufacturing story, equipment configurator and approved centred logo/blur loader. Quotation delivery, drawing uploads, completed-project content, new machine specifications and PDF exports remain outside this change pending MD approval.

## Loading and rendering

- Serve the same five Manrope weights as Latin/extended-Latin WOFF2 subsets: 81,072 bytes in total instead of 481,852 bytes (83.2% smaller). Punctuation, currency and arrow characters used in the interface are included.
- Convert six existing PNG/JPEG fallback photographs to WebP: 373,902 bytes instead of 1,509,943 bytes (75.2% smaller). Existing photo content and dimensions are retained.
- Preload the essential hero fallback; defer offscreen equipment/process images until within 400 px. The hero and loader's readiness resources remain eager.
- Load the equipment-list component when its disclosure opens. Product and process engine modules retain their existing viewport-triggered imports.
- Phones, coarse pointers, data-saving connections and devices reporting no more than 4 GB memory or 4 logical cores use a 1.25 pixel-ratio cap, 512 px shadows, fewer hero sparks, no MSAA and a 30 fps rendering ceiling. Desktop keeps a 1.5 pixel-ratio cap, 1024 px shadows and a 60 fps ceiling. Settings update on resize; scene geometry and customer controls are retained.
- Hidden/offscreen suspension and reduced-motion support remain in place. Replaced the removed Three.js PCFSoftShadowMap setting with the supported PCFShadowMap equivalent.

These are payload reductions and rendering budgets, not measured speed or real-device frame-rate claims. The shared Three.js runtime remains necessary for the original 3D experience.

## Search preparation

Vite generates the title, description, canonical URL, Open Graph/Twitter previews, LocalBusiness JSON-LD, robots.txt and sitemap.xml from one build configuration. The no-JavaScript fallback includes services and direct contact links. No unverified capacity, certification, review, price or opening-hour claims are added.

The current owner-only preview is deliberately not a public search launch. Its default origin is the exact Sites preview URL, and its metadata uses noindex. No sharing setting is changed.

When public launch and the final domain are approved, set these **build-time** variables and rebuild:

```text
SITE_URL=https://the-approved-domain.example/
SITE_INDEXABLE=true
```

SITE_URL must be the actual origin serving this build. This updates canonical, sharing URLs, schema and sitemap together; it does not connect a custom domain or grant public access. Public hosting/access, final company location and Search Console ownership/sitemap submission must be handled at the approved launch. Do not publish the preview as a duplicate of the existing company website.

## Contact information

The email and telephone were checked against the company's published contact page on 9 November 2026: https://fasttrackmi.com/contacts/ . Shared public values are in src/lib/site-info.mjs and are used by the displayed links, enquiry drafts and structured data. The map link searches the company in Sharjah without adding a possibly changing street address or a third-party map embed. No messages are sent by this update.
