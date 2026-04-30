import { CreateServiceDTO, UpdateServiceDTO } from "@/modules/partner/model/dto";
import { PagingDTO } from "@/share";
import { Services, AdminServiceRow } from "@/modules/partner/model/model";

export interface AdminServiceListQuery {
  page?: number;
  limit?: number;
  keyword?: string;
  category?: string;
}

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
  // Admin
  listAll(query: AdminServiceListQuery): Promise<{ items: AdminServiceRow[]; total: number }>;
}
