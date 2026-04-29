import { IUseCase } from "../../../share/interface";
import { CategoryCondDTO, CategoryCreateDTO, CategoryUpdateDTO } from "../model/dto";
import { Category } from "../model/model";

export interface ICategoryUseCase extends IUseCase<
  CategoryCreateDTO,
  CategoryUpdateDTO,
  Category,
  CategoryCondDTO
> {}
