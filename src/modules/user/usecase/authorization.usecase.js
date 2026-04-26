"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthorizationUseCase = void 0;
const client_1 = require("@prisma/client");
const http_server_1 = require("../../../share/transport/http-server");
const permissions_1 = require("../../../share/security/permissions");
class AuthorizationUseCase {
    getPermissionsByRole(role) {
        if (!role)
            return permissions_1.ROLE_PERMISSION_MAP[client_1.Role.USER];
        switch (role) {
            case client_1.Role.ADMIN:
                return permissions_1.ROLE_PERMISSION_MAP[client_1.Role.ADMIN];
            case client_1.Role.PARTNER:
                return permissions_1.ROLE_PERMISSION_MAP[client_1.Role.PARTNER];
            case client_1.Role.USER:
            default:
                return permissions_1.ROLE_PERMISSION_MAP[client_1.Role.USER];
        }
    }
    normalizePermissionsOverride(raw) {
        if (!Array.isArray(raw))
            return [];
        return Array.from(new Set(raw.filter((permission) => typeof permission === "string" && (0, permissions_1.isPermissionCode)(permission))));
    }
    resolvePermissions(subject) {
        if (Array.isArray(subject.permissions) && subject.permissions.length > 0) {
            return Array.from(new Set(subject.permissions));
        }
        const rolePermissions = this.getPermissionsByRole(subject.role);
        const overridePermissions = this.normalizePermissionsOverride(subject.permissionsOverride);
        return Array.from(new Set([...rolePermissions, ...overridePermissions]));
    }
    hasPermission(subject, permission) {
        const resolvedPermissions = this.resolvePermissions(subject);
        return resolvedPermissions.includes("*") || resolvedPermissions.includes(permission);
    }
    hasAllPermissions(subject, permissions) {
        return permissions.every((permission) => this.hasPermission(subject, permission));
    }
    hasAnyPermission(subject, permissions) {
        return permissions.some((permission) => this.hasPermission(subject, permission));
    }
    canAccessOwnResource(userId, ownerId) {
        return Boolean(userId && ownerId && userId === ownerId);
    }
    assertPermission(subject, permission, message) {
        if (!this.hasPermission(subject, permission)) {
            throw new http_server_1.ForbiddenError(message ?? `Missing required permission: ${permission}`);
        }
    }
    assertSelfOrPermission(subject, ownerId, permission, message) {
        if (this.canAccessOwnResource(subject.id, ownerId)) {
            return;
        }
        this.assertPermission(subject, permission, message);
    }
}
exports.AuthorizationUseCase = AuthorizationUseCase;
