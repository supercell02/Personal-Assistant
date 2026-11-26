## Hono CLI

Run `npx hono --help` first, and use the CLI instead of a dev server.

## Environment Variables & Cloudflare Sync

- Never override Cloudflare's `TRIGGER_SECRET_KEY` with any local value — it is not for production.
- When using the Cloudflare skill to "sync environment variables", always exclude `TRIGGER_SECRET_KEY`.
