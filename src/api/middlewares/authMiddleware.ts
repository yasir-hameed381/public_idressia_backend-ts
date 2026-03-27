import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import vars from '../../config/vars';
import logger from '../../config/logger';

export interface JwtPayload {
  id: number;
  email: string;
  role?: unknown;
}

export interface AuthRequest extends Request {
  user?: JwtPayload;
}

const authMiddleware = (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        message: 'Access denied. No token provided.',
      });
    }

    const token = authHeader.substring(7);

    if (!token) {
      return res.status(401).json({
        message: 'Access denied. No token provided.',
      });
    }

    try {
      if (!vars.jwtSecret) {
        logger.error('JWT_SECRET not configured');
        return res.status(500).json({ message: 'Internal server error.' });
      }
      const decoded = jwt.verify(token, vars.jwtSecret) as JwtPayload;

      req.user = {
        id: decoded.id,
        email: decoded.email,
        role: decoded.role,
      };

      next();
    } catch (error) {
      logger.error('Token verification failed:', error);
      return res.status(401).json({
        message: 'Invalid token.',
      });
    }
  } catch (error) {
    logger.error('Auth middleware error:', error);
    return res.status(500).json({
      message: 'Internal server error.',
    });
  }
};

export default authMiddleware;
