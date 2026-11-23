# Bizon email notifications implementation plan

## Scope and boundaries

Implement email notifications only. Keep Telegram source/configuration untouched. Work only in isolated branches `codex/bizon-email-notifications-backend` and `codex/bizon-email-notifications-cms`; do not edit active checkouts. Do not configure secrets, run production migrations, send real mail, deploy, commit, or push.

## Sequence

1. **Backend request contract** — add regression coverage for supported `sourceForm` values, preserve `procurement`, `tire_cart`, and `shop_cart`, and enqueue one email row in the same PostgreSQL transaction as request/items. Add an additive migration.
2. **Message and transport** — build an escaped text+HTML message from canonical request data; isolate SMTP behind an injectable transport; credentials remain server-side and configuration failure must not crash API intake.
3. **Outbox worker** — claim rows with `FOR UPDATE SKIP LOCKED` and lease, send outside transaction, persist success/retry/final-failure with bounded backoff, and recover expired leases. Add focused tests for claiming, delivery outcomes, and idempotent retry behavior.
4. **CMS contract and UX** — return form answers, safe attachment URL, and email delivery state; display the values and status. Add permission-checked retry only if the existing admin transport supports a clean backend operation and its authorization can be tested.
5. **Verification** — install dependencies with lockfile, run focused tests then backend/CMS typecheck and relevant suites. If a disposable DB and fake SMTP are available, verify the vertical request→outbox→email path. Never use production credentials.

## Completion evidence

Record each command as PASS/FAIL/BLOCKED/NOT RUN and identify the repository, branch, environment, and proof boundary. Explicitly state that live SMTP receipt, production migration, and deployment are not verified unless separately authorized and completed.
