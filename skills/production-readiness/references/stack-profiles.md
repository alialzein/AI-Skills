# Stack profiles — scope the audit to what's relevant

Not every project needs every area. Flagging RLS on a single-user CLI is noise and erodes
trust in the review. Use these profiles to decide what's **in scope**, then state the scope
explicitly in your report. When a project blends types (e.g. a SaaS with an AI feature),
union the relevant profiles.

Legend: ✅ core · ➕ if present · — usually N/A

| Area (detailed-checklist §) | CLI / script | Library / SDK | Web app / SaaS | API / backend service | AI-heavy app | Mobile / desktop |
|---|---|---|---|---|---|---|
| 1 Day-1 setup (VCS, CI, lint, secrets) | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| 2 Testing the seams | ✅ (I/O, args) | ✅ (public API, semver) | ✅ | ✅ | ✅ (+ evals §7) | ✅ |
| 3 CI/CD + drift guard | ✅ | ✅ (+ publish/release) | ✅ | ✅ | ✅ | ✅ (+ build signing) |
| 4 Security & secrets | ➕ | ➕ (no embedded secrets) | ✅ | ✅ | ✅ | ✅ (keychain, no secrets in bundle) |
| 5 External integrations & resilience | ➕ | ➕ | ✅ | ✅ | ✅ | ✅ |
| 6 Data integrity & concurrency | ➕ | — | ✅ | ✅ | ✅ | ➕ (local DB) |
| 7 AI / LLM | ➕ | ➕ | ➕ | ➕ | ✅ | ➕ |
| 8 Cost & budget | ➕ | — | ➕ | ➕ | ✅ | ➕ |
| 9 Frontend & UX | — | — | ✅ | — | ➕ (if UI) | ✅ |
| 10 Observability & ops | ➕ | ➕ (debug logging) | ✅ | ✅ | ✅ | ✅ (crash reporting) |
| 11 Admin / operator control | — | — | ✅ | ➕ | ✅ | ➕ |
| 12 Docs & handoff | ✅ (`--help`, README) | ✅ (API docs, changelog) | ✅ | ✅ | ✅ | ✅ (store listing) |
| 13 Migrations & schema | — | — | ➕ (if DB) | ➕ (if DB) | ➕ | ➕ (if local DB) |
| 14 Data lifecycle, privacy, backups | ➕ | — | ✅ | ✅ | ✅ | ✅ (user data export/delete) |

## Notes per type

- **CLI / script:** the seams are argument parsing, file/stdin I/O, exit codes, and external
  process/API calls. Test the failure paths (missing file, bad flag, non-zero exit). Secrets
  matter if it touches APIs. Skip UI, RLS, admin panels.
- **Library / SDK:** the "seam" is your *public API* — test it the way consumers call it,
  honor semver, never embed secrets, and ship a changelog + release CI. No UI/DB/admin.
- **Web app / SaaS:** the full checklist applies. The classic gaps are integration tests on
  the sync/webhook/auth seams, data-scoping tests, theming, and observability.
- **API / backend service:** like SaaS minus the frontend. Emphasize §4–6, §10, rate limiting
  your own endpoints, and contract/integration tests over UI.
- **AI-heavy app:** §7 and §8 become first-class blockers, not nice-to-haves — uncapped spend
  and missing anti-invention/confirm gates are the top risks. Add an eval set to CI.
- **Mobile / desktop:** no server-side RLS, but watch secrets in the bundle, crash reporting,
  offline/local-DB integrity, app-store data-handling disclosures, and update/signing in CI.

If unsure which profile fits, ask the user one question ("is this a CLI, a web app, a
library, or a backend service?") rather than guessing and over/under-scoping.
