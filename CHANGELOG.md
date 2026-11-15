# Changelog

## 0.2.0-beta.7 · 2026-11-15

- Welcome new local users with a compact project dialog that separates the organizing project name from the visible Instagram profile name. Configure the first empty project in place; keep returning and shared sessions unobstructed.
- Use explicit project labels for selection/rename, retain independent names in backups, and create subsequent projects with fresh defaults without inheriting current data.
- Add an on-demand editing guide, temporary editable-area highlights and subtle hover cues; enlarge mobile highlight playback targets while preserving clean exports.
- Explain partial Instagram imports before the URL/search form and in the project dialog, without an extra confirmation step or paid service.
- Verify creation, cancellation, reload, independent renaming, project switching, import validation and export on desktop and a 390px mobile viewport.

## 0.2.0-beta.6 · 2026-11-15

- Add contextual upload/import actions only to a truly empty feed; keep them out of captures and populated profiles.
- Show the browser-local save location persistently, with a small save-details dialog and direct portable backup download. Preserve truthful cloud labels for the existing Hilton project and distinguish local copies from live synchronization.
- Create a new carousel directly from a library selection, preserving selection order and all existing posts. Grow a full grid when possible as one undoable change; retain selection and data on capacity/validation failures.
- Apply these improvements to local, shared and legacy editors without adding a header or changing the two Hilton Reels badge exceptions.

## 0.2.0-beta.5 · 2026-11-14

- Choose a PNG capture area: complete profile, profile header, highlight covers, feed grid, open post or current highlight story. Preview the chosen area and preserve the device and theme.
- Capture directly from post/story viewers; retain the current carousel photo and pause highlight playback until export closes, respecting existing manual pauses.
- Render an inert copy without resizing, scrolling or re-rendering the editor; remove capture copies on success or failure and prevent Escape from also closing the underlying viewer.
- Apply the same export controls to local, shared and legacy Hilton projects. Verify all six downloads on desktop and Android/iPhone layouts, including dark mode and state preservation.

## 0.2.0-beta.4 · 2026-11-14

- Merge profile metadata from both page and embed sources; preserve known empty bios, exact zeros and precise available counts. Support Spanish count/biography metadata and safe same-profile canonical redirects.
- Import highlight titles, covers and image stories when present in profile data, and hydrate them into the local editable project.
- Add a free saved-HTML supplement for missing bio, visible exact counters and highlights. Parse the file only in an inert browser template, verify the target profile and never execute or upload its scripts.
- Distinguish unavailable highlights, covers-only highlights and included story sequences; preserve existing media during enrichment and disclose source limitations.

## 0.2.0-beta.3 · 2026-11-14

- Import a public Instagram profile by URL or username from Photos, with a preview before creating a separate local project.
- Read available public profile/embed metadata, captions, counters, photos and complete available carousel sequences; copy image bytes locally so the project does not depend on expiring CDN URLs.
- Explicitly report missing/partial data, limits and video covers; do not fabricate highlights, private data or unavailable counts.
- Preserve the current local/shared/Hilton project during import; add bounded same-origin endpoints, CDN-only image proxying, rate limits and parser/security regressions.

## 0.2.0-beta.2 · 2026-11-14

- Make profile capture the default export, with clear capture/photo choices, device/theme context and a single Save capture action. Keep format and publication numbering under optional details.
- Add a persistent moon/sun toggle for Instagram dark mode beside the device selector; preserve the chosen theme in downloaded profile PNGs.
- Export a single carousel as a complete ZIP, show the selected file type/count and keep failed exports open for retry. Await PNG creation and guard repeated downloads and destructive editor shortcuts inside the export dialog.
- Apply the export and theme controls to the existing Hilton editor as well as local and generic shared projects, preserving their storage protocols.

## 0.2.0-beta.1 · 2026-11-14

- Create public editable `/p/<slug>/` links for any project while retaining the original local copy.
- Persist metadata and content-addressed image chunks in SQLite Durable Objects; synchronize field patches with hibernating WebSockets and connection presence.
- Preserve offline outboxes and private browser drafts; merge independent changes, detect competing edits and offer explicit conflict resolution with a backup option.
- Preserve post identity, preview preferences and active post/story position across remote updates. Add collaboration regressions and desktop/mobile checks.
- Document public-link access, hosting requirements, storage limits and beta limitations.
- Preserve the existing Hilton route, original cloud document, media and Durable Object migration; reserve its slug against accidental replacement.

