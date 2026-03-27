import { Op } from 'sequelize';
import logger from '../../config/logger';
import { sequelize } from '../../config/database';
import categoriesModel from '../models/categories';
import { paginate, constructPagination } from './utilityServices';
import { SearchFields } from '../Enums/searchEnums';

const model = categoriesModel(sequelize);

export const getCategories = async ({
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
    const searchFields = [SearchFields.TITLE_EN, SearchFields.TITLE_UR, SearchFields.SLUG, SearchFields.STATUS];
    const { offset, limit, currentPage } = paginate({ page, size });
    const where: Record<string, unknown> = {};
    if (search && searchFields.length > 0) {
      (where as Record<symbol, unknown>)[Op.or as unknown as symbol] = searchFields.map((field) => ({ [field]: { [Op.like]: `%${search}%` } }));
    }
    const { count, rows: data } = await model.findAndCountAll({ where, offset, limit });
    const { links, meta } = constructPagination({ count, limit, offset, currentPage, baseUrl: requestUrl });
    return { data, links, meta };
  } catch (error) {
    logger.error('Error fetching categories:', error);
    throw error;
  }
};

export const createCategory = async ({
  slug,
  title_en,
  title_ur,
  status = 1,
}: {
  slug: string;
  title_en: string;
  title_ur: string;
  status?: number;
}) => {
  try {
    return await model.create({
      slug,
      title_en,
      title_ur,
      status: status || 1,
      created_at: new Date(),
    } as Record<string, unknown>);
  } catch (error) {
    logger.error('Error creating category:', error);
    throw new Error(`Failed to create category: ${(error as Error).message}`);
  }
};

export const updateCategory = async ({
  id,
  slug,
  title_en,
  title_ur,
  status,
}: {
  id: string | number;
  slug?: string;
  title_en?: string;
  title_ur?: string;
  status?: number;
}) => {
  try {
    const categoryCheck = await model.findByPk(String(id));
    if (!categoryCheck) {
      return { success: false, message: 'Category not found' };
    }
    const updatePayload = {
      slug,
      title_en,
      title_ur,
      status: status !== undefined ? status : (categoryCheck.get('status') as number),
      updated_at: new Date(),
    };
    await model.update(updatePayload as Record<string, unknown>, { where: { id } });
    return { success: true, message: 'Category updated successfully' };
  } catch (error) {
    logger.error('Error update categories:', error);
    throw error;
  }
};

export const deleteCategory = async (category_id: string | number) => {
  try {
    if (!category_id || (typeof category_id === 'string' && isNaN(Number(category_id)))) {
      return { success: false, message: 'Invalid Category ID provided' };
    }
    const category = await model.findByPk(String(category_id));
    if (!category) {
      return { success: true, message: 'category not found.' };
    }
    await category.destroy();
    return { success: true, message: 'Category deleted successfully.' };
  } catch (error) {
    logger.error('Error deleting category:', error);
    throw error;
  }
};
