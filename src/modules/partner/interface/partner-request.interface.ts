import { PagingDTO } from "../../../share";
import {
  RegisterPartnerDTO,
  RequestCondDTO,
  SubmitPartnerRequestInput,
  UpdatePartnerDTO,
} from "../model/dto";
import {
  MyPartnerStatusResponse,
  PartnerRequestRow,
  PartnerRequestUpdateInput,
} from "../model/model";

export interface IPartnerRequestRepository {
  create(data: SubmitPartnerRequestInput): Promise<PartnerRequestRow>;
  findByUserId(userId: string): Promise<PartnerRequestRow | null>;
  findById(id: string): Promise<PartnerRequestRow | null>;
  findAll(query: {
    page: number;
    limit: number;
    status?: string;
    search?: string;
  }): Promise<{ items: PartnerRequestRow[]; paging: PagingDTO }>;
  updateStatus(
    id: string,
    status: string,
    reviewedBy: string,
    rejectionReason?: string,
    approvedPartnerId?: string,
  ): Promise<boolean>;
  existsByUserId(userId: string): Promise<boolean>;
  update(id: string, data: PartnerRequestUpdateInput): Promise<PartnerRequestRow>;
  getStatsData(): Promise<any>;
}

export interface IPartnerRequestUseCase {
  submit(userId: string, data: RegisterPartnerDTO): Promise<PartnerRequestRow>;
  editSubmit(userId: string, data: UpdatePartnerDTO): Promise<PartnerRequestRow>;
  getMyRequest(userId: string): Promise<MyPartnerStatusResponse>;
  adminListRequests(
    cond: RequestCondDTO,
  ): Promise<{ data: PartnerRequestRow[]; paging: PagingDTO }>;
  adminGetRequest(id: string): Promise<PartnerRequestRow>;
  adminApprove(id: string): Promise<boolean>;
  adminReject(id: string, reason: string): Promise<boolean>;
  getStats(): Promise<any>;
  adminReset(id: string): Promise<boolean>;
}
