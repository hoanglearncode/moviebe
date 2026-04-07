import { prisma } from "./component/prisma";
import {
  BaseCommandRepositoryPrisma,
  BaseQueryRepositoryPrisma,
  BaseRepositoryPrisma
} from "./repository/generic-prisma-repo";

const hardDeleteOnly = {
  softDelete: false as const,
  touchUpdatedAt: false,
};

const userRepositoryOptions = {
  softDelete: false as const,
};

// User Repository
export const userQueryRepository = new BaseQueryRepositoryPrisma(prisma.user, userRepositoryOptions);
export const userCommandRepository = new BaseCommandRepositoryPrisma(prisma.user, userRepositoryOptions);
export const userRepository = new BaseRepositoryPrisma(userQueryRepository, userCommandRepository);

// Session Repository
export const sessionQueryRepository = new BaseQueryRepositoryPrisma(prisma.session, hardDeleteOnly);
export const sessionCommandRepository = new BaseCommandRepositoryPrisma(prisma.session, hardDeleteOnly);
export const sessionRepository = new BaseRepositoryPrisma(sessionQueryRepository, sessionCommandRepository);

// Password Reset Token Repository
export const passwordResetTokenQueryRepository = new BaseQueryRepositoryPrisma(prisma.passwordResetToken, hardDeleteOnly);
export const passwordResetTokenCommandRepository = new BaseCommandRepositoryPrisma(prisma.passwordResetToken, hardDeleteOnly);
export const passwordResetTokenRepository = new BaseRepositoryPrisma(passwordResetTokenQueryRepository, passwordResetTokenCommandRepository);

// Email Verification Token Repository
export const emailVerificationTokenQueryRepository = new BaseQueryRepositoryPrisma(prisma.emailVerificationToken, hardDeleteOnly);
export const emailVerificationTokenCommandRepository = new BaseCommandRepositoryPrisma(prisma.emailVerificationToken, hardDeleteOnly);
export const emailVerificationTokenRepository = new BaseRepositoryPrisma(emailVerificationTokenQueryRepository, emailVerificationTokenCommandRepository);

// Export all repositories
export const repositories = {
  user: userRepository,
  session: sessionRepository,
  passwordResetToken: passwordResetTokenRepository,
  emailVerificationToken: emailVerificationTokenRepository,
};
