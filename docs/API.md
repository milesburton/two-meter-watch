# API

two-meter-watch exposes a deliberately **read-only** REST API plus one
websocket endpoint. There are no write/control endpoints — see
[docs/DEPLOYMENT.md](./DEPLOYMENT.md) for why.

## REST endpoints

All endpoints are `GET` only. Any other method returns `405`.

### `GET /api/status`

```json
{
  "uptime_seconds": 12345,
  "capture": { "connected": false, "mode": "waterfall" },
  "db": { "reachable": true }
}
```

### `GET /api/activity?since=<iso8601>&until=<iso8601>`

Returns per-minute band-activity rollups. `since`/`until` default to the last
24 hours if omitted. The requested range is capped at 7 days.

```json
{
  "rollups": [
    {
      "timestamp": 1735689600000,
      "freq_range_start": 144000000,
      "freq_range_end": 146000000,
      "peak_db": -32.1,
      "avg_db": -58.4
    }
  ]
}
```

### `GET /api/sstv/images?since=<iso8601>&limit=<n>`

`limit` is capped at 100. In Phase 1, SSTV decoding is not implemented, so
this always returns an empty array.

```json
{ "images": [] }
```

### `GET /version.json`

```json
{
  "version": "0.1.0",
  "gitSha": "abc1234",
  "builtAt": "2026-01-01T00:00:00.000Z"
}
```

## Websocket: `/ws`

Two logical channels are multiplexed over one connection. The `sstv` channel
stays idle in Phase 1 (no messages are sent on it yet).

### `waterfall` channel

```json
{
  "channel": "waterfall",
  "data": {
    "timestamp": 1735689600000,
    "bins": [-60.1, -59.8, "... dB values across the display width"],
    "freqStart": 144000000,
    "freqEnd": 146000000
  }
}
```

### `sstv` channel (idle in Phase 1)

```json
{
  "channel": "sstv",
  "data": {}
}
```

Connections beyond `WS_MAX_CONNECTIONS` are rejected with a clean close
(code `1013`, "server at capacity").
