import { sequelize } from '../../../config/database';

const tableExistsCache = new Map<string, boolean>();

export const tableExists = async (tableName: string) => {
  if (tableExistsCache.has(tableName)) return tableExistsCache.get(tableName) as boolean;
  try {
    await sequelize.getQueryInterface().describeTable(tableName);
    tableExistsCache.set(tableName, true);
    return true;
  } catch {
    tableExistsCache.set(tableName, false);
    return false;
  }
};
