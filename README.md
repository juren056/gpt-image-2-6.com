# Qwen Image 3

Qwen Image 3 is an independent image-generation workspace and subscription service built for beginners. The homepage combines guided prompting, model and aspect-ratio controls, examples, pricing, account management, credits, and subscription billing.

This project is an independent third-party product and is not affiliated with or endorsed by Alibaba or the Qwen team.

## Technology

- TanStack Start, React 19, TypeScript, Vite and Nitro
- Tailwind CSS and shadcn/ui
- better-auth and Drizzle ORM
- PostgreSQL/Neon for production data
- Stripe subscriptions, S3-compatible storage, and configurable AI providers
- Paraglide internationalization for English and Chinese

## Local development

```bash
pnpm install
pnpm db:setup
pnpm db:push
pnpm dev
```

Copy `.env.example` to `.env.development` before starting and configure the database, application URL, authentication secret, and encryption key.

## Production verification

```bash
pnpm build
```

The production site is intended for Vercel. Provider credentials are configured from the administrator settings and stored encrypted when `CONFIG_ENCRYPTION_KEY` is set.
