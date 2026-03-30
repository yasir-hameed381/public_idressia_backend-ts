import { QueryTypes } from 'sequelize';
import { sequelize } from '../../../config/database';
import { tableExists } from './tableExists';

export const getRecentMeetingsIfTableExists = async (committeeId: number) => {
  const exists = await tableExists('committee_meetings');
  if (!exists) return [];

  const meetingColumns = await sequelize.getQueryInterface().describeTable('committee_meetings');
  const columnNames = new Set(Object.keys(meetingColumns));

  const titleColumn = columnNames.has('title')
    ? 'title'
    : columnNames.has('subject')
    ? 'subject'
    : columnNames.has('name')
    ? 'name'
    : null;

  const dateColumn = columnNames.has('meeting_date')
    ? 'meeting_date'
    : columnNames.has('scheduled_at')
    ? 'scheduled_at'
    : columnNames.has('created_at')
    ? 'created_at'
    : null;

  if (!titleColumn || !dateColumn) return [];

  const rows = await sequelize.query<{
    id: number;
    title: string | null;
    meeting_date: string | null;
  }>(
    `SELECT
       id,
       \`${titleColumn}\` AS title,
       \`${dateColumn}\` AS meeting_date
     FROM committee_meetings
     WHERE committee_id = :committeeId
     ORDER BY \`${dateColumn}\` DESC
     LIMIT 5`,
    {
      replacements: { committeeId },
      type: QueryTypes.SELECT,
    },
  );

  return rows.map((row) => ({
    id: row.id,
    title: row.title || 'Untitled meeting',
    meeting_date: row.meeting_date,
  }));
};
