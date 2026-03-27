import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { Op } from 'sequelize';
import logger from '../../config/logger';
import { sequelize } from '../../config/database';
import vars from '../../config/vars';
import { ErrorMessages } from '../Enums/errorMessages';
import { RateLimiter } from './rateLimiter';

import authModel from '../models/auth';
import userAdminModel from '../models/user-admin';
import rolesModel from '../models/roles';
import permissionsModel from '../models/permission';
import roleHasPermissionsModel from '../models/roleHasPermissions';
import modelHasRolesModel from '../models/modelHasRoles';
import committeeMemberModel from '../models/committee-members';

const userModel = authModel(sequelize);
const adminUserModel = userAdminModel(sequelize);
const rolesModelInstance = rolesModel(sequelize);
const permissionsModelInstance = permissionsModel(sequelize);
const roleHasPermissionsModelInstance = roleHasPermissionsModel(sequelize);
const modelHasRolesModelInstance = modelHasRolesModel(sequelize);
const committeeMemberModelInstance = committeeMemberModel(sequelize);

// Set up associations
adminUserModel.belongsToMany(rolesModelInstance, {
  through: { model: modelHasRolesModelInstance, unique: false },
  foreignKey: 'model_id',
  otherKey: 'role_id',
  as: 'roles',
  constraints: false,
});

rolesModelInstance.belongsToMany(permissionsModelInstance, {
  through: roleHasPermissionsModelInstance,
  foreignKey: 'role_id',
  otherKey: 'permission_id',
  as: 'permissions',
});

permissionsModelInstance.belongsToMany(rolesModelInstance, {
  through: roleHasPermissionsModelInstance,
  foreignKey: 'permission_id',
  otherKey: 'role_id',
  as: 'roles',
});

