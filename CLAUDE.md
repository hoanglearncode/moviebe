# CLAUDE.md - Backend (Express 5 + TypeScript)

Stack: Express 5, TypeScript 5.9, Prisma 6, BullMQ 5, Redis, Winston, Zod 4

> Shared rules (security, naming, behavior): see `../.claude/CLAUDE.md`

---

## Core architecture (SOLID + Hexagonal)

This backend is not Controller-Service in the classic layered style.
Current codebase follows Hexagonal architecture with clear ports/adapters.

Runtime flow:

`HTTP Request -> Express Router -> Transport Adapter (HttpService) -> UseCase (application core) -> Port Interfaces -> Infrastructure Adapters (Prisma, token, mail, social, queue)`

SOLID mapping in this codebase:

1. `S` (Single Responsibility):
   - `usecase/*`: business rules only.
   - `infras/transport/*`: HTTP mapping only.
   - `infras/repository/*`: persistence mapping only.
2. `O` (Open/Closed):
   - Add new adapters by implementing interfaces in `interface/index.ts` without rewriting use case core.
3. `L` (Liskov):
   - Adapters must satisfy contract of ports (`IAuthUserRepository`, `ITokenService`, ...).
4. `I` (Interface Segregation):
   - Small role-focused interfaces instead of one giant dependency contract.
5. `D` (Dependency Inversion):
   - Use case depends on interfaces; concrete implementations are wired in `setup*Hexagon`.

---

## Module anatomy (standard in this project)

Example: `src/modules/auth`

```
auth/
|- index.ts                    # composition root (build hexagon + router)
|- interface/                  # ports (input + output contracts)
|- usecase/                    # application core
|- model/                      # dto/schema/domain model
|- infras/
|  |- transport/               # HTTP adapter (Express handlers)
|  `- repository/              # persistence adapter (Prisma)
`- shared/                     # domain services/adapters (token, hash, social, notification)
```

Required responsibilities:

- `index.ts`: wire dependencies and expose router (`setupAuthHexagon`, `setupAuthHexagonWithUseCase`).
- `usecase`: validate input and orchestrate business flow.
- `interface`: define all ports for dependency injection.
- `infras/transport`: convert request metadata to use case input/output.
- `infras/repository`: map between Prisma model and domain model.

---

## Composition root pattern

Follow pattern used in:

- `src/modules/auth/index.ts`
- `src/modules/category/index.ts`

Rules:

1. Build concrete adapters in module root.
2. Inject them into use case via dependency object.
3. Bind HTTP handlers in one router factory.
4. Export `setup*Hexagon(...)` for app bootstrap (`src/index.ts`).

Do not instantiate infra dependencies directly inside use case methods.

---

## UseCase rules (application core)

Use case is the only place for business logic:

- Validate DTO with Zod payload schemas (`safeParse` or `parse`).
- Throw domain/application errors from `share/transport/http-server.ts` (`ValidationError`, `UnauthorizedError`, `NotFoundError`, `ConflictError`).
- Use ports from `interface/index.ts`, not Prisma client directly.
- Keep id generation and business state transitions in use case.
- Use `concurrentLockService` for race-sensitive actions (register/login/social login).

Reference: `src/modules/auth/usecase/index.ts`.

---

## Transport adapter rules (HTTP)

HTTP layer in this project is `*HttpService` classes, not standalone controllers.

Rules:

1. Transport reads request data (`body`, `params`, headers, client IP, user-agent).
2. Transport calls use case methods.
3. Transport never contains business decisions.
4. Prefer `BaseHttpService.handleRequest(...)` for consistent success/error envelope.

Reference:

- `src/modules/auth/infras/transport/http-service.ts`
- `src/share/transport/http-server.ts`

---

## Repository adapter rules (Prisma)

Repository adapters implement module ports and convert data both ways:

- Prisma row -> domain model (`toAuthUser`)
- domain model -> Prisma input (`toCreateInput`, `toUpdateInput`)

Rules:

1. No business decisions in repository.
2. Keep mapping logic explicit and typed.
3. Return domain entity shape expected by use case.

Reference: `src/modules/auth/infras/repository/repo.ts`.

---

## AuthN/AuthZ and guards

Use shared auth middleware in `src/share/middleware/auth.ts`:

- `protect(...)` for authenticated + active user.
- `requireRole(...)`, `requirePermission(...)`, `requireAnyPermission(...)`.
- `requireSelfOrPermission(...)` for ownership checks.

Never duplicate JWT verification logic inside module transport/usecase.

---

## Validation strategy

Validation is schema-first in module DTO files (`model/dto.ts`), then enforced in use case.

Rules:

1. Define payload DTO schemas with Zod in module `model`.
2. Parse/validate at use case boundary.
3. Surface validation errors through `ValidationError`.

Do not rely on ad-hoc field checks scattered across transport/repository.

---

## Error and response contract

Central error classes and base response helpers live in:

- `src/share/transport/http-server.ts`

Preferred contract:

```ts
// success
{ success: true, data: T, paging?: PagingDTO | null, message?: string }

// app error
{ code: ErrorCode, message: string, details?: unknown }
```

Rules:

1. Do not leak stack traces to clients.
2. Convert unexpected errors to generic internal error.
3. Keep module handlers aligned with `BaseHttpService` envelope.

---

## Logging

Use Winston logger from:

- `src/modules/system/log/logger.ts`

Rules:

1. Use structured logs (`logger.info/error/warn` with metadata object).
2. Do not introduce `console.log` in new code.
3. Include context fields (`userId`, `requestId`, `module`, `action`) where possible.

---

## Queue and async jobs

Background tasks must run through BullMQ infrastructure:

- `src/queue/*`

Rules:

1. No `setTimeout`/in-memory timers for business jobs.
2. Use queue config in `src/queue/config/config.ts`.
3. Keep queue side effects out of HTTP transport.

---

## Non-negotiables for this backend

1. New modules must follow `model/interface/usecase/infras/shared/index.ts` hexagon layout.
2. Use case depends on interfaces only (no direct Prisma in use case).
3. HTTP code stays in transport adapters, not in use case.
4. Data access stays in repository adapters, not in use case.
5. Validate all use case inputs via Zod DTO schemas.
6. Use shared app errors from `share/transport/http-server.ts`.
7. Use Winston logger, avoid console output in production paths.
8. Use BullMQ for background processing.
9. Keep dependency wiring in module `index.ts` and app bootstrap `src/index.ts`.
