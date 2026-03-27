import logger from '../../config/logger';
import { sequelize } from '../../config/database';
import feedbackModel from '../models/feedback';
import { getList } from './listResourceHelper';

const modelInstance = feedbackModel(sequelize);

export const getFeedback = async ({
  page = 1,
  size = 25,
  requestUrl = '',
}: {
  page?: number | string;
  size?: number | string;
  requestUrl?: string;
}) => {
  try {
    return await getList({
      model: modelInstance as never,
      page,
      size,
      requestUrl,
    });
  } catch (error) {
    logger.error('Error fetching feedback:', error as Error);
    throw error;
  }
};
