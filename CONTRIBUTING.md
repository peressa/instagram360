# Contributing / Cómo contribuir

Contributions in Spanish and English are welcome. Project direction and maintenance: [Juan Peressa](https://peressa.dev).

## Run and check

Requires Node.js 22 or newer. No dependency installation is needed.

```sh
git clone https://github.com/peressa/instagram360.git
cd instagram360
node scripts/serve.cjs
# Open http://127.0.0.1:8765
node tests/run.cjs
```

Fork the repository and create a focused branch. Describe the user problem, implementation and validation in your pull request. Discuss larger changes in an issue before writing them. The maintainer reviews contributions; opening a PR does not publish to the demo.

## Design principles

- The editable profile is the workspace. Keep the feed prominent.
- Prefer direct editing and contextual controls. Features should not add permanent panels or a header.
- Preserve browser-local storage and existing backup formats.
- Use original or properly licensed demo assets. Never commit personal backups or private photos.
- State limitations honestly. A responsive browser preview does not verify a native Android/iOS app.

## Validation

Run `node tests/run.cjs`. Add meaningful regression coverage when changing persistence, cropping, backup validation, grid resizing or numeric rules. For UI changes, check desktop and mobile browser viewports and attach screenshots. Check keyboard navigation, focus and readable labels.

Changes to Instagram fidelity need an inspectable source, date, platform, language and exact observed behavior. Keep inferred behavior separate; see [reference review](references/counts/REVISION-ANDROID.md). Do not encode unobserved rules as externally verified fixtures.

See [development guide](docs/DEVELOPMENT.md). GitHub checks run on PRs and `main`; Cloudflare publishes after pushes to `main` pass its tests. Contributions are MIT licensed; preserve third-party notices. See [community conduct](CODE_OF_CONDUCT.md) and [security reporting](SECURITY.md).
