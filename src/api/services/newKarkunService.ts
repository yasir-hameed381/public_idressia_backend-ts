import logger from '../../config/logger';
import { sequelize } from '../../config/database';
import newEhadKarkunModel from '../models/newEhadKarkun';
import { getList } from './listResourceHelper';
import { SearchFields } from '../Enums/searchEnums';

const modelInstance = newEhadKarkunModel(sequelize);

export const getNewKarkuns = async ({
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
      searchFields: [SearchFields.NAME, SearchFields.FATHERNAME],
    });
  } catch (error) {
    logger.error('Error fetching new karkuns:', error as Error);
    throw error;
  }
};
