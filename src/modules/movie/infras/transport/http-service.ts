import { Request, Response } from "express";
import { BaseHttpService } from "../../../../share/transport/http-server";
import { IPublicMovieUseCase } from "../../interface";
import { MovieCondDTO, MovieCondDTOSchema } from "../../model/dto";
import { Movie } from "../../model/model";

function getParam(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export class PublicMovieHttpService extends BaseHttpService<any, Movie, any, any> {
  private readonly movieUseCase: IPublicMovieUseCase;

  constructor(useCase: IPublicMovieUseCase) {
    super(useCase as any);
    this.movieUseCase = useCase;
  }

  async getListMovies(req: Request, res: Response): Promise<void> {
    const cond = MovieCondDTOSchema.parse(req.query);
    await this.handleRequest(res, () =>
      this.movieUseCase.getListMovies(cond, {
        page: Number(cond.page),
        limit: Number(cond.limit),
      }),
    );
  }

  async getMovieDetail(req: Request, res: Response): Promise<void> {
    const id = this.getRequiredId(req.params["id"]);
    await this.handleRequest(res, () => this.movieUseCase.getMovieById(id));
  }

  async getMovieShowtimes(req: Request, res: Response): Promise<void> {
    const id = this.getRequiredId(req.params["id"]);
    const date = getParam(req.query["date"] as string | string[] | undefined);
    await this.handleRequest(res, () => this.movieUseCase.getMovieShowtimes(id, date));
  }

  async getShowtimeDetail(req: Request, res: Response): Promise<void> {
    const id = this.getRequiredId(req.params["showtimeId"]);
    await this.handleRequest(res, async () => {
      const showtime = await this.movieUseCase.getShowtimeById(id);
      if (!showtime) throw new Error("Showtime not found");
      return showtime;
    });
  }

  async getShowtimeSeatMap(req: Request, res: Response): Promise<void> {
    const id = this.getRequiredId(req.params["showtimeId"]);
    await this.handleRequest(res, async () => {
      const seatMap = await this.movieUseCase.getShowtimeSeatMap(id);
      if (!seatMap) throw new Error("Showtime not found");
      return seatMap;
    });
  }
}
