import logger from '../../config/logger';
import { sequelize } from '../../config/database';
import tagsModel from '../models/tags';
import { getList } from './listResourceHelper';
import { SearchFields } from '../Enums/searchEnums';

const modelInstance = tagsModel(sequelize);

export const getTags = async ({
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
      searchFields: [SearchFields.NAME, SearchFields.NORMALIZED],
      order: [['tag_id', 'ASC']],
    });
  } catch (error) {
    logger.error('Error fetching tags:', error as Error);
    throw error;
  }
};

export const getTagsById = async (id: string | number) => {
  const row = await modelInstance.findByPk(String(id));
  if (!row) throw new Error('Tag not found');
  return row;
};
