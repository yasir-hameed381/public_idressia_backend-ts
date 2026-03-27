import { Op } from 'sequelize';
import bcrypt from 'bcrypt';
import logger from '../../config/logger';
import { sequelize } from '../../config/database';
import userAdminModel from '../models/user-admin';
import modelHasRolesModel from '../models/modelHasRoles';
import rolesModel from '../models/roles';
import zoneModel from '../models/zone';
import mehfilDirectoryModel from '../models/mehfil-directories';
import { paginate, constructPagination } from './utilityServices';

const SALT_ROUNDS = 10;
const adminUsersModel = userAdminModel(sequelize);
const modelHasRolesModelInstance = modelHasRolesModel(sequelize);
const rolesModelInstance = rolesModel(sequelize);
const zoneModelInstance = zoneModel(sequelize);
const mehfilDirectoryModelInstance = mehfilDirectoryModel(sequelize);

let associationsInitialized = false;

const initializeAssociations = () => {
  if (associationsInitialized) return;
  (adminUsersModel as unknown as { belongsToMany: Function; belongsTo: Function }).belongsToMany(rolesModelInstance, {
    through: { model: modelHasRolesModelInstance, unique: false },
    foreignKey: 'model_id',
    otherKey: 'role_id',
    as: 'roles',
    constraints: false,
  });
  (adminUsersModel as unknown as { belongsTo: Function }).belongsTo(zoneModelInstance, {
    foreignKey: 'zone_id',
    as: 'zone',
  });
  (adminUsersModel as unknown as { belongsTo: Function }).belongsTo(mehfilDirectoryModelInstance, {
    foreignKey: 'mehfil_directory_id',
    as: 'mehfilDirectory',
  });
  associationsInitialized = true;
};

interface GetUserAdminsParams {
  page?: number | string;
  size?: number | string;
  search?: string;
  sortField?: string;
  sortDirection?: string;
  requestUrl?: string;
  zone_id?: string | null;
  mehfil_directory_id?: string | null;
  activeTab?: string | null;
}

