import { PagingDTOSchema } from "@/share/model/paging";
import { ErrorCode } from "@/share/model/error-code";
export class AppError extends Error {
    constructor(message, code, status, details) {
        super(message);
        this.code = code;
        this.status = status;
        this.details = details;
        this.name = "AppError";
    }
}
export class ValidationError extends AppError {
    constructor(message, details, code = ErrorCode.VALIDATION) {
        super(message, code, 400, details);
        this.name = "ValidationError";
    }
}
export class NotFoundError extends AppError {
    constructor(resource, code = ErrorCode.NOT_FOUND) {
        super(`${resource} not found`, code, 404);
        this.name = "NotFoundError";
    }
}
export class UnauthorizedError extends AppError {
    constructor(message = "Unauthorized", code = ErrorCode.UNAUTHORIZED) {
        super(message, code, 401);
        this.name = "UnauthorizedError";
    }
}
export class ForbiddenError extends AppError {
    constructor(message = "Forbidden", code = ErrorCode.UNAUTHORIZED) {
        super(message, code, 403);
        this.name = "ForbiddenError";
    }
}
export class ConflictError extends AppError {
    constructor(message = "Conflict", code = ErrorCode.CONCURRENT_TASK_LOCKED, details) {
        super(message, code, 409, details);
        this.name = "ConflictError";
    }
}
export class BaseHttpService {
    constructor(useCase) {
        this.useCase = useCase;
    }
    getRequiredId(value) {
        const id = Array.isArray(value) ? value[0] : value;
        if (!id) {
            throw new ValidationError("ID is required");
        }
        return id;
    }
    async handleRequest(res, operation, successStatus = 200) {
        try {
            const result = await operation();
            successResponse(res, result, "Success", successStatus);
        }
        catch (error) {
            this.handleError(error, res);
        }
    }
    handleError(error, res) {
        if (error instanceof AppError) {
            res.status(error.status).json({
                code: error.code,
                message: error.message,
                details: error.details,
            });
            return;
        }
        console.error("Unhandled error:", error);
        res.status(500).json({
            code: ErrorCode.INTERNAL,
            message: "Internal server error",
        });
    }
    async createAPI(req, res) {
        await this.handleRequest(res, () => this.useCase.create(req.body), 201);
    }
    async getDetailAPI(req, res) {
        await this.handleRequest(res, () => {
            return this.useCase.getDetail(this.getRequiredId(req.params.id));
        });
    }
    async listAPI(req, res) {
        await this.handleRequest(res, async () => {
            const pagingResult = PagingDTOSchema.safeParse(req.query);
            if (!pagingResult.success) {
                throw new ValidationError("Invalid paging parameters", pagingResult.error.issues);
            }
            const cond = req.query;
            return this.useCase.list(cond, pagingResult.data);
        });
    }
    async updateAPI(req, res) {
        await this.handleRequest(res, () => {
            return this.useCase.update(this.getRequiredId(req.params.id), req.body);
        });
    }
    async deleteAPI(req, res) {
        await this.handleRequest(res, () => {
            return this.useCase.delete(this.getRequiredId(req.params.id));
        });
    }
}
/**
 * Send success response
 */
export function successResponse(res, data, message = "Success", statusCode = 200, paging = null) {
    res.status(statusCode).json({
        success: true,
        data,
        paging,
        message,
    });
}
/**
 * Send error response
 */
export function errorResponse(res, statusCode = 500, message = "Internal server error", code = ErrorCode.INTERNAL.toString(), details) {
    res.status(statusCode).json({
        success: false,
        error: {
            code,
            message,
            details,
        },
    });
}
