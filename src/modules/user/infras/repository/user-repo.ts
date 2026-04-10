import { Prisma, PrismaClient } from "@prisma/client";
import { PagingDTO } from "../../../../share/model/paging";
import { IUserRepository } from "../../interface";
import { ListUsersQueryDTO } from "../../model/dto";
import { OwnUserProfile, UserProfile } from "../../model/model";
import { getUserModel } from "./dto";

// ──────────────────────────────────────────────
// MAPPERS
// ──────────────────────────────────────────────

// NOTE: Mapper tách riêng để dễ test và tái sử dụng
// Prisma trả về kiểu nội bộ của nó → ta map sang domain type
function toUserProfile(raw: any): UserProfile {
  return {
    id: raw.id,
    email: raw.email,
    username: raw.username ?? null,
    name: raw.name ?? null,
    password: raw.password ?? null,
    provider: raw.provider ?? "local",
    avatar: raw.avatar ?? null,
    phone: raw.phone ?? null,
    bio: raw.bio ?? null,
    location: raw.location ?? null,
    avatarColor: raw.avatarColor ?? null,
    role: raw.role,
    status: raw.status,
    emailVerified: raw.emailVerified ?? false,
    mustChangePassword: raw.mustChangePassword ?? false,
    lastLoginAt: raw.lastLoginAt ?? null,
    createdAt: raw.createdAt,
    updatedAt: raw.updatedAt,
  };
}

// NOTE: OwnUserProfile = subset an toàn để trả về API (không có password)
function toOwnUserProfile(user: UserProfile): OwnUserProfile {
  return {
    id: user.id,
    email: user.email,
    username: user.username,
    name: user.name,
    avatar: user.avatar,
    status: user.status,
    bio: user.bio,
    location: user.location,
    avatarColor: user.avatarColor,
    phone: user.phone,
    emailVerified: user.emailVerified,
    role: user.role,
    lastLoginAt: user.lastLoginAt,
    createdAt: user.createdAt,
  };
}

// ──────────────────────────────────────────────
// REPOSITORY
// ──────────────────────────────────────────────

export class PrismaUserRepository implements IUserRepository {
  private readonly model: ReturnType<typeof getUserModel>;

  constructor(prisma: PrismaClient) {
    this.model = getUserModel(prisma);
  }

  // ── IQueryRepository methods (required by base interface) ──

  /**
   * get — tìm theo ID (alias của findById, dùng bởi base interface)
   */
  async get(id: string): Promise<UserProfile | null> {
    return this.findById(id);
  }

  /**
   * findByCond — tìm 1 user theo điều kiện đơn giản
   * NOTE: Base interface trả về single entity (không phải array)
   * Dùng cho các query đơn như: { email: "x@x.com" }
   */
  async findByCond(cond: Partial<UserProfile>): Promise<UserProfile | null> {
    const raw = await this.model.findFirst({ where: cond as Prisma.UserWhereInput });
    return raw ? toUserProfile(raw) : null;
  }

  /**
   * list — generic list với Partial<UserProfile> filter
   * NOTE: Method này match đúng signature của IRepository base
   * Dùng bởi các generic caller, không có keyword search
   */
  async list(cond: Partial<UserProfile>, paging: PagingDTO): Promise<UserProfile[]> {
    const skip = ((paging.page ?? 1) - 1) * (paging.limit ?? 20);
    const rows = await this.model.findMany({
      where: cond as Prisma.UserWhereInput,
      skip,
      take: paging.limit ?? 20,
      orderBy: { createdAt: "desc" },
    });
    return rows.map(toUserProfile);
  }

  // ── ICommandRepository methods (required by base interface) ──

  /**
   * insert — nhận full UserProfile entity, trả boolean
   * NOTE: Base interface định nghĩa insert(data: Entity): Promise<boolean>
   * Khác với create() trả string id — đây là quyết định thiết kế của share layer
   */
  async insert(data: UserProfile): Promise<boolean> {
    await this.model.create({
      data: {
        id: data.id,          // NOTE: caller phải tự cấp id nếu dùng insert
        email: data.email,
        name: data.name,
        username: data.username,
        password: data.password,
        role: data.role,
        status: data.status,
        provider: data.provider,
        emailVerified: data.emailVerified,
        mustChangePassword: data.mustChangePassword,
        avatarColor: data.avatarColor,
        phone: data.phone,
        bio: data.bio,
        location: data.location,
        avatar: data.avatar,
      },
    });
    return true;
  }

