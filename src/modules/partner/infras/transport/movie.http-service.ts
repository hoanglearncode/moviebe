import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import { successResponse, errorResponse } from "../../../../share/transport/http-server";
import { IMovieManagementUseCase } from "../../interface/movie.interface";
import {
  UpdateMovieDTO,
  CreateMovieDTO,
  ListMoviesQueryDTO,
} from "../../model/dto";
import { writeAuditLog } from "../../../admin-audit-logs/helper";

export class MovieManagementHttpService {
  constructor(
    private useCase: IMovieManagementUseCase,
    private prisma?: PrismaClient,
  ) {}

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

  // ── Admin handlers ──────────────────────────────────────────────────────────

  async adminListMovies(req: Request, res: Response): Promise<void> {
    try {
      const query: ListMoviesQueryDTO = {
        page: req.query.page ? parseInt(req.query.page as string) : 1,
        limit: req.query.limit ? parseInt(req.query.limit as string) : 20,
        status: req.query.status as any,
        keyword: req.query.keyword as string | undefined,
        sortBy: (req.query.sortBy as any) || "createdAt",
        sortOrder: (req.query.sortOrder as any) || "desc",
      };
      const result = await this.useCase.adminListMovies(query);
      successResponse(res, result, "Movies retrieved successfully");
    } catch (error: any) {
      errorResponse(res, error.statusCode || 500, error.message, error.code);
    }
  }

  async adminGetMovieStats(req: Request, res: Response): Promise<void> {
    try {
      const stats = await this.useCase.adminGetMovieStats();
      successResponse(res, stats, "Movie stats retrieved");
    } catch (error: any) {
      errorResponse(res, 500, error.message, error.code);
    }
  }

  async adminApproveMovie(req: Request, res: Response): Promise<void> {
    try {
      const { movieId } = req.params;
      const { note = "" } = req.body;
      const result = await this.useCase.adminApproveMovie(String(movieId), note);
      if (this.prisma) {
        await writeAuditLog(this.prisma, req, {
          action: "approve_movie",
          description: `Approved movie ${movieId}`,
          category: "movie",
          severity: "medium",
          targetType: "movie",
          targetId: String(movieId),
          targetLabel: String((result as any)?.title ?? movieId),
          meta: { note },
        });
      }
      successResponse(res, result, "Movie approved successfully");
    } catch (error: any) {
      errorResponse(res, error.statusCode || 400, error.message, error.code);
    }
  }

  async adminRejectMovie(req: Request, res: Response): Promise<void> {
    try {
      const { movieId } = req.params;
      const { reason, note } = req.body;
      if (!reason || !note) {
        return errorResponse(res, 400, "reason and note are required");
      }
      const result = await this.useCase.adminRejectMovie(String(movieId), reason, note);
      if (this.prisma) {
        await writeAuditLog(this.prisma, req, {
          action: "reject_movie",
          description: `Rejected movie ${movieId}`,
          category: "movie",
          severity: "medium",
          targetType: "movie",
          targetId: String(movieId),
          targetLabel: String((result as any)?.title ?? movieId),
          meta: { reason, note },
        });
      }
      successResponse(res, result, "Movie rejected successfully");
    } catch (error: any) {
      errorResponse(res, error.statusCode || 400, error.message, error.code);
    }
  }
}
