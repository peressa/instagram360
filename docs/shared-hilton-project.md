# Hilton Mendoza: shared editable project

Demo: https://ig360.peressa.dev/p/hilton-mendoza/

This URL opens an editable collaborative project, with 18 publications, 39 library
photos, carousels and five highlights. It does not connect to the hotel's Instagram
account. Everyone with the URL can edit the same proposal without signing in.

The personal studio at `/` continues to use its existing local persistence. The
shared route includes a separate copy of the beta.7 editor and its assets, so it
does not read or overwrite personal browser profiles. Its UI snapshot is pinned;
future editor improvements must also be applied to this route. The beta.2 export interface and dark-mode shortcut are applied here too, using the common `/export-ui.js` and `/export-ui.css` assets.

## Storage and synchronization

`worker/shared-project.mjs` coordinates the project in one SQLite-backed Cloudflare
Durable Object. The first request initializes it from `seed.json`; later deployments
retain existing cloud edits instead of reapplying the seed. Uploaded images are
addressed by SHA-256 and stored in chunks independently of document metadata.
The initial images are served as static local assets, without expiring Instagram
CDN links. Their attribution is in `fuentes.csv`; hotel photos are excluded from
the software's MIT license.

Clients send changes to individual fields over HTTP and receive live revision
notifications over a hibernating WebSocket. Changes to different fields merge;
the latest accepted change wins when two people edit the same field. Array size
changes (for example, adding a carousel frame) replace that array together.
This is not character-level collaborative text editing. Device/theme selection
is personal to each open tab and is not synchronized.

An IndexedDB outbox stores pending edits on each device, retries after reconnecting,
and prevents a successful cloud-save indicator before server acknowledgement.
The connection and pending-save state remain visible. `Guardar respaldo` downloads
a portable backup with embedded images that the normal studio can import.

Project metadata is limited to 1.8 MB; individual uploaded images to 20 MB after
the editor's existing downscaling, and the library to 1,000 photos. The shared
route uses the same Cloudflare Worker deployment and domain as the normal app.
Wrangler's migration creates the `SharedProject` Durable Object namespace.

## Validation

```sh
node tests/run.cjs
node tests/shared-static.cjs
pnpm dlx wrangler@4.162.0 dev --port 8767 --local
# In another terminal:
node tests/shared-project.cjs
```

The integration check uses three independent clients: fresh loading, simultaneous
edits to different fields, live propagation, image upload, offline retry and
validation. Run it against the local server, not a project people are editing.
It restores the original editorial profile when it finishes successfully.

API: `/api/shared/hilton-mendoza/document`, `/socket`, and `/media/:sha256`.
The API rejects foreign browser origins and invalid change paths. Access is by
the shared URL; this version intentionally has no accounts or read-only roles.
