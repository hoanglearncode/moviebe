import { CreateServiceDTO, UpdateServiceDTO } from "../model/dto";
import { PagingDTO } from "../../../share";
import { Services } from "../model/model";

export interface IPartnerServicesUseCase {
  list(partnerId: string, cond: any, paging: PagingDTO): Promise<{
    items: Services[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }>;
  findByCond(partnerId: string, cond: any): Promise<Services[]>;
  insert(partnerId: string, data: CreateServiceDTO): Promise<Services>;
  update(partnerId: string, id: number, data: UpdateServiceDTO): Promise<Services | null>;
  delete(partnerId: string, id: number, isHard: boolean): Promise<boolean>;
  findById(partnerId: string, id: number): Promise<Services | null>;
}

export interface IPartnerServiceRepository {
  get(partnerId: string, id: number): Promise<Services | null>;
  list(partnerId: string, cond: any, paging: PagingDTO): Promise<{
    items: Services[];
    total: number;
  }>;
  findByCond(partnerId: string, cond: any): Promise<Services[]>;
  insert(partnerId: string, data: CreateServiceDTO): Promise<Services>;
  update(partnerId: string, id: number, data: UpdateServiceDTO): Promise<Services>;
  delete(partnerId: string, id: number, isHard: boolean): Promise<boolean>;
  findById(partnerId: string, id: number): Promise<Services | null>;
}
