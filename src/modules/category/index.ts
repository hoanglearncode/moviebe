import { Router } from "express";
import { IRepository } from "../../share/interface";
import { CategoryHttpService } from "./infras/transport/http-service";
import { CategoryCondDTO, CategoryUpdateDTO } from "./model/dto";
import { Category } from "./model/model";
import { CategoryUseCase } from "./usecase";

export const setupCategoryHexagon = (
  repository: IRepository<Category, CategoryCondDTO, CategoryUpdateDTO>
) => {
  const useCase = new CategoryUseCase(repository);
  const httpService = new CategoryHttpService(useCase);

  const router = Router();

  router.post('/categories', httpService.createAPI.bind(httpService));
  router.get('/categories/:id', httpService.getDetailAPI.bind(httpService));
  router.get('/categories', httpService.listAPI.bind(httpService));
  router.patch('/categories/:id', httpService.updateAPI.bind(httpService));
  router.delete('/categories/:id', httpService.deleteAPI.bind(httpService));

  return router;
};
