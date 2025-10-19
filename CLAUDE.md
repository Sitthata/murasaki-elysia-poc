# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is **Murasaki Backend**, an Elysia-based REST API with Bun runtime that provides AI-powered prompt evaluation using OpenAI/OpenRouter. The project uses Prisma with PostgreSQL for database management and Prismabox for automatic TypeBox schema generation.

## Development Commands

### Running the Application
```bash
bun run dev                    # Start development server with hot reload on port 8080
```

### Database Management
```bash
docker compose up -d           # Start PostgreSQL database
npx prisma migrate dev         # Run database migrations
npx prisma db seed            # Seed database with initial data
npx prisma studio             # Open Prisma Studio (database GUI)
npx prisma generate           # Generate Prisma Client and Prismabox schemas
```

### Testing
```bash
bun test                      # Run Vitest tests
```

## Architecture

### Runtime & Framework
- **Runtime:** Bun (JavaScript runtime optimized for speed)
- **Framework:** Elysia (high-performance TypeScript framework with type safety)
- **Validation:** TypeBox via Elysia's `t` schema builder

### Database Layer
- **ORM:** Prisma with PostgreSQL
- **Schema Generator:** Prismabox - automatically generates TypeBox schemas from Prisma models
  - Generated files are in `prisma/prismabox/`
  - Prismabox uses Elysia's `t` import for schema validation
  - `inputModel = true` generates input validation schemas

### Project Structure
```
src/
  index.ts              # Application entry point, Elysia app initialization
  routes/
    verify.ts           # POST /api/verify - AI prompt evaluation endpoint
    todo.ts             # Todo CRUD endpoints (example/legacy)
prisma/
  schema.prisma         # Database schema and Prismabox configuration
  seed.ts              # Database seeding script
  prismabox/           # Auto-generated TypeBox schemas (ignored in git)
```

### Key Patterns

**Routing:** Routes are modularized using Elysia's plugin system with `.use()`. Each route file exports an Elysia instance with a prefix:
```typescript
export const routes = new Elysia({ prefix: "/api" })
  .post("/endpoint", handler, { body: t.Object({...}) })
```

**Database Access:** A singleton PrismaClient instance is exported from `src/index.ts` and imported as `{ prisma }` in route files.

**Request Validation:** Elysia's TypeBox integration validates request bodies declaratively:
```typescript
{
  body: t.Object({
    prompt: t.String(),
    model: t.String()
  })
}
```

**AI Integration:** The `/api/verify` endpoint uses OpenAI SDK configured with OpenRouter's base URL. It evaluates prompts against a rubric for clarity, context, constraints, and collaborative framing.

## Environment Configuration

Required environment variables in `.env.local`:
- `DATABASE_URL` - PostgreSQL connection string (format: `postgresql://user:password@localhost:5432/dbname`)
- `OPEN_AI_KEY` - OpenRouter API key for AI model access
- `DB_USERNAME`, `DB_PASSWORD`, `DB_NAME` - Used by docker-compose.yml

The `.env.local` file should never be committed (already in .gitignore).

## Important Notes

- TypeScript paths are configured to alias `@prisma/client` to `./generated/prisma` (tsconfig.json)
- Prisma Client is generated to `src/generated/prisma` (gitignored)
- The server runs on port 8080 by default
- Process cleanup: `beforeExit` event handler disconnects Prisma on shutdown