export const login = async (email: string, password: string, ipAddress = '127.0.0.1') => {
  const throttleKey = RateLimiter.throttleKey(email, ipAddress);

  if (RateLimiter.tooManyAttempts(throttleKey, 5)) {
    const seconds = RateLimiter.availableIn(throttleKey, 1);
    const minutes = Math.ceil(seconds / 60);
    const error = new Error(`Too many login attempts. Please try again in ${minutes} minute(s).`) as Error & { statusCode?: number; seconds?: number; minutes?: number };
    error.statusCode = 429;
    error.seconds = seconds;
    error.minutes = minutes;
    throw error;
  }

  let user = await adminUserModel.findOne({
    where: { email },
    include: [
      {
        model: rolesModelInstance,
        as: 'roles',
        through: { attributes: ['role_id', 'model_id', 'model_type'] },
        required: false,
        include: [
          {
            model: permissionsModelInstance,
            as: 'permissions',
            through: { attributes: ['role_id', 'permission_id'] },
            required: false,
          },
        ],
      },
    ],
  });

  if (!user) {
    user = await userModel.findOne({ where: { email } });
  }

  const isMatch = user ? await bcrypt.compare(password, user.get('password') as string) : false;

  // if (!user || !isMatch) {
  //   RateLimiter.hit(throttleKey, 1);
  //   const error = new Error('These credentials do not match our records.') as Error & { statusCode?: number };
  //   error.statusCode = 400;
  //   throw error;
  // }

  RateLimiter.clear(throttleKey);

  const expirationInSeconds = 24 * 60 * 60;

  const userRoles = (user.get('roles') as unknown[]) || [];
  const firstRole = userRoles.length > 0 ? userRoles[0] : null;
  const hasCommitteePortalAccess = await committeeMemberModelInstance.findOne({
    where: { user_id: user.get('id') as number },
    attributes: ['id'],
  });

  const allPermissionsMap = new Map<string, { id: number; name: string; guard_name: string }>();
  userRoles.forEach((role: { permissions?: { name: string; id: number; guard_name: string }[] }) => {
    if (role?.permissions && Array.isArray(role.permissions)) {
      role.permissions.forEach((permission) => {
        if (!allPermissionsMap.has(permission.name)) {
          allPermissionsMap.set(permission.name, {
            id: permission.id,
            name: permission.name,
            guard_name: permission.guard_name,
          });
        }
      });
    }
  });

  const combinedPermissions = Array.from(allPermissionsMap.values());

  const userData = {
    id: user.get('id') as number,
    name: user.get('name') as string,
    email: user.get('email') as string,
    phone_number: (user.get('phone_number') as string) || '',
    avatar: (user.get('avatar') as string) || '',
    is_super_admin: (user.get('is_super_admin') as boolean) || false,
    is_mehfil_admin: (user.get('is_mehfil_admin') as boolean) || false,
    is_zone_admin: (user.get('is_zone_admin') as boolean) || false,
    is_region_admin: (user.get('is_region_admin') as boolean) || false,
    is_all_region_admin: (user.get('is_all_region_admin') as boolean) || false,
    has_committee_portal_access: !!hasCommitteePortalAccess,
    zone_id: (user.get('zone_id') as number) || null,
    region_id: (user.get('region_id') as number) || null,
    mehfil_directory_id: (user.get('mehfil_directory_id') as number) || null,
    role: firstRole
      ? {
          id: (firstRole as { id: number }).id,
          name: (firstRole as { name: string }).name,
          guard_name: (firstRole as { guard_name: string }).guard_name,
          permissions: combinedPermissions,
        }
      : null,
    roles: userRoles.map((r: unknown) => {
      const role = r as { id: number; name: string; guard_name: string; permissions?: { id: number; name: string; guard_name: string }[] };
      return {
        id: role.id,
        name: role.name,
        guard_name: role.guard_name,
        permissions: role.permissions ? role.permissions.map((p) => ({ id: p.id, name: p.name, guard_name: p.guard_name })) : [],
      };
    }),
  };

  if (!vars.jwtSecret) {
    throw new Error('JWT_SECRET not configured');
  }
  const token = jwt.sign(
    { id: user.get('id'), email: user.get('email'), role: userData.role },
    vars.jwtSecret,
    { expiresIn: expirationInSeconds },
  );

  return {
    success: true,
    user: userData,
    token,
    message: ErrorMessages.SUCCESS_LOGIN,
  };
};

export const register = async (email: string, password: string, name: string) => {
  const existingUser = await userModel.findOne({ where: { email } });

  if (existingUser) {
    const error = new Error(ErrorMessages.EMAIL_EXIST) as Error & { statusCode?: number };
    error.statusCode = 400;
    throw error;
  }

  const hashedPassword = await bcrypt.hash(password, 9);
  const crypto = require('crypto');
  const apiToken = crypto.randomBytes(32).toString('hex');

  const newUser = await userModel.create({
    email,
    password: hashedPassword,
    name,
    api_token: apiToken,
    is_active: true,
  } as Record<string, unknown>);

  logger.info(ErrorMessages.USER_REGISTER_SUCCESS, { email, name });

  return {
    user: newUser,
    message: ErrorMessages.REGISTRATION_SUCCESS,
  };
};

