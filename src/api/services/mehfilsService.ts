import logger from '../../config/logger';
import { sequelize } from '../../config/database';
import mehfilsModel from '../models/mehfils';
import { getList } from './listResourceHelper';
import { SearchFields } from '../Enums/searchEnums';

const modelInstance = mehfilsModel(sequelize);

export const getMehfils = async ({
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
      searchFields: [SearchFields.TITLE_EN, SearchFields.TITLE_UR, SearchFields.SLUG],
    });
  } catch (error) {
    logger.error('Error fetching mehfils:', error as Error);
    throw error;
  }
};
