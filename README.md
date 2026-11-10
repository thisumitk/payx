# PayX

A wallet-style payments prototype built with Next.js, NextAuth, Prisma, PostgreSQL, and an Express dummy-bank service. It explores balance storage, simulated wallet top-ups, and peer-to-peer balance transfers in an npm/Turborepo monorepo.

**Status:** learning/portfolio prototype, not a payment product. Use synthetic data and a disposable database only. The bank names and redirects in the UI do not represent working bank integrations. Do not use real money, bank credentials, or customer information.

## Start with these files

- [P2P transfer action](apps/user-app/app/lib/actions/p2pTransfers.tsx): session lookup, recipient lookup, balance checks, and debit/credit updates.
- [On-ramp action](apps/user-app/app/lib/actions/createOnRampTransactions.ts): create a pending top-up record.
- [Dummy-bank handler](apps/dummyBank/src/index.ts): simulate a callback, update a balance, and mark matching top-up records successful.
- [Authentication](apps/user-app/app/lib/auth.ts): phone-number/password credentials and bcrypt checks.
- [Prisma schema](packages/db/prisma/schema.prisma): users, integer balances, and on-ramp status.
- [Review and testing guide](docs/review-guide.md): tradeoffs, known gaps, and concrete test acceptance cases.

## What is implemented

- Credentials-based sign-in that also creates a user for a previously unseen number.
- A transfer screen with balance and on-ramp history.
- An on-ramp action that records a `Processing` transaction.
- A dummy callback handler that updates balances and transaction status using Prisma's transaction API.
- A P2P action that decrements one balance and increments another inside a transaction callback.

The dashboard and standalone transactions pages are placeholders. P2P transfers do not create a separate transaction-history record. Source-level use of a database transaction does **not** establish safe concurrent spending or payment correctness.

## Architecture

```text
Browser (Next.js / React)
  |-- NextAuth credentials --> Prisma --> PostgreSQL
  |-- Server actions ------> on-ramp records / P2P balance changes
  |
Local dummy-bank service (Express, port 3003)
  |-- simulated callback --> Prisma transaction --> PostgreSQL
```

The UI converts display amounts to integer minor units by multiplying by 100. The schema stores amounts as integers. Server-side amount validation and a consistent currency policy still need to be added.

The Add Money UI creates a pending record and redirects to a bank website. It does not connect that website to the dummy-bank callback or complete a real payment.

## Repository layout

- `apps/user-app`: Next.js application, named `web` in its package manifest.
- `apps/dummyBank`: local Express callback simulator, named `dummybank`.
- `components`: wallet UI components shared by the application routes.
- `packages/db`: Prisma schema, migrations, seed, and client.
- `packages/store`: Recoil balance state helpers.
- `packages/ui`: shared React components.
- `packages/eslint-config`, `packages/typescript-config`: shared tooling.

## Local development

The repository declares Node.js `>=18` and npm `10.8.2`; the existing build workflow uses Node 20. A supported-toolchain refresh is separate from this documentation change.

1. Use a **disposable local PostgreSQL database**, then install from the repository root:

   ```sh
   npm ci
   ```

2. Supply `DATABASE_URL` to Prisma and both applications. The Next.js app also needs `NEXTAUTH_URL=http://localhost:3000` and a locally generated `JWT_SECRET`, which its NextAuth configuration uses as the session secret. Export values in the process shell or use the relevant framework's local environment mechanism. The dummy-bank entry point does not load dotenv itself. Do not commit environment files or reuse personal credentials.

3. Generate the client and apply the checked-in migrations only to that disposable database:

   ```sh
   npx prisma generate --schema=packages/db/prisma/schema.prisma
   npx prisma migrate deploy --schema=packages/db/prisma/schema.prisma
   ```

4. Start the two applications in separate terminals:

   ```sh
   npm run dev --workspace=web
   ```

   ```sh
   npm run dev --workspace=dummybank
   ```

   The frontend normally uses port 3000 and the dummy-bank service listens on port 3003.

These commands are derived from the package scripts, not a verified clean-room run. Dependency installation, Prisma generation, builds, and the local walkthrough still require verification.

The seed defines sample users and on-ramp records but does not create balance records. Newly registered users also do not automatically receive a balance row. A deterministic fixture with funded synthetic users is required for a meaningful transfer demo.

**Demo caution:** Add Money currently redirects to real bank websites. Keep a demo local and replace or disable those redirects before a walkthrough. Never enter bank credentials or treat a redirect as payment completion.

## Verification and next steps

Root `npm run build` and `npm run lint` scripts exist. The repository has no automated behavioral test suite or root `test` script. The [PR workflow](.github/workflows/build.yml) installs dependencies and builds; it does not verify financial invariants.

Priorities are reproducible fixtures, server-side amount checks, authenticated/idempotent callbacks, concurrency-safe transfers, secret/logging hygiene, and integration tests. The [review and testing guide](docs/review-guide.md) separates implemented code from acceptance criteria that remain to be proven.

No real payment processing, production usage, throughput, security certification, or availability claim is made.
