import logger from '../../config/logger';
import { sequelize } from '../../config/database';
import messagesModel from '../models/messages';
import { getList } from './listResourceHelper';
import { SearchFields } from '../Enums/searchEnums';

const modelInstance = messagesModel(sequelize);

export const getMessages = async ({
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
      searchFields: [SearchFields.TITLE_EN, SearchFields.TITLE_UR],
    });
  } catch (error) {
    logger.error('Error fetching messages:', error as Error);
    throw error;
  }
};
