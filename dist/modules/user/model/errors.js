"use strict";
/**
 * ==========================================
 * USER MODULE - BUSINESS ERRORS
 * ==========================================
 * Centralized error definitions following
 * hexagonal architecture pattern
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ErrCannotModifyAdmin = exports.ErrCannotDeleteAdmin = exports.ErrAdminOnlyAction = exports.ErrUserIdRequired = exports.ErrForbiddenAccess = exports.ErrUnauthorizedAccess = exports.ErrInvalidUserData = exports.ErrInvalidSettingsData = exports.ErrInvalidQueryData = exports.ErrInvalidPasswordData = exports.ErrInvalidProfileData = exports.ErrAccountCreationFailed = exports.ErrAccountUpdateFailed = exports.ErrAccountPasswordChangeFailed = exports.ErrAccountDeletionFailed = exports.ErrSettingsNotFound = exports.ErrSessionUnauthorized = exports.ErrSessionExpired = exports.ErrSessionNotFound = exports.ErrPasswordUnchangeable = exports.ErrNewPasswordSameAsCurrent = exports.ErrPasswordsDoNotMatch = exports.ErrPasswordInvalid = exports.ErrEmailNotVerified = exports.ErrUserInactive = exports.ErrUsernameAlreadyExists = exports.ErrEmailAlreadyExists = exports.ErrUserAlreadyExists = exports.ErrUserNotFound = void 0;
const http_server_1 = require("../../../share/transport/http-server");
const error_code_1 = require("../../../share/model/error-code");
// Profile errors
exports.ErrUserNotFound = new http_server_1.NotFoundError("User");
exports.ErrUserAlreadyExists = new http_server_1.ConflictError("User already exists", error_code_1.ErrorCode.Duplicate);
exports.ErrEmailAlreadyExists = new http_server_1.ConflictError("Email already exists", error_code_1.ErrorCode.EMAIL_EXISTS);
exports.ErrUsernameAlreadyExists = new http_server_1.ConflictError("Username already exists", error_code_1.ErrorCode.USERNAME_EXISTS);
exports.ErrUserInactive = new http_server_1.UnauthorizedError("User account is not active", error_code_1.ErrorCode.ACCOUNT_INACTIVE);
exports.ErrEmailNotVerified = new http_server_1.UnauthorizedError("Email has not been verified", error_code_1.ErrorCode.ACCOUNT_NOT_VERIFIED);
// Password errors
exports.ErrPasswordInvalid = new http_server_1.ValidationError("Current password is incorrect");
exports.ErrPasswordsDoNotMatch = new http_server_1.ValidationError("Passwords do not match");
exports.ErrNewPasswordSameAsCurrent = new http_server_1.ValidationError("New password must be different from current password");
exports.ErrPasswordUnchangeable = new http_server_1.UnauthorizedError("Password login is not available for this account");
// Session errors
exports.ErrSessionNotFound = new http_server_1.NotFoundError("Session");
exports.ErrSessionExpired = new http_server_1.UnauthorizedError("Session has expired", error_code_1.ErrorCode.REFRESH_TOKEN_EXPIRED);
exports.ErrSessionUnauthorized = new http_server_1.UnauthorizedError("Unauthorized session access");
// Settings errors
exports.ErrSettingsNotFound = new http_server_1.NotFoundError("User settings");
// Account errors
exports.ErrAccountDeletionFailed = new http_server_1.ValidationError("Failed to delete user account", {}, error_code_1.ErrorCode.INTERNAL);
exports.ErrAccountPasswordChangeFailed = new http_server_1.ValidationError("Failed to update password", {}, error_code_1.ErrorCode.INTERNAL);
exports.ErrAccountUpdateFailed = new http_server_1.ValidationError("Failed to update user account", {}, error_code_1.ErrorCode.INTERNAL);
exports.ErrAccountCreationFailed = new http_server_1.ValidationError("Failed to create user account", {}, error_code_1.ErrorCode.INTERNAL);
// Validation errors
exports.ErrInvalidProfileData = new http_server_1.ValidationError("Invalid profile data");
exports.ErrInvalidPasswordData = new http_server_1.ValidationError("Invalid password data");
exports.ErrInvalidQueryData = new http_server_1.ValidationError("Invalid query parameters");
exports.ErrInvalidSettingsData = new http_server_1.ValidationError("Invalid settings data");
exports.ErrInvalidUserData = new http_server_1.ValidationError("Invalid user data");
// Authorization errors
exports.ErrUnauthorizedAccess = new http_server_1.UnauthorizedError("Unauthorized");
exports.ErrForbiddenAccess = new http_server_1.UnauthorizedError("Access forbidden");
exports.ErrUserIdRequired = new http_server_1.ValidationError("User ID is required");
// Admin errors
exports.ErrAdminOnlyAction = new http_server_1.UnauthorizedError("This action is only available to administrators");
exports.ErrCannotDeleteAdmin = new http_server_1.ConflictError("Cannot delete administrator account");
exports.ErrCannotModifyAdmin = new http_server_1.ConflictError("Cannot modify administrator account");
