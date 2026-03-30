import { sequelize } from '../../../config/database';
import { tableExists } from './tableExists';

export const getMeetingAttendanceConfig = async () => {
  const exists = await tableExists('committee_meeting_attendance');
  if (!exists) {
    return {
      exists: false,
      meetingRefColumn: null,
      noteColumn: null,
    } as const;
  }

  const attendanceColumns = await sequelize.getQueryInterface().describeTable('committee_meeting_attendance');
  const columnNames = new Set(Object.keys(attendanceColumns));
  const meetingRefColumn = columnNames.has('committee_meeting_id')
    ? 'committee_meeting_id'
    : columnNames.has('meeting_id')
    ? 'meeting_id'
    : null;
  const noteColumn = columnNames.has('notes')
    ? 'notes'
    : columnNames.has('note')
    ? 'note'
    : null;

  return {
    exists: true,
    meetingRefColumn,
    noteColumn,
  } as const;
};
