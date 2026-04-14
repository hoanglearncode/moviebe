import { Request, Response } from "express";
import { successResponse, errorResponse } from "../../../../share/transport/http-server";
import { IMovieManagementUseCase } from "../../interface/movie.interface";
import {
  CreateMoviePayloadDTO,
  UpdateMoviePayloadDTO,
  ListMoviesQueryPayloadDTO,
} from "../../model/dto";

export class MovieManagementHttpService {
  constructor(private readonly useCase: IMovieManagementUseCase) {}

  async createMovie(req: Request, res: Response): Promise<void> {
    try {
      const parsed = CreateMoviePayloadDTO.parse(req.body);
      const result = await this.useCase.createMovie((req as any).partnerId, parsed);
      successResponse(res, result, "Movie created successfully", 201);
    } catch (err: any) {
      errorResponse(res, err.statusCode || 400, err.message, err.code);
    }
  }

  async getMovies(req: Request, res: Response): Promise<void> {
    try {
      const query = ListMoviesQueryPayloadDTO.parse({
        page: req.query.page ? Number(req.query.page) : 1,
        limit: req.query.limit ? Number(req.query.limit) : 20,
        status: req.query.status,
        keyword: req.query.keyword,
        sortBy: req.query.sortBy ?? "createdAt",
        sortOrder: req.query.sortOrder ?? "desc",
      });
      const result = await this.useCase.getMovies((req as any).partnerId, query);
      successResponse(res, result);
    } catch (err: any) {
      errorResponse(res, err.statusCode || 500, err.message, err.code);
    }
  }

  async getMovieDetail(req: Request, res: Response): Promise<void> {
    try {
      const movie = await this.useCase.getMovieDetail(
        (req as any).partnerId,
        String(req.params.movieId),
      );
      successResponse(res, movie);
    } catch (err: any) {
      errorResponse(res, err.statusCode || 404, err.message, err.code);
    }
  }

  async updateMovie(req: Request, res: Response): Promise<void> {
    try {
      const parsed = UpdateMoviePayloadDTO.parse(req.body);
      const updated = await this.useCase.updateMovie(
        (req as any).partnerId,
        String(req.params.movieId),
        parsed,
      );
      successResponse(res, updated);
    } catch (err: any) {
      errorResponse(res, err.statusCode || 400, err.message, err.code);
    }
  }

  async deleteMovie(req: Request, res: Response): Promise<void> {
    try {
      const result = await this.useCase.deleteMovie(
        (req as any).partnerId,
        String(req.params.movieId),
      );
      successResponse(res, result);
    } catch (err: any) {
      errorResponse(res, err.statusCode || 400, err.message, err.code);
    }
  }

  async submitMovie(req: Request, res: Response): Promise<void> {
    try {
      const result = await this.useCase.submitMovieForApproval(
        (req as any).partnerId,
        String(req.params.movieId),
      );
      successResponse(res, result);
    } catch (err: any) {
      errorResponse(res, err.statusCode || 400, err.message, err.code);
    }
  }
}
