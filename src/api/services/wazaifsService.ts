import logger from '../../config/logger';
import { sequelize } from '../../config/database';
import wazaifsModel from '../models/wazaifs';
import { getList } from './listResourceHelper';
import { SearchFields } from '../Enums/searchEnums';

const modelInstance = wazaifsModel(sequelize);

export const getWazaifs = async ({
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
    logger.error('Error fetching wazaifs:', error as Error);
    throw error;
  }
};
