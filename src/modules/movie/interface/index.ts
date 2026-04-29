import { PagingDTO } from "../../../share";
import { Movie, PublicShowtime, PublicShowtimeSeatMap } from "../model/model";
import { MovieCondDTO } from "../model/dto";

export interface IPublicMovieRepository {
  getListMovies(cond: MovieCondDTO, paging: PagingDTO): Promise<Movie[]>;
  getMovieById(id: string): Promise<Movie | null>;
  getMovieShowtimes(movieId: string, date?: string): Promise<PublicShowtime[]>;
  getShowtimeById(showtimeId: string): Promise<PublicShowtime | null>;
  getShowtimeSeatMap(showtimeId: string): Promise<PublicShowtimeSeatMap | null>;
}

export interface IPublicMovieUseCase {
  getListMovies(cond: MovieCondDTO, paging: PagingDTO): Promise<Movie[]>;
  getMovieById(id: string): Promise<Movie | null>;
  getMovieShowtimes(movieId: string, date?: string): Promise<PublicShowtime[]>;
  getShowtimeById(showtimeId: string): Promise<PublicShowtime | null>;
  getShowtimeSeatMap(showtimeId: string): Promise<PublicShowtimeSeatMap | null>;
}
