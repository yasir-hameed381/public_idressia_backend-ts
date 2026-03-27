import logger from '../../config/logger';
import { sequelize } from '../../config/database';
import khatModel from '../models/khat';
import { getList } from './listResourceHelper';
import { SearchFields } from '../Enums/searchEnums';

const modelInstance = khatModel(sequelize);

export const getKhats = async ({
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
    return await getList({
      model: modelInstance as never,
      page,
      size,
      requestUrl,
      search,
      searchFields: [SearchFields.FATHERNAME, 'full_name'],
    });
  } catch (error) {
    logger.error('Error fetching khats:', error as Error);
    throw error;
  }
};
