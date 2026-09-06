# two-meter-watch

[![CI](https://github.com/milesburton/two-meter-watch/actions/workflows/ci.yml/badge.svg)](https://github.com/milesburton/two-meter-watch/actions/workflows/ci.yml)
[![Docker Build](https://github.com/milesburton/two-meter-watch/actions/workflows/docker-build.yml/badge.svg)](https://github.com/milesburton/two-meter-watch/actions/workflows/docker-build.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](./LICENSE)

## What is this

`two-meter-watch` is a public 2-meter amateur radio band (144-146MHz)
monitoring dashboard: a live FFT waterfall plus per-minute band activity
history, with SSTV (slow-scan television) detection and decoding planned for
a later phase. It's a sibling project to
[night-watch](https://github.com/milesburton/night-watch), sharing the same
stack and conventions.

## Features

- Live FFT waterfall of the 2m band via an RTL-SDR dongle
- Per-minute band activity rollups (peak/avg dB) with a queryable history API
- Read-only public REST API and websocket feed — no write/control endpoints
- SSTV detection/decoding — **planned for Phase 2**, not yet implemented

## Hardware

- An RTL-SDR dongle (e.g. RTL-SDR Blog V3)
- A 2m band antenna (e.g. a simple J-pole or discone)
- A Raspberry Pi 4 or 5 (or any Linux host) to run the capture + server process

## Quick Start

```bash
git clone https://github.com/milesburton/two-meter-watch.git
cd two-meter-watch
cp .env.example .env
# edit .env for your SDR and station settings
docker compose -f docker/compose.yaml up -d
```

## Configuration

All environment variables are documented in [`.env.example`](./.env.example).

## Development

```bash
npm install
npm run dev      # backend, tsx --watch
npm run dev:ui    # frontend, Vite dev server
npm test
```

## Deployment

See [docs/DEPLOYMENT.md](./docs/DEPLOYMENT.md) for the full deployment guide,
including Docker Compose usage and a sample Caddy reverse-proxy config.

## API

See [docs/API.md](./docs/API.md) for the full REST and websocket contract.

## Architecture

```
RTL-SDR dongle --> rtl_fm (child process) --> fft.js waterfall (Hann window)
                                                     |
                                                     v
                                    band activity rollups --> SQLite
                                                     |
                                                     v
                                     websocket broadcast --> React frontend
```

SSTV detection/decoding (VIS header detection, Robot36/Scottie/Martin decode)
is planned for Phase 2 and is currently a documented stub
(`src/backend/sstv/decoder.ts`).

## Roadmap / Status

- **Phase 1 (current):** RTL-SDR capture, FFT waterfall, band-activity
  rollups, read-only API, React dashboard. SSTV decoding **not yet
  implemented**.
- **Phase 2 (planned):** SSTV VIS detection and Robot36/Scottie/Martin decode,
  image gallery.

## License

MIT — see [LICENSE](./LICENSE).
