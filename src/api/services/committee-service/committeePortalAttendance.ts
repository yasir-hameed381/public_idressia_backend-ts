import { Op, QueryTypes } from 'sequelize';
import { sequelize } from '../../../config/database';
import committeeMemberModel from '../../models/committee-members';
import userAdminModel from '../../models/user-admin';
import { getCommitteeMeetingsConfig } from './getCommitteeMeetingsConfig';
import { getMeetingByIdOrHash } from './getMeetingByIdOrHash';
import { getMeetingAttendanceConfig } from './getMeetingAttendanceConfig';
import { getCommitteePortalContext, getSelectedCommitteeMembership } from './committeePortalContext';

const committeeMemberModelInstance = committeeMemberModel(sequelize);
const userModelInstance = userAdminModel(sequelize);

export const getCommitteePortalMeetingAttendance = async ({ userId, id }: { userId: number; id: string | number }) => {
  const context = await getCommitteePortalContext(userId);
  if (!context.has_access || !context.selected_committee) return { success: false, has_access: false, message: 'No committee access.' };
  const selectedCommitteeId = context.selected_committee.committee_id;
  const config = await getCommitteeMeetingsConfig();
  if (!config.exists || !config.titleColumn || !config.dateColumn) return { success: false, has_access: true, message: 'Meetings table is not configured.' };
  const meeting = await getMeetingByIdOrHash({ committeeId: selectedCommitteeId, idOrHash: id, includeAttendance: true, includeDescription: false });
  if (!meeting) return { success: false, has_access: true, message: 'Meeting not found.' };
  const meetingId = Number(meeting.id);
  const members = await committeeMemberModelInstance.findAll({ where: { committee_id: selectedCommitteeId }, attributes: ['user_id'] });
  const memberUserIds = (members as { get: (k: string) => unknown }[]).map((r) => Number(r.get('user_id'))).filter(Boolean);
  const users = memberUserIds.length ? await userModelInstance.findAll({ where: { id: { [Op.in]: memberUserIds } }, attributes: ['id', 'name', 'email'] }) : [];
  let statusByUserId: Record<number, { status: 'present' | 'absent' | 'excused'; note: string }> = {};
  const attendanceConfig = await getMeetingAttendanceConfig();
  if (attendanceConfig.exists && attendanceConfig.meetingRefColumn) {
    const rows = await sequelize.query<{ user_id: number; status: 'present' | 'absent' | 'excused'; note: string | null; }>(
      `SELECT user_id, status, ${attendanceConfig.noteColumn ? `\`${attendanceConfig.noteColumn}\`` : 'NULL'} AS note FROM committee_meeting_attendance WHERE \`${attendanceConfig.meetingRefColumn}\` = :meetingId`,
      { replacements: { meetingId }, type: QueryTypes.SELECT },
    );
    statusByUserId = rows.reduce((acc, row) => {
      acc[Number(row.user_id)] = { status: row.status || 'absent', note: row.note || '' };
      return acc;
    }, {} as Record<number, { status: 'present' | 'absent' | 'excused'; note: string }>);
  }
  const data = (users as { get: (k: string) => unknown }[]).map((u) => {
    const idValue = Number(u.get('id'));
    const statusRecord = statusByUserId[idValue] || { status: 'present' as const, note: '' };
    return { user_id: idValue, name: String(u.get('name') || ''), email: String(u.get('email') || ''), status: statusRecord.status, note: statusRecord.note };
  });
  const summary = { total_members: data.length, present: data.filter((x) => x.status === 'present').length, absent: data.filter((x) => x.status === 'absent').length, excused: data.filter((x) => x.status === 'excused').length };
  return { success: true, has_access: true, meeting: { id: meetingId, hash_id: (meeting.hash_id as string | null) || null, title: (meeting.title as string) || 'Untitled meeting', meeting_date: (meeting.meeting_date as string | null) || null }, summary, data };
};

export const saveCommitteePortalMeetingAttendance = async ({ userId, id, attendance }: { userId: number; id: string | number; attendance: { user_id: number; status: 'present' | 'absent' | 'excused'; note?: string }[]; }) => {
  const selected = await getSelectedCommitteeMembership(userId);
  if (!selected) return { success: false, message: 'No committee access.' };
  if (selected.role !== 'admin') return { success: false, message: 'Only committee admins can manage attendance.' };
  const config = await getCommitteeMeetingsConfig();
  if (!config.exists) return { success: false, message: 'Meetings table is not configured.' };
  const meeting = await getMeetingByIdOrHash({ committeeId: selected.committee_id, idOrHash: id });
  if (!meeting) return { success: false, message: 'Meeting not found.' };
  const meetingId = Number(meeting.id);
  const cleanAttendance = (Array.isArray(attendance) ? attendance : []).map((row) => ({ user_id: Number(row.user_id), status: row.status === 'present' || row.status === 'excused' ? row.status : 'absent', note: String(row.note || '').trim() })).filter((row) => Number.isFinite(row.user_id) && row.user_id > 0);
  const attendanceConfig = await getMeetingAttendanceConfig();
  if (attendanceConfig.exists && attendanceConfig.meetingRefColumn) {
    for (const row of cleanAttendance) {
      const existingRows = await sequelize.query<{ id: number }>(`SELECT id FROM committee_meeting_attendance WHERE \`${attendanceConfig.meetingRefColumn}\` = :meeting_id AND user_id = :user_id LIMIT 1`, { replacements: { meeting_id: meetingId, user_id: row.user_id }, type: QueryTypes.SELECT });
      if (existingRows[0]) {
        await sequelize.query(`UPDATE committee_meeting_attendance SET status = :status, ${attendanceConfig.noteColumn ? `\`${attendanceConfig.noteColumn}\`` : 'note'} = :note, updated_at = :updated_at WHERE id = :id`, { replacements: { id: existingRows[0].id, status: row.status, note: row.note || null, updated_at: new Date() }, type: QueryTypes.UPDATE });
      } else {
        await sequelize.query(`INSERT INTO committee_meeting_attendance (\`${attendanceConfig.meetingRefColumn}\`, user_id, status, ${attendanceConfig.noteColumn ? `\`${attendanceConfig.noteColumn}\`` : 'note'}, created_at, updated_at) VALUES (:meeting_id, :user_id, :status, :note, :created_at, :updated_at)`, { replacements: { meeting_id: meetingId, user_id: row.user_id, status: row.status, note: row.note || null, created_at: new Date(), updated_at: new Date() }, type: QueryTypes.INSERT });
      }
    }
  }
  const presentCount = cleanAttendance.filter((row) => row.status === 'present').length;
  if (config.attendanceColumn) {
    await sequelize.query(`UPDATE committee_meetings SET \`${config.attendanceColumn}\` = :attendanceCount, updated_at = :updated_at, updated_by = :updated_by WHERE id = :id AND committee_id = :committee_id`, { replacements: { attendanceCount: presentCount, updated_at: new Date(), updated_by: userId, id: meetingId, committee_id: selected.committee_id }, type: QueryTypes.UPDATE });
  }
  return { success: true, message: 'Attendance saved successfully.' };
};
