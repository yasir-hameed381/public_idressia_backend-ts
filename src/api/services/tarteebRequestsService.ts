import logger from '../../config/logger';
import { sequelize } from '../../config/database';
import tarteebRequestsModel from '../models/tarteebRequests';
import { getList } from './listResourceHelper';
import { SearchFields } from '../Enums/searchEnums';

const modelInstance = tarteebRequestsModel(sequelize);

export const getTarteebRequests = async ({
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
    logger.error('Error fetching tarteeb requests:', error as Error);
    throw error;
  }
};
