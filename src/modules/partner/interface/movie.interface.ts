import { IRepository } from "@/share/interface";
import { Movie, CastMember, AdminMovieRow, AdminMovieStats } from "@/modules/partner/model/model";
import { CreateMovieDTO, UpdateMovieDTO, ListMoviesQueryDTO } from "@/modules/partner/model/dto";

// ─── Repository Port ──────────────────────────────────────────────────────────

export interface IMovieRepository extends IRepository<Movie, Partial<Movie>, Partial<Movie>> {
  findById(movieId: string): Promise<Movie | null>;
  findByPartnerId(
    partnerId: string,
    query: ListMoviesQueryDTO,
  ): Promise<{ items: Movie[]; total: number }>;
  findByIdAndPartnerId(movieId: string, partnerId: string): Promise<Movie | null>;
  updateStatus(movieId: string, status: string): Promise<boolean>;
  replaceCast(movieId: string, cast: CastMember[]): Promise<void>;
  // Admin
  findAllForAdmin(query: ListMoviesQueryDTO): Promise<{ items: AdminMovieRow[]; total: number }>;
  getMovieStats(): Promise<AdminMovieStats>;
}

// ─── Use-Case Port ────────────────────────────────────────────────────────────

export interface IMovieManagementUseCase {
  createMovie(partnerId: string, data: CreateMovieDTO): Promise<{ movieId: string }>;
  getMovies(
    partnerId: string,
    query: ListMoviesQueryDTO,
  ): Promise<{ items: Movie[]; total: number }>;
  getMovieDetail(partnerId: string, movieId: string): Promise<Movie>;
  updateMovie(partnerId: string, movieId: string, data: UpdateMovieDTO): Promise<Movie>;
  deleteMovie(partnerId: string, movieId: string): Promise<{ message: string }>;
  submitMovieForApproval(partnerId: string, movieId: string): Promise<{ message: string }>;
  // Admin
  adminListMovies(query: ListMoviesQueryDTO): Promise<{ items: AdminMovieRow[]; total: number }>;
  adminGetMovieStats(): Promise<AdminMovieStats>;
  adminApproveMovie(movieId: string, note: string): Promise<{ message: string }>;
  adminRejectMovie(movieId: string, reason: string, note: string): Promise<{ message: string }>;
}
