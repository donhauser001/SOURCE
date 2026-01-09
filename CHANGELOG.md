# Changelog

All notable changes to SOURCE will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [0.6.3] - 2026-01-08

### Added
- `source analyze` CLI command for engineering color analysis
- `--file` parameter for local SourcePack file input
- `--stdin` parameter for pipe input
- `--summary` parameter for condensed output
- Human-readable formatted output with color statistics, risk identification, and paper recommendations

### Changed
- CLI version upgraded to 0.6.3

---

## [0.6.2] - 2026-01-08

### Added
- Analysis report detail page (`/analyze/[id]`)
- Report sections component with color overview, risk identification, paper recommendations
- Permission filtering for free/paid content tiers
- Report sharing (copy link)
- Report export (JSON + TXT summary)
- Analysis mode selection (Full Analysis / Quick Parse)

---

## [0.6.1] - 2026-01-08

### Added
- Four-dimensional scoring model (fidelity, risk, cost, suitability)
- Risk identification engine (7 risk types: large_area, gradient, overprint, fine_line, small_text, bleed, critical)
- Paper recommendation engine with Top 3 recommendations and avoid list
- Report service with 30-day auto-expiration
- Evidence chain tracing (Color → PaperProfile → Batch → AuditNote)
- Full analysis API (`/api/analyze`)
- Report detail API (`/api/analyze/[id]`)

---

## [0.6.0] - 2026-01-08

### Added
- SourcePack JSON Schema validation (`lib/validations/sourcepack.ts`)
- SourcePack parser service (`lib/analyze/parser.ts`)
- Color mapping logic with exact match (ColorID) and Lab ΔE matching
- Three mapping states: verified, partial_match, unmapped
- SourcePack uploader component with drag-and-drop support
- Parse result view component
- Quick parse API (`/api/analyze/parse`)

---

## [0.5.2] - 2026-01-08

### Added
- User management page (`/admin/users`) with search, filter, role editing
- API key management page (`/admin/api-keys`)
- `user.adminList`, `user.adminUpdate`, `user.adminStats` tRPC procedures

---

## [0.5.1] - 2026-01-08

### Added
- Enhanced color list management with search and multi-select
- Batch delete functionality (`color.adminBatchDelete`)
- CSV/JSON export functionality
- Audit notes management page (`/admin/audit-notes`)
- `auditNote` tRPC router with full CRUD

---

## [0.5.0] - 2026-01-08

### Added
- Admin dashboard with statistics overview
- Admin sidebar navigation component
- Admin route guard with role verification (ADMIN/OPERATOR)

---

## [0.4.2] - 2026-01-08

### Added
- CLI permission validation with 403 Forbidden friendly messages
- `source audit` command (list/stats/my)
- CLI version upgraded to 0.4.2

---

## [0.4.1] - 2026-01-08

### Added
- Plugin authorization API (`/api/plugin/verify`)
- Plugin colors API (`/api/plugin/colors`)
- Rate limiting implementation with `X-RateLimit-*` headers
- Permission levels (PLUGIN_FREE/PLUGIN_PAID)

---

## [0.4.0] - 2026-01-08

### Added
- Activation code system (ActivationCode model)
- Activation code CRUD API (`activationCode.*` tRPC)
- User activation page (`/activate`)
- Admin activation code management (`/admin/activation-codes`)
- Batch generation page (`/admin/activation-codes/generate`)

---

## [0.3.2] - 2026-01-08

### Added
- `source cost estimate` command for cost estimation
- `source cost paper-types` command
- `source cost sizes` command
- Built-in cost model (base printing + plate + size coefficients)

---

## [0.3.1] - 2026-01-08

### Added
- BuyIntent model and API (`/api/buy-intent`)
- Purchase intent recording on click
- Admin buy intents statistics page (`/admin/buy-intents`)
- Hot SKU ranking
- Daily trend statistics

---

## [0.3.0] - 2026-01-08

### Added
- ProofingPack model (SKU definition)
- ProofingPack CRUD API (`proofingPack.*` tRPC)
- Proofing pack card component for color pages
- Admin proofing packs management (`/admin/proofing-packs`)

---

## [0.2.4] - 2026-01-07

### Added
- Color creation form (`/admin/colors/new`)
- Color edit form (`/admin/colors/[id]/edit`)
- Partner management (`/admin/partners`)
- Data import entry page (`/admin/import`)
- Color CSV/JSON import (`/admin/import/colors`)
- Paper profile CSV/JSON import (`/admin/import/paper-profiles`)
- Import components: csv-uploader, json-uploader, import-preview, validation-errors

---

## [0.2.3] - 2026-01-07

### Added
- `source color get <colorId>` command
- `source color list` command
- `source color paper <colorId>` command
- `source color recommend <colorId>` command
- `source search <query>` command
- `source config set-key/show` command
- `source cite <colorId>` command (formats: json/apa/bibtex)
- CLI audit headers (X-CLI-Version, X-CLI-Command)

---

## [0.2.2] - 2026-01-07

### Added
- Color search API with `q` parameter
- Color list page (`/colors`)
- Enhanced filters (status, audit status, paper type, participant)
- Search result highlighting for colorId and name

---

## [0.2.1] - 2026-01-07

### Added
- Color identity card page (`/color/[id]`)
- Basic profile section (ID, name, Lab true source)
- Paper performance section with multi-paper comparison
- Material radar chart (gloss, ink absorption, gamut)
- Production technical section (ink recipe, tolerance)
- SEO optimization (meta tags, structured data)
- Partners list page (`/partners`)
- Partner detail page (`/partners/[id]`)
- Documentation hub (`/docs`)

---

## [0.2.0] - 2026-01-07

### Added
- Color CRUD API (`color.*` tRPC)
- PaperProfile CRUD API
- Batch management API
- Zod validation schemas

---

## [0.1.4] - 2026-01-07

### Added
- SOURCE CLI package (`packages/cli`)
- Commander.js command framework
- `--json` flag for structured output
- API Key authentication flow
- Unified error handling

---

## [0.1.3] - 2026-01-07

### Added
- ApiKey model for key management
- ApiKey middleware for authentication
- Scope enumeration for permissions
- Unified error code format
- CliAuditLog model for audit logging

---

## [0.1.2] - 2026-01-07

### Added
- tRPC integration with type safety
- NextAuth.js with email magic links
- Session management
- User model with profile

---

## [0.1.1] - 2026-01-07

### Added
- PostgreSQL database configuration
- Prisma ORM integration
- Core data models (Color, PaperProfile, Batch, etc.)
- Seed data scripts

---

## [0.1.0] - 2026-01-07

### Added
- Next.js 15 project initialization (App Router + TypeScript)
- Monorepo structure with pnpm workspace
- shadcn/ui component library integration
- Tailwind CSS configuration
- ESLint + Prettier setup
- Basic layout (Header, Footer)

---

*Maintained by SOURCE Team*
