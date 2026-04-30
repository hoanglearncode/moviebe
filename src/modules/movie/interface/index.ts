import { PagingDTO } from "@/share";
import { Movie, PublicShowtime, PublicShowtimeSeatMap } from "@/modules/movie/model/model";
import { MovieCondDTO } from "@/modules/movie/model/dto";

export type MovieSectionsResponse = {
  coming: Movie[];
  showing: Movie[];
  trend: Movie[];
  pagination: {
    page: number;
    limit: number;
    totalComing: number;
    totalShowing: number;
    totalPagesComing: number;
    totalPagesShowing: number;
  };
};

export interface IPublicMovieRepository {
  getListMovies(cond: MovieCondDTO, paging: PagingDTO): Promise<MovieSectionsResponse>;
  getMovieById(id: string): Promise<Movie | null>;
  getMovieShowtimes(movieId: string, date?: string): Promise<PublicShowtime[]>;
  getShowtimeById(showtimeId: string): Promise<PublicShowtime | null>;
  getShowtimeSeatMap(showtimeId: string): Promise<PublicShowtimeSeatMap | null>;
}

export interface IPublicMovieUseCase {
  getListMovies(cond: MovieCondDTO, paging: PagingDTO): Promise<MovieSectionsResponse>;
  getMovieById(id: string): Promise<Movie | null>;
  getMovieShowtimes(movieId: string, date?: string): Promise<PublicShowtime[]>;
  getShowtimeById(showtimeId: string): Promise<PublicShowtime | null>;
  getShowtimeSeatMap(showtimeId: string): Promise<PublicShowtimeSeatMap | null>;
}