export const getuserAdmins = async (params: GetUserAdminsParams) => {
  const {
    page = 1,
    size = 50,
    search = '',
    sortField = 'created_at',
    sortDirection = 'DESC',
    requestUrl = '',
    zone_id = null,
    mehfil_directory_id = null,
    activeTab = null,
  } = params;
  try {
    initializeAssociations();
    const { offset, limit, currentPage } = paginate({ page, size });
    const where: Record<string, unknown> = {};
    where.is_super_admin = { [Op.ne]: true };

    if (activeTab) {
      switch (activeTab) {
        case 'karkun': where.user_type = 'karkun'; break;
        case 'ehad_karkun': where.user_type = 'ehad_karkun'; break;
        case 'mehfil_admin': where.is_mehfil_admin = true; break;
        case 'zone_admin': where.is_zone_admin = true; break;
        case 'region_admin': where.is_region_admin = true; (where as Record<string, unknown>).is_all_region_admin = false; break;
        case 'all_region_admin': where.is_all_region_admin = true; break;
      }
    }
    if (zone_id) {
      const zoneIdNum = parseInt(String(zone_id), 10);
      if (!isNaN(zoneIdNum)) where.zone_id = zoneIdNum;
    }
    if (mehfil_directory_id) {
      const mehfilIdNum = parseInt(String(mehfil_directory_id), 10);
      if (!isNaN(mehfilIdNum)) where.mehfil_directory_id = mehfilIdNum;
    }
    if (search && String(search).trim()) {
      const searchTerm = String(search).trim();
      const existingConditions = { ...where };
      Object.keys(where).forEach((k) => delete where[k]);
      (where as Record<symbol, unknown>)[Op.and as unknown as symbol] = [
        existingConditions,
        { [Op.or]: [{ name: { [Op.like]: `%${searchTerm}%` } }, { email: { [Op.like]: `%${searchTerm}%` } }] },
      ];
    }

    const sortableFields = ['id', 'name', 'email', 'created_at', 'updated_at'];
    const normalizedSortField = sortableFields.includes(sortField) ? sortField : 'created_at';
    const normalizedSortDirection = String(sortDirection).toUpperCase() === 'DESC' ? 'DESC' : 'ASC';

    const { count, rows: data } = await adminUsersModel.findAndCountAll({
      where,
      offset,
      limit,
      order: [[normalizedSortField, normalizedSortDirection]],
      include: [
        { model: rolesModelInstance, as: 'roles', attributes: ['id', 'name', 'guard_name'], through: { attributes: [] }, required: false },
        { model: zoneModelInstance, as: 'zone', attributes: ['id', 'title_en', 'title_ur'], required: false },
        { model: mehfilDirectoryModelInstance, as: 'mehfilDirectory', attributes: ['id', 'name_en', 'name_ur', 'city_en'], required: false },
      ],
    });

    const userIds = [...new Set([...data.map((u) => u.get('created_by')).filter(Boolean), ...data.map((u) => u.get('updated_by')).filter(Boolean)])] as number[];
    let creatorsMap: Record<number, { id: number; name: string }> = {};
    let updatersMap: Record<number, { id: number; name: string }> = {};
    if (userIds.length > 0) {
      const creatorUpdaters = await adminUsersModel.findAll({
        where: { id: userIds },
        attributes: ['id', 'name'],
        raw: true,
      });
      creatorUpdaters.forEach((user: unknown) => {
        const u = user as { id: number; name: string };
        creatorsMap[u.id] = { id: u.id, name: u.name };
        updatersMap[u.id] = { id: u.id, name: u.name };
      });
    }

    const plainData = data.map((user) => {
      const userData = user.get({ plain: true }) as Record<string, unknown> & { created_by?: number; updated_by?: number };
      if (userData.created_by && creatorsMap[userData.created_by]) userData.creator = creatorsMap[userData.created_by];
      if (userData.updated_by && updatersMap[userData.updated_by]) userData.updater = updatersMap[userData.updated_by];
      return userData;
    });

    const { links, meta } = constructPagination({ count, limit, offset, currentPage, baseUrl: requestUrl || '' });
    return { data: plainData, links, meta };
  } catch (error) {
    logger.error('Error fetching admin users:', error);
    throw error;
  }
};

export const getAdminUserById = async (id: string | number) => {
  try {
    if (!id) return { success: false, message: 'user not found' };
    initializeAssociations();
    const adminUser = await adminUsersModel.findByPk(String(id), {
      include: [{ model: rolesModelInstance, as: 'roles', attributes: ['id', 'name', 'guard_name'], through: { attributes: [] }, required: false }],
    });
    if (!adminUser) return { success: false, message: 'user not founded ' };
    return { success: true, data: adminUser };
  } catch (error) {
    logger.error('Error fetching admin users:', error);
    throw error;
  }
};

interface CreateAdminUserParams {
  zone_id?: number | null;
  name?: string;
  email?: string;
  password?: string;
  city?: string;
  country?: string;
  is_zone_admin?: boolean;
  is_mehfil_admin?: boolean;
  is_super_admin?: boolean;
  is_region_admin?: boolean;
  is_all_region_admin?: boolean;
  user_type?: string;
  father_name?: string;
  phone_number?: string;
  id_card_number?: string;
  address?: string;
  birth_year?: number;
  ehad_year?: number;
  mehfil_directory_id?: number | null;
  duty_days?: unknown;
  duty_type?: string;
  is_active?: boolean;
  affidavit_form_file?: string;
  has_affidavit_form?: boolean;
  region_id?: number | null;
  role_id?: number | string;
  role_ids?: (number | string)[];
}

