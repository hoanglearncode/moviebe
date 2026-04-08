import { Prisma, PrismaClient, UserStatus, Role } from "@prisma/client";
import { IAuthUserRepository } from "../../interface";
import { AuthUser } from "../../model/model";
import { PagingDTO } from "../../../../share/model/paging";
import { getUserModel } from "./dto";

export class PrismaAuthUserRepository implements IAuthUserRepository {
  private readonly model;

  constructor(prisma: PrismaClient) {
    this.model = getUserModel(prisma);
  }

  async get(id: string): Promise<AuthUser | null> {
    return this.model.findUnique({ where: { id } });
  }

  async findByCond(cond: Partial<AuthUser>): Promise<AuthUser | null> {
    return this.model.findFirst({ where: cond as Prisma.UserWhereInput });
  }

  async list(cond: Partial<AuthUser>, paging: PagingDTO): Promise<AuthUser[]> {
    const { page, limit } = paging;

    const where = cond as Prisma.UserWhereInput;
    paging.total = await this.model.count({ where });

    return this.model.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { createdAt: "desc" },
    });
  }

  async insert(data: AuthUser): Promise<boolean> {
    await this.model.create({ data });
    return true;
  }

  async update(id: string, data: Partial<AuthUser>): Promise<boolean> {
    await this.model.update({ where: { id }, data: { ...data, updatedAt: new Date() } });
    return true;
  }

  async delete(id: string, isHard: boolean = false): Promise<boolean> {
    if (isHard) {
      await this.model.delete({ where: { id } });
    } else {
      await this.model.update({
        where: { id },
        data: { status: UserStatus.INACTIVE, updatedAt: new Date() }
      });
    }
    return true;
  }

  async findByEmail(email: string): Promise<AuthUser | null> {
    return this.model.findUnique({ where: { email } });
  }

  async findByUsername(username: string): Promise<AuthUser | null> {
    return this.model.findFirst({ where: { username } });
  }

  async findByEmailOrUsername(identifier: string): Promise<AuthUser | null> {
    return this.model.findFirst({
      where: {
        OR: [
          { email: identifier },
          { username: identifier }
        ]
      }
    });
  }

  async markVerified(userId: string): Promise<boolean> {
    await this.model.update({
      where: { id: userId },
      data: { emailVerified: true, updatedAt: new Date() }
    });
    return true;
  }

  async updatePassword(userId: string, passwordHash: string): Promise<boolean> {
    await this.model.update({
      where: { id: userId },
      data: { password: passwordHash, updatedAt: new Date() }
    });
    return true;
  }
}

export const createAuthUserRepository = (prisma: PrismaClient) =>
  new PrismaAuthUserRepository(prisma);
