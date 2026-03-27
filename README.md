# Idressia Backend (TypeScript)

TypeScript implementation of the Idressia API backend. Professional Express.js REST API with Sequelize (MySQL), JWT auth, and full feature parity with the JavaScript version.

## Setup

```bash
npm install
```

Copy `.env.example` to `.env` and configure your environment variables.

## Development

```bash
npm run dev
```

## Build

```bash
npm run build
```

## Production

```bash
npm run build
npm start
```

## Database Migrations

```bash
npm run db:migrate              # Run pending migrations
npm run db:migrate:undo         # Undo last migration
npm run db:migrate:undo:all     # Undo all migrations
npm run db:migrate:status       # Check migration status
```

Migrations read DB config from `.env` (MYSQL_HOST, MYSQL_USER, MYSQL_PASSWORD, MYSQL_DATABASE, PORT_DEV).

## Structure

- `src/config/` - Configuration (vars, logger, database, express)
- `src/db/migrations/` - Sequelize migrations
- `src/api/models/` - Sequelize models
- `src/api/services/` - Business logic
- `src/api/controllers/` - Request handlers
- `src/api/routes/` - API routes
- `src/api/middlewares/` - Auth, permissions, error handling
- `src/api/Enums/` - Constants and enums
