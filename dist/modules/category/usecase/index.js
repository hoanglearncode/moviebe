import { ErrDataNotFound } from "@/share/model/base-error";
import { ModelStatus } from "@/share/model/base-model";
import { v7 } from "uuid";
import { CategoryCondDTOSchema, CategoryCreateSchema, CategoryUpdateSchema, } from "@/modules/category/model/dto";
import { ErrCategoryNameTooShort } from "@/modules/category/model/errors";
export class CategoryUseCase {
    constructor(repository) {
        this.repository = repository;
    }
    async create(data) {
        const { success, data: parsedData, error } = CategoryCreateSchema.safeParse(data);
        if (error) {
            // TODO: process error
            const issues = error.issues;
            for (const issue of issues) {
                if (issue.path[0] === "name") {
                    throw ErrCategoryNameTooShort;
                }
            }
            throw error;
        }
        const newId = v7();
        const category = {
            id: newId,
            name: parsedData.name,
            slug: parsedData.slug,
            position: 0,
            image: parsedData.image,
            description: parsedData.description,
            parentId: parsedData.parentId ?? null,
            status: ModelStatus.ACTIVE,
            createdAt: new Date(),
            updatedAt: new Date(),
        };
        await this.repository.insert(category);
        return newId;
    }
    async getDetail(id) {
        const data = await this.repository.get(id);
        if (!data || data.status === ModelStatus.DELETED) {
            throw ErrDataNotFound;
        }
        return data;
    }
    async list(cond, paging) {
        const parsedCond = CategoryCondDTOSchema.parse(cond);
        const data = await this.repository.list(parsedCond, paging);
        return data;
    }
    async update(id, data) {
        const category = await this.repository.get(id);
        if (!category || category.status === ModelStatus.DELETED) {
            throw ErrDataNotFound;
        }
        const updateData = CategoryUpdateSchema.parse(data);
        return await this.repository.update(id, updateData);
    }
    async delete(id) {
        const category = await this.repository.get(id);
        if (!category || category.status === ModelStatus.DELETED) {
            throw ErrDataNotFound;
        }
        return await this.repository.delete(id, false);
    }
}
