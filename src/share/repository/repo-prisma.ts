import { ICommandRepository, IQueryRepository, IRepository } from "../interface";
import { ModelStatus } from "../model/base-model";
import { PagingDTO } from "../model/paging";

type PrismaQueryModel = {
  findUnique(args: { where: { id: string } }): Promise<unknown | null>;
  findFirst(args: { where: Record<string, unknown> }): Promise<unknown | null>;
  findMany(args: {
    where: Record<string, unknown>;
    take: number;
    skip: number;
    orderBy: Record<string, "asc" | "desc">;
  }): Promise<unknown[]>;
  count(args: { where: Record<string, unknown> }): Promise<number>;
};

type PrismaCommandModel = {
  create(args: { data: Record<string, unknown> }): Promise<unknown>;
  update(args: { where: { id: string }; data: Record<string, unknown> }): Promise<unknown>;
  delete(args: { where: { id: string } }): Promise<unknown>;
};

export abstract class BaseRepositoryPrisma<Entity, Cond, UpdateDTO> implements IRepository<
  Entity,
  Cond,
  UpdateDTO
> {
  constructor(
    readonly queryRepo: IQueryRepository<Entity, Cond>,
    readonly cmdRepo: ICommandRepository<Entity, UpdateDTO>,
  ) {}

  async get(id: string): Promise<Entity | null> {
    return this.queryRepo.get(id);
  }

  async findByCond(cond: Cond): Promise<Entity | null> {
    return this.queryRepo.findByCond(cond);
  }

  async list(cond: Cond, paging: PagingDTO): Promise<Array<Entity>> {
    return this.queryRepo.list(cond, paging);
  }

  async insert(data: Entity): Promise<boolean> {
    return this.cmdRepo.insert(data);
  }

  async update(id: string, data: UpdateDTO): Promise<boolean> {
    return this.cmdRepo.update(id, data);
  }

  async delete(id: string, isHard: boolean): Promise<boolean> {
    return this.cmdRepo.delete(id, isHard);
  }
}

export abstract class BaseQueryRepositoryPrisma<Entity, Cond> implements IQueryRepository<
  Entity,
  Cond
> {
  constructor(protected readonly model: PrismaQueryModel) {}

  async get(id: string): Promise<Entity | null> {
    const data = await this.model.findUnique({
      where: { id },
    });

    return (data as Entity | null) ?? null;
  }

  async findByCond(cond: Cond): Promise<Entity | null> {
    const data = await this.model.findFirst({
      where: cond as Record<string, unknown>,
    });

    return (data as Entity | null) ?? null;
  }

  async list(cond: Cond, paging: PagingDTO): Promise<Entity[]> {
    const { page, limit } = paging;

    const where = {
      ...(cond as Record<string, unknown>),
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

    return rows as Entity[];
  }
}

export abstract class BaseCommandRepositoryPrisma<Entity, UpdateDTO> implements ICommandRepository<
  Entity,
  UpdateDTO
> {
  constructor(protected readonly model: PrismaCommandModel) {}

  async insert(data: Entity): Promise<boolean> {
    await this.model.create({
      data: data as Record<string, unknown>,
    });
    return true;
  }

  async update(id: string, data: UpdateDTO): Promise<boolean> {
    await this.model.update({
      where: { id },
      data: data as Record<string, unknown>,
    });
    return true;
  }

  async delete(id: string, isHard: boolean = false): Promise<boolean> {
    if (!isHard) {
      await this.model.update({
        where: { id },
        data: {
          status: ModelStatus.DELETED,
        },
      });
    } else {
      await this.model.delete({
        where: { id },
      });
    }

    return true;
  }
}
