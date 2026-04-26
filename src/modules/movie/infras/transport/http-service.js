"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PublicMovieHttpService = void 0;
const http_server_1 = require("../../../../share/transport/http-server");
const dto_1 = require("../../model/dto");
function getParam(value) {
    return Array.isArray(value) ? value[0] : value;
}
class PublicMovieHttpService extends http_server_1.BaseHttpService {
    constructor(useCase) {
        super(useCase);
        this.movieUseCase = useCase;
    }
    async getListMovies(req, res) {
        const cond = dto_1.MovieCondDTOSchema.parse(req.query);
        await this.handleRequest(res, () => this.movieUseCase.getListMovies(cond, {
            page: Number(cond.page),
            limit: Number(cond.limit),
        }));
    }
    async getMovieDetail(req, res) {
        const id = this.getRequiredId(req.params["id"]);
        await this.handleRequest(res, () => this.movieUseCase.getMovieById(id));
    }
    async getMovieShowtimes(req, res) {
        const id = this.getRequiredId(req.params["id"]);
        const date = getParam(req.query["date"]);
        await this.handleRequest(res, () => this.movieUseCase.getMovieShowtimes(id, date));
    }
    async getShowtimeDetail(req, res) {
        const id = this.getRequiredId(req.params["showtimeId"]);
        await this.handleRequest(res, async () => {
            const showtime = await this.movieUseCase.getShowtimeById(id);
            if (!showtime)
                throw new Error("Showtime not found");
            return showtime;
        });
    }
    async getShowtimeSeatMap(req, res) {
        const id = this.getRequiredId(req.params["showtimeId"]);
        await this.handleRequest(res, async () => {
            const seatMap = await this.movieUseCase.getShowtimeSeatMap(id);
            if (!seatMap)
                throw new Error("Showtime not found");
            return seatMap;
        });
    }
}
exports.PublicMovieHttpService = PublicMovieHttpService;
