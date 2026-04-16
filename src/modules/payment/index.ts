import { PrismaClient } from "@prisma/client";

import { Router, Request, Response, NextFunction } from "express";

import { ENV, ErrorCode } from "../../share";

const router = Router();

import { PayOS } from "@payos/node";

const payOSIn = new PayOS({
  clientId: process.env.PAY_IN_PAYOS_CLIENT_ID,
  apiKey: process.env.PAY_IN_PAYOS_API_KEY,
  checksumKey: process.env.PAY_IN_PAYOS_CHECKSUM_KEY,
});

const payOSOut = new PayOS({
  clientId: process.env.PAY_OUT_PAYOS_CLIENT_ID,
  apiKey: process.env.PAY_OUT_PAYOS_API_KEY,
  checksumKey: process.env.PAY_OUT_PAYOS_CHECKSUM_KEY,
});

router.post("/create", async (req: Request, res: Response) => {
  const type = req.query.type as string | undefined;

  if (!type) {
    return res.status(404).json({ code: ErrorCode.NOT_FOUND, message: "Type payment not found!" });
  }

  if (type.trim() === "checkout") {
    const paymentData = {
      orderCode: 123456,
      amount: 50000,
      description: "Thanh toán đơn hàng",
      items: [
        {
          name: "Sản phẩm A",
          quantity: 1,
          price: 50000,
        },
      ],
      cancelUrl: ENV.FRONTEND_URL,
      returnUrl: ENV.FRONTEND_URL,
    };

    const paymentLink = await payOSOut.paymentRequests.create(paymentData);
    console.log(paymentLink.checkoutUrl);
  } else if (type.trim() === "checkin") {
    const paymentData = {
      orderCode: 123456,
      amount: 50000,
      description: "Thanh toán đơn hàng",
      items: [
        {
          name: "Sản phẩm A",
          quantity: 1,
          price: 50000,
        },
      ],
      cancelUrl: ENV.FRONTEND_URL,
      returnUrl: ENV.FRONTEND_URL,
    };

    const paymentLink = await payOSIn.paymentRequests.create(paymentData);
    console.log(paymentLink.checkoutUrl);
  } else {
    return res.status(403).json({ code: ErrorCode.UNAUTHORIZED, mesage: "Type incorrect format" });
  }
});
