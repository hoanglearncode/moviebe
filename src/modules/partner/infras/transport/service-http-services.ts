import { Request, Response } from "express";
import { IPartnerServicesUseCase } from "../../interface";

export class ServicesHttpService {
  constructor(private useCase: IPartnerServicesUseCase) {}

  private parseServiceId(rawId: string): number {
    const id = Number(rawId);

    if (!Number.isInteger(id) || id <= 0) {
      throw new Error("Invalid service id");
    }

    return id;
  }

  async list(req: Request, res: Response) {
    try {
      const { page = 1, limit = 10, ...cond } = req.query;
      const partnerId = (req as any).partnerId;

      const data = await this.useCase.list(partnerId, cond, {
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
      const partnerId = (req as any).partnerId;
      const data = await this.useCase.findByCond(partnerId, req.query);

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
      const partnerId = (req as any).partnerId;

      const data = await this.useCase.findById(partnerId, this.parseServiceId(id.toString()));

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
      const partnerId = (req as any).partnerId;
      const data = await this.useCase.insert(partnerId, req.body);

      return res.status(201).json({
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

  async update(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const partnerId = (req as any).partnerId;

      const data = await this.useCase.update(partnerId, this.parseServiceId(id.toString()), req.body);

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

  async delete(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const partnerId = (req as any).partnerId;

      const success = await this.useCase.delete(
        partnerId,
        this.parseServiceId(id.toString()),
        false,
      );

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
