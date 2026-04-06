"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createCategoryRepository = exports.PrismaCategoryCommandRepository = exports.PrismaCategoryQueryRepository = exports.PrismaCategoryRepository = void 0;
const repo_prisma_1 = require("../../../../share/repository/repo-prisma");
const dto_1 = require("./dto");
// implement ORM here (Prisma)
class PrismaCategoryRepository extends repo_prisma_1.BaseRepositoryPrisma {
    constructor(prisma) {
        const model = (0, dto_1.getCategoryModel)(prisma);
        super(new PrismaCategoryQueryRepository(model), new PrismaCategoryCommandRepository(model));
    }
}
exports.PrismaCategoryRepository = PrismaCategoryRepository;
class PrismaCategoryQueryRepository extends repo_prisma_1.BaseQueryRepositoryPrisma {
    constructor(model) {
        super(model);
    }
}
exports.PrismaCategoryQueryRepository = PrismaCategoryQueryRepository;
class PrismaCategoryCommandRepository extends repo_prisma_1.BaseCommandRepositoryPrisma {
    constructor(model) {
        super(model);
    }
}
exports.PrismaCategoryCommandRepository = PrismaCategoryCommandRepository;
const createCategoryRepository = (prisma) => new PrismaCategoryRepository(prisma);
exports.createCategoryRepository = createCategoryRepository;