export const createAdminUser = async (params: CreateAdminUserParams) => {
  const transaction = await sequelize.transaction();
  try {
    const rolesToAssign =
      params.role_ids && Array.isArray(params.role_ids) && params.role_ids.length > 0
        ? params.role_ids.map(Number)
        : params.role_id
          ? [Number(params.role_id)]
          : [];
    if (!params.password) throw new Error('Password is required');
    const hashedPassword = await bcrypt.hash(params.password, SALT_ROUNDS);
    const payload = {
      zone_id: params.zone_id,
      region_id: params.region_id,
      name: params.name,
      email: params.email,
      password: hashedPassword,
      city: params.city,
      country: params.country,
      is_zone_admin: params.is_zone_admin,
      is_mehfil_admin: params.is_mehfil_admin,
      is_super_admin: params.is_super_admin,
      is_region_admin: params.is_region_admin,
      is_all_region_admin: params.is_all_region_admin,
      user_type: params.user_type,
      father_name: params.father_name,
      phone_number: params.phone_number,
      id_card_number: params.id_card_number,
      address: params.address,
      birth_year: params.birth_year,
      ehad_year: params.ehad_year,
      mehfil_directory_id: params.mehfil_directory_id,
      duty_days: params.duty_days,
      duty_type: params.duty_type,
      is_active: params.is_active,
      affidavit_form_file: params.affidavit_form_file,
      has_affidavit_form: params.has_affidavit_form,
      created_at: new Date(),
    };
    const result = await adminUsersModel.create(payload as Record<string, unknown>, { transaction });
    if (rolesToAssign.length > 0) {
      await modelHasRolesModelInstance.bulkCreate(
        rolesToAssign.map((roleId) => ({ role_id: roleId, model_type: 'users', model_id: result.get('id') as number })),
        { transaction },
      );
    }
    await transaction.commit();
    return result;
  } catch (error) {
    await transaction.rollback();
    if ((error as { name?: string }).name === 'SequelizeValidationError') {
      const err = error as { errors?: { path: string; message: string }[] };
      throw new Error(`Validation failed: ${err.errors?.map((e) => `${e.path}: ${e.message}`).join(', ')}`);
    }
    if ((error as { name?: string }).name === 'SequelizeUniqueConstraintError') {
      const err = error as { errors?: { path: string; message: string }[] };
      throw new Error(`Duplicate entry: ${err.errors?.map((e) => `${e.path}: ${e.message}`).join(', ')}`);
    }
    throw error;
  }
};

export const updateAdminUser = async (params: CreateAdminUserParams & { id: string | number }) => {
  const transaction = await sequelize.transaction();
  try {
    const { id, password, role_id, role_ids, ...rest } = params;
    const rolesToAssign =
      role_ids !== undefined && Array.isArray(role_ids)
        ? role_ids.map(Number)
        : role_id !== undefined
          ? role_id
            ? [Number(role_id)]
            : []
          : undefined;

    const adminUser = await adminUsersModel.findByPk(String(id));
    if (!adminUser) {
      await transaction.rollback();
      return { success: false, message: 'admin user not found' };
    }
    const updatePayload = { ...rest } as Record<string, unknown>;
    if (password) updatePayload.password = await bcrypt.hash(password, SALT_ROUNDS);
    await adminUsersModel.update(updatePayload, { where: { id }, transaction });

    if (rolesToAssign !== undefined) {
      await modelHasRolesModelInstance.destroy({
        where: { model_id: id, model_type: 'users' },
        transaction,
      });
      if (rolesToAssign.length > 0) {
        await modelHasRolesModelInstance.bulkCreate(
          rolesToAssign.map((roleId) => ({ role_id: roleId, model_type: 'users', model_id: Number(id) })),
          { transaction },
        );
      }
    }
    await transaction.commit();
    return { success: true, message: 'admin user updated successfully.' };
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
};

export const deleteAdminUser = async (id: string | number) => {
  const transaction = await sequelize.transaction();
  try {
    const adminUser = await adminUsersModel.findByPk(String(id));
    if (!adminUser) {
      await transaction.rollback();
      return { success: false, message: 'admin user not found' };
    }
    await modelHasRolesModelInstance.destroy({
      where: { model_id: id, model_type: 'users' },
      transaction,
    });
    await adminUser.destroy({ transaction });
    await transaction.commit();
    return { success: true, message: 'admin user deleted successfully.' };
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
};
