import { Op } from 'sequelize';
import logger from '../../config/logger';
import { sequelize } from '../../config/database';
import mehfilCoordinatorModel from '../models/mehfilCoordinator';

const model = mehfilCoordinatorModel(sequelize);

export const getAllCoordinators = async ({
  page = 1,
  size = 10,
  search = '',
  mehfilDirectoryId = null,
}: {
  page?: number | string;
  size?: number | string;
  search?: string;
  mehfilDirectoryId?: string | number | null;
}) => {
  try {
    const limit = Math.max(1, parseInt(String(size), 10) || 10);
    const offset = (Math.max(1, parseInt(String(page), 10) || 1) - 1) * limit;
    const whereClause: Record<string, unknown> = {};
    if (mehfilDirectoryId != null && mehfilDirectoryId !== '') {
      whereClause.mehfil_directory_id = Number(mehfilDirectoryId);
    }
    if (search) {
      (whereClause as Record<string, unknown>)[Op.or as unknown as string] = [{ coordinator_type: { [Op.like]: `%${search}%` } }];
    }
    const { count, rows } = await model.findAndCountAll({
      where: whereClause,
      limit,
      offset,
      order: [['created_at', 'DESC']],
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
    logger.error(`Error fetching coordinators: ${message}`);
    throw error;
  }
};

export const getCoordinatorById = async (id: string) => {
  try {
    const coordinator = await model.findByPk(id);
    if (!coordinator) throw new Error('Coordinator not found');
    return coordinator;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    logger.error(`Error fetching coordinator: ${message}`);
    throw error;
  }
};

export const createCoordinator = async (data: Record<string, unknown>) => {
  try {
    const coordinator = await model.create({
      ...data,
      created_at: new Date(),
    } as Parameters<typeof model.create>[0]);
    return coordinator;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    logger.error(`Error creating coordinator: ${message}`);
    throw error;
  }
};

export const updateCoordinator = async (id: string, data: Record<string, unknown>) => {
  try {
    const coordinator = await model.findByPk(id);
    if (!coordinator) throw new Error('Coordinator not found');
    await coordinator.update({
      ...data,
      updated_at: new Date(),
    } as Parameters<typeof coordinator.update>[0]);
    return coordinator;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    logger.error(`Error updating coordinator: ${message}`);
    throw error;
  }
};

export const deleteCoordinator = async (id: string) => {
  try {
    const coordinator = await model.findByPk(id);
    if (!coordinator) throw new Error('Coordinator not found');
    await coordinator.destroy();
    return { success: true, message: 'Coordinator deleted successfully' };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    logger.error(`Error deleting coordinator: ${message}`);
    throw error;
  }
};

export const getActiveCoordinatorsByMehfil = async (mehfilDirectoryId: string) => {
  try {
    const coordinators = await model.findAll({
      where: { mehfil_directory_id: Number(mehfilDirectoryId) },
      order: [
        ['coordinator_type', 'ASC'],
        ['created_at', 'DESC'],
      ],
    });
    return coordinators;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    logger.error(`Error fetching coordinators by mehfil: ${message}`);
    throw error;
  }
};
