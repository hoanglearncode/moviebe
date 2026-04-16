import { PrismaClient } from "@prisma/client";
import { PagingDTO } from "../../../../share";
import { IPartnerServiceRepository } from "../../interface/services.interface";
import { Services } from "../../model/model";

export class Service implements IPartnerServiceRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async list(cond: any, paging: PagingDTO): Promise<any> {
    return [];
  }

  async findByCond(cond: any): Promise<any> {
    return null;
  }

  async insert(data: Services): Promise<boolean> {
    return true;
  }

  async update(
    id: string,
    data: {
      name?: string | undefined;
      price?: number | undefined;
      category?: string | undefined;
      icon?: string | null | undefined;
    },
  ) {
    return true;
  }

  async delete(id: string, isHard: boolean): Promise<boolean> {
    return true;
  }

  async get(id: string): Promise<Services | null> {
    return null;
  }
}

export const createServerRepository = (prisma: PrismaClient): IPartnerServiceRepository =>
  new Service(prisma);
