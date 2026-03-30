import { Op } from 'sequelize';
import { sequelize } from '../../../config/database';
import committeeModel from '../../models/committees';
import committeeMessageModel from '../../models/committee-messages';
import userAdminModel from '../../models/user-admin';
import { paginate, constructPagination } from '../utilityServices';
import { getCommitteePortalContext } from './committeePortalContext';

const committeeModelInstance = committeeModel(sequelize);
const committeeMessageModelInstance = committeeMessageModel(sequelize);
const userModelInstance = userAdminModel(sequelize);

export const getCommitteePortalInbox = async ({
  userId, tab = 'received', page = 1, size = 10, requestUrl = '',
}: {
  userId: number; tab?: 'received' | 'sent'; page?: number | string; size?: number | string; requestUrl?: string;
}) => {
  const context = await getCommitteePortalContext(userId);
  if (!context.has_access || !context.selected_committee) return { success: true, has_access: false, data: [], links: { first: null, last: null, prev: null, next: null }, meta: { current_page: 1, from: 0, last_page: 1, path: requestUrl, per_page: String(size), to: 0, total: 0 } };
  const selectedCommitteeId = context.selected_committee.committee_id;
  const { offset, limit, currentPage } = paginate({ page, size });
  const where: Record<string | symbol, unknown> = {};
  if (tab === 'sent') where.committee_id = selectedCommitteeId;
  else {
    where[Op.or] = [
      sequelize.where(sequelize.fn('JSON_CONTAINS', sequelize.col('recipient_committees'), sequelize.literal(`'"${selectedCommitteeId}"'`)), 1),
      sequelize.where(sequelize.fn('JSON_CONTAINS', sequelize.col('recipient_committees'), sequelize.literal(`${selectedCommitteeId}`)), 1),
    ];
  }
  const { count, rows } = await committeeMessageModelInstance.findAndCountAll({ where, order: [['created_at', 'DESC']], offset, limit });
  const senderCommitteeIds = [...new Set((rows as { get: (k: string) => unknown }[]).map((r) => Number(r.get('committee_id'))).filter(Boolean))];
  const senderCommittees = senderCommitteeIds.length ? await committeeModelInstance.findAll({ where: { id: { [Op.in]: senderCommitteeIds } }, attributes: ['id', 'name'] }) : [];
  const senderMap: Record<number, string> = {};
  for (const c of senderCommittees as { get: (k: string) => unknown }[]) senderMap[Number(c.get('id'))] = String(c.get('name') || '');
  const data = (rows as { get: (k: string) => unknown }[]).map((r) => {
    const recipientCommittees = (r.get('recipient_committees') as number[] | string[] | null) || [];
    const recipientIds = recipientCommittees.map((x) => Number(x)).filter(Boolean);
    const recipientNames = context.committees.filter((c) => recipientIds.includes(c.committee_id)).map((c) => c.committee.name);
    return { id: Number(r.get('id')), committee_id: Number(r.get('committee_id')), title: String(r.get('title') || ''), description: String(r.get('description') || ''), recipient_committees: recipientCommittees, sender_type: String(r.get('sender_type') || 'committee'), attachment: (r.get('attachment') as string | null) ?? null, message_type: String(r.get('message_type') || 'original'), created_at: r.get('created_at'), from: senderMap[Number(r.get('committee_id'))] || null, to: recipientNames };
  });
  const { links, meta } = constructPagination({ count, limit, offset, currentPage, baseUrl: requestUrl });
  return { success: true, has_access: true, tab, data, links, meta };
};

export const composeCommitteePortalMessage = async ({
  userId, title, description, recipientCommittees, attachment,
}: {
  userId: number; title: string; description: string; recipientCommittees: number[]; attachment?: string | null;
}) => {
  const context = await getCommitteePortalContext(userId);
  if (!context.has_access || !context.selected_committee) return { success: false, message: 'You are not assigned to any committee.' };
  const selected = context.selected_committee;
  if (selected.role !== 'admin') return { success: false, message: 'Only committee admins can compose messages.' };
  const allowedRecipients = context.committees.map((c) => c.committee_id);
  const sanitizedRecipients = recipientCommittees.map((id) => Number(id)).filter((id) => Number.isFinite(id) && allowedRecipients.includes(id));
  if (!sanitizedRecipients.length) return { success: false, message: 'At least one valid recipient committee is required.' };
  const created = await committeeMessageModelInstance.create({
    committee_id: selected.committee_id,
    title: title.trim(),
    description: description.trim(),
    recipient_committees: sanitizedRecipients,
    sender_type: 'committee',
    attachment: attachment ?? null,
    message_type: 'original',
    created_by: userId,
    updated_by: userId,
    created_at: new Date(),
    updated_at: new Date(),
  } as Record<string, unknown>);
  return { success: true, message: 'Message sent successfully.', data: created };
};

export const getCommitteePortalRecipientOptions = async ({ userId, search = '', }: { userId: number; search?: string; }) => {
  const context = await getCommitteePortalContext(userId);
  if (!context.has_access) return { success: true, has_access: false, committees: [], admins: [] };
  const q = String(search || '').trim().toLowerCase();
  const committees = context.committees.filter((c) => (q ? c.committee.name.toLowerCase().includes(q) : true)).map((c) => ({ membership_id: c.membership_id, committee_id: c.committee_id, role: c.role, committee: c.committee }));
  const adminWhere: Record<string | symbol, unknown> = { [Op.or]: [{ is_super_admin: true }, { is_mehfil_admin: true }, { is_zone_admin: true }, { is_region_admin: true }, { is_all_region_admin: true }] };
  if (q) adminWhere[Op.and] = [{ [Op.or]: [{ name: { [Op.like]: `%${q}%` } }, { email: { [Op.like]: `%${q}%` } }, { phone_number: { [Op.like]: `%${q}%` } }] }];
  const admins = await userModelInstance.findAll({ where: adminWhere, attributes: ['id', 'name', 'email', 'phone_number', 'zone_id'], order: [['name', 'ASC']], limit: 25 });
  return {
    success: true,
    has_access: true,
    committees,
    admins: (admins as { get: (k: string) => unknown }[]).map((a) => ({
      id: Number(a.get('id')),
      name: String(a.get('name') || ''),
      email: String(a.get('email') || ''),
      phone_number: (a.get('phone_number') as string | null) ?? null,
      zone_id: (a.get('zone_id') as number | null) ?? null,
    })),
  };
};
