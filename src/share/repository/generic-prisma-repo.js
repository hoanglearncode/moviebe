"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BaseRepositoryPrisma = exports.BaseCommandRepositoryPrisma = exports.BaseQueryRepositoryPrisma = void 0;
const base_model_1 = require("../model/base-model");
class BaseQueryRepositoryPrisma {
    constructor(model, options = {}) {
        this.model = model;
        this.options = options;
    }
    async get(id) {
        return this.model.findUnique({ where: { id } });
    }
    async findByCond(cond) {
        return this.model.findFirst({ where: cond });
    }
    async list(cond, paging) {
        const { page, limit } = paging;
        const where = this.buildWhere(cond);
        if (this.model.count) {
            paging.total = await this.model.count({ where });
        }
        return this.model.findMany({
            where,
            skip: (page - 1) * limit,
            take: limit,
            orderBy: this.options.orderBy ?? { createdAt: "desc" },
        });
    }
    buildWhere(cond) {
        const where = { ...cond };
        const softDelete = this.options.softDelete === undefined
            ? { field: "status", deletedValue: base_model_1.ModelStatus.DELETED }
            : this.options.softDelete;
        if (!softDelete) {
            return where;
        }
        return {
            ...where,
            [softDelete.field]: { not: softDelete.deletedValue },
        };
    }
}
exports.BaseQueryRepositoryPrisma = BaseQueryRepositoryPrisma;
class BaseCommandRepositoryPrisma {
    constructor(model, options = {}) {
        this.model = model;
        this.options = options;
    }
    async insert(data) {
        await this.model.create({ data: data });
        return true;
    }
    async update(id, data) {
        await this.model.update({
            where: { id },
            data: this.withUpdatedAt(data),
        });
        return true;
    }
    async delete(id, isHard = false) {
        const softDelete = this.options.softDelete === undefined
            ? { field: "status", deletedValue: base_model_1.ModelStatus.DELETED }
            : this.options.softDelete;
        if (!isHard && softDelete) {
            await this.model.update({
                where: { id },
                data: this.withUpdatedAt({
                    [softDelete.field]: softDelete.deletedValue,
                }),
            });
        }
        else {
            await this.model.delete({ where: { id } });
        }
        return true;
    }
    withUpdatedAt(data) {
        if (this.options.touchUpdatedAt === false) {
            return data;
        }
        return {
            ...data,
            updatedAt: new Date(),
        };
    }
}
exports.BaseCommandRepositoryPrisma = BaseCommandRepositoryPrisma;
class BaseRepositoryPrisma {
    constructor(queryRepo, cmdRepo) {
        this.queryRepo = queryRepo;
        this.cmdRepo = cmdRepo;
    }
    async get(id) {
        return this.queryRepo.get(id);
    }
    async findByCond(cond) {
        return this.queryRepo.findByCond(cond);
    }
    async list(cond, paging) {
        return this.queryRepo.list(cond, paging);
    }
    async insert(data) {
        return this.cmdRepo.insert(data);
    }
    async update(id, data) {
        return this.cmdRepo.update(id, data);
    }
    async delete(id, isHard = false) {
        return this.cmdRepo.delete(id, isHard);
    }
}
exports.BaseRepositoryPrisma = BaseRepositoryPrisma;
