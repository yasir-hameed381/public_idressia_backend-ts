import { sequelize } from '../../../config/database';

let pollColumnsCache: Set<string> | null = null;

export const getCommitteePollColumns = async () => {
  if (pollColumnsCache) return pollColumnsCache;
  try {
    const columns = await sequelize.getQueryInterface().describeTable('committee_polls');
    pollColumnsCache = new Set(Object.keys(columns));
  } catch {
    pollColumnsCache = new Set<string>();
  }
  return pollColumnsCache;
};
