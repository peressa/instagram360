# Instagram 360

**Design the profile. Move the feed. Present the idea.**

An open source visual studio for designing and presenting Instagram profiles. Edit directly on the mockup, arrange your images and export your proposal. Created and maintained by [Juan Peressa](https://peressa.dev).

[Live demo](https://ig360.peressa.dev) · [Latest beta](https://github.com/peressa/instagram360/releases/tag/v0.1.0-beta.7) · [Guía en español](docs/USAGE.md) · [Contribute](CONTRIBUTING.md)

![Instagram 360 desktop workspace with an original example profile](docs/screenshots/desktop.jpg)

## What you can do

- Edit names, biography and counts directly on the profile.
- Replace avatars/highlight covers and drag to crop inside their circles.
- Arrange a feed by dragging, preserving photos when resizing the grid.
- Create multi-photo carousels by selecting and dragging a batch from the library. Arrange photos directly on the open post; browse with desktop arrows or native touch swipes.
- Preview mobile, desktop and tablet variants, light/dark and owner/visitor views.
- Drag library photos onto highlights; arrange and remove stories directly inside their viewer, with progress, pause/resume and navigation across highlights.
- Keep proposals locally, with JSON backup/import and recovery drafts.
- Export a profile PNG or a ZIP of prepared grid images.

No account connection, backend or runtime API keys. Projects stay in your browser. The interface is Spanish.

<img src="docs/screenshots/mobile.jpg" alt="Instagram 360 at a 390 px mobile browser viewport" width="320">

<details>
<summary>Carousels and highlights in the current beta</summary>

![Arrange carousel photos directly on the open mockup](docs/screenshots/direct-carousel.jpg)

![Arrange highlight stories directly in the viewer](docs/screenshots/direct-stories.jpg)

</details>

## Run locally

Requires Node.js 22+. No dependencies to install or build step.

```sh
git clone https://github.com/peressa/instagram360.git
cd instagram360
node scripts/serve.cjs
```

Open **http://127.0.0.1:8765**. Run `node tests/run.cjs` (or `npm test`). Any static HTTPS host can serve `dist/`; see [hosting and architecture](docs/DEVELOPMENT.md).

## Try a complete example

Download [the example backup](examples/studio360.json) and import it from the profile's three-dot menu → **Proyecto y ajustes → Importar**. It creates a separate project with synthetic data and original graphics. See [usage and backups](docs/USAGE.md).

## Beta status

**v0.1.0-beta.7** fixes exact-count persistence, saved comment drafts, interaction counts, highlight pause cleanup, export selection/numbering, pinned posts, singular labels and invalid-image feedback. Video playback, cloud sync and real Instagram publishing are not included. Device variants are presentation mockups, not certified replicas of every native app version. Android abbreviations and the exact 9999/10000 transition remain unverified; formatting comes from web observations. See [evidence and limits](references/counts/REVISION-ANDROID.md).

Saved projects belong to one browser and origin. Export/import backups when changing domains or computers. Earlier backups remain importable.

## Help shape the project

Read [CONTRIBUTING](CONTRIBUTING.md), [community conduct](CODE_OF_CONDUCT.md) and [security reporting](SECURITY.md). Bug reports, design feedback, accessibility fixes and well-sourced Instagram comparisons are welcome.

Next priorities: modularize remaining inline code; strengthen browser regression coverage; improve accessibility and add video playback. These are directions, not committed dates.

## Credits and license

Developed and maintained by **Juan Peressa**, building on [mkgrid](https://github.com/chrisvrakas/mkgrid) by **Chris Vrakas**, retaining the original MIT attribution. Licensed under [MIT](LICENSE), including the original example graphics. Bundled dependencies: html2canvas 1.4.1 ([MIT](dist/vendor/html2canvas.LICENSE.txt)) and Manrope ([SIL OFL](dist/fonts/OFL-Manrope.txt)).

Independent project, not affiliated with or endorsed by Instagram or Meta. Third-party brands and reference captures belong to their respective owners; MIT does not grant rights to those materials. Original example graphics and screenshots of this project's synthetic example are provided for reuse.
