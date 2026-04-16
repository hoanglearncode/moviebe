import { Role } from "@prisma/client";
import { ForbiddenError } from "../../../share/transport/http-server";
import {
  EffectivePermission,
  isPermissionCode,
  PermissionCode,
  ROLE_PERMISSION_MAP,
} from "../../../share/security/permissions";

type AuthorizationSubject = {
  id?: string;
  role?: Role | string;
  permissions?: string[];
  permissionsOverride?: unknown;
};

export class AuthorizationUseCase {
  getPermissionsByRole(role?: Role | string): readonly EffectivePermission[] {
    if (!role) return ROLE_PERMISSION_MAP[Role.USER];

    switch (role) {
      case Role.ADMIN:
        return ROLE_PERMISSION_MAP[Role.ADMIN];
      case Role.PARTNER:
        return ROLE_PERMISSION_MAP[Role.PARTNER];
      case Role.USER:
      default:
        return ROLE_PERMISSION_MAP[Role.USER];
    }
  }

  normalizePermissionsOverride(raw: unknown): PermissionCode[] {
    if (!Array.isArray(raw)) return [];

    return Array.from(
      new Set(
        raw.filter(
          (permission): permission is PermissionCode =>
            typeof permission === "string" && isPermissionCode(permission),
        ),
      ),
    );
  }

  resolvePermissions(subject: AuthorizationSubject): EffectivePermission[] {
    if (Array.isArray(subject.permissions) && subject.permissions.length > 0) {
      return Array.from(new Set(subject.permissions as EffectivePermission[]));
    }

    const rolePermissions = this.getPermissionsByRole(subject.role);
    const overridePermissions = this.normalizePermissionsOverride(subject.permissionsOverride);

    return Array.from(new Set([...rolePermissions, ...overridePermissions]));
  }

  hasPermission(subject: AuthorizationSubject, permission: PermissionCode): boolean {
    const resolvedPermissions = this.resolvePermissions(subject);
    return resolvedPermissions.includes("*") || resolvedPermissions.includes(permission);
  }

  hasAllPermissions(subject: AuthorizationSubject, permissions: PermissionCode[]): boolean {
    return permissions.every((permission) => this.hasPermission(subject, permission));
  }

  hasAnyPermission(subject: AuthorizationSubject, permissions: PermissionCode[]): boolean {
    return permissions.some((permission) => this.hasPermission(subject, permission));
  }

  canAccessOwnResource(userId?: string, ownerId?: string | null): boolean {
    return Boolean(userId && ownerId && userId === ownerId);
  }

  assertPermission(
    subject: AuthorizationSubject,
    permission: PermissionCode,
    message?: string,
  ): void {
    if (!this.hasPermission(subject, permission)) {
      throw new ForbiddenError(message ?? `Missing required permission: ${permission}`);
    }
  }

  assertSelfOrPermission(
    subject: AuthorizationSubject,
    ownerId: string | null | undefined,
    permission: PermissionCode,
    message?: string,
  ): void {
    if (this.canAccessOwnResource(subject.id, ownerId)) {
      return;
    }

    this.assertPermission(subject, permission, message);
  }
}
