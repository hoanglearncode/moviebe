import { ModelStatus } from "@/share/model/base-model";
export class BaseRepositoryPrisma {
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
    async delete(id, isHard) {
        return this.cmdRepo.delete(id, isHard);
    }
}
export class BaseQueryRepositoryPrisma {
    constructor(model) {
        this.model = model;
    }
    async get(id) {
        const data = await this.model.findUnique({
            where: { id },
        });
        return data ?? null;
    }
    async findByCond(cond) {
        const data = await this.model.findFirst({
            where: cond,
        });
        return data ?? null;
    }
    async list(cond, paging) {
        const { page, limit } = paging;
        const where = {
            ...cond,
            status: {
                not: ModelStatus.DELETED,
            },
        };
        const total = await this.model.count({ where });
        paging.total = total;
        const rows = await this.model.findMany({
            where,
            take: limit,
            skip: (page - 1) * limit,
            orderBy: {
                id: "desc",
            },
        });
        return rows;
    }
}
export class BaseCommandRepositoryPrisma {
    constructor(model) {
        this.model = model;
    }
    async insert(data) {
        await this.model.create({
            data: data,
        });
        return true;
    }
    async update(id, data) {
        await this.model.update({
            where: { id },
            data: data,
        });
        return true;
    }
    async delete(id, isHard = false) {
        if (!isHard) {
            await this.model.update({
                where: { id },
                data: {
                    status: ModelStatus.DELETED,
                },
            });
        }
        else {
            await this.model.delete({
                where: { id },
            });
        }
        return true;
    }
}
