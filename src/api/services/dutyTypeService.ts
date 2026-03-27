import { Op } from 'sequelize';
import logger from '../../config/logger';
import { sequelize } from '../../config/database';
import dutyTypeModel from '../models/dutyType';

const model = dutyTypeModel(sequelize);

export const getAllDutyTypes = async ({
  page = 1,
  size = 10,
  search = '',
  zone_id = null,
}: {
  page?: number | string;
  size?: number | string;
  search?: string;
  zone_id?: string | number | null;
}) => {
  try {
    const limit = Math.max(1, parseInt(String(size), 10) || 10);
    const offset = (Math.max(1, parseInt(String(page), 10) || 1) - 1) * limit;

    const whereClause: Record<string, unknown> = {};
    if (zone_id != null && zone_id !== '') {
      whereClause.zone_id = Number(zone_id);
    }
    if (search) {
      (whereClause as Record<string, unknown>)[Op.or as unknown as string] = [
        { name: { [Op.like]: `%${search}%` } },
        { description: { [Op.like]: `%${search}%` } },
      ];
    }

    const { count, rows } = await model.findAndCountAll({
      where: whereClause,
      limit,
      offset,
      order: [['name', 'ASC']],
    });

    const totalPages = Math.ceil(count / limit) || 1;
    return {
      success: true,
      totalItems: count,
      totalPages,
      currentPage: parseInt(String(page), 10) || 1,
      pageSize: limit,
      data: rows,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    logger.error(`Error fetching duty types: ${message}`);
    throw error;
  }
};

export const getDutyTypeById = async (id: string) => {
  try {
    const dutyType = await model.findByPk(id);
    if (!dutyType) {
      throw new Error('Duty type not found');
    }
    return dutyType;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    logger.error(`Error fetching duty type: ${message}`);
    throw error;
  }
};

export const createDutyType = async (data: {
  zone_id: number;
  name: string;
  description?: string;
  is_editable?: number;
  created_by?: number;
}) => {
  try {
    const dutyType = await model.create({
      ...data,
      created_at: new Date(),
    } as Parameters<typeof model.create>[0]);
    return dutyType;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    logger.error(`Error creating duty type: ${message}`);
    throw error;
  }
};

export const updateDutyType = async (
  id: string,
  data: {
    zone_id?: number;
    name?: string;
    description?: string;
    is_editable?: number;
    updated_by?: number;
  },
) => {
  try {
    const dutyType = await model.findByPk(id);
    if (!dutyType) {
      throw new Error('Duty type not found');
    }
    await dutyType.update({
      ...data,
      updated_at: new Date(),
    } as Parameters<typeof dutyType.update>[0]);
    return dutyType;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    logger.error(`Error updating duty type: ${message}`);
    throw error;
  }
};

export const deleteDutyType = async (id: string) => {
  try {
    const dutyType = await model.findByPk(id);
    if (!dutyType) {
      throw new Error('Duty type not found');
    }
    await dutyType.destroy();
    return { success: true, message: 'Duty type deleted successfully' };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    logger.error(`Error deleting duty type: ${message}`);
    throw error;
  }
};

export const getActiveDutyTypes = async (zone_id?: string | number | null) => {
  try {
    const whereClause: Record<string, unknown> = {};
    if (zone_id != null && zone_id !== '') {
      whereClause.zone_id = Number(zone_id);
    }
    const dutyTypes = await model.findAll({
      where: whereClause,
      order: [['name', 'ASC']],
    });
    return dutyTypes;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    logger.error(`Error fetching active duty types: ${message}`);
    throw error;
  }
};
