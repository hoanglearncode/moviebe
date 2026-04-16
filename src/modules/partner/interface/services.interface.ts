import { IRepository } from "../../../share";
import { CreateServiceDTO, UpdateServiceDTO } from "../model/dto";
import { PagingDTO } from "../../../share";
import { Services } from "../model/model";

export interface IPartnerServicesUseCase {
  list(cond: any, paging: PagingDTO): Promise<any>;
  findByCond(cond: any): Promise<any>;
  insert(data: CreateServiceDTO): Promise<boolean>;
  update(id: string, data: UpdateServiceDTO): Promise<boolean>;
  delete(id: string, isHard: boolean): Promise<boolean>;
  findById(id: string): Promise<Services | null>;
}

export interface IPartnerServiceRepository extends IRepository<Services, any, UpdateServiceDTO> {}
