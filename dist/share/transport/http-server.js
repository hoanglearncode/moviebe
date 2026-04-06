"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BaseHttpService = void 0;
const paging_1 = require("../model/paging");
class BaseHttpService {
    constructor(useCase) {
        this.useCase = useCase;
    }
    async createAPI(req, res) {
        try {
            const result = await this.useCase.create(req.body);
            res.status(201).json({ data: result });
        }
        catch (error) {
            res.status(400).json({
                message: error.message,
            });
        }
    }
    async getDetailAPI(req, res) {
        try {
            const { id } = req.params;
            const result = await this.useCase.getDetail(id.toString());
            res.status(200).json({ data: result });
        }
        catch (error) {
            res.status(400).json({
                message: error.message,
            });
        }
    }
    async updateAPI(req, res) {
        try {
            const { id } = req.params;
            const result = await this.useCase.update(id, req.body);
            res.status(200).json({ data: result });
        }
        catch (error) {
            res.status(400).json({
                message: error.message,
            });
        }
    }
    async deleteAPI(req, res) {
        try {
            const { id } = req.params;
            const result = await this.useCase.delete(id.toString());
            res.status(200).json({ data: result });
        }
        catch (error) {
            res.status(400).json({
                message: error.message,
            });
        }
    }
    async listAPI(req, res) {
        try {
            const { success, data: paging, error } = paging_1.PagingDTOSchema.safeParse(req.query);
            if (!success) {
                res.status(400).json({
                    message: 'Invalid paging',
                    error: error.message,
                });
                return;
            }
            const result = await this.useCase.list(req.query, paging);
            res.status(200).json({ data: result, paging, filter: req.query });
        }
        catch (error) {
            res.status(400).json({
                message: error.message,
            });
        }
    }
}
exports.BaseHttpService = BaseHttpService;
