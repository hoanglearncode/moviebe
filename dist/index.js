"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const category_1 = require("./modules/category");
const auth_1 = require("./modules/auth");
const user_1 = require("./modules/user");
const repo_1 = require("./modules/category/infras/repository/repo");
const prisma_1 = require("./share/component/prisma");
const dotenv_1 = require("dotenv");
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const value_1 = require("./share/common/value");
const hash_1 = require("./modules/auth/shared/hash");
const client_1 = require("@prisma/client");
const logger_1 = require("./modules/system/log/logger");
const request_logger_1 = require("./modules/system/log/request-logger");
(0, dotenv_1.config)();
(async () => {
    await prisma_1.prisma.$connect();
    logger_1.logger.info("Database connected successfully");
    await ensureAdminUser();
    const app = (0, express_1.default)();
    const port = process.env.PORT || 3000;
    app.use(express_1.default.json());
    app.use(request_logger_1.requestLogger);
    app.use((0, cors_1.default)({
        origin: [
            "http://localhost:3000",
            "http://localhost:3001",
            "http://localhost:3002",
        ],
        credentials: true,
        methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
        allowedHeaders: ["Content-Type", "Authorization"],
    }));
    app.use('/v1', (0, category_1.setupCategoryHexagon)((0, repo_1.createCategoryRepository)(prisma_1.prisma)));
    app.use('/v1', (0, auth_1.setupAuthHexagon)(prisma_1.prisma));
    app.use('/v1', (0, user_1.setupUserHexagon)(prisma_1.prisma));
    // app.use('/v1', setupProductHexagon(sequelize));
    app.listen(port, () => {
        logger_1.logger.info(`Server is running on http://localhost:${port}`);
    });
})();
async function ensureAdminUser() {
    const email = value_1.ENV.ADMIN_INIT_EMAIL;
    const password = value_1.ENV.ADMIN_INIT_PASSWORD;
    if (!email || !password) {
        logger_1.logger.warn("ADMIN_INIT_EMAIL or ADMIN_INIT_PASSWORD is not set. Skipping admin bootstrap.");
        return;
    }
    const existing = await prisma_1.prisma.user.findFirst({
        where: { email, role: client_1.Role.ADMIN },
    });
    if (existing) {
        return;
    }
    const hashService = new hash_1.HashService();
    const passwordHash = await hashService.hash(password);
    await prisma_1.prisma.user.create({
        data: {
            email,
            password: passwordHash,
            username: "admin",
            name: "Administrator",
            role: client_1.Role.ADMIN,
            status: client_1.UserStatus.ACTIVE,
            emailVerified: true,
            provider: "local",
        },
    });
    logger_1.logger.info("Admin user created", { email });
}
