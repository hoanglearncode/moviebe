"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ServicesHttpService = void 0;
class ServicesHttpService {
    constructor(useCase) {
        this.useCase = useCase;
    }
    parseServiceId(rawId) {
        const id = Number(rawId);
        if (!Number.isInteger(id) || id <= 0) {
            throw new Error("Invalid service id");
        }
        return id;
    }
    async list(req, res) {
        try {
            const { page = 1, limit = 10, ...cond } = req.query;
            const partnerId = req.partnerId;
            const data = await this.useCase.list(partnerId, cond, {
                page: Number(page),
                limit: Number(limit),
            });
            return res.status(200).json({
                success: true,
                data,
            });
        }
        catch (error) {
            return res.status(400).json({
                success: false,
                message: error.message,
            });
        }
    }
    async findByCond(req, res) {
        try {
            const partnerId = req.partnerId;
            const data = await this.useCase.findByCond(partnerId, req.query);
            return res.status(200).json({
                success: true,
                data,
            });
        }
        catch (error) {
            return res.status(400).json({
                success: false,
                message: error.message,
            });
        }
    }
    async findById(req, res) {
        try {
            const { id } = req.params;
            const partnerId = req.partnerId;
            const data = await this.useCase.findById(partnerId, this.parseServiceId(id.toString()));
            if (!data) {
                return res.status(404).json({
                    success: false,
                    message: "Service not found",
                });
            }
            return res.status(200).json({
                success: true,
                data,
            });
        }
        catch (error) {
            return res.status(400).json({
                success: false,
                message: error.message,
            });
        }
    }
    async create(req, res) {
        try {
            const partnerId = req.partnerId;
            const data = await this.useCase.insert(partnerId, req.body);
            return res.status(201).json({
                success: true,
                data,
            });
        }
        catch (error) {
            return res.status(400).json({
                success: false,
                message: error.message,
            });
        }
    }
    async update(req, res) {
        try {
            const { id } = req.params;
            const partnerId = req.partnerId;
            const data = await this.useCase.update(partnerId, this.parseServiceId(id.toString()), req.body);
            if (!data) {
                return res.status(404).json({
                    success: false,
                    message: "Service not found",
                });
            }
            return res.status(200).json({
                success: true,
                data,
            });
        }
        catch (error) {
            return res.status(400).json({
                success: false,
                message: error.message,
            });
        }
    }
    async delete(req, res) {
        try {
            const { id } = req.params;
            const partnerId = req.partnerId;
            const success = await this.useCase.delete(partnerId, this.parseServiceId(id.toString()), false);
            if (!success) {
                return res.status(404).json({
                    success: false,
                    message: "Service not found",
                });
            }
            return res.status(200).json({
                success: true,
            });
        }
        catch (error) {
            return res.status(400).json({
                success: false,
                message: error.message,
            });
        }
    }
}
exports.ServicesHttpService = ServicesHttpService;