## 0.1.0-beta.7 · 2026-11-14

- Preserve exact profile counts across switching, duplication and backups; save comment drafts across interactions, viewer reopening and reload, clearing only after submission. Previously rounded digits cannot be reconstructed automatically.
- Parse abbreviated interaction counts and display exact Spanish integers; correct singular profile labels.
- Restore highlight autoplay when the library closes while preserving manual pause and progress.
- Select individual export thumbnails with mouse, touch or keyboard; render reverse publication-order badges in profile PNGs and serialize concurrent captures.
- Pin up to three posts at the start, support unpinning and normalize legacy excess pins without removing photos. Preserve metadata when a panorama splits.
- Show accessible, dismissible errors for invalid, unreadable or oversized image uploads.
- Add integration regressions for the nine audited issues; check desktop and mobile browser layouts, downloads and saved-data roundtrips.

## 0.1.0-beta.6 · 2026-11-14

- Drag selected library photos onto a highlight circle or its open viewer; insert before a story thumbnail or append the batch.
- Arrange, preview and remove stories directly in the viewer using mouse drag, touch hold-and-drag or Alt + arrow keys.
- Pause playback during direct editing/library selection while preserving manual pause. Keep existing cover crops, skip duplicate images and save complete independent story sources.
- Support empty highlights and atomic batch validation with regression coverage for legacy data, missing assets, limits and playback state.

## 0.1.0-beta.5 · 2026-11-14

- Keep the library selection count, clear action and add-to-post button visible while browsing photos.
- Includes batch dragging and inline carousel arrangement from beta.4.

## 0.1.0-beta.4 · 2026-11-14

- Select multiple library photos and drag the batch onto an existing post or empty slot to create one carousel, with duplicate prevention and atomic undo.
- Add and arrange photos directly on the open mockup, without opening the metadata editor. Inline thumbnails support mouse drag, touch hold-and-drag, keyboard ordering and cover selection.
- Preserve existing cover crops, captions, likes, comments and comment drafts while adding photos.

## 0.1.0-beta.3 · 2026-11-14

- Keep carousel pagination labels accessible without showing them as text over the image.
- Includes the multi-photo carousel, highlight player and desktop post improvements from beta.2.

## 0.1.0-beta.2 · 2026-11-14

- Real multi-photo carousels with batch upload, cover/reorder/removal, desktop arrows and native mobile swipe. Likes and comments preserve the current slide.
- Complete carousel sequences in JSON backups and ZIP exports; legacy cover-only posts remain valid.
- Rebuilt highlight player with desktop vertical framing, immersive mobile view, load-aware progress, hold-to-pause, resume without restarting and empty-group skipping.

- Desktop posts open in a two-column overlay over the dimmed profile, with full images, independently scrolling captions/comments and fixed actions/composer.
- Previous/next arrows, keyboard navigation, Escape/backdrop closing and modal focus management; editing stays in the post's three-dot menu.
- Mobile posts retain their stacked presentation. Local likes, saves and comments remain persistent.

## 0.1.0-beta.1 · 2026-11-14

First public beta of **Instagram 360**, created and maintained by Juan Peressa, based on mkgrid by Chris Vrakas (MIT).

- Direct editing of profile text, counts, avatar and highlights.
- Drag-and-drop grid arrangement with photo preservation when resizing.
- Avatar and cover cropping directly in their circles.
- Desktop, mobile and tablet presentation variants; light/dark and owner/visitor views.
- Local post navigation, likes, comments and highlight stories.
- Browser-local saving with recovery drafts and JSON backup/import.
- Profile PNG and image ZIP exports.
- New branding, demo at https://ig360.peressa.dev and MIT contribution workflow.
- New backup identifier `instagram360`; previous backups remain importable.
- Documentation, original example, screenshots and automated PR checks.

### Beta limitations

- Reels/videos use still covers; no real video playback or Instagram publishing.
- No cloud sync or real social interactions.
- Native Android/iOS fidelity is not certified. The exact 9999/10000 follower transition and native abbreviation rules remain unverified; formatting derives from documented web samples.
- Domain changes do not transfer browser storage. Export/import projects; see [usage](docs/USAGE.md).
