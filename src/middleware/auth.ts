import jwt from "jsonwebtoken";
import { Request, Response, NextFunction } from "express";
import { prisma } from "../prisma/client";
const JWT_SECRET = process.env.JWT_SECRET || "supersecret";

export interface AuthRequest extends Request {
  user?: any;
}

export const authenticateJWT = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  const token = req.cookies.token;
  if (!token) return res.status(401).json({ error: "No token provided" });

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(403).json({ error: "Invalid or expired token" });
  }
};

export function authenticateAdminJWT(
  req: Request,
  res: Response,
  next: NextFunction
) {
  console.log('[authenticateAdminJWT] Middleware called');
  console.log('[authenticateAdminJWT] Cookies:', req.cookies);
  console.log('[authenticateAdminJWT] Headers:', req.headers.cookie);
  
  const token = req.cookies.admintoken;
  console.log('[authenticateAdminJWT] Admin token:', token ? 'Present' : 'Missing');
  
  if (!token) {
    console.log('[authenticateAdminJWT] No token found');
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "supersecret");
    console.log('[authenticateAdminJWT] Token decoded:', decoded);
    
    if (typeof decoded === "string") {
      console.log('[authenticateAdminJWT] Invalid token payload');
      res.status(403).json({ error: "Invalid token payload" });
      return;
    }
    
    (req as any).user = decoded;
    console.log('[authenticateAdminJWT] User set:', (req as any).user);
    next();
  } catch (err) {
    console.log('[authenticateAdminJWT] Token verification failed:', err);
    res.status(403).json({ error: "Forbidden" });
    return;
  }
}


export function authorizeRoles(...roles: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    const user = (req as any).user;
    if (!user || !roles.includes(user.role)) {
      res.status(403).json({ error: "Forbidden" });
      return;
    }
    next();
  };
}

export const authenticateUserJWT = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const token = req.cookies.token;

    console.log("Token received:", token ? "Yes" : "No"); 
    console.log("Verifying with secret:", JWT_SECRET.substring(0, 10) + "..."); 

    if (!token) {
      res.status(401).json({ error: "No token provided" });
      return;
    }

    const decoded = jwt.verify(token, JWT_SECRET) as {
      userId: string;
      email: string;
    };

    console.log("Token decoded successfully:", decoded.userId); 

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
    });

    if (!user) {
      res.status(401).json({ error: "User not found" });
      return;
    }

    if (user.isBlocked) {
      res.status(401).json({ error: "Account is blocked" });
      return;
    }

    (req as any).user = user;
    next();
  } catch (error) {
    console.error("Auth middleware error:", error);
    res.status(401).json({ error: "Invalid token" });
    return;
  }
};
