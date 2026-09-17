# CertiCell

A second-life battery assessment workspace. CertiCell records battery packs and
their laboratory measurements, derives a provisional health grade, and issues
tamper-evident certificates that anyone can verify from a QR code or serial
lookup.

> **This is a functional pilot, not accredited battery certification.** See
> [Scope and limitations](#scope-and-limitations) before relying on any grade it
> produces.

## What it does

- **Intake** — register packs individually or via atomic CSV batch (up to 50
  packs / 200 KB per request), with serials unique per account.
- **Testing** — capture lab measurements (capacity, temperature, resistance,
  cell imbalance, cycles, rig and calibration references) and 2–20 repeated
  capacity runs.
- **Grading** — compute capacity retention and assign a provisional grade.
- **Review and issuance** — require complete evidence plus reviewer notes
  (10–1500 characters) before a certificate can be issued.
- **Certificates** — issuance freezes an immutable snapshot with a SHA-256
  digest, the selected lab report fingerprint, reviewer identity, test
  conditions, and repeat summary. Snapshots are printable and can be revoked,
  irreversibly.
- **Public verification** — `/verify` resolves a certificate without
  authentication and returns a limited numerical summary. Original reports,
  reviewer identity and notes, and equipment details stay private to the record
  owner.
- **Workspace** — search, status filters, customer portfolios, CSV export,
  audit events, and a read-only demo mode.

### Grade bands

| Grade | Condition |
| --- | --- |
| A | Capacity retention ≥ 80% |
| B | Capacity retention ≥ 70% |
| C | Capacity retention < 70% |
| Hold | Safety flag reported, or cell imbalance > 100 mV |

These bands are illustrative. Capacity ratio is not a remaining-life estimate.

## Tech stack

- [Next.js](https://nextjs.org) 16 (App Router) on [vinext](https://www.npmjs.com/package/vinext) + Vite 8
- React 19, Tailwind CSS 4, shadcn-style UI components
- Cloudflare Workers runtime, D1 (SQLite) for data, R2 for lab report PDFs
- [Drizzle ORM](https://orm.drizzle.team) + drizzle-kit for schema and migrations
- Zod for request validation

## Getting started

Requires Node.js ≥ 22.13 and pnpm 11.25 (pinned via `packageManager`).

```bash
pnpm install --frozen-lockfile
pnpm dev
```

| Command | Purpose |
| --- | --- |
| `pnpm dev` | Local development server |
| `pnpm build` | Build Worker and client output into `dist/` |
| `pnpm start` | Serve the built Worker locally via Wrangler |
| `pnpm lint` | ESLint |
| `pnpm db:generate` | Generate a Drizzle migration after editing `db/schema.ts` |

No application API keys are required. D1 and R2 are reached through the logical
`DB` and `BUCKET` bindings declared in `.openai/hosting.json`, which
`vite.config.ts` reads at build time.

## Project layout

```
app/              Routes, pages, and API handlers
  api/            account, reports, verify, workspace endpoints
  certificate/    Certificate view and print layout
  verify/         Public verification
build/            Vite plugin for the hosting platform
components/ui/    Shared UI primitives
db/               Drizzle client and schema
drizzle/          Generated SQL migrations and snapshots
lib/              Grading, storage, demo data, helpers
scripts/          Install, environment, and build tooling
tests/            Node test suites
```

## Routes

| Route | Access |
| --- | --- |
| `/` | Public landing page |
| `/signin`, `/signup` | ChatGPT-backed authentication and profile setup |
| `/dashboard` | Battery workspace; requires a trusted identity |
| `/account` | Edit your own profile |
| `/demo?account=…` | Read-only sample personas: `fleet-manager`, `lab-reviewer`, `certificate-auditor` |
| `/certificate/:id` | Issued certificate view and print layout |
| `/verify` | Unauthenticated certificate verification |

`/api/account` supports GET, POST (idempotent creation) and PATCH (self-only).
Request bodies cannot set email, owner ID, or roles — email is always read from
trusted identity headers.

## Authentication model

Requests are authenticated by ChatGPT identity headers supplied by the hosting
dispatcher. **Never trust arbitrary identity headers outside that deployment
boundary.** A self-hosted deployment must put a trusted authentication proxy in
front of the authenticated routes first.

Each signed-in account owns a separate workspace. There is no organization
membership or multi-reviewer role model in this version.

## Testing

```bash
node --experimental-strip-types tests/grading.test.mjs
node --experimental-strip-types tests/workflow.test.mjs
node --experimental-strip-types tests/account.test.mjs
pnpm exec tsc --noEmit
pnpm build
```

The workflow and account suites run the real route handlers against an
in-memory SQLite adapter with a mocked trusted identity, covering ownership
isolation, authentication, atomic intake rollback, holds, issuing,
immutability, verification privacy, revocation, and integrity failure. They do
not substitute for deployed integration or load testing.

`pnpm lint` currently reports pre-existing errors (mostly
`@typescript-eslint/no-explicit-any` and Next.js link/navigation rules) and is
not yet part of the green baseline.

## Security and data handling

- Server-side authorization on every route, with prepared SQL and Zod input
  validation.
- Cross-site mutation requests are rejected; serials are unique per account.
- Lab report PDFs are checked for content type and magic header, streamed with
  a 10 MB cap, stored under unique R2 object keys, and downloadable only by the
  owner as attachments. This validates format, not full PDF correctness or
  malware.
- Uploaded reports are immutable, so issue-time evidence stays stable.
- Audit events are recorded per pack.
- Workspace listing returns the newest 2,000 records per account.

## Scope and limitations

CertiCell is a pilot platform. It does not perform accredited certification and
claims no UL, EN, EPR, or Battery Passport compliance. The grade bands and hold
conditions above are illustrative, and the evidence-completeness checks are
pilot checks rather than scientifically validated acceptance criteria.

Commercial issuance would require chemistry-specific protocol validation,
controlled lab testing, qualified independent reviewers, standards review, and
accreditation where appropriate.

CSV intake uses the documented schema. Direct CAN/Modbus ingestion and
manufacturer BMS parsers need hardware-specific integrations. The marketplace,
compliance reporting, billing, and insurer APIs on the roadmap are future
phases.

Research context: Manthiram (2017), [DOI 10.1021/acscentsci.7b00288](https://doi.org/10.1021/acscentsci.7b00288);
Dai & Cai (2022), [DOI 10.1038/s43246-022-00286-8](https://doi.org/10.1038/s43246-022-00286-8).
These inform chemistry and reproducibility context, not the provisional numeric
grade bands.

Before a public commercial launch: browser and device acceptance testing, real
D1 operational tests, backup/restore and monitoring, and threat review remain
outstanding, alongside the scientific validation above. Real-device mobile and
WebMCP runtime testing have not been done; WebMCP search is feature-detected and
optional. The hero battery image is AI-generated conceptual artwork and is
labeled as illustrative in the UI.
