import { IRepository } from "../../../share/interface";
import { Movie } from "../model/model";
import { CreateMovieDTO, UpdateMovieDTO, ListMoviesQueryDTO } from "../model/dto";

// ─── Repository Port ──────────────────────────────────────────────────────────

export interface IMovieRepository extends IRepository<Movie, Partial<Movie>, Partial<Movie>> {
  findById(movieId: string): Promise<Movie | null>;
  findByPartnerId(
    partnerId: string,
    query: ListMoviesQueryDTO,
  ): Promise<{ items: Movie[]; total: number }>;
  findByIdAndPartnerId(movieId: string, partnerId: string): Promise<Movie | null>;
  updateStatus(movieId: string, status: string): Promise<boolean>;
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
}