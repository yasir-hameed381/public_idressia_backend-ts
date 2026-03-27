import { sequelize } from '../../config/database';
import logger from '../../config/logger';
import { SearchFields } from '../Enums/searchEnums';
import { common } from '../Enums/commonEnums';
import { Op } from 'sequelize';
import taleemModel from '../models/taleem';
import mehfilsModel from '../models/mehfils';
import naatModel from '../models/naat';

const models: Record<string, ReturnType<typeof taleemModel>> = {
  [common.TALEEM]: taleemModel(sequelize),
  [common.MEHFILS]: mehfilsModel(sequelize),
  [common.NAAT]: naatModel(sequelize),
};

const searchFields: Record<string, string[]> = {
  taleem: [
    SearchFields.TITLE_EN,
    SearchFields.TITLE_UR,
    SearchFields.DESCRIPTION,
    SearchFields.FILENAME,
    SearchFields.TRACK,
  ],
  mehfils: [
    SearchFields.TITLE_EN,
    SearchFields.TITLE_UR,
    SearchFields.DESCRIPTION,
    SearchFields.FILENAME,
    SearchFields.TRACK,
  ],
  naat: [
    SearchFields.TITLE_EN,
    SearchFields.TITLE_UR,
    SearchFields.FILENAME,
    SearchFields.FILEPATH,
    SearchFields.TRACK,
  ],
};

export const search = async ({
  type = '',
  query = '',
}: {
  type?: string;
  query?: string;
}) => {
  try {
    const targetModel = models[type];
    if (!targetModel) {
      throw new Error(`type is required like 'taleem', 'mehfils', 'naat'`);
    }
    if (!query) {
      throw new Error(`No results found, please try with different keywords`);
    }

    const fieldsToSearch = searchFields[type] || [];
    const where =
      query && fieldsToSearch.length
        ? {
            [Op.or]: fieldsToSearch.map((field) => ({
              [field]: { [Op.like]: `%${query}%` },
            })),
          }
        : {};

    const data = await targetModel.findAll({ where });

    return {
      success: true,
      data,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    logger.error(`Error fetching data for type ${type}: ${message}`);
    return {
      success: false,
      error: message,
    };
  }
};
