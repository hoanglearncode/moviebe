import { PagingDTO } from "../../../share";
import { MovieCondDTO } from "../model/dto";
import { Movie, PublicShowtime, PublicShowtimeSeatMap } from "../model/model";
import { IPublicMovieRepository, IPublicMovieUseCase } from "../interface";

export class PublicMovieUseCase implements IPublicMovieUseCase {
  constructor(private readonly repo: IPublicMovieRepository) {}

  async getListMovies(cond: MovieCondDTO, paging: PagingDTO): Promise<Movie[]> {
    return this.repo.getListMovies(cond, paging);
  }

  async getMovieById(id: string): Promise<Movie | null> {
    return this.repo.getMovieById(id);
  }

  async getMovieShowtimes(movieId: string, date?: string): Promise<PublicShowtime[]> {
    return this.repo.getMovieShowtimes(movieId, date);
  }

  async getShowtimeById(showtimeId: string): Promise<PublicShowtime | null> {
    return this.repo.getShowtimeById(showtimeId);
  }

  async getShowtimeSeatMap(showtimeId: string): Promise<PublicShowtimeSeatMap | null> {
    return this.repo.getShowtimeSeatMap(showtimeId);
  }
}
