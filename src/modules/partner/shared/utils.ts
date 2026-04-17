import { PartnerRequestRow } from "../model/model";
import { getSessionModel } from "../../user/infras/repository/dto";
import { PrismaClient } from "@prisma/client";

export const initializePartnerData = async (data: PartnerRequestRow) => {
    const prisma = PrismaClient;
    // logout toàn bộ thông tin user hiện đang đăng nhập 
    const sessionModel = getSessionModel(prisma);
    const result = await this.model.updateMany({
      where: { userId, isActive: true },
      data: { isActive: false },
    });
    return result.count;
    // tạo partner profile

    
    // tạo wallet partner 

    // tạo partner setting 

    // tạo partner staff 

}