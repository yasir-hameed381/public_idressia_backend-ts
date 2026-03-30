import { QueryTypes } from 'sequelize';
import { sequelize } from '../../../config/database';
import { tableExists } from './tableExists';

export const countByCommitteeIfTableExists = async (tableName: string, committeeId: number) => {
  const exists = await tableExists(tableName);
  if (!exists) return 0;
  const rows = await sequelize.query<{ total: number }>(
    `SELECT COUNT(*) as total FROM \`${tableName}\` WHERE committee_id = :committeeId`,
    {
      replacements: { committeeId },
      type: QueryTypes.SELECT,
    },
  );
  return Number(rows?.[0]?.total || 0);
};
