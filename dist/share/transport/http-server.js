"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BaseHttpService = exports.ConflictError = exports.ForbiddenError = exports.UnauthorizedError = exports.NotFoundError = exports.ValidationError = exports.AppError = void 0;
exports.successResponse = successResponse;
exports.errorResponse = errorResponse;
const paging_1 = require("../model/paging");
const error_code_1 = require("../model/error-code");
class AppError extends Error {
    constructor(message, code, status, details) {
        super(message);
        this.code = code;
        this.status = status;
        this.details = details;
        this.name = "AppError";
    }
}
exports.AppError = AppError;
class ValidationError extends AppError {
    constructor(message, details, code = error_code_1.ErrorCode.VALIDATION) {
        super(message, code, 400, details);
        this.name = "ValidationError";
    }
}
exports.ValidationError = ValidationError;
class NotFoundError extends AppError {
    constructor(resource, code = error_code_1.ErrorCode.NOT_FOUND) {
        super(`${resource} not found`, code, 404);
        this.name = "NotFoundError";
    }
}
exports.NotFoundError = NotFoundError;
class UnauthorizedError extends AppError {
    constructor(message = "Unauthorized", code = error_code_1.ErrorCode.UNAUTHORIZED) {
        super(message, code, 401);
        this.name = "UnauthorizedError";
    }
}
exports.UnauthorizedError = UnauthorizedError;
class ForbiddenError extends AppError {
    constructor(message = "Forbidden", code = error_code_1.ErrorCode.UNAUTHORIZED) {
        super(message, code, 403);
        this.name = "ForbiddenError";
    }
}
exports.ForbiddenError = ForbiddenError;
class ConflictError extends AppError {
    constructor(message = "Conflict", code = error_code_1.ErrorCode.CONCURRENT_TASK_LOCKED, details) {
        super(message, code, 409, details);
        this.name = "ConflictError";
    }
}
exports.ConflictError = ConflictError;
class BaseHttpService {
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
            res.status(successStatus).json({ data: result });
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
            code: error_code_1.ErrorCode.INTERNAL,
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
            const pagingResult = paging_1.PagingDTOSchema.safeParse(req.query);
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
exports.BaseHttpService = BaseHttpService;
/**
 * Send success response
 */
function successResponse(res, data, message = "Success", statusCode = 200) {
    res.status(statusCode).json({
        success: true,
        data,
        message,
    });
}
/**
 * Send error response
 */
function errorResponse(res, statusCode = 500, message = "Internal server error", code = error_code_1.ErrorCode.INTERNAL.toString(), details) {
    res.status(statusCode).json({
        success: false,
        error: {
            code,
            message,
            details,
        },
    });
}
