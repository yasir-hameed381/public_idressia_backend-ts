import { QueryTypes } from 'sequelize';
import { sequelize } from '../../../config/database';
import { paginate, constructPagination } from '../utilityServices';
import { getCommitteeMeetingsConfig } from './getCommitteeMeetingsConfig';
import { getMeetingAttendanceConfig } from './getMeetingAttendanceConfig';
import { getMeetingByIdOrHash } from './getMeetingByIdOrHash';
import { getCommitteePortalContext, getSelectedCommitteeMembership } from './committeePortalContext';

// eslint-disable-next-line max-lines-per-function
export const getCommitteePortalMeetings = async ({
  userId, page = 1, size = 10, search = '', requestUrl = '',
}: {
  userId: number; page?: number | string; size?: number | string; search?: string; requestUrl?: string;
}) => {
  const context = await getCommitteePortalContext(userId);
  if (!context.has_access || !context.selected_committee) {
    return { success: true, has_access: false, data: [], links: { first: null, last: null, prev: null, next: null }, meta: { current_page: 1, from: 0, last_page: 1, path: requestUrl, per_page: String(size), to: 0, total: 0 } };
  }
  const selectedCommitteeId = context.selected_committee.committee_id;
  const config = await getCommitteeMeetingsConfig();
  const { offset, limit, currentPage } = paginate({ page, size });
  if (!config.exists) {
    return { success: true, has_access: true, data: [], links: { first: null, last: null, prev: null, next: null }, meta: { current_page: currentPage, from: 0, last_page: 1, path: requestUrl, per_page: String(limit), to: 0, total: 0 } };
  }
  const { titleColumn, dateColumn, attendanceColumn, descriptionColumn } = config;
  const hasHashColumn = !!(await sequelize.getQueryInterface().describeTable('committee_meetings')).hash_id;
  const attendanceConfig = await getMeetingAttendanceConfig();
  if (!titleColumn || !dateColumn) {
    return { success: true, has_access: true, data: [], links: { first: null, last: null, prev: null, next: null }, meta: { current_page: currentPage, from: 0, last_page: 1, path: requestUrl, per_page: String(limit), to: 0, total: 0 } };
  }
  const attendanceExpr = (attendanceConfig.exists && attendanceConfig.meetingRefColumn)
    ? `(SELECT COUNT(*) FROM committee_meeting_attendance cma WHERE cma.\`${attendanceConfig.meetingRefColumn}\` = committee_meetings.id AND cma.status = 'present')`
    : (attendanceColumn ? `\`${attendanceColumn}\`` : 'NULL');
  const searchTrimmed = String(search || '').trim();
  const whereSearch = searchTrimmed ? ` AND (\`${titleColumn}\` LIKE :search${descriptionColumn ? ` OR \`${descriptionColumn}\` LIKE :search` : ''})` : '';
  const replacements: Record<string, unknown> = { committeeId: selectedCommitteeId };
  if (searchTrimmed) replacements.search = `%${searchTrimmed}%`;
  const countRows = await sequelize.query<{ total: number }>(`SELECT COUNT(*) as total FROM committee_meetings WHERE committee_id = :committeeId${whereSearch}`, { replacements, type: QueryTypes.SELECT });
  const total = Number(countRows?.[0]?.total || 0);
  const dataRows = await sequelize.query<{ id: number; hash_id: string | null; title: string | null; description: string | null; meeting_date: string | null; attendance: number | null; }>(
    `SELECT id, ${hasHashColumn ? 'hash_id' : 'NULL AS hash_id'}, \`${titleColumn}\` AS title, ${descriptionColumn ? `\`${descriptionColumn}\`` : 'NULL'} AS description, \`${dateColumn}\` AS meeting_date, ${attendanceExpr} AS attendance FROM committee_meetings WHERE committee_id = :committeeId${whereSearch} ORDER BY \`${dateColumn}\` DESC LIMIT :limit OFFSET :offset`,
    { replacements: { ...replacements, limit, offset }, type: QueryTypes.SELECT },
  );
  const { links, meta } = constructPagination({ count: total, limit, offset, currentPage, baseUrl: requestUrl });
  return { success: true, has_access: true, data: dataRows.map((row) => ({ id: row.id, hash_id: row.hash_id || null, title: row.title || 'Untitled meeting', description: row.description || '', meeting_date: row.meeting_date, attendance: row.attendance ?? 0 })), links, meta };
};

