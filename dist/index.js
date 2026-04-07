"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const category_1 = require("./modules/category");
const auth_1 = require("./modules/auth");
const repo_1 = require("./modules/category/infras/repository/repo");
const prisma_1 = require("./share/component/prisma");
const dotenv_1 = require("dotenv");
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
(0, dotenv_1.config)();
(async () => {
    await prisma_1.prisma.$connect();
    console.log('Connection has been established successfully.');
    const app = (0, express_1.default)();
    const port = process.env.PORT || 3000;
    app.use(express_1.default.json());
    app.use((0, cors_1.default)({
        origin: [
            "http://localhost:3000",
            "http://localhost:3001",
            "http://localhost:3002",
            "https://yourdomain.com",
        ],
        credentials: true,
        methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
        allowedHeaders: ["Content-Type", "Authorization"],
    }));
    app.use('/v1', (0, category_1.setupCategoryHexagon)((0, repo_1.createCategoryRepository)(prisma_1.prisma)));
    app.use('/v1', (0, auth_1.setupAuthHexagon)(prisma_1.prisma));
    // app.use('/v1', setupProductHexagon(sequelize));
    app.listen(port, () => {
        console.log(`Server is running on http://localhost:${port}`);
    });
})();
