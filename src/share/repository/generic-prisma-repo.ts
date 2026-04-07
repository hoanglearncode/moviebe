import { IRepository, IQueryRepository, ICommandRepository } from "../interface";
import { ModelStatus } from "../model/base-model";
import { PagingDTO } from "../model/paging";

type PrismaWhere = Record<string, unknown>;
type PrismaData = Record<string, unknown>;
type PrismaOrderBy = Record<string, "asc" | "desc">;

type PrismaModel = {
  findUnique(args: { where: { id: string } | PrismaWhere }): Promise<any>;
  findFirst(args: { where: PrismaWhere }): Promise<any>;
  findMany(args: {
    where: PrismaWhere;
    take: number;
    skip: number;
    orderBy?: PrismaOrderBy;
  }): Promise<any[]>;
  count?(args: { where: PrismaWhere }): Promise<number>;
  create(args: { data: PrismaData }): Promise<any>;
  update(args: { where: { id: string } | PrismaWhere; data: PrismaData }): Promise<any>;
  delete(args: { where: { id: string } }): Promise<any>;
};

type RepositoryOptions = {
  orderBy?: PrismaOrderBy;
  softDelete?:
    | false
    | {
        field: string;
        deletedValue: unknown;
      };
  touchUpdatedAt?: boolean;
};

export class BaseQueryRepositoryPrisma<Entity>
  implements IQueryRepository<Entity, Partial<Entity>>
{
  constructor(
    private readonly model: PrismaModel,
    private readonly options: RepositoryOptions = {}
  ) {}

  async get(id: string): Promise<Entity | null> {
    return this.model.findUnique({ where: { id } });
  }

  async findByCond(cond: Partial<Entity>): Promise<Entity | null> {
    return this.model.findFirst({ where: cond as unknown as PrismaWhere });
  }

  async list(cond: Partial<Entity>, paging: PagingDTO): Promise<Array<Entity>> {
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

  private buildWhere(cond: Partial<Entity>): PrismaWhere {
    const where = { ...(cond as unknown as PrismaWhere) };
    const softDelete =
      this.options.softDelete === undefined
        ? { field: "status", deletedValue: ModelStatus.DELETED }
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

export class BaseCommandRepositoryPrisma<Entity, UpdateDTO>
  implements ICommandRepository<Entity, UpdateDTO>
{
  constructor(
    private readonly model: PrismaModel,
    private readonly options: RepositoryOptions = {}
  ) {}

  async insert(data: Entity): Promise<boolean> {
    await this.model.create({ data: data as unknown as PrismaData });
    return true;
  }

  async update(id: string, data: UpdateDTO): Promise<boolean> {
    await this.model.update({
      where: { id },
      data: this.withUpdatedAt(data),
    });
    return true;
  }

  async delete(id: string, isHard: boolean = false): Promise<boolean> {
    const softDelete =
      this.options.softDelete === undefined
        ? { field: "status", deletedValue: ModelStatus.DELETED }
        : this.options.softDelete;

    if (!isHard && softDelete) {
      await this.model.update({
        where: { id },
        data: this.withUpdatedAt({
          [softDelete.field]: softDelete.deletedValue,
        }),
      });
    } else {
      await this.model.delete({ where: { id } });
    }

    return true;
  }

  private withUpdatedAt(data: UpdateDTO | PrismaData): PrismaData {
    if (this.options.touchUpdatedAt === false) {
      return data as PrismaData;
    }

    return {
      ...(data as PrismaData),
      updatedAt: new Date(),
    };
  }
}

export class BaseRepositoryPrisma<Entity, UpdateDTO>
  implements IRepository<Entity, Partial<Entity>, UpdateDTO>
{
  constructor(
    private readonly queryRepo: BaseQueryRepositoryPrisma<Entity>,
    private readonly cmdRepo: BaseCommandRepositoryPrisma<Entity, UpdateDTO>
  ) {}

  async get(id: string): Promise<Entity | null> {
    return this.queryRepo.get(id);
  }

  async findByCond(cond: Partial<Entity>): Promise<Entity | null> {
    return this.queryRepo.findByCond(cond);
  }

  async list(cond: Partial<Entity>, paging: PagingDTO): Promise<Array<Entity>> {
    return this.queryRepo.list(cond, paging);
  }

  async insert(data: Entity): Promise<boolean> {
    return this.cmdRepo.insert(data);
  }

  async update(id: string, data: UpdateDTO): Promise<boolean> {
    return this.cmdRepo.update(id, data);
  }

  async delete(id: string, isHard: boolean = false): Promise<boolean> {
    return this.cmdRepo.delete(id, isHard);
  }
}
