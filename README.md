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

- [Next.js](https://nextjs.org) 16 (App Router), React 19, Tailwind CSS 4,
  shadcn-style UI components
- [Turso](https://turso.tech) / libSQL for data (SQLite-compatible)
- [Vercel Blob](https://vercel.com/docs/vercel-blob) for lab report PDFs
- [Auth.js v5](https://authjs.dev) for authentication
- [Drizzle ORM](https://orm.drizzle.team) + drizzle-kit for schema and migrations
- Zod for request validation

Deployment target is [Vercel](https://vercel.com).

## Getting started

Requires Node.js ≥ 22.13 and pnpm 11.25 (pinned via `packageManager`).

```bash
pnpm install --frozen-lockfile
cp .env.example .env.local     # then fill it in — see Configuration below
pnpm db:migrate                # apply migrations to your database
pnpm dev
```

| Command | Purpose |
| --- | --- |
| `pnpm dev` | Local development server |
| `pnpm build` | Production build |
| `pnpm start` | Serve the production build locally |
| `pnpm test` | Run all three test suites |
| `pnpm lint` | ESLint |
| `pnpm db:generate` | Generate a Drizzle migration after editing `db/schema.ts` |
| `pnpm db:migrate` | Apply pending migrations to the configured database |

### Configuration

Every value lives in `.env.example`. Nothing has a usable default — the app
fails loudly rather than silently running against the wrong store.

| Variable | Purpose |
| --- | --- |
| `TURSO_DATABASE_URL` | libSQL database URL. A local `file:./local.db` works for development. |
| `TURSO_AUTH_TOKEN` | Turso token. Not needed for a local `file:` URL. |
| `BLOB_READ_WRITE_TOKEN` | Vercel Blob token; set automatically when you connect a Blob store. |
| `BLOB_PUBLIC_BASE_URL` | The Blob store's public base URL. |
| `AUTH_SECRET` | Session signing key — `openssl rand -base64 32`. |
| `AUTH_URL` | Deployed origin, e.g. `https://certicell.vercel.app`. |
| `AUTH_GITHUB_ID` / `AUTH_GITHUB_SECRET` | GitHub OAuth app, if used. |
| `AUTH_GOOGLE_ID` / `AUTH_GOOGLE_SECRET` | Google OAuth client, if used. |
| `AUTH_TRUST_HOST` | Set `true` for local development only. Vercel trusts its own host automatically. |

At least one OAuth provider must be configured or nobody can sign in.

## Deploying to Vercel

1. Import the repository in Vercel. The Next.js preset needs no overrides.
2. Create a Turso database and run `pnpm db:migrate` against it once.
3. Add a Blob store to the project (Storage → Blob), which sets
   `BLOB_READ_WRITE_TOKEN` for you. Copy its public base URL into
   `BLOB_PUBLIC_BASE_URL`.
4. Set every remaining variable from the table above in Project Settings →
   Environment Variables.
5. Register your OAuth callback URLs with each provider:
   `https://<your-domain>/api/auth/callback/github` (and `/google`).

Migrations are not applied automatically on deploy — run `pnpm db:migrate`
yourself after generating a new one, so a schema change is never an implicit
side effect of a push.

## Project layout

```
app/              Routes, pages, and API handlers
  api/            account, reports, verify, workspace endpoints
  certificate/    Certificate view and print layout
  verify/         Public verification
  api/auth/       Auth.js handler
auth.ts           Auth.js configuration
components/ui/    Shared UI primitives
db/schema.ts      Drizzle schema (drives migration generation)
drizzle/          Generated SQL migrations and snapshots
lib/              Grading, database adapter, blob storage, demo data
scripts/migrate.mjs  Migration runner
tests/            Node test suites
```

## Routes

| Route | Access |
| --- | --- |
| `/` | Public landing page |
| `/signin`, `/signup` | Sign-in and profile setup |
| `/dashboard` | Battery workspace; requires a trusted identity |
| `/account` | Edit your own profile |
| `/demo?account=…` | Read-only sample personas: `fleet-manager`, `lab-reviewer`, `certificate-auditor` |
| `/certificate/:id` | Issued certificate view and print layout |
| `/verify` | Unauthenticated certificate verification |
| `/api/auth/*` | Auth.js sign-in, sign-out, callback and session endpoints |

`/api/account` supports GET, POST (idempotent creation) and PATCH (self-only).
Request bodies cannot set email, owner ID, or roles — email is always read from
trusted identity headers.

## Authentication model

Authentication is handled by Auth.js v5 with JWT sessions, so no session state
is written to the battery database. Every record is keyed by an `owner` string
of the form `<provider>:<providerAccountId>` — namespaced by provider so two
providers issuing the same opaque id can never collide into one workspace.

Route handlers call `getUser()` / `requireUser()` from `app/auth-user.ts`; that
module is the single seam through which identity enters the application.

Each signed-in account owns a separate workspace. There is no organization
membership or multi-reviewer role model in this version.

## Testing

```bash
pnpm test                 # all three suites
pnpm exec tsc --noEmit
pnpm build
```

The workflow and account suites run the real route handlers against an
in-memory SQLite adapter with a mocked trusted identity, covering ownership
isolation, authentication, atomic intake rollback, holds, issuing,
immutability, verification privacy, revocation, and integrity failure. They do
not substitute for deployed integration or load testing.

`pnpm lint` currently reports pre-existing errors (mostly
`@typescript-eslint/no-explicit-any` and Next.js link/navigation rules) in the
application and UI files, and is not yet part of the green baseline.

## Security and data handling

- Server-side authorization on every route, with prepared SQL and Zod input
  validation.
- Cross-site mutation requests are rejected; serials are unique per account.
- Lab report PDFs are checked for content type and magic header, streamed with
  a 10 MB cap, stored under unique object keys, and downloadable only by the
  owner as attachments. This validates format, not full PDF correctness or
  malware.
- Blob URLs are unguessable but publicly reachable if leaked, so report bytes
  are never handed to the browser directly — `/api/reports` authorizes the
  owner and then streams the object through itself.
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
