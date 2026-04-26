"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.repositories = exports.emailVerificationTokenRepository = exports.emailVerificationTokenCommandRepository = exports.emailVerificationTokenQueryRepository = exports.passwordResetTokenRepository = exports.passwordResetTokenCommandRepository = exports.passwordResetTokenQueryRepository = exports.sessionRepository = exports.sessionCommandRepository = exports.sessionQueryRepository = exports.userRepository = exports.userCommandRepository = exports.userQueryRepository = void 0;
const prisma_1 = require("./component/prisma");
const generic_prisma_repo_1 = require("./repository/generic-prisma-repo");
const hardDeleteOnly = {
    softDelete: false,
    touchUpdatedAt: false,
};
const userRepositoryOptions = {
    softDelete: false,
};
// User Repository
exports.userQueryRepository = new generic_prisma_repo_1.BaseQueryRepositoryPrisma(prisma_1.prisma.user, userRepositoryOptions);
exports.userCommandRepository = new generic_prisma_repo_1.BaseCommandRepositoryPrisma(prisma_1.prisma.user, userRepositoryOptions);
exports.userRepository = new generic_prisma_repo_1.BaseRepositoryPrisma(exports.userQueryRepository, exports.userCommandRepository);
// Session Repository
exports.sessionQueryRepository = new generic_prisma_repo_1.BaseQueryRepositoryPrisma(prisma_1.prisma.session, hardDeleteOnly);
exports.sessionCommandRepository = new generic_prisma_repo_1.BaseCommandRepositoryPrisma(prisma_1.prisma.session, hardDeleteOnly);
exports.sessionRepository = new generic_prisma_repo_1.BaseRepositoryPrisma(exports.sessionQueryRepository, exports.sessionCommandRepository);
// Password Reset Token Repository
exports.passwordResetTokenQueryRepository = new generic_prisma_repo_1.BaseQueryRepositoryPrisma(prisma_1.prisma.passwordResetToken, hardDeleteOnly);
exports.passwordResetTokenCommandRepository = new generic_prisma_repo_1.BaseCommandRepositoryPrisma(prisma_1.prisma.passwordResetToken, hardDeleteOnly);
exports.passwordResetTokenRepository = new generic_prisma_repo_1.BaseRepositoryPrisma(exports.passwordResetTokenQueryRepository, exports.passwordResetTokenCommandRepository);
// Email Verification Token Repository
exports.emailVerificationTokenQueryRepository = new generic_prisma_repo_1.BaseQueryRepositoryPrisma(prisma_1.prisma.emailVerificationToken, hardDeleteOnly);
exports.emailVerificationTokenCommandRepository = new generic_prisma_repo_1.BaseCommandRepositoryPrisma(prisma_1.prisma.emailVerificationToken, hardDeleteOnly);
exports.emailVerificationTokenRepository = new generic_prisma_repo_1.BaseRepositoryPrisma(exports.emailVerificationTokenQueryRepository, exports.emailVerificationTokenCommandRepository);
// Export all repositories
exports.repositories = {
    user: exports.userRepository,
    session: exports.sessionRepository,
    passwordResetToken: exports.passwordResetTokenRepository,
    emailVerificationToken: exports.emailVerificationTokenRepository,
};
