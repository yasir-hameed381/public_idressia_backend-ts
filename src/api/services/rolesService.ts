import { Op } from 'sequelize';
import logger from '../../config/logger';
import { sequelize } from '../../config/database';
import rolesModel from '../models/roles';
import permissionModel from '../models/permission';
import roleHasPermissionsModel from '../models/roleHasPermissions';
import { paginate, constructPagination } from './utilityServices';
import { SearchFields } from '../Enums/searchEnums';

const rolesModelInstance = rolesModel(sequelize);
const permissionsModelInstance = permissionModel(sequelize);
const roleHasPermissionsModelInstance = roleHasPermissionsModel(sequelize);

// Set up association so roles can include permissions (same as JS backend)
(rolesModelInstance as unknown as { belongsToMany: (model: unknown, opts: Record<string, unknown>) => void }).belongsToMany(
  permissionsModelInstance,
  {
    through: 'role_has_permissions',
    foreignKey: 'role_id',
    otherKey: 'permission_id',
    as: 'permissions',
  },
);

export const getRoles = async ({
  page = 1,
  size = 25,
  search = '',
  requestUrl = '',
}: {
  page?: number | string;
  size?: number | string;
  search?: string;
  requestUrl?: string;
}) => {
  try {
    const { offset, limit, currentPage } = paginate({ page, size });
    const where: Record<string, unknown> = {};
    if (search) {
      (where as Record<symbol, unknown>)[Op.or as unknown as symbol] = [
        { [SearchFields.NAME]: { [Op.like]: `%${search}%` } },
      ];
    }
    const { count, rows: data } = await rolesModelInstance.findAndCountAll({
      where: Object.keys(where).length ? where : undefined,
      offset,
      limit,
      attributes: ['id', 'name', 'guard_name', 'created_at', 'updated_at'],
      include: [
        {
          model: permissionsModelInstance,
          as: 'permissions',
          attributes: ['id', 'name'],
          through: { attributes: [] },
        },
      ],
    });
    const { links, meta } = constructPagination({ count, limit, offset, currentPage, baseUrl: requestUrl });
    return { data, links, meta };
  } catch (error) {
    logger.error('Error fetching roles:', error as Error);
    throw error;
  }
};

export const createRole = async ({
  name,
  guard_name = 'web',
  permissions = [],
}: {
  name: string;
  guard_name?: string;
  permissions?: number[];
}) => {
  const transaction = await sequelize.transaction();
  try {
    const role = await rolesModelInstance.create(
      {
        name,
        guard_name,
        created_at: new Date(),
        updated_at: new Date(),
      } as Record<string, unknown>,
      { transaction },
    );
    const roleId = (role.get('id') as number);
    if (Array.isArray(permissions) && permissions.length > 0) {
      await roleHasPermissionsModelInstance.bulkCreate(
        permissions.map((permissionId) => ({ role_id: roleId, permission_id: permissionId })),
        { transaction },
      );
    }
    await transaction.commit();
    return { id: roleId, name, guard_name, permissions };
  } catch (error) {
    await transaction.rollback();
    logger.error('Error creating role:', error as Error);
    throw new Error(`Failed to create role: ${(error as Error).message}`);
  }
};

export const updateRole = async ({
  id,
  name,
  guard_name = 'web',
  permissions = [],
}: {
  id: string | number;
  name?: string;
  guard_name?: string;
  permissions?: number[];
}) => {
  const transaction = await sequelize.transaction();
  try {
    const role = await rolesModelInstance.findByPk(String(id));
    if (!role) {
      return { success: false, message: 'Role does not exist.' };
    }
    await role.update({
      name: name ?? (role.get('name') as string),
      guard_name: guard_name ?? (role.get('guard_name') as string),
      updated_at: new Date(),
    } as Record<string, unknown>, { transaction });
    await roleHasPermissionsModelInstance.destroy({
      where: { role_id: id },
      transaction,
    });
    if (Array.isArray(permissions) && permissions.length > 0) {
      await roleHasPermissionsModelInstance.bulkCreate(
        permissions.map((permissionId) => ({ role_id: id, permission_id: permissionId })),
        { transaction },
      );
    }
    await transaction.commit();
    return {
      id: typeof id === 'string' ? parseInt(id, 10) : id,
      name: name ?? (role.get('name') as string),
      guard_name: guard_name ?? (role.get('guard_name') as string),
      permissions,
    };
  } catch (error) {
    await transaction.rollback();
    logger.error('Error updating role:', error as Error);
    throw new Error(`Failed to update role: ${(error as Error).message}`);
  }
};

export const deleteRole = async (id: string | number) => {
  const transaction = await sequelize.transaction();
  try {
    const role = await rolesModelInstance.findByPk(String(id));
    if (!role) {
      return { success: false, message: 'Role does not exist.' };
    }
    await role.destroy({ transaction });
    await roleHasPermissionsModelInstance.destroy({
      where: { role_id: id },
      transaction,
    });
    await transaction.commit();
    return { success: true, message: 'Role deleted successfully.' };
  } catch (error) {
    await transaction.rollback();
    logger.error('Error deleting role:', error as Error);
    throw new Error(`Failed to delete role: ${(error as Error).message}`);
  }
};

export const getRoleById = async (id: string | number) => {
  try {
    const role = await rolesModelInstance.findByPk(String(id), {
      attributes: ['id', 'name', 'guard_name', 'created_at', 'updated_at'],
      include: [
        {
          model: permissionsModelInstance,
          as: 'permissions',
          attributes: ['id', 'name'],
          through: { attributes: [] },
        },
      ],
    });
    if (!role) {
      throw new Error('Role not found');
    }
    return role;
  } catch (error) {
    logger.error('Error fetching role by ID:', error as Error);
    throw error;
  }
};
