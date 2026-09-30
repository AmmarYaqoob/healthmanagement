# HealthPass API

Node.js and TypeScript backend for HealthPass. This repository currently contains the application skeleton: configuration, MongoDB connection, error handling, and a health check. Feature modules will be added later.

## Requirements

- Node.js 20 or newer
- npm
- MongoDB

## Installation

```bash
cd BE
npm install
cp .env.example .env
```

On Windows PowerShell, copy the example env file with:

```powershell
Copy-Item .env.example .env
```

## Environment variables

Configuration is read from the environment through `src/config/env.ts`. Do not read `process.env` elsewhere in the application.

| Variable      | Description                            |
| ------------- | -------------------------------------- |
| `NODE_ENV`    | `development`, `test`, or `production` |
| `PORT`        | HTTP port                              |
| `MONGODB_URI` | MongoDB connection string              |

See `.env.example`.

## Scripts

```bash
npm run dev
```

Starts the API in watch mode with `tsx`.

```bash
npm run build
```

Compiles TypeScript to `dist/`.

```bash
npm start
```

Runs the compiled server: `node dist/server.js`.

```bash
npm run lint
npm run format
npm run typecheck
```

## Health endpoint

```http
GET /api/v1/health
```

```json
{
  "success": true,
  "message": "API is running"
}
```

## Project structure

```text
src/
├── config/          env, MongoDB connection, logger
├── modules/         feature modules (users, auth, and so on) added later
├── common/          errors, middleware, response helper, constants
├── routes/          API route registration
├── app.ts           Express app (no HTTP listen)
└── server.ts        config, database, HTTP server, graceful shutdown
```

Request flow for future features:

```text
Request → Routes → Middleware → Controller → Service → Repository → Mongoose → MongoDB
```
