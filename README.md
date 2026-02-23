# devsms

Gateway-neutral SMS inbox scaffold with:
- `pnpm` monorepo
- Express API server (`apps/server`)
- SQLite canonical schema + JSON `meta`
- Provider normalization stubs (`mimsms`, `twilio`, `smpp`)
- SSE (`sms.new`) canonical event stream
- Vite + React 19 inbox UI (`apps/web`)
- Tailwind CSS v4 setup


## Pull Image

### Docker

```bash
docker pull ghcr.io/mrmeaow/devsms:latest
```

### Podman

```bash
podman pull ghcr.io/mrmeaow/devsms:latest
```

---

## Run Container

### Docker

```bash
docker run --rm -p 5153:5153 ghcr.io/mrmeaow/devsms:latest
```

### Podman 

```bash
podman run --rm -p 5153:5153 ghcr.io/mrmeaow/devsms:latest
```

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

## Docker

Build and run locally:

```bash
docker build -t devsms:local .
docker run --rm -p 4000:4000 -p 5153:5153 devsms:local
```

- API: `http://localhost:4000`
- Web (SSR): `http://localhost:5153`

## CI / Image Publish

GitHub Actions workflow: `.github/workflows/ci-image.yml`

- Runs build checks on pull requests.
- On push to `main` and tags (`v*`), builds Docker image and publishes to GHCR:
  - `ghcr.io/<owner>/<repo>:<branch>`
  - `ghcr.io/<owner>/<repo>:sha-...`
  - `ghcr.io/<owner>/<repo>:latest` (default branch only)

## Container Image (GHCR)

Prebuilt container images are published to **GitHub Container Registry (GHCR)** via CI.

Image namespace:

```
ghcr.io/mrmeaow/devsms
```

### Available Tags

Tags are automatically generated:

- `latest` → default branch build  
- `main` → branch tag  
- `vX.Y.Z` → git tag releases  
- `sha-<commit>` → commit-specific immutable image  

---

## Pull Image

### Docker

```bash
docker pull ghcr.io/mrmeaow/devsms:latest
```

### Podman

```bash
podman pull ghcr.io/mrmeaow/devsms:latest
```

---

## Run Container

### Docker

```bash
docker run --rm -p 4000:4000 -p 5153:5153 ghcr.io/mrmeaow/devsms:latest
```

### Podman (rootless recommended)

```bash
podman run --rm -p 4000:4000 -p 5153:5153 ghcr.io/mrmeaow/devsms:latest
```

---

## Production (Detached Mode)

```bash
docker run -d \
  --name devsms \
  --restart unless-stopped \
  -p 4000:4000 \
  -p 5153:5153 \
  ghcr.io/mrmeaow/devsms:latest
```

---

## Kubernetes Example

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: devsms
spec:
  replicas: 1
  selector:
    matchLabels:
      app: devsms
  template:
    metadata:
      labels:
        app: devsms
    spec:
      containers:
        - name: devsms
          image: ghcr.io/mrmeaow/devsms:latest
          ports:
            - containerPort: 4000
            - containerPort: 5153
```

---

## Image Provenance

Images are built by GitHub Actions using Docker Buildx with layer caching.  
Immutable images are available via SHA tags for reproducible deployments.
