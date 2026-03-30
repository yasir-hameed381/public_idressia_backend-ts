import { QueryTypes } from 'sequelize';
import { sequelize } from '../../../config/database';
import { getCommitteeMeetingsConfig } from './getCommitteeMeetingsConfig';

export const getMeetingByIdOrHash = async ({
  committeeId,
  idOrHash,
  includeAttendance = false,
  includeDescription = false,
}: {
  committeeId: number;
  idOrHash: string | number;
  includeAttendance?: boolean;
  includeDescription?: boolean;
}) => {
  const config = await getCommitteeMeetingsConfig();
  if (!config.exists || !config.titleColumn || !config.dateColumn) {
    return null;
  }

  const rawValue = String(idOrHash || '').trim();
  const numericId = Number(rawValue);
  const isNumeric = Number.isFinite(numericId) && numericId > 0;
  const hasHashColumn = !!(await sequelize.getQueryInterface().describeTable('committee_meetings')).hash_id;

  const selectCols = [
    'id',
    `\`${config.titleColumn}\` AS title`,
    `\`${config.dateColumn}\` AS meeting_date`,
  ];
  if (includeDescription) {
    selectCols.push(config.descriptionColumn ? `\`${config.descriptionColumn}\` AS description` : 'NULL AS description');
  }
  if (includeAttendance) {
    selectCols.push(config.attendanceColumn ? `\`${config.attendanceColumn}\` AS attendance` : 'NULL AS attendance');
  }
  if (hasHashColumn) {
    selectCols.push('hash_id');
  }

  let whereSql = 'committee_id = :committeeId';
  const replacements: Record<string, unknown> = { committeeId };
  if (isNumeric) {
    whereSql += ' AND id = :id';
    replacements.id = numericId;
  } else if (hasHashColumn) {
    whereSql += ' AND hash_id = :hash_id';
    replacements.hash_id = rawValue;
  } else {
    return null;
  }

  const rows = await sequelize.query<Record<string, unknown>>(
    `SELECT ${selectCols.join(', ')} FROM committee_meetings WHERE ${whereSql} LIMIT 1`,
    {
      replacements,
      type: QueryTypes.SELECT,
    },
  );
  return rows[0] || null;
};
