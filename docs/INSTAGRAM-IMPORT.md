# Import a public Instagram profile

Open **Fotos → Importar Instagram**, paste the profile URL and choose **Buscar perfil**. The preview shows only what the public pages actually supplied. Confirm **Importar como proyecto nuevo** to hydrate the images and create a separate local editable project. The original local/shared/Hilton project is never used as the destination. The imported copy is not automatically published.

This is a best-effort public-page importer, not an authenticated Instagram integration or synchronization service. It reads the profile's public HTML metadata and public embed JSON without executing provider scripts. It does not query private endpoints, collect passwords, forward Instagram cookies or bypass login/challenge/rate restrictions. Instagram can change the format, return a partial feed or block server-side access. Such cases are reported; a complete account import is not guaranteed.

Available data includes identity, avatar, biography, supplied profile counts, captions, dates, supplied interaction totals, post order and available carousel images. Missing counts use `—`; abbreviated source counts remain source abbreviations rather than invented exact totals. Highlight titles, covers and image story sequences are imported only when actually present in a source. Private information, individual comments and unavailable links are not reconstructed. Videos use their poster image only. This is a snapshot, not a continuing connection to Instagram.

## Implementation

`POST /api/instagram/preview` accepts a username or HTTPS Instagram profile URL. It strips tracking parameters, accepts only a single username path and fetches fixed `www.instagram.com/<username>/` and `/embed/` pages. Provider JavaScript is parsed as bounded JSON/text, never evaluated. Only normalized public fields and allowlisted media URLs are returned, not raw page configuration or tokens. Previews can be cached for five minutes in Cloudflare's Cache API.

`GET /api/instagram/media?url=...` accepts only HTTPS `*.cdninstagram.com` or `*.fbcdn.net` `/v/` image URLs, with no userinfo/custom port. It does not follow redirects. Responses must use a supported image MIME type, have bounded size, and receive sandbox/nosniff headers. No open arbitrary-host proxy is provided.

Limits: 30 preview queries and 600 media requests per IP/hour; 4 MiB per public page; 12 MiB per image; 15–20 second provider fetch timeouts; at most 27 posts, 100 frames per carousel and 200 post photos per preview; 100 MiB of downloaded images per browser import. Truncation is disclosed before import. The existing hidden `ProjectRoom` rate-limit object stores SHA-256 IP digests with hour buckets; it does not hold imported image bytes. No new Durable Object binding/migration or runtime API key is required.

The browser checks every available image, downsizes using the editor's existing image pipeline and writes assets/layout/profile/view together in a new IndexedDB database. Catalog activation happens only after the transaction completes. Failure/cancellation during image loading creates no catalog entry. Images are embedded in the local project and ordinary JSON backups rather than relying on expiring Instagram URLs. Current edits are flushed before creating the new project. Exported backups and explicitly shared copies include imported media, so users should share only material they are authorized to use.

The frontend uses common root assets on both the main editor and the existing Hilton route. A static-only host can still edit/import IG360 backups but cannot fetch Instagram profiles; run Wrangler for the complete feature.

## Verification

`tests/instagram-import.cjs` covers synthetic public metadata and nested embed JSON, Unicode captions, carousel ordering, partial data, unknown counters, local project shape, URL validation, foreign Origins and redirect rejection. It makes no live Instagram calls. Browser smoke tests use public profiles and check actual image loading, independent local saving, carousel navigation and reload in desktop/mobile layouts. Real account images/data must not be bundled in fixtures or releases.


## Free saved-page enrichment

When Cloudflare receives incomplete public metadata, the user can select a saved HTML page of the same profile. `dist/instagram-saved-page.js` parses it in an inert, never-inserted `<template>`, verifies the canonical Instagram handle and extracts only whitelisted profile fields, visible count labels/tooltips and highlight links/images. Provider scripts are not executed and raw HTML is never uploaded. Extracted image URLs still use the same bounded CDN proxy when previewed or imported; cookies and page tokens are not forwarded.

The supplement preserves available URL-imported media and adds/replaces corresponding profile/highlight fields. A complete visible count wins over an abbreviated candidate. Known empty biographies and zero values remain meaningful. Wrong-profile HTML is rejected. Expand the bio and wait for highlight covers before saving; partially rendered pages can remain incomplete.

Saved profile DOM commonly contains highlight covers/titles rather than the complete story sequences. Structured story image data is supported if present, with at most 50 highlights, 100 stories per highlight and 200 story frames overall. Covers-only highlights retain an empty story array; the reader does not turn a cover into an invented story. Local image-file references are not read from disk implicitly and are reported as missing. There is no guarantee of a full automatic highlight import by URL without another data source.

Verification includes real visible public profile header data with six highlights, exact count tooltips and an expanded biography, plus synthetic included story sequences and an inert-script probe. No real account export or session data is committed to the repository.
