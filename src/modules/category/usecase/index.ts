import { IRepository } from "@/share/interface";
import { ErrDataNotFound } from "@/share/model/base-error";
import { ModelStatus } from "@/share/model/base-model";
import { PagingDTO } from "@/share/model/paging";
import { v7 } from "uuid";
import { ZodError } from "zod";
import { ICategoryUseCase } from "@/modules/category/interface";
import {
  CategoryCondDTO,
  CategoryCondDTOSchema,
  CategoryCreateDTO,
  CategoryCreateSchema,
  CategoryUpdateDTO,
  CategoryUpdateSchema,
} from "@/modules/category/model/dto";
import { ErrCategoryNameTooShort } from "@/modules/category/model/errors";
import { Category } from "@/modules/category/model/model";

export class CategoryUseCase implements ICategoryUseCase {
  constructor(
    private readonly repository: IRepository<Category, CategoryCondDTO, CategoryUpdateDTO>,
  ) {}

  async create(data: CategoryCreateDTO): Promise<string> {
    const { success, data: parsedData, error } = CategoryCreateSchema.safeParse(data);

    if (error) {
      // TODO: process error
      const issues = (error as ZodError).issues;

      for (const issue of issues) {
        if (issue.path[0] === "name") {
          throw ErrCategoryNameTooShort;
        }
      }

      throw error;
    }

    const newId = v7();

    const category: Category = {
      id: newId,
      name: parsedData!.name,
      slug: parsedData!.slug,
      position: 0,
      image: parsedData!.image,
      description: parsedData!.description,
      parentId: parsedData!.parentId ?? null,
      status: ModelStatus.ACTIVE,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await this.repository.insert(category);

    return newId;
  }

  async getDetail(id: string): Promise<Category | null> {
    const data = await this.repository.get(id);

    if (!data || data.status === ModelStatus.DELETED) {
      throw ErrDataNotFound;
    }

    return data;
  }

  async list(cond: CategoryCondDTO, paging: PagingDTO): Promise<Array<Category>> {
    const parsedCond = CategoryCondDTOSchema.parse(cond);

    const data = await this.repository.list(parsedCond, paging);
    return data;
  }

  async update(id: string, data: CategoryUpdateDTO): Promise<boolean> {
    const category = await this.repository.get(id);

    if (!category || category.status === ModelStatus.DELETED) {
      throw ErrDataNotFound;
    }

    const updateData = CategoryUpdateSchema.parse(data);

    return await this.repository.update(id, updateData);
  }

  async delete(id: string): Promise<boolean> {
    const category = await this.repository.get(id);

    if (!category || category.status === ModelStatus.DELETED) {
      throw ErrDataNotFound;
    }

    return await this.repository.delete(id, false);
  }
}
