import { Response, NextFunction } from 'express';
import logger from '../../config/logger';
import { AuthRequest } from './authMiddleware';

export const permissionMiddleware = (requiredPermissions: string[] = []) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          message: 'Authentication required.',
        });
      }

      if (!requiredPermissions || requiredPermissions.length === 0) {
        return next();
      }

      const role = req.user.role as { permissions?: { name: string }[] } | undefined;
      if (!role) {
        return res.status(403).json({
          message: 'Access denied. No role assigned.',
        });
      }

      const userPermissions = role.permissions || [];
      const userPermissionNames = userPermissions.map((p) => p.name);
      const hasRequiredPermission = requiredPermissions.some((permission) =>
        userPermissionNames.includes(permission),
      );

      if (!hasRequiredPermission) {
        return res.status(403).json({
          message: 'Access denied. Insufficient permissions.',
        });
      }

      next();
    } catch (error) {
      logger.error('Permission middleware error:', error);
      return res.status(500).json({
        message: 'Internal server error.',
      });
    }
  };
};
