import { BaseCommandRepositoryPrisma, BaseQueryRepositoryPrisma, BaseRepositoryPrisma, } from "@/share/repository/repo-prisma";
import { getCategoryModel } from "@/modules/category/infras/repository/dto";
// implement ORM here (Prisma)
export class PrismaCategoryRepository extends BaseRepositoryPrisma {
    constructor(prisma) {
        const model = getCategoryModel(prisma);
        super(new PrismaCategoryQueryRepository(model), new PrismaCategoryCommandRepository(model));
    }
}
export class PrismaCategoryQueryRepository extends BaseQueryRepositoryPrisma {
    constructor(model) {
        super(model);
    }
}
export class PrismaCategoryCommandRepository extends BaseCommandRepositoryPrisma {
    constructor(model) {
        super(model);
    }
}
export const createCategoryRepository = (prisma) => new PrismaCategoryRepository(prisma);
