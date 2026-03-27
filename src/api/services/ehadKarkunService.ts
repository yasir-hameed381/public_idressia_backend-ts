import logger from '../../config/logger';
import { sequelize } from '../../config/database';
import ehadKarkunModel from '../models/ehadKarkun';
import { getList } from './listResourceHelper';
import { SearchFields } from '../Enums/searchEnums';

const modelInstance = ehadKarkunModel(sequelize);

export const getEhadKarkuns = async ({
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
      searchFields: [SearchFields.NAME_EN, SearchFields.NAME_UR],
    });
  } catch (error) {
    logger.error('Error fetching ehad karkuns:', error as Error);
    throw error;
  }
};
