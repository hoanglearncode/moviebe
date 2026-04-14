import { randomUUID } from "crypto";
import { IPartnerRepository } from "../interface/profile.interface";
import { IMovieRepository, IMovieManagementUseCase } from "../interface/movie.interface";
import { PartnerProfile, Movie } from "../model/model";
import { CreateMovieDTO, UpdateMovieDTO, ListMoviesQueryDTO } from "../model/dto";

export class MovieManagementUseCase implements IMovieManagementUseCase {
  constructor(
    private readonly partnerRepo: IPartnerRepository,
    private readonly movieRepo: IMovieRepository,
  ) {}

  private async requireApprovedPartner(partnerId: string): Promise<PartnerProfile> {
    const partner = await this.partnerRepo.findById(partnerId);
    if (!partner) throw new Error("Partner not found");
    if (partner.status !== "APPROVED")
      throw new Error(`Partner is not approved (current status: ${partner.status})`);
    return partner;
  }

  async createMovie(partnerId: string, data: CreateMovieDTO): Promise<{ movieId: string }> {
    await this.requireApprovedPartner(partnerId);

    const releaseDate = new Date(data.releaseDate);
    const endDate = new Date(data.endDate);
    if (releaseDate >= endDate) throw new Error("Release date must be before end date");

    const movieId = randomUUID();
    const now = new Date();
    const movie: Movie = {
      id: movieId,
      partnerId,
      title: data.title,
      description: data.description ?? null,
      genre: data.genre,
      language: data.language,
      duration: data.duration,
      releaseDate,
      endDate,
      posterUrl: data.posterUrl ?? null,
      trailerUrl: data.trailerUrl ?? null,
      rating: data.rating ?? null,
      status: "DRAFT",
      publishedAt: null,
      createdAt: now,
      updatedAt: now,
    };

    await this.movieRepo.insert(movie);
    return { movieId };
  }

  async getMovies(
    partnerId: string,
    query: ListMoviesQueryDTO,
  ): Promise<{ items: Movie[]; total: number }> {
    return this.movieRepo.findByPartnerId(partnerId, query);
  }

  async getMovieDetail(partnerId: string, movieId: string): Promise<Movie> {
    const movie = await this.movieRepo.findByIdAndPartnerId(movieId, partnerId);
    if (!movie) throw new Error("Movie not found");
    return movie;
  }

  async updateMovie(partnerId: string, movieId: string, data: UpdateMovieDTO): Promise<Movie> {
    const movie = await this.movieRepo.findByIdAndPartnerId(movieId, partnerId);
    if (!movie) throw new Error("Movie not found");
    if (movie.status !== "DRAFT" && movie.status !== "SUBMITTED")
      throw new Error("Only DRAFT or SUBMITTED movies can be updated");

    await this.movieRepo.update(movieId, { ...data, updatedAt: new Date() });

    const updated = await this.movieRepo.findByIdAndPartnerId(movieId, partnerId);
    if (!updated) throw new Error("Movie not found after update");
    return updated;
  }

  async deleteMovie(partnerId: string, movieId: string): Promise<{ message: string }> {
    const movie = await this.movieRepo.findByIdAndPartnerId(movieId, partnerId);
    if (!movie) throw new Error("Movie not found");
    if (movie.status !== "DRAFT") throw new Error("Only DRAFT movies can be deleted");

    await this.movieRepo.delete(movieId, false);
    return { message: "Movie deleted successfully" };
  }

  async submitMovieForApproval(
    partnerId: string,
    movieId: string,
  ): Promise<{ message: string }> {
    const movie = await this.movieRepo.findByIdAndPartnerId(movieId, partnerId);
    if (!movie) throw new Error("Movie not found");
    if (movie.status !== "DRAFT")
      throw new Error("Only DRAFT movies can be submitted for approval");

    await this.movieRepo.updateStatus(movieId, "SUBMITTED");
    return { message: "Movie submitted for approval" };
  }
}