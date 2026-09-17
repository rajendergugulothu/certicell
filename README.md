# CertiCell

Responsive second-life battery assessment workspace based on the supplied CertiCell project documentation.

## Implemented

- Account-isolated battery, customer, and batch records backed by Cloudflare D1.
- Single-pack and atomic CSV batch intake (up to 50 packs / 200 KB per request).
- Laboratory measurement capture, capacity-retention calculation, provisional grades, safety holds, and review acknowledgement.
- Immutable issued snapshots with SHA-256 integrity checks, QR verification, printable PDF layouts, and irreversible revocation.
- Search, status filters, customer portfolios, CSV export, sample workspace, and mobile sidebar.
- Server-side authorization, prepared SQL, cross-site mutation rejection, input validation, unique serials per account, and audit events.

The site is deployed privately. Verification is unauthenticated at the application route but remains subject to the site's access policy. External verification needs an explicitly approved public audience. Each signed-in account owns a separate workspace; this version does not provide organization membership or multi-reviewer roles.

## Scientific and operational boundary

This is a functional pilot platform, not accredited battery certification. Provisional grades A >=80%, B >=70%, C <70% and holds (reported safety flag / imbalance >100 mV) are explicitly illustrative. Capacity ratio is not a remaining-life estimate. No UL, EN, EPR, or Battery Passport compliance is claimed. Commercial issuance requires chemistry-specific protocol validation, controlled lab testing, qualified independent reviewers, standards review, and accreditation where appropriate.

CSV intake uses the documented schema; direct CAN/Modbus ingestion and arbitrary manufacturer BMS parsers require hardware-specific integrations. Data collection currently captures measurements and lab references; original PDF lab reports are stored in private R2 objects with D1 metadata and SHA-256 fingerprints. The roadmap's marketplace, compliance reporting, billing, and insurer APIs are future phases.

## Development

Use the pinned pnpm version and existing lockfile. Run `pnpm dev` in a supported development environment, `pnpm build` for Worker and client output, and `pnpm db:generate` after schema changes. Production hosting manages D1 through `.openai/hosting.json` and applies the generated Drizzle migrations. No application API keys are required. R2 uses the logical BUCKET binding managed by Sites.

Dispatch-provided ChatGPT identity headers authenticate API requests. Never trust arbitrary identity headers outside that controlled deployment boundary. A self-hosted deployment must supply a trusted authentication proxy before exposing authenticated routes.

## Verification

- `node --experimental-strip-types tests/grading.test.mjs`
- `node --experimental-strip-types tests/workflow.test.mjs`
- `pnpm exec tsc --noEmit`
- `pnpm build`

Workflow tests invoke the actual route implementations against an in-memory SQLite adapter with a mocked trusted identity. They cover ownership isolation, authentication, atomic intake rollback, holds, issuing, immutability, verification privacy, revocation, and integrity failure. They do not substitute for deployed integration/load testing. The landing page and demo battery search were checked in the managed browser preview. Real-device mobile and WebMCP runtime testing remain outstanding. WebMCP search is feature-detected and optional.

Before a public commercial launch, complete browser/device acceptance testing, real D1 operational tests, backup/restore and monitoring arrangements, threat review, and the scientific validation above. Workspace listing currently returns the newest 2,000 records per account.

## Evidence collection update (v0.2)

New test saves require actual charge/discharge rates, pack voltage limits, rest time, rig ID, calibration date, 2–20 repeated capacities, and a report belonging to the same battery/account. Repeated capacity mean must match the measured capacity within 0.1 Ah. These are explicit pilot completeness checks, not scientifically validated acceptance criteria. Grade thresholds have not changed.

New issuance requires complete saved evidence and 10–1500-character review notes. The certificate snapshot freezes the selected report fingerprint, reviewer identity, test conditions, and repeat summary. Public verification exposes a limited numerical test summary; original reports, reviewer identity/notes, and equipment details are only returned to the record owner. Existing issued snapshots are preserved as legacy records.

PDF upload accepts a PDF content type and magic header, streams with a 10 MB cap, stores files under unique object keys, and exposes downloads only to the owner as attachments. This checks format, not full PDF validity or malware. Uploaded reports are immutable; issue-time evidence remains stable. Storage failures retain form input and present retry guidance.

Research references: Manthiram (2017), DOI 10.1021/acscentsci.7b00288; Dai & Cai (2022), DOI 10.1038/s43246-022-00286-8. These inform chemistry/reproducibility context, not the provisional numeric grade bands. The ScienceDirect paper remains unreviewed pending access to its full text.

## Sign-in, sign-up, and demo access

`/signin` uses dispatch-owned ChatGPT authentication. `/signup` first verifies that identity and then persists a CertiCell profile (name, optional company). `/account` edits the signed-in user's profile; the email is always read from trusted identity headers. Profiles do not grant organization membership or broader site access. The root route presents the landing page; `/dashboard` requires a trusted ChatGPT identity and opens the battery workspace. Existing signed-in users retain access to their battery records before completing profile setup.

`/api/account` supports authenticated GET, POST (idempotent creation), and PATCH (self-only edit). Request bodies cannot set email, owner ID, or roles. Site-level private access is unchanged; anonymous external visitors may encounter the platform's sign-in/access gate before these pages.

Three read-only demos are available at `/demo?account=fleet-manager`, `/demo?account=lab-reviewer`, and `/demo?account=certificate-auditor`. These are sample persona entry screens, not separate authentication identities or password accounts. All use the same illustrative dataset. Demo pages do not fetch the live workspace, disable intake, and direct users to sign-in for real records. Existing API authorization remains in force.

Run `node --experimental-strip-types tests/account.test.mjs` for account creation/editing, isolation, validation, trusted identity, repeat-registration behavior, and safe authentication redirects. The hosted ChatGPT login flow has not been exercised in a real browser during this update.

## Landing page and UI update

The landing page introduces the platform, evidence workflow, limitations, and three demo personas. Sign-in and profile completion lead to `/dashboard`. Responsive mobile navigation uses the shared Sheet primitive. The hero battery image is AI-generated conceptual artwork and is labeled as illustrative. Short-height sidebar layouts omit the decorative card to preserve navigation space.
