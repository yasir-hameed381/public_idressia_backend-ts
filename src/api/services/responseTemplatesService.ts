import logger from '../../config/logger';
import { sequelize } from '../../config/database';
import responseTemplatesModel from '../models/responseTemplates';
import { getList } from './listResourceHelper';

const modelInstance = responseTemplatesModel(sequelize);

export const getResponseTemplates = async ({
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
    logger.error('Error fetching response templates:', error as Error);
    throw error;
  }
};
