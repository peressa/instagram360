# Security policy

The latest beta on `main` is maintained. Older betas do not receive separate fixes.

Report vulnerabilities through [GitHub private reporting](https://github.com/peressa/instagram360/security/advisories/new). If unavailable, contact the maintainer using [peressa.dev](https://peressa.dev). Do not publish credentials, private backups or personal images in an issue.

Include the affected version, browser, reproduction steps and a minimal example with synthetic data. There is no guaranteed response time or bounty program.

Local projects stay in the visitor's browser. Explicitly shared projects are stored in Cloudflare SQLite Durable Objects, including image bytes. Anyone who knows or guesses their public slug can read and edit them; there are no accounts, roles, password protection or link revocation in this beta. Do not share confidential projects. Pages request search engines not to index them, which is not access control. Limits and the protocol are documented in docs/COLLABORATION.md. JSON backups contain the user's profile, images and local simulated interactions. Treat them as personal files. The official demo does not connect Instagram accounts or send messages to Instagram. Review code before self-hosting modified versions.