export const getCommitteePortalMeetingById = async ({ userId, id }: { userId: number; id: string | number }) => {
  const context = await getCommitteePortalContext(userId);
  if (!context.has_access || !context.selected_committee) return { success: false, has_access: false, message: 'No committee access.' };
  const selectedCommitteeId = context.selected_committee.committee_id;
  const config = await getCommitteeMeetingsConfig();
  if (!config.exists || !config.titleColumn || !config.dateColumn) return { success: false, has_access: true, message: 'Meetings table is not configured.' };
  const row = await getMeetingByIdOrHash({ committeeId: selectedCommitteeId, idOrHash: id, includeAttendance: true, includeDescription: true });
  if (!row) return { success: false, has_access: true, message: 'Meeting not found.' };
  return { success: true, has_access: true, data: { id: Number(row.id), hash_id: (row.hash_id as string | null) || null, title: (row.title as string) || 'Untitled meeting', description: (row.description as string) || '', meeting_date: (row.meeting_date as string | null) || null, attendance: Number(row.attendance || 0) } };
};

export const createCommitteePortalMeeting = async ({ userId, title, meeting_date, description }: { userId: number; title: string; meeting_date?: string | null; description?: string | null; }) => {
  const selected = await getSelectedCommitteeMembership(userId);
  if (!selected) return { success: false, message: 'No committee access.' };
  if (selected.role !== 'admin') return { success: false, message: 'Only committee admins can manage meetings.' };
  const config = await getCommitteeMeetingsConfig();
  if (!config.exists || !config.titleColumn || !config.dateColumn) return { success: false, message: 'Meetings table is not configured.' };
  const payload: Record<string, unknown> = { committee_id: selected.committee_id, [config.titleColumn]: title.trim(), [config.dateColumn]: meeting_date ? new Date(meeting_date) : new Date(), created_by: userId, updated_by: userId, created_at: new Date(), updated_at: new Date() };
  if (config.descriptionColumn) payload[config.descriptionColumn] = description ? description.trim() : null;
  const fields = Object.keys(payload);
  await sequelize.query(`INSERT INTO committee_meetings (${fields.map((f) => `\`${f}\``).join(', ')}) VALUES (${fields.map((f) => `:${f}`).join(', ')})`, { replacements: payload, type: QueryTypes.INSERT });
  return { success: true, message: 'Meeting created successfully.' };
};

export const updateCommitteePortalMeeting = async ({ userId, id, title, meeting_date, description }: { userId: number; id: string | number; title: string; meeting_date?: string | null; description?: string | null; }) => {
  const selected = await getSelectedCommitteeMembership(userId);
  if (!selected) return { success: false, message: 'No committee access.' };
  if (selected.role !== 'admin') return { success: false, message: 'Only committee admins can manage meetings.' };
  const config = await getCommitteeMeetingsConfig();
  if (!config.exists || !config.titleColumn || !config.dateColumn) return { success: false, message: 'Meetings table is not configured.' };
  const existing = await getMeetingByIdOrHash({ committeeId: selected.committee_id, idOrHash: id });
  if (!existing) return { success: false, message: 'Meeting not found.' };
  const meetingId = Number(existing.id);
  const payload: Record<string, unknown> = { [config.titleColumn]: title.trim(), [config.dateColumn]: meeting_date ? new Date(meeting_date) : new Date(), updated_by: userId, updated_at: new Date() };
  if (config.descriptionColumn) payload[config.descriptionColumn] = description ? description.trim() : null;
  await sequelize.query(`UPDATE committee_meetings SET ${Object.keys(payload).map((f) => `\`${f}\` = :${f}`).join(', ')} WHERE id = :id AND committee_id = :committee_id`, { replacements: { ...payload, id: meetingId, committee_id: selected.committee_id }, type: QueryTypes.UPDATE });
  return { success: true, message: 'Meeting updated successfully.' };
};

export const deleteCommitteePortalMeeting = async ({ userId, id }: { userId: number; id: string | number }) => {
  const selected = await getSelectedCommitteeMembership(userId);
  if (!selected) return { success: false, message: 'No committee access.' };
  if (selected.role !== 'admin') return { success: false, message: 'Only committee admins can manage meetings.' };
  const config = await getCommitteeMeetingsConfig();
  if (!config.exists) return { success: false, message: 'Meetings table is not configured.' };
  const existing = await getMeetingByIdOrHash({ committeeId: selected.committee_id, idOrHash: id });
  if (!existing) return { success: false, message: 'Meeting not found.' };
  await sequelize.query(`DELETE FROM committee_meetings WHERE committee_id = :committeeId AND id = :id`, { replacements: { committeeId: selected.committee_id, id: Number(existing.id) }, type: QueryTypes.DELETE });
  return { success: true, message: 'Meeting deleted successfully.' };
};
