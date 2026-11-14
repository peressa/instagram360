# Changelog

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
