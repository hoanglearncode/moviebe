import { randomUUID } from "crypto";
import { ConflictError, NotFoundError, PagingDTO, ValidationError } from "@/share";
import {
  IPartnerRequestRepository,
  IPartnerRequestUseCase,
} from "@/modules/partner/interface/partner-request.interface";
import {
  RegisterPartnerDTO,
  RequestCondDTO,
  SubmitPartnerRequestSchema,
  UpdatePartnerDTO,
} from "@/modules/partner/model/dto";
import {
  MyPartnerStatusResponse,
  PartnerRequestRow,
  StaffRole,
} from "@/modules/partner/model/model";
import { IWalletRepository } from "@/modules/partner/interface/finance.interface";
import { IPartnerRepository } from "@/modules/partner/interface/profile.interface";
import { IStaffRepo } from "@/modules/partner/interface/staff.interface";
import { ISessionRepository, IUserRepository } from "@/modules/admin-manage/admin-user/interface";

export class RequestUseCase implements IPartnerRequestUseCase {
  constructor(
    private readonly repo: IPartnerRequestRepository,
    private readonly partnerRepo: IPartnerRepository,
    private readonly userRepo: IUserRepository,
    private readonly sessionRepo: ISessionRepository,
    private readonly walletRepo: IWalletRepository,
    private readonly staffRepo: IStaffRepo,
  ) {}

  async submit(userId: string, data: RegisterPartnerDTO): Promise<PartnerRequestRow> {
    const existing = await this.repo.findByUserId(userId);

    if (existing && existing.status === "PENDING") {
      throw new ConflictError("You already have a pending request");
    }

    const parsedData = SubmitPartnerRequestSchema.safeParse(data);

    if (!parsedData.success) {
      throw new ValidationError("Invalid partner request data", parsedData.error.issues);
    }

    return this.repo.create({
      ...parsedData.data,
      userId,
    });
  }

  async editSubmit(userId: string, data: UpdatePartnerDTO): Promise<PartnerRequestRow> {
    const existing = await this.repo.findByUserId(userId);

    if (!existing) {
      throw new NotFoundError("Request");
    }

    if (existing.status !== "PENDING") {
      throw new ConflictError("Cannot edit a non-pending request");
    }

    return this.repo.update(existing.id, data);
  }

  async getMyRequest(userId: string): Promise<MyPartnerStatusResponse> {
    const [partner, request] = await Promise.all([
      this.partnerRepo.findByUserId(userId),
      this.repo.findByUserId(userId),
    ]);

    if (partner) {
      return {
        type: "partner",
        request,
        partner,
      };
    }

    if (request) {
      return {
        type: "request",
        request,
        partner: null,
      };
    }

    return {
      type: "none",
      request: null,
      partner: null,
    };
  }

  async getStats(): Promise<any> {
    const data = await this.repo.getStatsData();
    return data;
  }

  async adminListRequests(
    cond: RequestCondDTO,
  ): Promise<{ data: PartnerRequestRow[]; paging: PagingDTO }> {
    const result = await this.repo.findAll(cond);

    return {
      data: result.items,
      paging: result.paging,
    };
  }

  async adminGetRequest(id: string): Promise<PartnerRequestRow> {
    const data = await this.repo.findById(id);
    if (!data) {
      throw new NotFoundError("Request");
    }
    return data;
  }

  async adminApprove(id: string): Promise<boolean> {
    const adminId = "system-admin";
    const request = await this.repo.findById(id);
    if (!request) {
      throw new NotFoundError("Request");
    }
    if (request.status !== "PENDING") {
      throw new ConflictError("Only pending requests can be approved");
    }

    const existingPartner = await this.partnerRepo.findByUserId(request.userId);
    if (existingPartner) {
      throw new ConflictError("User already has an approved partner profile");
    }

    const partnerId = randomUUID();
    const now = new Date();

    await this.partnerRepo.insert({
      id: partnerId,
      userId: request.userId,
      cinemaName: request.cinemaName,
      address: request.address,
      city: request.city,
      country: "",
      postalCode: null,
      phone: request.phone,
      email: request.email,
      website: null,
      logo: request.logo ?? null,
      taxCode: request.taxCode,
      businessLicense: request.businessLicense ?? null,
      businessLicenseFile: request.businessLicenseFile ?? null,
      representativeName: request.representativeName ?? null,
      representativeIdNumber: request.representativeIdNumber ?? null,
      representativeIdFile: request.representativeIdFile ?? null,
      taxCertificateFile: request.taxCertificateFile ?? null,
      bankAccountName: request.bankAccountName,
      bankAccountNumber: request.bankAccountNumber,
      bankName: request.bankName,
      bankCode: request.bankCode ?? "",
      status: "ACTIVE",
      approvedAt: now,
      rejectionReason: null,
      approvedBy: adminId,
      commissionRate: 0.1,
      createdAt: now,
      updatedAt: now,
    });

    await this.walletRepo.insert({
      id: randomUUID(),
      partnerId,
      balance: 0,
      totalEarned: 0,
      totalWithdrawn: 0,
      totalRefunded: 0,
      createdAt: now,
      updatedAt: now,
    });

    await this.staffRepo.insert({
      id: randomUUID(),
      partnerId,
      userId: request.userId,
      role: StaffRole.OWNER,
      createdAt: now,
    });

    await this.userRepo.update(request.userId, {
      role: "PARTNER",
      status: "ACTIVE",
    });

    await this.sessionRepo.revokeAllSessionsByUserId(request.userId);

    return this.repo.updateStatus(id, "APPROVED", adminId, undefined, partnerId);
  }

  async adminReject(id: string, reason: string): Promise<boolean> {
    const adminId = "system-admin";
    const request = await this.repo.findById(id);

    if (!request) {
      throw new NotFoundError("Request");
    }

    if (request.status !== "PENDING") {
      throw new ConflictError("Only pending requests can be rejected");
    }

    if (!reason || reason.trim().length < 3) {
      throw new ValidationError("Rejection reason is required");
    }

    return this.repo.updateStatus(id, "REJECTED", adminId, reason.trim());
  }

  async adminReset(id: string): Promise<boolean> {
    const adminId = "system-admin";
    const request = await this.repo.findById(id);

    if (!request) {
      throw new NotFoundError("Request");
    }

    if (request.status === "PENDING") {
      throw new ConflictError("Request is already pending");
    }

    return this.repo.updateStatus(id, "PENDING", adminId);
  }
}
