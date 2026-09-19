# Agents.md - Architecture, Constraints, and Operational Standards

## 1. Project Overview & Scope

`brwyatt.me` is the public-facing personal portfolio and identity platform for Bryan Wyatt.

- **Primary Public Site:** `https://brwyatt.me/` (and `www.brwyatt.me`)
- **Infrastructure & Network Domain:** `brwyatt.net` (reserved for internal homelab routing, mail services, and future central identity services)
- **Legacy Domain Redirects:** `brwyatt.net` and `brwyatt.com` (along with their `www` counterparts) permanently redirect (301) to `https://brwyatt.me/`
- **Upcoming Extensions:** Subdomains under `*.brwyatt.me` (e.g., `cardgame.brwyatt.me`) deployed as independent decoupled stacks.

---

## 2. Core Architectural Directives

### 2.1 Build-Time Purity (Offline Hermetic Builds)

- **No External API Dependencies at Build Time:** Builds MUST NEVER make network requests to third-party services (such as GitHub, Twitter/X, or external feeds).
- CI/CD environments must build hermetically and deterministically without requiring internet access to third-party content.
- Remote data (e.g. GitHub repositories) is retrieved client-side directly by the visitor's browser or populated via decoupled, asynchronous background cache refreshers.
- Offline fallbacks and mock data MUST be supplied so the web application builds and renders properly even in completely air-gapped environments.

### 2.2 Micro-Frontends & Domain Isolation

- The portfolio application is a standalone, lightweight, high-performance static SPA.
- Future apps and interactive tools MUST NOT be grafted into the portfolio codebase as subpaths (`brwyatt.me/app`).
- All future projects must use independent subdomains (`<app>.brwyatt.me`) with their own isolated CI/CD pipelines, CDK stacks, and compute resources.

### 2.3 Explicit Certificates (No Wildcards)

- Wildcard TLS certificates (`*.brwyatt.me`) are explicitly disallowed.
- Each domain and subdomain must provision an explicit ACM certificate validated automatically via Route 53 DNS records.

### 2.4 Central vs. Application Identity

- Applications hosted in AWS must remain resilient and operational even during homelab power or internet connectivity outages.
- AWS-hosted applications must not depend on homelab LDAP/FreeIPA for their primary runtime authentication.
- Shared authentication for AWS resources should leverage AWS Cognito User Pools placed under `brwyatt.net` (e.g. `auth.brwyatt.net`) or standalone app pools.

---

## 3. Monorepo Organization

```text
brwyatt.me/
├── packages/
│   ├── web/               # React 18 + Vite + TypeScript frontend
│   │   ├── src/           # UI components, pages, client services
│   │   └── dist/          # Hermetic static production build
│   └── infra/             # AWS CDK (TypeScript)
│       ├── bin/           # CDK application entry point
│       ├── lib/           # PortfolioStack and RedirectStack definitions
│       └── test/          # CDK unit and snapshot assertions
├── .github/workflows/     # CI/CD and deployment promotion pipelines
└── docs/                  # Setup guides, secrets runbooks, architecture docs
```

---

## 4. Security & Secrets Management

- **Zero Committed Secrets:** Absolutely no passwords, API keys, private keys, or AWS access tokens may be committed to this repository in plaintext.
- **Placeholder Conventions:** Any configuration templates requiring sensitive values must use uppercase placeholders (e.g., `AWS_ACCOUNT_ID_PLACEHOLDER`, `OIDC_ROLE_ARN_PLACEHOLDER`).
- **Deployment Identity:** AWS deployments from GitHub Actions must exclusively use **AWS IAM OpenID Connect (OIDC) Federation** using short-lived credentials via `aws-actions/configure-aws-credentials`. Long-lived IAM user access keys are strictly forbidden.
- **Documentation:** Any newly introduced secret or credential must include a setup procedure in `docs/SECRETS_AND_CREDENTIALS.md`.

---

## 5. Testing & Promotion Standards

### 5.1 Testing Levels

1. **Frontend Unit Tests:** Vitest + React Testing Library testing state handling, local caching TTL, error boundaries, and component rendering.
2. **Infrastructure Unit Tests:** `@aws-cdk/assertions` testing:
   - S3 bucket security (encryption enabled, public access blocked, TLS enforcement).
   - CloudFront Origin Access Control (OAC) attachment.
   - Security header response policies (HSTS, CSP, X-Frame-Options).
   - Route 53 alias record creation.
3. **Integration / Smoke Tests:** Lightweight synthetic HTTP probes validating HTTP 200/301 responses, TLS handshakes, and essential DOM content on deployed or locally served endpoints.

### 5.2 Promotion Pipeline

Deployments must follow a staged promotion workflow:

1. **Local:** `npm run dev` in `packages/web` (offline).
2. **Pull Request / CI:** Automated linting, typechecking, and unit tests.
3. **Beta:** Automated deployment to beta environment followed by integration smoke tests.
4. **Prod:** Manual promotion gate requiring review before updating production S3 assets and CloudFront caches.

---

## 6. Git & Branching Hygiene

- **Default Branch:** `main` (protected; no direct commits).
- **Agent Branch Pattern:** All automated agent branches must follow `agent-homelab-sre/<feature-or-fix-kebab-case>`.
- **Clean Commits:** Run `npm run lint` and `npm run typecheck` before committing. Ensure diffs are minimal and focused.
