# devsms

Gateway-neutral SMS inbox scaffold with:
- `pnpm` monorepo
- Express API server (`apps/server`)
- SQLite canonical schema + JSON `meta`
- Provider normalization stubs (`mimsms`, `twilio`, `smpp`)
- SSE (`sms.new`) canonical event stream
- Vite + React 19 inbox UI (`apps/web`)
- Tailwind CSS v4 setup

## Workspace

- `apps/server`: canonical message API + DB + SSE
- `apps/web`: SSR React inbox client

## Canonical Schema

Migration: `apps/server/migrations/001_canonical_sms.sql`

Core table: `sms_messages`
- provider-neutral fields (`sender`, `recipient`, `body`, `status`, `direction`)
- provider tracking (`provider`, `provider_message_id`)
- flexible metadata (`encoding`, `parts`, `cost`, `currency`)
- campaign fields (`campaign_id`, `transaction_type`)
- compliance fields (`retention_policy`)
- raw provider payload (`meta` JSON)

## Run

```bash
pnpm install
pnpm dev:server
pnpm dev:web
```

Server API: `http://localhost:4000`
Web UI: `http://localhost:5153`

SSR web server mode:

```bash
pnpm --filter @devsms/web dev:ssr
```

SSR mode URL: `http://localhost:4173`

## API

Health:

```bash
curl http://localhost:4000/health
```

List inbox rows:

```bash
curl "http://localhost:4000/api/sms?limit=100"
curl "http://localhost:4000/api/sms?provider=mimsms"
```

SSE stream:

```bash
curl -N http://localhost:4000/api/events
```

Delivery simulation (`queued -> delivered`):

```bash
curl -X POST http://localhost:4000/api/sms/simulate-delivery
```

## Send Message Examples

MiMSMS:

```bash
curl -X POST http://localhost:4000/api/sms/send/mimsms \
  -H "content-type: application/json" \
  -d '{
    "SenderName": "GovOTP",
    "MobileNumber": "8801712345678",
    "Message": "OTP 1234",
    "CampaignId": "campaign-1",
    "TransactionType": "T"
  }'
```

Twilio:

```bash
curl -X POST http://localhost:4000/api/sms/send/twilio \
  -H "content-type: application/json" \
  -d '{
    "From": "+12065550000",
    "To": "+12065550123",
    "Body": "Hello from Twilio stub"
  }'
```

SMPP:

```bash
curl -X POST http://localhost:4000/api/sms/send/smpp \
  -H "content-type: application/json" \
  -d '{
    "source_addr": "8801700000000",
    "destination_addr": "8801712345678",
    "short_message": "SMPP test",
    "data_coding": 0
  }'
```

## Status Mapping

Canonical lifecycle:
- `queued -> sent -> delivered`
- `queued -> failed`
- `queued -> expired`

Provider mapping implemented in `apps/server/src/status-map.js`.
