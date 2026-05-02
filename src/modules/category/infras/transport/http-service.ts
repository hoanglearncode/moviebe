import { ICategoryUseCase } from "@/modules/category/interface";
import {
  CategoryCondDTO,
  CategoryCondDTOSchema,
  CategoryCreateDTO,
  CategoryUpdateDTO,
} from "@/modules/category/model/dto";
import { Category } from "@/modules/category/model/model";
import { BaseHttpService } from "@/share/transport/http-server";
import { Request, Response } from "express";

export class CategoryHttpService extends BaseHttpService<
  Category,
  CategoryCreateDTO,
  CategoryUpdateDTO,
  CategoryCondDTO
> {
  constructor(useCase: ICategoryUseCase) {
    super(useCase);
  }

  async listAPI(req: Request, res: Response) {
    try {
      const paging = {
        page: 1,
        limit: 200,
      };

      const cond = CategoryCondDTOSchema.parse(req.query);

      const result = await this.useCase.list(req.query, paging);

      const categoriesTree = this.buildTree(result);

      res.status(200).json({ data: categoriesTree, paging, filter: cond });
    } catch (error) {
      res.status(400).json({
        message: (error as Error).message,
      });
    }
  }

  private buildTree(categories: Category[]): Category[] {
    const categoriesTree: Category[] = [];
    const mapChildren = new Map<string, Category[]>();

    for (let i = 0; i < categories.length; i++) {
      const category = categories[i];

      if (!mapChildren.get(category.id)) {
        mapChildren.set(category.id, []);
      }

      category.children = mapChildren.get(category.id);

      if (!category.parentId) {
        categoriesTree.push(category);
      } else {
        const children = mapChildren.get(category.parentId);
        children ? children.push(category) : mapChildren.set(category.parentId, [category]);
      }
    }

    return categoriesTree;
  }
}
