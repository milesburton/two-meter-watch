# Deployment

## Deployment mode: single "full" process

Unlike [night-watch](https://github.com/milesburton/night-watch), which
splits capture/decode into separate stages because LRPT decoding is CPU/RAM
heavy, two-meter-watch runs as a **single "full" process**: capture, FFT
waterfall, and band-activity aggregation all run in one Node process.

Why this is fine here: a 2m FFT waterfall plus (eventually) SSTV detection is
computationally light compared to LRPT satellite decoding. There's no need to
split ingestion from processing onto separate hosts or containers — a
Raspberry Pi 4/5 handles the whole pipeline comfortably. If SSTV decoding in
Phase 2 turns out to be heavier than expected, this can be revisited, but
Phase 1 does not need it.

## Docker Compose

```bash
git clone https://github.com/milesburton/two-meter-watch.git
cd two-meter-watch
cp .env.example .env
# edit .env for your SDR and station settings
docker compose -f docker/compose.yaml up -d
```

The compose file mounts `/dev/bus/usb` into the container so the RTL-SDR
dongle is accessible, and persists `./data` (SQLite) and `./images` (future
SSTV decoded images) as volumes.

## Reverse proxy: Caddy

Put Caddy in front of the container rather than exposing port 3000 directly.
Example `Caddyfile`:

```
two-meter-watch.example.com {
	reverse_proxy localhost:3000

	# Rate limiting — prefer caddy-ratelimit (https://github.com/mholt/caddy-ratelimit)
	# or, better, terminate through Cloudflare and let its edge rate limiting
	# and bot protection handle abusive traffic before it reaches this host.
	#
	# rate_limit {
	#     zone dashboard {
	#         key {remote_host}
	#         events 120
	#         window 1m
	#     }
	# }
}
```

The app ships its own lightweight per-IP limiter
(`src/middleware/rateLimiting.ts`) as defense-in-depth, but it is **not** a
substitute for edge-level rate limiting — treat it as a second line of
defense only.

## Cloudflare

This dashboard is intended to sit behind Cloudflare (orange-clouded DNS)
before it is ever exposed publicly. Cloudflare provides DDoS mitigation, edge
rate limiting, and hides the origin IP — all things a lone Raspberry Pi on a
home connection benefits from.

## No public write/control endpoints, by design

Every API route is `GET`-only (see [docs/API.md](./API.md)). There is
deliberately no way to control the SDR, trigger scans, or mutate stored data
over the network. This removes an entire class of exposure for a public,
unauthenticated dashboard — the worst a hostile client can do is read data.
