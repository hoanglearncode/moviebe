"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RoomManagementHttpService = void 0;
const http_server_1 = require("../../../../share/transport/http-server");
const dto_1 = require("../../model/dto");
class RoomManagementHttpService {
    constructor(roomRepo) {
        this.roomRepo = roomRepo;
    }
    async createRoom(req, res) {
        try {
            const partnerId = req.partnerId;
            if (!partnerId) {
                return (0, http_server_1.errorResponse)(res, 401, "Unauthorized");
            }
            const payload = dto_1.CreateRoomPayloadDTO.parse(req.body);
            const room = await this.roomRepo.create(partnerId, payload);
            (0, http_server_1.successResponse)(res, room, "Room created successfully", 201);
        }
        catch (error) {
            if (error.name === "ZodError") {
                return (0, http_server_1.errorResponse)(res, 400, "Invalid payload", error.errors);
            }
            (0, http_server_1.errorResponse)(res, error.statusCode || 500, error.message);
        }
    }
    async getRooms(req, res) {
        try {
            const partnerId = req.partnerId;
            if (!partnerId) {
                return (0, http_server_1.errorResponse)(res, 401, "Unauthorized");
            }
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 20;
            const paging = { page, limit };
            const result = await this.roomRepo.findMany(partnerId, paging);
            (0, http_server_1.successResponse)(res, {
                items: result.items,
                total: result.total,
                page,
                limit,
                totalPages: Math.ceil(result.total / limit),
            }, "Rooms retrieved successfully");
        }
        catch (error) {
            (0, http_server_1.errorResponse)(res, error.statusCode || 500, error.message);
        }
    }
    async getRoomDetail(req, res) {
        try {
            const { roomId } = req.params;
            const partnerId = req.partnerId;
            if (!partnerId) {
                return (0, http_server_1.errorResponse)(res, 401, "Unauthorized");
            }
            const room = await this.roomRepo.findById(String(roomId));
            if (!room || room.partnerId !== partnerId) {
                return (0, http_server_1.errorResponse)(res, 404, "Room not found");
            }
            (0, http_server_1.successResponse)(res, room, "Room details retrieved successfully");
        }
        catch (error) {
            (0, http_server_1.errorResponse)(res, error.statusCode || 500, error.message);
        }
    }
    async updateRoom(req, res) {
        try {
            const { roomId } = req.params;
            const partnerId = req.partnerId;
            if (!partnerId) {
                return (0, http_server_1.errorResponse)(res, 401, "Unauthorized");
            }
            const payload = dto_1.UpdateRoomPayloadDTO.parse(req.body);
            const room = await this.roomRepo.update(partnerId, String(roomId), payload);
            (0, http_server_1.successResponse)(res, room, "Room updated successfully");
        }
        catch (error) {
            if (error.name === "ZodError") {
                return (0, http_server_1.errorResponse)(res, 400, "Invalid payload", error.errors);
            }
            if (error.message.includes("not found")) {
                return (0, http_server_1.errorResponse)(res, 404, error.message);
            }
            (0, http_server_1.errorResponse)(res, error.statusCode || 500, error.message);
        }
    }
    async deleteRoom(req, res) {
        try {
            const { roomId } = req.params;
            const partnerId = req.partnerId;
            if (!partnerId) {
                return (0, http_server_1.errorResponse)(res, 401, "Unauthorized");
            }
            await this.roomRepo.delete(partnerId, String(roomId));
            (0, http_server_1.successResponse)(res, { id: roomId }, "Room deleted successfully");
        }
        catch (error) {
            if (error.message.includes("not found")) {
                return (0, http_server_1.errorResponse)(res, 404, error.message);
            }
            (0, http_server_1.errorResponse)(res, error.statusCode || 500, error.message);
        }
    }
}
exports.RoomManagementHttpService = RoomManagementHttpService;