  /**
   * update — update theo id, data là Partial<UserProfile>
   */
  async update(id: string, data: Partial<UserProfile>): Promise<boolean> {
    await this.model.update({
      where: { id },
      data: data as Prisma.UserUpdateInput,
    });
    return true;
  }

  /**
   * delete — base interface có isHard flag
   * isHard=true  → xoá khỏi DB vĩnh viễn
   * isHard=false → soft delete (set status=INACTIVE hoặc deletedAt)
   *
   * NOTE: Schema của bạn có thể không có deletedAt.
   * Nếu không có, soft delete = set status INACTIVE.
   */
  async delete(id: string, isHard: boolean): Promise<boolean> {
    if (isHard) {
      await this.model.delete({ where: { id } });
    } else {
      await this.model.update({
        where: { id },
        data: { status: "INACTIVE" },
      });
    }
    return true;
  }

  // ── Domain-specific methods ──

  async findById(userId: string): Promise<UserProfile | null> {
    const raw = await this.model.findUnique({ where: { id: userId } });
    return raw ? toUserProfile(raw) : null;
  }

  async findByEmail(email: string): Promise<UserProfile | null> {
    const raw = await this.model.findUnique({ where: { email } });
    return raw ? toUserProfile(raw) : null;
  }

  async findByUsername(username: string): Promise<UserProfile | null> {
    const raw = await this.model.findUnique({ where: { username } });
    return raw ? toUserProfile(raw) : null;
  }

  async updateProfile(userId: string, data: Partial<UserProfile>): Promise<UserProfile> {
    const raw = await this.model.update({
      where: { id: userId },
      data: {
        ...(data.name !== undefined   && { name: data.name }),
        ...(data.phone !== undefined  && { phone: data.phone }),
        ...(data.avatar !== undefined && { avatar: data.avatar }),
        ...(data.bio !== undefined    && { bio: data.bio }),
        ...(data.location !== undefined && { location: data.location }),
        ...(data.username !== undefined && { username: data.username }),
        ...(data.role !== undefined   && { role: data.role }),
        ...(data.status !== undefined && { status: data.status }),
        ...(data.emailVerified !== undefined && { emailVerified: data.emailVerified }),
      },
    });
    return toUserProfile(raw);
  }

  async updatePassword(userId: string, passwordHash: string): Promise<boolean> {
    await this.model.update({
      where: { id: userId },
      data: { password: passwordHash, mustChangePassword: false },
    });
    return true;
  }

  async deleteUser(userId: string): Promise<boolean> {
    await this.model.delete({ where: { id: userId } });
    return true;
  }

  async countUsers(): Promise<number> {
    return this.model.count();
  }

  /**
   * listUsers — admin filter đầy đủ với keyword, sort, paging
   * NOTE: Tách khỏi base list() vì cần ListUsersQueryDTO phức tạp hơn
   */
  async listUsers(cond: ListUsersQueryDTO): Promise<{ items: OwnUserProfile[]; total: number }> {
    const where = this.buildAdminWhere(cond);
    const orderBy = { [cond.sortBy]: cond.sortOrder };
    const skip = (cond.page - 1) * cond.limit;

    const [rows, total] = await Promise.all([
      this.model.findMany({ where, orderBy, skip, take: cond.limit }),
      this.model.count({ where }),
    ]);

    return {
      items: rows.map(toUserProfile).map(toOwnUserProfile),
      total,
    };
  }

  // ── Private helpers ──

  private buildAdminWhere(cond: ListUsersQueryDTO): Prisma.UserWhereInput {
    const { keyword, email, username, role, status } = cond;
    const where: Prisma.UserWhereInput = {};

    if (keyword) {
      where.OR = [
        { email: { contains: keyword, mode: "insensitive" } },
        { username: { contains: keyword, mode: "insensitive" } },
        { name: { contains: keyword, mode: "insensitive" } },
      ];
    }

    if (email) where.email = email;
    if (username) where.username = username;
    if (role) where.role = role;

    if (status) {
      where.status = status;
    } else {
      where.status = { not: "INACTIVE" };
    }

    return where;
  }
}

export const createUserRepository = (prisma: PrismaClient) =>
  new PrismaUserRepository(prisma);
