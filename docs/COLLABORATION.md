# Shared projects (beta)

The official demo supports public editable links at `/p/<slug>/`. Sharing is explicit, per project, and preserves the original local project. No Instagram, ChatGPT or editor account is required. Anyone who obtains or guesses the address can read, upload images and edit. There is no owner account, password, access revocation or deletion UI yet. Do not use public links for confidential work.

## Local development and deployment

The static server (`node scripts/serve.cjs`) and Docker image provide only local editing. For the complete app:

```sh
npx wrangler@4.162.0 dev
# http://127.0.0.1:8787, including /p/ routes and local Durable Objects
node tests/run.cjs
# Authenticate to your own Cloudflare account first:
npx wrangler@4.162.0 deploy
```

For a fork, change the Worker name and custom domain in `wrangler.jsonc`. Keep `worker/main.mjs` as the entry point, the `ASSETS`, `PROJECTS` and legacy `SHARED_PROJECTS` bindings, worker-first `/api/*` and `/p/*` routes, and both ordered SQLite migrations. Configure GitHub/Cloudflare Workers Builds with the build and deploy commands from DEVELOPMENT.md. Deployment creates the Durable Object namespace. Publishing new application assets preserves the namespace's data. Renaming/removing the binding, namespace or migration is a data migration and needs a backup plan.

Cloudflare account quotas and pricing still apply. This beta uses SQLite storage for both fields and image chunks, without an R2 bucket. No runtime API keys are sent to browsers. `.wrangler` development storage must never be committed. Static release ZIPs intentionally do not contain an executable Cloudflare backend; use the source repository for shared hosting.

## Protocol and persistence

- `POST /api/projects/<slug>` creates a project. An idempotent private creation token prevents a retry from overwriting an existing unrelated address. This token is not an editing credential; editing is public.
- `GET /api/projects/<slug>` returns flat fields, revision and available media hashes.
- `PUT/GET /api/projects/<slug>/media/<sha256>` stores/retrieves image bytes. Images are hash-checked, split into 256 KiB SQL rows, served with a sandbox CSP and never interpreted as HTML by the API.
- `/api/projects/<slug>/live` upgrades to a hibernating WebSocket. It emits snapshots, revisioned patches, acknowledgements, conflicts and connection counts. POST `/patch` uses the same patch protocol.

One SQLite Durable Object owns each project's fields, revision, media and recent operation receipts. Writes validate the complete resulting model and commit transactionally. The client serializes flights, retains a browser-local outbox and retries operation IDs after reconnection. Receipts deduplicate the last 1,000 operations; older retries still compare their expected previous field values. The local persistence journal includes collaboration state, without duplicating image bytes in the wire outbox. Cache API media is optional; IndexedDB still holds the expanded local project.

The wire format uses stable post/story/comment IDs, separate fields for profile values and crops, independently keyed comments, and ordered arrays for carousel/highlight/story sequences. Comment drafts, simulated private messages and preview device/theme are excluded. Current shared state is durable; this is not a server-side version history or backup service. Download JSON backups for portable recovery.

## Concurrency behavior

Each operation contains the expected previous value and its replacement/removal. Independent fields merge. Concurrent appends to an unchanged ordered sequence merge uniquely. Competing replacements/reorders produce an explicit conflict and retain the local pending edition. The user can download their local copy, explicitly rebase their edits or accept current shared state. This is **field-level optimistic collaboration**, not character-level CRDT text editing.

Remote UI updates preserve the open post/carousel or highlight position. Native editing dialogs and unfinished drag gestures defer visual replacement; inline profile fields preserve text focus/cursor when updated. Shared undo reverts only that client's still-matching fields; it does not undo other users' subsequent changes. Undo history is session-local.

## Limits and operational scope

Project metadata: 8 MiB total, 64 KiB per field, 30,000 fields. Images: 25 MiB each, 200 MiB and 500 stored hashes per project. Removed images are retained; there is no garbage collection UI yet. The editor retains its existing 27-slot maximum and separate content limits.

There are at most 50 live connections per project, 20 incoming messages per second per socket and 10 creation attempts per IP per hour. The rate limiter stores a SHA-256 IP digest plus the hour bucket, not the raw IP. Failed creation attempts and resumable retries count toward the limit. Ordinary HTTP field updates remain public; limits are beta storage guards, not a comprehensive abuse prevention service.

Provided cross-origin browser Origins are rejected. Shared pages request `noindex, nofollow`; this is advisory only. Public slugs are discoverable and confer no confidentiality. Connection counts identify sockets, not unique or authenticated people. There is no promise of unlimited service, guaranteed uptime, conflict-free same-field text, or offline first-time access.

## Verification

`tests/sharing.cjs` checks schema validation, private-field exclusion, field merge/conflict, two independent sync clients, changes during a flight, offline state restoration, undo, transactional SQLite persistence, idempotent writes, media roundtrips and Origin rejection. Existing local editor regression checks also run. Browser QA uses synthetic example data, with desktop and 390 px mobile layouts, live changes in both directions, disconnect/reconnect and explicit same-field conflict resolution. Never upload real user projects for smoke tests.


## Existing Hilton link compatibility

The pre-existing `/p/hilton-mendoza/` project remains on its original editor/protocol and `SharedProject` namespace, with all cloud edits and media preserved. `worker/main.mjs` delegates that route and `/api/shared/*` to the existing handler; generic links use `ProjectRoom` and `/api/projects/*`. The slug `hilton-mendoza` is reserved, so creation cannot hide or replace the existing proposal. This beta does not migrate its document or grant it new field-conflict semantics. See [its existing protocol](shared-hilton-project.md). All newly created links use the common current editor and need no per-project static copy or seed in GitHub.
