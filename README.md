# Ghostsky

This is a soft fork of [social app](https://github.com/bluesky-social/social-app).

**Web: [ghostsky.app](https://ghostsky.app)**

This is a self-hosted fork operated by one person for personal use

@dev.ghostsky.app

## Changes from Upstream

- Custom ghost branding and logo
- [Catppuccin Mocha](https://github.com/catppuccin/catppuccin) theme
- Disabled telemetry and analytics (GrowthBook, MetricsClient, Sentry)
- Age assurance bypass
- App password warning on login — prompts users to use an app password instead of their main account password
- Deployed via Cloudflare Workers (`pnpm deploy-ghost`)

## Development Resources

This is a [React Native](https://reactnative.dev/) application, written in TypeScript. It builds on the `atproto` TypeScript packages (like [`@atproto/api`](https://www.npmjs.com/package/@atproto/api)), code for which is also open source, but in [a different git repository](https://github.com/bluesky-social/atproto). It is regularly rebased on top of new releases of [social-app](https://github.com/bluesky-social/social-app).

There is vestigial Go language source code (in `./bskyweb/`), for a web service that returns the React Native Web application. It is not used in Ghostsky deployments. The intended deployment is Cloudflare Workers.

The [Build Instructions](./docs/build.md) are a good place to get started with the app itself.

The Authenticated Transfer Protocol ("AT Protocol" or "atproto") is a decentralized social media protocol. You don't *need* to understand AT Protocol to work with this application, but it can help. You may wish to reference [resources linked in social-app](https://github.com/bluesky-social/social-app#development-resources). Please don't open issues with the Bluesky team about Ghostsky.

## Deployment

```bash
pnpm deploy-ghost
```

Ghostsky is deployed as a Cloudflare Worker. See `wrangler.toml` for configuration.

## Security Disclosures

If you discover any security issues, please open an issue in this repository. If the issue pertains to infrastructure or systems outside the scope of Ghostsky, please refer to the [disclosure guidelines on social-app](https://github.com/bluesky-social/social-app#security-disclosures) if hosted by Bluesky PBC.

## License (MIT)

See [./LICENSE](./LICENSE) for the full license.
