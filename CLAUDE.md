# CLAUDE.md — Backend (Express 5 + TypeScript)

Stack: Express 5 · TypeScript 5.9 · Prisma 6 · BullMQ 5 · Redis · Winston · Zod 4

> Shared rules (security, naming, behavior): xem `../.claude/CLAUDE.md`

---

## Architecture — phân tầng bắt buộc

```
Request → Router → Middleware (validate) → Controller → Service → Prisma/Queue
```

- **Controller**: chỉ handle HTTP request/response, delegate mọi logic xuống service
- **Service**: chứa toàn bộ business logic, không biết về HTTP
- **Middleware**: auth, validation, rate limiting
- **Queue**: background tasks — không dùng `setTimeout`

---

## Controller pattern

```typescript
// src/modules/product/product.controller.ts
import { Request, Response, NextFunction } from 'express';
import { productService } from './product.service';
import { asyncHandler } from '../../lib/asyncHandler';

export const createProduct = asyncHandler(async (req: Request, res: Response) => {
  // req.body đã validated bởi validateMiddleware trước khi vào đây
  const result = await productService.create(req.body, req.user!.id);
  res.status(201).json({ success: true, data: result });
});

export const getProduct = asyncHandler(async (req: Request, res: Response) => {
  const product = await productService.getById(req.params.id);
  res.json({ success: true, data: product });
});
```

## Service pattern

```typescript
// src/modules/product/product.service.ts
import { prisma } from '../../lib/prisma';
import { logger } from '../../lib/logger';
import type { CreateProductDto } from './product.schema';

export const productService = {
  async create(dto: CreateProductDto, sellerId: string) {
    const product = await prisma.product.create({
      data: { ...dto, sellerId },
      select: { id: true, name: true, price: true, slug: true },
    });
    logger.info('Product created', { productId: product.id, sellerId });
    return product;
  },

  async getById(id: string) {
    const product = await prisma.product.findUnique({
      where: { id, deletedAt: null },
      select: { id: true, name: true, price: true, slug: true, description: true },
    });
    if (!product) throw new NotFoundError('Product not found');
    return product;
  },
};
```

## Validation middleware

```typescript
// src/middleware/validate.middleware.ts
import { z } from 'zod';
import { Request, Response, NextFunction } from 'express';

export function validate(schema: z.ZodSchema) {
  return (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: result.error.flatten(),
      });
    }
    req.body = result.data;
    next();
  };
}
```

## Response format — chuẩn cho mọi endpoint

```typescript
// Success
{ success: true, data: T, message?: string }

// Paginated
{ success: true, data: T[], pagination: { page, limit, total, totalPages } }

// Error
{ success: false, error: string, code?: string }
// Không return stack trace trong production
```

## Error handling

```typescript
// src/lib/asyncHandler.ts
export const asyncHandler = (fn: Function) => (req: Request, res: Response, next: NextFunction) =>
  Promise.resolve(fn(req, res, next)).catch(next);

// src/middleware/error.middleware.ts
export function globalErrorHandler(err: Error, req: Request, res: Response, next: NextFunction) {
  logger.error('Unhandled error', { error: err.message, stack: err.stack, path: req.path });

  if (err instanceof NotFoundError) return res.status(404).json({ success: false, error: err.message });
  if (err instanceof ConflictError) return res.status(409).json({ success: false, error: err.message });
  if (err instanceof UnauthorizedError) return res.status(401).json({ success: false, error: err.message });

  const isProd = process.env.NODE_ENV === 'production';
  res.status(500).json({
    success: false,
    error: isProd ? 'Internal server error' : err.message,
  });
}
```

## Logging — Winston (không console.log)

```typescript
// src/lib/logger.ts
import winston from 'winston';

export const logger = winston.createLogger({
  level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json(),
  ),
  transports: [new winston.transports.Console()],
});

// ✅ Structured logging
logger.info('Order created', { orderId, userId, amount });
logger.error('Payment failed', { orderId, error: err.message });

// ❌ Không dùng
console.log('order:', order);
```

## Auth middleware

```typescript
// src/middleware/auth.middleware.ts
import jwt from 'jsonwebtoken';
import { ROLES } from '../shared/constants/roles';

export function authenticate(req: Request, res: Response, next: NextFunction) {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) return res.status(401).json({ success: false, error: 'No token' });

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET!) as JWTPayload;
    req.user = payload;
    next();
  } catch {
    res.status(401).json({ success: false, error: 'Invalid token' });
  }
}

export function authorize(...roles: Role[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!roles.includes(req.user!.role)) {
      return res.status(403).json({ success: false, error: 'Forbidden' });
    }
    next();
  };
}
```

---

## Non-negotiables BE

1. Mọi route phải qua `validate(schema)` middleware trước controller
2. Controller không chứa business logic — chỉ gọi service
3. Không `console.log` — dùng `logger` từ Winston
4. Không raw SQL — dùng Prisma (xem `.claude/rules/7-database/prisma.md`)
5. Mọi background task qua BullMQ — không `setTimeout` (xem `.claude/rules/7-database/bullmq.md`)
6. Rate limit cho auth endpoints
7. Không return stack trace trong production responses