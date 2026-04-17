import { PrismaClient } from "@prisma/client";
import { IMovieRepository } from "../../interface/movie.interface";
import { Movie } from "../../model/model";
import { ListMoviesQueryDTO } from "../../model/dto";
import { PagingDTO } from "../../../../share";

export class MovieRepository implements IMovieRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async get(_id: string): Promise<Movie | null> {
    return null;
  }
  async list(_cond: Partial<Movie>, _paging: PagingDTO): Promise<Movie[]> {
    return [];
  }
  async findByCond(_cond: Partial<Movie>): Promise<Movie | null> {
    return null;
  }

  async findById(movieId: string): Promise<Movie | null> {
    const row = await this.prisma.movie.findUnique({ where: { id: movieId } });
    return row ? (row as unknown as Movie) : null;
  }

  async findByPartnerId(
    partnerId: string,
    query: ListMoviesQueryDTO,
  ): Promise<{ items: Movie[]; total: number }> {
    const {
      page = 1,
      limit = 20,
      status,
      keyword,
      sortBy = "createdAt",
      sortOrder = "desc",
    } = query;
    const skip = (page - 1) * limit;
    const where: any = { partnerId };
    if (status) where.status = status;
    if (keyword) where.title = { contains: keyword, mode: "insensitive" };

    const [rows, total] = await Promise.all([
      this.prisma.movie.findMany({ where, skip, take: limit, orderBy: { [sortBy]: sortOrder } }),
      this.prisma.movie.count({ where }),
    ]);
    return { items: rows as unknown as Movie[], total };
  }

  async findByIdAndPartnerId(movieId: string, partnerId: string): Promise<Movie | null> {
    const row = await this.prisma.movie.findFirst({ where: { id: movieId, partnerId } });
    return row ? (row as unknown as Movie) : null;
  }

  async updateStatus(movieId: string, status: string): Promise<boolean> {
    await this.prisma.movie.update({ where: { id: movieId }, data: { status: status as any } });
    return true;
  }

  async insert(data: Movie): Promise<boolean> {
    await this.prisma.movie.create({ data: data as any });
    return true;
  }

  async update(id: string, data: Partial<Movie>): Promise<boolean> {
    await this.prisma.movie.update({ where: { id }, data: data as any });
    return true;
  }

  async delete(id: string, _isHard = false): Promise<boolean> {
    await this.prisma.movie.delete({ where: { id } });
    return true;
  }
}

export const createMovieRepository = (prisma: PrismaClient): IMovieRepository =>
  new MovieRepository(prisma);
