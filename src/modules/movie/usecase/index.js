"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PublicMovieUseCase = void 0;
class PublicMovieUseCase {
    constructor(repo) {
        this.repo = repo;
    }
    async getListMovies(cond, paging) {
        return this.repo.getListMovies(cond, paging);
    }
    async getMovieById(id) {
        return this.repo.getMovieById(id);
    }
    async getMovieShowtimes(movieId, date) {
        return this.repo.getMovieShowtimes(movieId, date);
    }
    async getShowtimeById(showtimeId) {
        return this.repo.getShowtimeById(showtimeId);
    }
    async getShowtimeSeatMap(showtimeId) {
        return this.repo.getShowtimeSeatMap(showtimeId);
    }
}
exports.PublicMovieUseCase = PublicMovieUseCase;
