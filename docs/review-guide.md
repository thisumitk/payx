# Review and testing guide

## Trace the two main flows

### Simulated top-up

1. [Add Money component](../components/AppdMoneyCard.tsx) accepts an amount/provider and calls a server action.
2. [On-ramp action](../apps/user-app/app/lib/actions/createOnRampTransactions.ts) checks the session and writes a `Processing` record with an integer amount.
3. The browser redirects to a bank website. There is no integrated payment flow connecting this redirect to the local simulator.
4. [Dummy-bank service](../apps/dummyBank/src/index.ts) accepts a callback payload, changes the balance, and marks records matching a token `Success`.
5. [Transfer page](../apps/user-app/app/%28dashboard%29/transfer/page.tsx) reads the user's balance and on-ramp records.

### Peer-to-peer transfer

1. [Send component](../components/SendCard.tsx) converts the entered amount to minor units and calls the action.
2. [P2P action](../apps/user-app/app/lib/actions/p2pTransfers.tsx) resolves the session and recipient.
3. Inside a Prisma transaction callback, it reads the sender balance, checks available funds, and performs debit and credit updates.
4. Recipient-balance creation currently uses the outer client, not the transaction client. No P2P ledger/history row is written.

## Current tradeoffs and limitations

These are source-inspection findings, not a completed security audit or passing runtime tests.

- **Money validation:** amounts need server-side checks for positive finite integers, supported limits, and currency/unit consistency. UI conversion is not validation.
- **Concurrent spending:** a balance read followed by an update does not by itself prove protection against concurrent transfers. Establish an isolation/locking or conditional-update strategy and verify it against real PostgreSQL.
- **Transaction boundary:** recipient initialization must be atomic with the transfer; move it into the same transaction and handle concurrent initialization.
- **Callback trust:** the simulator needs authenticated callbacks, amount/user/token binding, and replay protection before any public deployment. It is not a real bank webhook integration.
- **Idempotency:** repeated callbacks must not credit funds repeatedly. Use a server-side state transition and a stable unique identifier, then test concurrent retries.
- **Tokens:** the current on-ramp identifier uses `Math.random()`. Replace it with an appropriate unique identifier and enforce transaction ownership.
- **Authentication hygiene:** the credentials handler logs submitted credentials and has a fallback secret. Remove credential logging and require configured secrets.
- **Completeness:** the standalone dashboard/history pages are placeholders; no P2P ledger, reconciliation process, refunds, or payment-provider integration is implemented.
- **UI feedback:** add clear success/failure states and repeated-click handling. The bank selector changes the redirect target but does not update the provider state.
- **Data fixtures:** neither registration nor the current seed creates wallet balances. Define isolated, deterministic fixtures before demonstrating transfers.

Do not expose the current dummy-bank service publicly or connect it to real financial data.

## Proposed automated tests

**Status: planned, not implemented or run.** Assertions below describe the intended contract, not behavior already established by the code.

### Amount and identity validation

- Reject zero, negative, fractional-minor-unit, non-finite, and out-of-range amounts on the server.
- Reject unauthenticated requests, unknown recipients, and any disallowed self-transfer.
- Never trust a client-supplied sender identity.
- Logs and error responses contain no passwords or secrets.

### P2P database invariants

- For a successful transfer, sender decreases and recipient increases by the same amount; their combined balance is conserved.
- An insufficient-funds transfer changes neither balance.
- A failure at any intermediate step rolls back all effects, including recipient initialization.
- Two concurrent transfers cannot spend the same available funds twice.
- Concurrent transfers to a recipient without a balance create exactly one balance row.
- Retries/repeated clicks follow a documented idempotency policy.
- Each successful transfer has an auditable record once a ledger is implemented.

Use a real disposable PostgreSQL database for transaction/concurrency tests. Mocked Prisma calls cannot prove database isolation.

### Simulated callback invariants

- An invalid signature/authentication attempt causes no state changes.
- Unknown token, mismatched user, or mismatched amount causes no state changes.
- The first valid callback credits exactly once and transitions the matching pending record.
- Sequential and concurrent duplicate callbacks do not credit again.
- A database failure rolls back both status and balance changes.
- The handler has a defined response for already-completed and rejected events.

### UI and setup

- A clean checkout installs, generates Prisma, migrates a fresh database, and starts both services using documented commands.
- Fixtures supply two synthetic funded accounts with known IDs/balances.
- An expired session redirects safely without null-session errors.
- Bank selection and recorded provider agree.
- Success/failure feedback is visible; repeated submission cannot silently duplicate the intended operation.
- The demo never navigates to a real bank or solicits real credentials.
- Empty balances/history and failed network requests have usable states.

## Evidence to record

For each future verified run, record the commit SHA, Node/npm and PostgreSQL versions, exact commands, fixture setup, passing/failing test counts, and skipped checks. For concurrency testing, retain the starting balances, simultaneous operation count, observed final balances, and retry/failure outcomes.

Any future benchmark should include its harness, hardware, workload, database configuration, duration, and correctness checks alongside throughput or latency. Do not infer real-world scale from a local happy-path demo.

This documentation pass adds no runtime fixes, test runner, deployment, financial integration, or benchmark result.