export const getUserWithPermissions = async (userId: number) => {
  try {
    const user = await adminUserModel.findByPk(userId, {
      include: [
        {
          model: rolesModelInstance,
          as: 'roles',
          through: { attributes: ['role_id', 'model_id', 'model_type'] },
          required: false,
          include: [
            {
              model: permissionsModelInstance,
              as: 'permissions',
              through: { attributes: ['role_id', 'permission_id'] },
              required: false,
            },
          ],
        },
      ],
    });

    if (!user) return null;

    const userRoles = (user.get('roles') as unknown[]) || [];
    const firstRole = userRoles.length > 0 ? userRoles[0] : null;
    const hasCommitteePortalAccess = await committeeMemberModelInstance.findOne({
      where: { user_id: user.get('id') as number },
      attributes: ['id'],
    });

    const allPermissionsMap = new Map<string, { id: number; name: string; guard_name: string }>();
    userRoles.forEach((role: { permissions?: { name: string; id: number; guard_name: string }[] }) => {
      if (role?.permissions && Array.isArray(role.permissions)) {
        role.permissions.forEach((permission) => {
          if (!allPermissionsMap.has(permission.name)) {
            allPermissionsMap.set(permission.name, {
              id: permission.id,
              name: permission.name,
              guard_name: permission.guard_name,
            });
          }
        });
      }
    });

    const combinedPermissions = Array.from(allPermissionsMap.values());

    return {
      id: user.get('id') as number,
      name: user.get('name') as string,
      email: user.get('email') as string,
      phone_number: (user.get('phone_number') as string) || '',
      avatar: (user.get('avatar') as string) || '',
      is_super_admin: (user.get('is_super_admin') as boolean) || false,
      is_mehfil_admin: (user.get('is_mehfil_admin') as boolean) || false,
      is_zone_admin: (user.get('is_zone_admin') as boolean) || false,
      is_region_admin: (user.get('is_region_admin') as boolean) || false,
      is_all_region_admin: (user.get('is_all_region_admin') as boolean) || false,
      has_committee_portal_access: !!hasCommitteePortalAccess,
      zone_id: (user.get('zone_id') as number) || null,
      region_id: (user.get('region_id') as number) || null,
      mehfil_directory_id: (user.get('mehfil_directory_id') as number) || null,
      role: firstRole
        ? {
            id: (firstRole as { id: number }).id,
            name: (firstRole as { name: string }).name,
            guard_name: (firstRole as { guard_name: string }).guard_name,
            permissions: combinedPermissions,
          }
        : null,
      roles: userRoles.map((r: unknown) => {
        const role = r as { id: number; name: string; guard_name: string; permissions?: { id: number; name: string; guard_name: string }[] };
        return {
          id: role.id,
          name: role.name,
          guard_name: role.guard_name,
          permissions: role.permissions ? role.permissions.map((p) => ({ id: p.id, name: p.name, guard_name: p.guard_name })) : [],
        };
      }),
    };
  } catch (error) {
    logger.error('Error fetching user with permissions:', error);
    throw error;
  }
};

export const updateProfile = async (
  userId: number,
  params: { name: string; email: string; phone_number?: string | null },
) => {
  const user = await adminUserModel.findByPk(userId);
  if (!user) {
    const error = new Error('User not found') as Error & { statusCode?: number };
    error.statusCode = 404;
    throw error;
  }

  const existingUser = await adminUserModel.findOne({
    where: {
      email: params.email,
      id: { [Op.ne]: userId },
    },
  });

  if (existingUser) {
    const error = new Error('This email is already taken.') as Error & { statusCode?: number };
    error.statusCode = 422;
    throw error;
  }

  await user.update({
    name: params.name,
    email: params.email,
    phone_number: params.phone_number ?? null,
    updated_at: new Date(),
    updated_by: userId,
  });

  return getUserWithPermissions(userId);
};

export const updatePassword = async (
  userId: number,
  params: { current_password: string; password: string },
) => {
  const user = await adminUserModel.findByPk(userId);
  if (!user) {
    const error = new Error('User not found') as Error & { statusCode?: number };
    error.statusCode = 404;
    throw error;
  }

  const currentHash = (user.get('password') as string) || '';
  const isCurrentValid = await bcrypt.compare(params.current_password, currentHash);
  if (!isCurrentValid) {
    const error = new Error('Current password is incorrect.') as Error & { statusCode?: number };
    error.statusCode = 422;
    throw error;
  }

  const newHashedPassword = await bcrypt.hash(params.password, 9);
  await user.update({
    password: newHashedPassword,
    updated_at: new Date(),
    updated_by: userId,
  });
};
