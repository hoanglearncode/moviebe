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
import { v7 } from "uuid";

export class ServicePartnerUser implements IPartnerServicesUseCase {
  constructor(private readonly partnerRepo: IPartnerServiceRepository) {}

  async list(cond: any, paging: PagingDTO): Promise<any> {
    const parsedCond = ServiceCondDTOSchema.parse(cond);

    const data = await this.partnerRepo.list(parsedCond, paging);
    return data;
  }
  async findByCond(cond: any): Promise<any> {
    const parsedCond = ServiceCondDTOSchema.parse(cond);

    const data = await this.partnerRepo.findByCond(parsedCond);
    return data;
  }
  async insert(data: CreateServiceDTO): Promise<boolean> {
    const { success, data: parsedData, error } = CreateServicePayloadDTO.safeParse(data);

    if (error) {
      // TODO: process error
      const issues = (error as ZodError).issues;

      for (const issue of issues) {
        if (issue.path[0] === "name") {
          throw ErrCategoryNameTooShort;
        }
      }

      throw error;
    }

    const newId = v7();

    const category: Services = {
      id: newId,
      name: parsedData!.name,
      price: parsedData!.price,
      category: parsedData!.category,
      icon: parsedData.icon,
    };

    await this.partnerRepo.insert(category);

    return !newId;
  }
  async update(id: string, data: UpdateServiceDTO): Promise<boolean> {
    const category = await this.partnerRepo.get(id);
    if (!category) {
      return false;
    }
    const updateData = UpdateServicePayloadDTO.parse(data);
    return await this.partnerRepo.update(id, updateData);
  }
  async delete(id: string, isHard: boolean): Promise<boolean> {
    const category = await this.partnerRepo.get(id);
    return await this.partnerRepo.delete(id, false);
  }

  async findById(id: string): Promise<Services | null> {
    return await this.partnerRepo.get(id);
  }
}
