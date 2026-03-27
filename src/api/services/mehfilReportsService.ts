import logger from '../../config/logger';
import { sequelize } from '../../config/database';
import mehfilReportsModel from '../models/mehfilReports';
import { getList } from './listResourceHelper';

const modelInstance = mehfilReportsModel(sequelize);

export const getMehfilReports = async ({
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
    logger.error('Error fetching mehfil reports:', error as Error);
    throw error;
  }
};
