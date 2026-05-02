export const getUserModel = (prisma) => prisma.user;
export const getSessionModel = (prisma) => prisma.session;
export const getPasswordTokenModel = (prisma) => prisma.passwordResetToken;
export const getEmailTokenModel = (prisma) => prisma.emailVerificationToken;
