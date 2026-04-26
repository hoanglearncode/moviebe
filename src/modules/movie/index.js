"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.setupPublicShowtimeRoutes = exports.setupPublicMovieRoutes = exports.buildPublicShowtimeRouter = exports.buildPublicMovieRouter = void 0;
const express_1 = require("express");
const repo_1 = require("./infras/repository/repo");
const index_1 = require("./usecase/index");
const http_service_1 = require("./infras/transport/http-service");
const buildPublicMovieRouter = (prisma) => {
    const movieRepo = new repo_1.MovieRepository(prisma);
    const movieUseCase = new index_1.PublicMovieUseCase(movieRepo);
    const movieController = new http_service_1.PublicMovieHttpService(movieUseCase);
    const router = (0, express_1.Router)();
    // Movie list and detail
    router.get("/", (req, res) => movieController.getListMovies(req, res));
    router.get("/:id", (req, res) => movieController.getMovieDetail(req, res));
    // Showtimes for a specific movie
    router.get("/:id/showtimes", (req, res) => movieController.getMovieShowtimes(req, res));
    return router;
};
exports.buildPublicMovieRouter = buildPublicMovieRouter;
const buildPublicShowtimeRouter = (prisma) => {
    const movieRepo = new repo_1.MovieRepository(prisma);
    const movieUseCase = new index_1.PublicMovieUseCase(movieRepo);
    const movieController = new http_service_1.PublicMovieHttpService(movieUseCase);
    const router = (0, express_1.Router)();
    // Public showtime detail
    router.get("/:showtimeId", (req, res) => movieController.getShowtimeDetail(req, res));
    // Seat map for a showtime
    router.get("/:showtimeId/seats", (req, res) => movieController.getShowtimeSeatMap(req, res));
    return router;
};
exports.buildPublicShowtimeRouter = buildPublicShowtimeRouter;
const setupPublicMovieRoutes = (prisma) => (0, exports.buildPublicMovieRouter)(prisma);
exports.setupPublicMovieRoutes = setupPublicMovieRoutes;
const setupPublicShowtimeRoutes = (prisma) => (0, exports.buildPublicShowtimeRouter)(prisma);
exports.setupPublicShowtimeRoutes = setupPublicShowtimeRoutes;
