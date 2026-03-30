import { sequelize } from '../../../config/database';
import { tableExists } from './tableExists';

export const getCommitteeMeetingsConfig = async () => {
  const exists = await tableExists('committee_meetings');
  if (!exists) {
    return {
      exists: false,
      titleColumn: null,
      dateColumn: null,
      attendanceColumn: null,
      descriptionColumn: null,
    } as const;
  }

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
  const attendanceColumn = columnNames.has('attendance')
    ? 'attendance'
    : columnNames.has('attendance_count')
    ? 'attendance_count'
    : columnNames.has('participants_count')
    ? 'participants_count'
    : columnNames.has('attendees_count')
    ? 'attendees_count'
    : null;
  const descriptionColumn = columnNames.has('description')
    ? 'description'
    : columnNames.has('agenda')
    ? 'agenda'
    : columnNames.has('notes')
    ? 'notes'
    : columnNames.has('summary')
    ? 'summary'
    : null;

  return {
    exists: true,
    titleColumn,
    dateColumn,
    attendanceColumn,
    descriptionColumn,
  } as const;
};
