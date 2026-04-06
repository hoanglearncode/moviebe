"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CategoryUseCase = void 0;
const base_error_1 = require("../../../share/model/base-error");
const base_model_1 = require("../../../share/model/base-model");
const uuid_1 = require("uuid");
const dto_1 = require("../model/dto");
const errors_1 = require("../model/errors");
class CategoryUseCase {
    constructor(repository) {
        this.repository = repository;
    }
    async create(data) {
        const { success, data: parsedData, error } = dto_1.CategoryCreateSchema.safeParse(data);
        if (error) {
            // TODO: process error
            const issues = error.issues;
            for (const issue of issues) {
                if (issue.path[0] === 'name') {
                    throw errors_1.ErrCategoryNameTooShort;
                }
            }
            throw error;
        }
        const newId = (0, uuid_1.v7)();
        const category = {
            id: newId,
            name: parsedData.name,
            position: 0,
            image: parsedData.image,
            description: parsedData.description,
            status: base_model_1.ModelStatus.ACTIVE,
            createdAt: new Date(),
            updatedAt: new Date(),
        };
        await this.repository.insert(category);
        return newId;
    }
    async getDetail(id) {
        const data = await this.repository.get(id);
        if (!data || data.status === base_model_1.ModelStatus.DELETED) {
            throw base_error_1.ErrDataNotFound;
        }
        return data;
    }
    async list(cond, paging) {
        const parsedCond = dto_1.CategoryCondDTOSchema.parse(cond);
        const data = await this.repository.list(parsedCond, paging);
        return data;
    }
    async update(id, data) {
        const category = await this.repository.get(id);
        if (!category || category.status === base_model_1.ModelStatus.DELETED) {
            throw base_error_1.ErrDataNotFound;
        }
        const updateData = dto_1.CategoryUpdateSchema.parse(data);
        return await this.repository.update(id, updateData);
    }
    async delete(id) {
        const category = await this.repository.get(id);
        if (!category || category.status === base_model_1.ModelStatus.DELETED) {
            throw base_error_1.ErrDataNotFound;
        }
        return await this.repository.delete(id, false);
    }
}
exports.CategoryUseCase = CategoryUseCase;
