# Fastrack Metallic website

React/Vinext website with the approved graphite theme, manufacturing journey, process demonstrations and equipment showroom. Requires Node.js 22.13 or newer.

## Development

```sh
npm ci
npm test
npm run db:generate
npm run build
npm run dev
```

The maintained Sites workflow owns installation, previews, source packaging and deployment in Work Mode. The frontend and server are now deployed together; the original Vite HTML entry is no longer used.

## Enquiries and drawings

`POST /api/enquiries` validates and saves an enquiry in D1 and returns an enquiry reference. Up to two PDF, DXF, DWG, PNG or JPEG attachments (6 MB each) are stored privately in R2. Successful retries reuse the original receipt. The form preserves entered details when saving fails. Requests have origin, honeypot, body-size and submission-limit checks.

Configure the secret `ENQUIRY_REVIEWERS` in Sites with a comma-separated list of approved team reviewer emails. Reviewers must also have a platform-authenticated identity. The team inbox is `/admin/enquiries`; API listing, status updates and attachment downloads enforce the same server-side allowlist. Do not add authentication bypasses or expose R2 objects publicly.

Email notifications are not configured. The team must check the inbox and respond through its company contact channels. The optional email-draft route remains available to customers; nothing is automatically sent through a personal email account.

## Database

Logical bindings in `.openai/hosting.json` are `DB` and `BUCKET`. Schema and generated SQL live under `db/` and `drizzle/`. Sites applies hosted migrations during publication. For local preview, build first and apply each pending migration once with the documented Wrangler local D1 command and `.wrangler/state`. Do not replay applied migrations or create tables during requests.

## Content and public launch

Product models and dimensional preview ranges are illustrative requests, not approved manufacturing limits. Current business copy uses existing company/service information without inventing projects, capacities, certifications or response times. Verified case studies, workshop photographs, exact machine capacities, location updates and business hours still require company-provided material.

The preview remains private and noindex. Set `SITE_URL` to the approved serving origin and `SITE_INDEXABLE=true` only as part of an approved public launch. The homepage, four service routes and eleven equipment routes have server-rendered content, canonical metadata and sitemap entries. Physical-phone/connection testing and Search Console submission remain launch tasks.

No keys, local databases, uploaded customer drawings, browser screenshots or private chat archives belong in the Git repository.

The public backup declares logical storage bindings without a Site project ID. Continue deployment through the existing connected Sites project; the canonical Sites source retains its hosting identity.
