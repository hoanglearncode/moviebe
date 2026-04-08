"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdminUserHttpService = void 0;
const http_server_1 = require("../../../../share/transport/http-server");
/**
 * User HTTP Service - handles user profile and session routes
 */
// export class UserHttpService {
//   constructor(private useCase: IUserUseCase) {}
//   /**
//    * GET /api/user/me - Get current user profile
//    */
//   async getProfile(req: Request, res: Response): Promise<void> {
//     try {
//       const userId = (req as any).user?.id; // From auth middleware
//       if (!userId) {
//         return errorResponse(res, 401, "Unauthorized", "USER_NOT_AUTHENTICATED");
//       }
//       const profile = await this.useCase.getProfile(userId);
//       successResponse(res, profile, "Profile retrieved successfully");
//     } catch (error: any) {
//       errorResponse(res, error.statusCode || 500, error.message, error.code);
//     }
//   }
//   /**
//    * PUT /api/user/me - Update current user profile
//    */
//   async updateProfile(req: Request, res: Response): Promise<void> {
//     try {
//       const userId = (req as any).user?.id;
//       if (!userId) {
//         return errorResponse(res, 401, "Unauthorized");
//       }
//       const data: UpdateProfileDTO = req.body;
//       const updated = await this.useCase.updateProfile(userId, data);
//       successResponse(res, updated, "Profile updated successfully");
//     } catch (error: any) {
//       errorResponse(res, error.statusCode || 400, error.message, error.code);
//     }
//   }
//   /**
//    * DELETE /api/user/me - Delete account
//    */
//   async deleteAccount(req: Request, res: Response): Promise<void> {
//     try {
//       const userId = (req as any).user?.id;
//       if (!userId) {
//         return errorResponse(res, 401, "Unauthorized");
//       }
//       const result = await this.useCase.deleteAccount(userId);
//       successResponse(res, result, "Account deleted successfully");
//     } catch (error: any) {
//       errorResponse(res, error.statusCode || 500, error.message, error.code);
//     }
//   }
//   /**
//    * POST /api/user/change-password - Change password
//    */
//   async changePassword(req: Request, res: Response): Promise<void> {
//     try {
//       const userId = (req as any).user?.id;
//       if (!userId) {
//         return errorResponse(res, 401, "Unauthorized");
//       }
//       const data: ChangePasswordDTO = req.body;
//       const result = await this.useCase.changePassword(userId, data);
//       successResponse(res, result, "Password changed successfully");
//     } catch (error: any) {
//       errorResponse(res, error.statusCode || 400, error.message, error.code);
//     }
//   }
//   /**
//    * GET /api/user/sessions - Get active sessions
//    */
//   async getSessions(req: Request, res: Response): Promise<void> {
//     try {
//       const userId = (req as any).user?.id;
//       if (!userId) {
//         return errorResponse(res, 401, "Unauthorized");
//       }
//       const query: GetSessionsQueryDTO = {
//         limit: req.query.limit ? parseInt(req.query.limit as string) : 20,
//         offset: req.query.offset ? parseInt(req.query.offset as string) : 0,
//         orderBy: (req.query.orderBy as "createdAt" | "lastActivityAt") || "createdAt",
//       };
//       const sessions = await this.useCase.getSessions(userId, query);
//       successResponse(res, sessions, "Sessions retrieved successfully");
//     } catch (error: any) {
//       errorResponse(res, error.statusCode || 500, error.message, error.code);
//     }
//   }
//   /**
//    * DELETE /api/user/sessions/:sessionId - Revoke session
//    */
//   async revokeSession(req: Request, res: Response): Promise<void> {
//     try {
//       const userId = (req as any).user?.id;
//       const { sessionId } = req.params;
//       if (!userId) {
//         return errorResponse(res, 401, "Unauthorized");
//       }
//       const result = await this.useCase.revokeSession(userId, sessionId);
//       successResponse(res, result, "Session revoked successfully");
//     } catch (error: any) {
//       errorResponse(res, error.statusCode || 400, error.message, error.code);
//     }
//   }
//   /**
//    * DELETE /api/user/sessions - Revoke all sessions
//    */
//   async revokeAllSessions(req: Request, res: Response): Promise<void> {
//     try {
//       const userId = (req as any).user?.id;
//       if (!userId) {
//         return errorResponse(res, 401, "Unauthorized");
//       }
//       const result = await this.useCase.revokeAllSessions(userId);
//       successResponse(res, result, "All sessions revoked successfully");
//     } catch (error: any) {
//       errorResponse(res, error.statusCode || 500, error.message, error.code);
//     }
//   }
//   /**
//    * GET /api/user/settings - Get settings
//    */
//   async getSettings(req: Request, res: Response): Promise<void> {
//     try {
//       const userId = (req as any).user?.id;
//       if (!userId) {
//         return errorResponse(res, 401, "Unauthorized");
//       }
//       const settings = await this.useCase.getSettings(userId);
//       successResponse(res, settings, "Settings retrieved successfully");
//     } catch (error: any) {
//       errorResponse(res, error.statusCode || 500, error.message, error.code);
//     }
//   }
//   /**
//    * PUT /api/user/settings - Update settings
//    */
//   async updateSettings(req: Request, res: Response): Promise<void> {
//     try {
//       const userId = (req as any).user?.id;
//       if (!userId) {
//         return errorResponse(res, 401, "Unauthorized");
//       }
//       const updated = await this.useCase.updateSettings(userId, req.body);
//       successResponse(res, updated, "Settings updated successfully");
//     } catch (error: any) {
//       errorResponse(res, error.statusCode || 400, error.message, error.code);
//     }
//   }
// }
/**
 * Admin User HTTP Service - handles admin user management routes
 */
