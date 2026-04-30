import { Request, Response } from "express";
import { successResponse, errorResponse } from "@/share/transport/http-server";
import { PagingDTO } from "@/share";
import { CreateRoomPayloadDTO, UpdateRoomPayloadDTO } from "@/modules/partner/model/dto";
import { IRoomRepository } from "@/modules/partner/infras/repository/room.repo";

export class RoomManagementHttpService {
  constructor(private roomRepo: IRoomRepository) {}

  async createRoom(req: Request, res: Response): Promise<void> {
    try {
      const partnerId = (req as any).partnerId;
      if (!partnerId) {
        return errorResponse(res, 401, "Unauthorized");
      }

      const payload = CreateRoomPayloadDTO.parse(req.body);

      const room = await this.roomRepo.create(partnerId, payload);
      successResponse(res, room, "Room created successfully", 201);
    } catch (error: any) {
      if (error.name === "ZodError") {
        return errorResponse(res, 400, "Invalid payload", error.errors);
      }
      errorResponse(res, error.statusCode || 500, error.message);
    }
  }

  async getRooms(req: Request, res: Response): Promise<void> {
    try {
      const partnerId = (req as any).partnerId;
      if (!partnerId) {
        return errorResponse(res, 401, "Unauthorized");
      }

      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;

      const paging: PagingDTO = { page, limit };
      const result = await this.roomRepo.findMany(partnerId, paging);

      successResponse(
        res,
        {
          items: result.items,
          total: result.total,
          page,
          limit,
          totalPages: Math.ceil(result.total / limit),
        },
        "Rooms retrieved successfully",
      );
    } catch (error: any) {
      errorResponse(res, error.statusCode || 500, error.message);
    }
  }

  async getRoomDetail(req: Request, res: Response): Promise<void> {
    try {
      const { roomId } = req.params;
      const partnerId = (req as any).partnerId;

      if (!partnerId) {
        return errorResponse(res, 401, "Unauthorized");
      }

      const room = await this.roomRepo.findById(String(roomId));

      if (!room || room.partnerId !== partnerId) {
        return errorResponse(res, 404, "Room not found");
      }

      successResponse(res, room, "Room details retrieved successfully");
    } catch (error: any) {
      errorResponse(res, error.statusCode || 500, error.message);
    }
  }

  async updateRoom(req: Request, res: Response): Promise<void> {
    try {
      const { roomId } = req.params;
      const partnerId = (req as any).partnerId;

      if (!partnerId) {
        return errorResponse(res, 401, "Unauthorized");
      }

      const payload = UpdateRoomPayloadDTO.parse(req.body);

      const room = await this.roomRepo.update(partnerId, String(roomId), payload);
      successResponse(res, room, "Room updated successfully");
    } catch (error: any) {
      if (error.name === "ZodError") {
        return errorResponse(res, 400, "Invalid payload", error.errors);
      }
      if (error.message.includes("not found")) {
        return errorResponse(res, 404, error.message);
      }
      errorResponse(res, error.statusCode || 500, error.message);
    }
  }

  async deleteRoom(req: Request, res: Response): Promise<void> {
    try {
      const { roomId } = req.params;
      const partnerId = (req as any).partnerId;

      if (!partnerId) {
        return errorResponse(res, 401, "Unauthorized");
      }

      await this.roomRepo.delete(partnerId, String(roomId));
      successResponse(res, { id: roomId }, "Room deleted successfully");
    } catch (error: any) {
      if (error.message.includes("not found")) {
        return errorResponse(res, 404, error.message);
      }
      errorResponse(res, error.statusCode || 500, error.message);
    }
  }
}
