import { Op } from 'sequelize';
import logger from '../../config/logger';
import { sequelize } from '../../config/database';
import newEhadFollowUpModel from '../models/newEhadFollowUp';

const model = newEhadFollowUpModel(sequelize);

export const getFollowUpsByNewEhadId = async (newEhadId: string) => {
  try {
    const followUps = await model.findAll({
      where: { new_ehad_id: newEhadId },
      order: [['follow_up_date', 'DESC']],
    });
    return followUps;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    logger.error(`Error fetching follow-ups: ${message}`);
    throw error;
  }
};

export const getAllFollowUps = async ({
  page = 1,
  size = 10,
  search = '',
}: {
  page?: number | string;
  size?: number | string;
  search?: string;
}) => {
  try {
    const limit = Math.max(1, parseInt(String(size), 10) || 10);
    const offset = (Math.max(1, parseInt(String(page), 10) || 1) - 1) * limit;
    const whereClause = search
      ? {
          [Op.or]: [
            { contact_method: { [Op.like]: `%${search}%` } },
            { status: { [Op.like]: `%${search}%` } },
            { notes: { [Op.like]: `%${search}%` } },
          ],
        }
      : {};
    const { count, rows } = await model.findAndCountAll({
      where: whereClause,
      limit,
      offset,
      order: [['follow_up_date', 'DESC']],
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
    logger.error(`Error fetching all follow-ups: ${message}`);
    throw error;
  }
};

export const getFollowUpById = async (id: string) => {
  try {
    const followUp = await model.findByPk(id);
    if (!followUp) throw new Error('Follow-up not found');
    return followUp;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    logger.error(`Error fetching follow-up: ${message}`);
    throw error;
  }
};

export const createFollowUp = async (data: Record<string, unknown>) => {
  try {
    const followUp = await model.create({
      ...data,
      created_at: new Date(),
    } as Parameters<typeof model.create>[0]);
    return followUp;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    logger.error(`Error creating follow-up: ${message}`);
    throw error;
  }
};

export const updateFollowUp = async (id: string, data: Record<string, unknown>) => {
  try {
    const followUp = await model.findByPk(id);
    if (!followUp) throw new Error('Follow-up not found');
    await followUp.update({
      ...data,
      updated_at: new Date(),
    } as Parameters<typeof followUp.update>[0]);
    return followUp;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    logger.error(`Error updating follow-up: ${message}`);
    throw error;
  }
};

export const deleteFollowUp = async (id: string) => {
  try {
    const followUp = await model.findByPk(id);
    if (!followUp) throw new Error('Follow-up not found');
    await followUp.destroy();
    return { success: true, message: 'Follow-up deleted successfully' };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    logger.error(`Error deleting follow-up: ${message}`);
    throw error;
  }
};
