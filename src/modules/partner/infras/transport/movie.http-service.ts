import { Request, Response } from "express";
import { successResponse, errorResponse } from "../../../../share/transport/http-server";
import { IMovieManagementUseCase } from "../../interface/movie.interface";
import {
  UpdateMovieDTO,
  CreateMovieDTO,
  ListMoviesQueryDTO,
} from "../../model/dto";

export class MovieManagementHttpService {
  constructor(private useCase: IMovieManagementUseCase) {}

  async createMovie(req: Request, res: Response): Promise<void> {
    try {
      const partnerId = (req as any).partnerId;
      if (!partnerId) {
        return errorResponse(res, 401, "Unauthorized");
      }

      const data: CreateMovieDTO = req.body;
      const result = await this.useCase.createMovie(partnerId, data);
      successResponse(res, result, "Movie created successfully", 201);
    } catch (error: any) {
      errorResponse(res, error.statusCode || 400, error.message, error.code);
    }
  }

  async getMovies(req: Request, res: Response): Promise<void> {
    try {
      const partnerId = (req as any).partnerId;
      if (!partnerId) {
        return errorResponse(res, 401, "Unauthorized");
      }

      const query: ListMoviesQueryDTO = {
        page: req.query.page ? parseInt(req.query.page as string) : 1,
        limit: req.query.limit ? parseInt(req.query.limit as string) : 20,
        status: req.query.status as any,
        keyword: req.query.keyword as string,
        sortBy: (req.query.sortBy as "createdAt" | "title" | "releaseDate") || "createdAt",
        sortOrder: (req.query.sortOrder as "asc" | "desc") || "desc",
      };

      const result = await this.useCase.getMovies(partnerId, query);
      successResponse(res, result, "Movies retrieved successfully");
    } catch (error: any) {
      errorResponse(res, error.statusCode || 500, error.message, error.code);
    }
  }

  async getMovieDetail(req: Request, res: Response): Promise<void> {
    try {
      const partnerId = (req as any).partnerId;
      const { movieId } = req.params;

      if (!partnerId) {
        return errorResponse(res, 401, "Unauthorized");
      }

      const movie = await this.useCase.getMovieDetail(partnerId, String(movieId));
      successResponse(res, movie, "Movie retrieved successfully");
    } catch (error: any) {
      errorResponse(res, error.statusCode || 404, error.message, error.code);
    }
  }

  async updateMovie(req: Request, res: Response): Promise<void> {
    try {
      const partnerId = (req as any).partnerId;
      const { movieId } = req.params;
      const data: UpdateMovieDTO = req.body;

      if (!partnerId) {
        return errorResponse(res, 401, "Unauthorized");
      }

      const updated = await this.useCase.updateMovie(partnerId, String(movieId), data);
      successResponse(res, updated, "Movie updated successfully");
    } catch (error: any) {
      errorResponse(res, error.statusCode || 400, error.message, error.code);
    }
  }

  async deleteMovie(req: Request, res: Response): Promise<void> {
    try {
      const partnerId = (req as any).partnerId;
      const { movieId } = req.params;

      if (!partnerId) {
        return errorResponse(res, 401, "Unauthorized");
      }

      const result = await this.useCase.deleteMovie(partnerId, String(movieId));
      successResponse(res, result, "Movie deleted successfully");
    } catch (error: any) {
      errorResponse(res, error.statusCode || 400, error.message, error.code);
    }
  }

  async submitMovie(req: Request, res: Response): Promise<void> {
    try {
      const partnerId = (req as any).partnerId;
      const { movieId } = req.params;

      if (!partnerId) {
        return errorResponse(res, 401, "Unauthorized");
      }

      const result = await this.useCase.submitMovieForApproval(partnerId, String(movieId));
      successResponse(res, result, "Movie submitted for approval");
    } catch (error: any) {
      errorResponse(res, error.statusCode || 400, error.message, error.code);
    }
  }
}