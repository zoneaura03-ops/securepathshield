# SecurePath Bank

A full-stack online banking application built with Next.js App Router, TypeScript, Tailwind CSS, and MySQL.

## Run locally

```bash
npm install
npm run dev
```

Open http://localhost:3000.

SecurePath Bank uses persistent MySQL-backed accounts, secure server-side sessions, password hashing, email verification, transaction PIN verification, and customer/admin roles.

Apply the database migrations before starting a new environment:

```bash
npm run db:migrate
```

Admin sign-in:

- URL: http://localhost:3000/admin/login
- Email: `admin@securepathgroups.com`
- Administrator credentials must be created and managed securely in the application database.

The application is entirely served by Next.js. Pages and APIs are under `src/app`; SQL migration files under `database/migrations` are applied by `scripts/migrate.mjs`.

## Branding

- Bank identity: `src/lib/config.ts`
- Placeholder shield logo: `src/components/logo.tsx`
- Navy and blue palette: `tailwind.config.ts`
- Global component tokens: `src/app/globals.css`

## Checks

```bash
npm run typecheck
npm run lint
npm run build
```
