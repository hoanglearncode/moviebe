import { Request, Response } from "express";
import { successResponse, errorResponse } from "../../../../share/transport/http-server";
import { writeAuditLog } from "../../../admin-audit-logs/helper";
import { getSystemSettingsService } from "../../shared/settings-service";
import type { ISystemSettingsUseCase } from "../../interface";
import { PrismaClient } from "@prisma/client";

function buildAuditDescription(
  changedKeys: string[],
  previousValues: Record<string, string>,
  currentValues: Record<string, string>,
): string {
  if (changedKeys.length === 1) {
    const key = changedKeys[0];
    if (key === "maintenanceMode") return currentValues[key] === "true" ? "Bật chế độ bảo trì" : "Tắt chế độ bảo trì";
    if (key === "siteName") return `Đổi tên nền tảng: "${previousValues[key]}" → "${currentValues[key]}"`;
    if (key === "registrationOpen") return currentValues[key] === "true" ? "Mở đăng ký tài khoản" : "Đóng đăng ký tài khoản";
  }
  if (changedKeys.includes("siteName")) {
    const extra = changedKeys.length > 1 ? ` (và ${changedKeys.length - 1} thay đổi khác)` : "";
    return `Đổi tên nền tảng: "${previousValues["siteName"]}" → "${currentValues["siteName"]}"${extra}`;
  }
  if (changedKeys.includes("maintenanceMode")) {
    const status = currentValues["maintenanceMode"] === "true" ? "Bật" : "Tắt";
    return `${status} chế độ bảo trì (và ${changedKeys.length - 1} thay đổi khác)`;
  }
  return `Cập nhật cài đặt hệ thống (${changedKeys.length} thay đổi)`;
}

export class SystemSettingsHttpService {
  constructor(
    private readonly useCase: ISystemSettingsUseCase,
    private readonly prisma: PrismaClient,
  ) {}

  async getSettings(req: Request, res: Response): Promise<void> {
    try {
      const settings = await this.useCase.getSettings();
      successResponse(res, settings);
    } catch (err: any) {
      errorResponse(res, 500, err.message);
    }
  }

  async updateSettings(req: Request, res: Response): Promise<void> {
    try {
      const result = await this.useCase.updateSettings(req.body);

      if (result.changedKeys.length === 0) {
        const settings = await this.useCase.getSettings();
        successResponse(res, settings, "No changes detected");
        return;
      }

      const description = buildAuditDescription(result.changedKeys, result.previousValues, result.currentValues);
      const toggledMaintenance = result.changedKeys.includes("maintenanceMode");

      await writeAuditLog(this.prisma, req, {
        action: "update_system_settings",
        description,
        category: "system",
        severity: toggledMaintenance ? "critical" : "high",
        targetType: "system_settings",
        targetLabel: "global",
        meta: {
          keys: result.changedKeys.join(","),
          previous: result.previousValues,
          current: result.currentValues,
        },
      });

      // Invalidate cached settings so maintenance middleware picks up changes immediately
      try {
        getSystemSettingsService().invalidate();
      } catch {
        // Service may not be initialized in tests — ignore
      }

      successResponse(res, result.settings, "Settings updated");
    } catch (err: any) {
      if (err.status === 400 || err.name === "ValidationError") {
        errorResponse(res, 400, err.message, "VALIDATION_ERROR", err.details);
      } else {
        errorResponse(res, 500, err.message);
      }
    }
  }

  async getSystemStatus(req: Request, res: Response): Promise<void> {
    try {
      const status = await this.useCase.getSystemStatus();
      successResponse(res, status);
    } catch (err: any) {
      errorResponse(res, 500, err.message);
    }
  }
}
