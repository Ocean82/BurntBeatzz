import type { Request, Response, NextFunction } from "express"
import { env } from "../config/env"

export const validateIpAddress = (allowedIps: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const clientIp = req.ip || req.socket.remoteAddress

    if (!clientIp) {
      return res.status(403).json({
        error: "Could not verify client IP",
        timestamp: new Date().toISOString(),
      })
    }

    if (!allowedIps.includes(clientIp) && env.NODE_ENV === "production") {
      return res.status(403).json({
        error: "Access denied",
        clientIp,
        allowedIps,
        timestamp: new Date().toISOString(),
      })
    }

    next()
  }
}