class AdminUserHttpService {
    constructor(useCase) {
        this.useCase = useCase;
    }
    /**
     * GET /api/admin/users - List users with pagination and filtering
     */
    async listUsers(req, res) {
        try {
            const query = {
                page: req.query.page ? parseInt(req.query.page) : 1,
                limit: req.query.limit ? parseInt(req.query.limit) : 20,
                keyword: req.query.keyword,
                email: req.query.email,
                username: req.query.username,
                role: req.query.role,
                status: req.query.status,
                sortBy: req.query.sortBy || "createdAt",
                sortOrder: req.query.sortOrder || "desc",
            };
            const users = await this.useCase.listUsers(query);
            (0, http_server_1.successResponse)(res, users, "Users retrieved successfully");
        }
        catch (error) {
            (0, http_server_1.errorResponse)(res, error.statusCode || 500, error.message, error.code);
        }
    }
    /**
     * GET /api/admin/users/:id - Get user by ID
     */
    async getUser(req, res) {
        try {
            const id = String(req.params.id || "");
            const user = await this.useCase.getUserById(id);
            (0, http_server_1.successResponse)(res, user, "User retrieved successfully");
        }
        catch (error) {
            (0, http_server_1.errorResponse)(res, error.statusCode || 404, error.message, error.code);
        }
    }
    /**
     * POST /api/admin/users - Create user (admin)
     */
    async createUser(req, res) {
        try {
            const data = req.body;
            const result = await this.useCase.createUser(data);
            (0, http_server_1.successResponse)(res, result, "User created successfully", 201);
        }
        catch (error) {
            (0, http_server_1.errorResponse)(res, error.statusCode || 400, error.message, error.code);
        }
    }
    /**
     * PUT /api/admin/users/:id - Update user
     */
    async updateUser(req, res) {
        try {
            const id = String(req.params.id || "");
            const data = req.body;
            const updated = await this.useCase.updateUser(id, data);
            (0, http_server_1.successResponse)(res, updated, "User updated successfully");
        }
        catch (error) {
            (0, http_server_1.errorResponse)(res, error.statusCode || 400, error.message, error.code);
        }
    }
    /**
     * PATCH /api/admin/users/:id/status - Change user status
     */
    async changeUserStatus(req, res) {
        try {
            const id = String(req.params.id || "");
            const data = req.body;
            const result = await this.useCase.changeUserStatus(id, data);
            (0, http_server_1.successResponse)(res, result, "User status changed successfully");
        }
        catch (error) {
            (0, http_server_1.errorResponse)(res, error.statusCode || 400, error.message, error.code);
        }
    }
    /**
     * POST /api/admin/users/:id/reset-password - Reset user password
     */
    async resetUserPassword(req, res) {
        try {
            const id = String(req.params.id || "");
            const data = req.body;
            const result = await this.useCase.resetUserPassword(id, data);
            (0, http_server_1.successResponse)(res, result, "Password reset successfully");
        }
        catch (error) {
            (0, http_server_1.errorResponse)(res, error.statusCode || 400, error.message, error.code);
        }
    }
    /**
     * POST /api/admin/users/:id/verify-email - Verify user email
     */
    async verifyUserEmail(req, res) {
        try {
            const id = String(req.params.id || "");
            const result = await this.useCase.verifyUserEmail(id);
            (0, http_server_1.successResponse)(res, result, "Email verified successfully");
        }
        catch (error) {
            (0, http_server_1.errorResponse)(res, error.statusCode || 400, error.message, error.code);
        }
    }
    /**
     * DELETE /api/admin/users/:id/sessions - Revoke all user sessions
     */
    async revokeAllUserSessions(req, res) {
        try {
            const id = String(req.params.id || "");
            const result = await this.useCase.revokeAllUserSessions(id);
            (0, http_server_1.successResponse)(res, result, "All user sessions revoked");
        }
        catch (error) {
            (0, http_server_1.errorResponse)(res, error.statusCode || 400, error.message, error.code);
        }
    }
    /**
     * DELETE /api/admin/users/:id - Delete user (soft delete)
     */
    async deleteUser(req, res) {
        try {
            const id = String(req.params.id || "");
            const result = await this.useCase.deleteUser(id);
            (0, http_server_1.successResponse)(res, result, "User deleted successfully");
        }
        catch (error) {
            (0, http_server_1.errorResponse)(res, error.statusCode || 400, error.message, error.code);
        }
    }
}
exports.AdminUserHttpService = AdminUserHttpService;
