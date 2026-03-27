import logger from '../../config/logger';
import { sequelize } from '../../config/database';
import namazModel from '../models/namaz';
import { getList } from './listResourceHelper';

const modelInstance = namazModel(sequelize);

export const getNamazTimings = async ({
  page = 1,
  size = 50,
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
    logger.error('Error fetching namaz timings:', error as Error);
    throw error;
  }
};
