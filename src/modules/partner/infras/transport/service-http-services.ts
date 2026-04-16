import { Request, Response } from "express";
import { IPartnerServicesUseCase } from "../../interface";

export class ServicesHttpService {
  constructor(private useCase: IPartnerServicesUseCase) {}

  async list(req: Request, res: Response) {
    try {
      const { page = 1, limit = 10, ...cond } = req.query;

      const data = await this.useCase.list(cond, {
        page: Number(page),
        limit: Number(limit),
      });

      return res.status(200).json({
        success: true,
        data,
      });
    } catch (error: any) {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  }

  async findByCond(req: Request, res: Response) {
    try {
      const data = await this.useCase.findByCond(req.query);

      return res.status(200).json({
        success: true,
        data,
      });
    } catch (error: any) {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  }

  async findById(req: Request, res: Response) {
    try {
      const { id } = req.params;

      const data = await this.useCase.findById(id.toString());

      if (!data) {
        return res.status(404).json({
          success: false,
          message: "Service not found",
        });
      }

      return res.status(200).json({
        success: true,
        data,
      });
    } catch (error: any) {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  }

  async create(req: Request, res: Response) {
    try {
      const success = await this.useCase.insert(req.body);

      return res.status(201).json({
        success,
      });
    } catch (error: any) {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  }

  async update(req: Request, res: Response) {
    try {
      const { id } = req.params;

      const success = await this.useCase.update(id.toString(), req.body);

      if (!success) {
        return res.status(404).json({
          success: false,
          message: "Service not found",
        });
      }

      return res.status(200).json({
        success: true,
      });
    } catch (error: any) {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  }

  async delete(req: Request, res: Response) {
    try {
      const { id } = req.params;

      const success = await this.useCase.delete(id.toString(), false);

      if (!success) {
        return res.status(404).json({
          success: false,
          message: "Service not found",
        });
      }

      return res.status(200).json({
        success: true,
      });
    } catch (error: any) {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  }
}
