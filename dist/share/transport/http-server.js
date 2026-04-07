"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BaseHttpService = exports.UnauthorizedError = exports.NotFoundError = exports.ValidationError = void 0;
const paging_1 = require("../model/paging");
class ValidationError extends Error {
    constructor(message, details) {
        super(message);
        this.details = details;
        this.name = "ValidationError";
    }
}
exports.ValidationError = ValidationError;
class NotFoundError extends Error {
    constructor(resource) {
        super(`${resource} not found`);
        this.name = "NotFoundError";
    }
}
exports.NotFoundError = NotFoundError;
class UnauthorizedError extends Error {
    constructor(message = "Unauthorized") {
        super(message);
        this.name = "UnauthorizedError";
    }
}
exports.UnauthorizedError = UnauthorizedError;
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
        if (error instanceof ValidationError) {
            res.status(400).json({
                message: error.message,
                details: error.details
            });
            return;
        }
        if (error instanceof NotFoundError) {
            res.status(404).json({
                message: error.message
            });
            return;
        }
        if (error instanceof UnauthorizedError) {
            res.status(401).json({
                message: error.message
            });
            return;
        }
        console.error("Unhandled error:", error);
        res.status(500).json({
            message: "Internal server error"
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
