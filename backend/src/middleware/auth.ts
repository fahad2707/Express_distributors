import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export interface AuthRequest extends Request {
  userId?: string;
  /** Set when authenticated as admin (JWT role === 'admin'). */
  userRole?: string;
}

export const authenticateUser = (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: string; phone: string };
    req.userId = decoded.userId;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
};

export const authenticateAdmin = (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { adminId: string; role: string };
    
    if (decoded.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    req.userId = decoded.adminId;
    req.userRole = decoded.role;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
};

/** If a valid admin JWT is present, sets userRole; otherwise continues as guest (no 401). */
export const optionalAuthenticateAdmin = (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return next();
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { adminId: string; role: string };
    if (decoded.adminId && String(decoded.role || '').toLowerCase() === 'admin') {
      req.userId = decoded.adminId;
      req.userRole = 'admin';
    }
    next();
  } catch {
    next();
  }
};


