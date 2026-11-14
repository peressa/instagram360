# Development and hosting

Node.js 22+ is sufficient; no packages or compilation are needed.

```sh
node scripts/serve.cjs
node tests/run.cjs
```

Preview: `127.0.0.1:8765`. Use `--port 9000` for another port. For a phone on your own network, explicitly bind with `--host 0.0.0.0` and open your computer's LAN address. This is a development server.

## Source map

| Path | Responsibility |
| --- | --- |
| `dist/index.html` | Shell, library, grid, exports and profile persistence wiring |
| `dist/workspace.js`, `workspace.css` | Minimal workspace and direct editing |
| `dist/studio.js`, `studio.css` | Profile presentation, contextual editors and device variants |
| `dist/simulator.js`, `simulator.css` | Local posts, comments, stories and navigation |
| `dist/persistence.js` | IndexedDB transactions and localStorage recovery drafts |
| `dist/circle-crop.js` | Bounded circle crops and gestures |
| `dist/profile-counts.js` | Exact count storage and display formatting |
| `dist/reliability.js` | Pin ordering, upload errors and profile export numbering |
| `dist/post-media.js` | Ordered carousel assets, photo editor, native swipe viewer and image export |
| `dist/direct-media.js` | Library selection, batch drops and inline carousel arrangement |
| `dist/highlight-media.js` | Embedded story sequences, library drops and inline story arrangement |
| `dist/story-player.js` | Highlight navigation and a load-aware, pausable progress animation |
| `references/` | Observations and explicit verification limits |
| `tests/` | Regression checks and script parsing |
| `examples/` | Synthetic, redistributable example project |

## Compatibility

Internal `rio360_` storage prefixes remain stable for existing users. These are legacy identifiers, not the current brand. New exports use `format: "instagram360"`, version 1; import accepts the previous identifier. Do not remove support without a migration.

Storage is scoped to the browser origin and profile. A new domain has separate storage. Recovery drafts protect pending state writes but do not replace image backups. Never commit real user projects.

Multi-photo posts use `carouselIds`, an immutable ordered array of library asset IDs with `imgId` first. Photos remain ordinary library assets. Cover changes reset the grid crop; deleting a library asset removes its references and promotes the next slide. Import rejects missing/duplicate references. Legacy single-photo and cover-only carousel posts remain valid. Removing a post photo does not delete its library asset. The editor accepts at most 100 photos per post as its own storage guard; this is not a claim about Instagram's upload limit.

## Hosting

Publish `dist/` with any static HTTPS host. Runtime assets are bundled locally; no API credentials are needed. With Docker:

```sh
docker build -t instagram360 .
docker run --rm -p 8080:80 instagram360
```

For Cloudflare, use `wrangler.jsonc` as a template, change its Worker name/domain to yours, authenticate and run Wrangler. Forks must replace the official demo domain. Never commit tokens or `.wrangler` files.

Official Cloudflare Workers Builds configuration: `main`, root `/`, build `node tests/run.cjs`, deploy `npx --yes wrangler@4.162.0 deploy`. GitHub Actions checks Node 22/24 without deployment credentials. PRs are checked; merging to `main` triggers publication.

## Releases

Update `package.json`, `dist/version.json` and `CHANGELOG.md`. Run checks and desktop/mobile QA with the example. Verify the demo, tag the tested commit and publish a prerelease. GitHub provides source archives; attach a static ZIP with `dist/` contents, license and usage instructions. Exclude local credentials and user backups.
