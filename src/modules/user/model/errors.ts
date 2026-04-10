/**
 * ==========================================
 * USER MODULE - BUSINESS ERRORS
 * ==========================================
 * Centralized error definitions following
 * hexagonal architecture pattern
 */

import { ConflictError, NotFoundError, UnauthorizedError, ValidationError } from "../../../share/transport/http-server";
import { ErrorCode } from "../../../share/model/error-code";

// Profile errors
export const ErrUserNotFound = new NotFoundError("User");
export const ErrUserAlreadyExists = new ConflictError("User already exists", ErrorCode.Duplicate);
export const ErrEmailAlreadyExists = new ConflictError("Email already exists", ErrorCode.EMAIL_EXISTS);
export const ErrUsernameAlreadyExists = new ConflictError("Username already exists", ErrorCode.USERNAME_EXISTS);
export const ErrUserInactive = new UnauthorizedError("User account is not active", ErrorCode.ACCOUNT_INACTIVE);
export const ErrEmailNotVerified = new UnauthorizedError("Email has not been verified", ErrorCode.ACCOUNT_NOT_VERIFIED);

// Password errors
export const ErrPasswordInvalid = new ValidationError("Current password is incorrect");
export const ErrPasswordsDoNotMatch = new ValidationError("Passwords do not match");
export const ErrNewPasswordSameAsCurrent = new ValidationError("New password must be different from current password");
export const ErrPasswordUnchangeable = new UnauthorizedError("Password login is not available for this account");

// Session errors
export const ErrSessionNotFound = new NotFoundError("Session");
export const ErrSessionExpired = new UnauthorizedError("Session has expired", ErrorCode.REFRESH_TOKEN_EXPIRED);
export const ErrSessionUnauthorized = new UnauthorizedError("Unauthorized session access");

// Settings errors
export const ErrSettingsNotFound = new NotFoundError("User settings");

// Account errors
export const ErrAccountDeletionFailed = new ValidationError("Failed to delete user account", {}, ErrorCode.INTERNAL);
export const ErrAccountPasswordChangeFailed = new ValidationError("Failed to update password", {}, ErrorCode.INTERNAL);
export const ErrAccountUpdateFailed = new ValidationError("Failed to update user account", {}, ErrorCode.INTERNAL);
export const ErrAccountCreationFailed = new ValidationError("Failed to create user account", {}, ErrorCode.INTERNAL);

// Validation errors
export const ErrInvalidProfileData = new ValidationError("Invalid profile data");
export const ErrInvalidPasswordData = new ValidationError("Invalid password data");
export const ErrInvalidQueryData = new ValidationError("Invalid query parameters");
export const ErrInvalidSettingsData = new ValidationError("Invalid settings data");
export const ErrInvalidUserData = new ValidationError("Invalid user data");

// Authorization errors
export const ErrUnauthorizedAccess = new UnauthorizedError("Unauthorized");
export const ErrForbiddenAccess = new UnauthorizedError("Access forbidden");
export const ErrUserIdRequired = new ValidationError("User ID is required");

// Admin errors
export const ErrAdminOnlyAction = new UnauthorizedError("This action is only available to administrators");
export const ErrCannotDeleteAdmin = new ConflictError("Cannot delete administrator account");
export const ErrCannotModifyAdmin = new ConflictError("Cannot modify administrator account");
