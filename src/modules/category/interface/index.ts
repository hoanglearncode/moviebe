import { IUseCase } from "@/share/interface";
import {
  CategoryCondDTO,
  CategoryCreateDTO,
  CategoryUpdateDTO,
} from "@/modules/category/model/dto";
import { Category } from "@/modules/category/model/model";

export interface ICategoryUseCase extends IUseCase<
  CategoryCreateDTO,
  CategoryUpdateDTO,
  Category,
  CategoryCondDTO
> {}
