# brwyatt.me

Modern personal portfolio website and AWS CDK infrastructure for `brwyatt.me` and `brwyatt.net`.

## Architecture Highlights

- **Web Frontend (`packages/web`)**: React 18, Vite, TypeScript, and accessible responsive CSS. Completely hermetic and offline build with client-side GitHub project fetching and storage caching.
- **Infrastructure as Code (`packages/infra`)**: AWS CDK v2 in TypeScript.
  - **Private S3 Origin** with CloudFront Origin Access Control (OAC).
  - **Explicit ACM Certificates** with automated Route 53 DNS validation.
  - **Domain Redirect Stack**: 301 redirects `brwyatt.net` and `brwyatt.com` to `https://brwyatt.me/`.
- **CI/CD Pipeline**: GitHub Actions with staging (`beta.brwyatt.me`) promotion and automated smoke tests.

---

## Quick Start (Local Development)

### 1. Install Dependencies

```bash
npm install
```

### 2. Run Web Development Server (Offline)

```bash
npm run dev -w @brwyatt/web
```

Opens at `http://localhost:3000`.

### 3. Run Unit Tests

```bash
npm run test
```

### 4. Build Production Bundle

```bash
npm run build
```

---

## Repository Structure

```text
brwyatt.me/
├── packages/
│   ├── web/               # React + Vite frontend
│   └── infra/             # AWS CDK TypeScript infrastructure
├── scripts/
│   └── smoke-test.sh      # Synthetic smoke test suite
├── docs/
│   └── SECRETS_AND_CREDENTIALS.md # OIDC setup and secrets guide
├── Agents.md              # Architectural invariants and engineering standards
└── package.json           # Workspace root
```

## Documentation

- See [Agents.md](./Agents.md) for architectural constraints, branch naming rules, and standards.
- See [docs/SECRETS_AND_CREDENTIALS.md](./docs/SECRETS_AND_CREDENTIALS.md) for AWS IAM OIDC federation instructions.
