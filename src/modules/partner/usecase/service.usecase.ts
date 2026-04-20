import { PagingDTO } from "../../../share";
import { IPartnerServicesUseCase } from "../interface";
import { IPartnerServiceRepository } from "../interface/services.interface";
import {
  ServiceCondDTOSchema,
  CreateServiceDTO,
  UpdateServiceDTO,
  CreateServicePayloadDTO,
  UpdateServicePayloadDTO,
} from "../model/dto";
import { Services } from "../model/model";
import { ErrCategoryNameTooShort } from "../model/error";
import { ZodError } from "zod";

export class ServicePartnerUser implements IPartnerServicesUseCase {
  constructor(private readonly partnerRepo: IPartnerServiceRepository) {}

  async list(
    partnerId: string,
    cond: any,
    paging: PagingDTO,
  ): Promise<{
    items: Services[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const parsedCond = ServiceCondDTOSchema.parse(cond);
    const data = await this.partnerRepo.list(partnerId, parsedCond, paging);

    return {
      items: data.items,
      total: data.total,
      page: paging.page,
      limit: paging.limit,
      totalPages: Math.ceil(data.total / paging.limit),
    };
  }

  async findByCond(partnerId: string, cond: any): Promise<Services[]> {
    const parsedCond = ServiceCondDTOSchema.parse(cond);

    const data = await this.partnerRepo.findByCond(partnerId, parsedCond);
    return data;
  }

  async insert(partnerId: string, data: CreateServiceDTO): Promise<Services> {
    const { success, data: parsedData, error } = CreateServicePayloadDTO.safeParse(data);
    if (!success || error) {
      // TODO: process error
      const issues = (error as ZodError).issues;

      for (const issue of issues) {
        if (issue.path[0] === "name") {
          throw ErrCategoryNameTooShort;
        }
      }

      throw error;
    }

    return await this.partnerRepo.insert(partnerId, parsedData);
  }

  async update(partnerId: string, id: number, data: UpdateServiceDTO): Promise<Services | null> {
    const service = await this.partnerRepo.get(partnerId, id);
    if (!service) {
      return null;
    }

    const updateData = UpdateServicePayloadDTO.parse(data);
    return await this.partnerRepo.update(partnerId, id, updateData);
  }

  async delete(partnerId: string, id: number, isHard: boolean): Promise<boolean> {
    const service = await this.partnerRepo.get(partnerId, id);
    if (!service) {
      return false;
    }

    return await this.partnerRepo.delete(partnerId, id, isHard);
  }

  async findById(partnerId: string, id: number): Promise<Services | null> {
    return await this.partnerRepo.get(partnerId, id);
  }
}
