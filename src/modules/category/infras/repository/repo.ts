import { CategoryCondDTO, CategoryUpdateDTO } from "@/modules/category/model/dto";
import { Category } from "@/modules/category/model/model";
import {
  BaseCommandRepositoryPrisma,
  BaseQueryRepositoryPrisma,
  BaseRepositoryPrisma,
} from "@/share/repository/repo-prisma";
import { PrismaClient } from "@prisma/client";
import { getCategoryModel } from "@/modules/category/infras/repository/dto";

// implement ORM here (Prisma)

export class PrismaCategoryRepository extends BaseRepositoryPrisma<
  Category,
  CategoryCondDTO,
  CategoryUpdateDTO
> {
  constructor(prisma: PrismaClient) {
    const model = getCategoryModel(prisma);

    super(new PrismaCategoryQueryRepository(model), new PrismaCategoryCommandRepository(model));
  }
}

export class PrismaCategoryQueryRepository extends BaseQueryRepositoryPrisma<
  Category,
  CategoryCondDTO
> {
  constructor(model: ReturnType<typeof getCategoryModel>) {
    super(model);
  }
}

export class PrismaCategoryCommandRepository extends BaseCommandRepositoryPrisma<
  Category,
  CategoryUpdateDTO
> {
  constructor(model: ReturnType<typeof getCategoryModel>) {
    super(model);
  }
}

export const createCategoryRepository = (prisma: PrismaClient) =>
  new PrismaCategoryRepository(prisma);
