import { Op } from 'sequelize';
import { sequelize } from '../../../config/database';
import committeeModel from '../../models/committees';
import committeeMemberModel from '../../models/committee-members';
import userAdminModel from '../../models/user-admin';
import { paginate, constructPagination } from '../utilityServices';

const committeeModelInstance = committeeModel(sequelize);
const committeeMemberModelInstance = committeeMemberModel(sequelize);
const userModelInstance = userAdminModel(sequelize);

export const getCommitteeMembers = async ({
  committeeId, page = 1, size = 10, search = '', requestUrl = '',
}: {
  committeeId: string | number; page?: number | string; size?: number | string; search?: string; requestUrl?: string;
}) => {
  const committee = await committeeModelInstance.findByPk(String(committeeId));
  if (!committee) return { success: false, message: 'Committee not found.' };

  const where: Record<string, unknown> = { committee_id: Number(committeeId) };
  if (search && String(search).trim()) {
    const users = await userModelInstance.findAll({
      where: { [Op.or]: [{ name: { [Op.like]: `%${search}%` } }, { email: { [Op.like]: `%${search}%` } }] },
      attributes: ['id'],
    });
    const userIds = (users as { get: (k: string) => unknown }[]).map((u) => u.get('id') as number);
    if (userIds.length === 0) {
      return { success: true, data: [], links: { first: null, last: null, prev: null, next: null }, meta: { current_page: 1, from: 0, last_page: 1, path: requestUrl, per_page: String(size), to: 0, total: 0 } };
    }
    where.user_id = { [Op.in]: userIds };
  }

  const { offset, limit, currentPage } = paginate({ page, size });
  const { count, rows } = await committeeMemberModelInstance.findAndCountAll({ where, offset, limit, order: [['created_at', 'DESC']] });
  const memberUserIds = (rows as { get: (k: string) => unknown }[]).map((r) => r.get('user_id') as number);
  const users = memberUserIds.length ? await userModelInstance.findAll({ where: { id: { [Op.in]: memberUserIds } }, attributes: ['id', 'name', 'email'] }) : [];
  const usersMap: Record<number, { id: number; name: string; email: string }> = {};
  for (const u of users as { get: (k: string) => unknown }[]) {
    usersMap[u.get('id') as number] = { id: u.get('id') as number, name: (u.get('name') as string) || '', email: (u.get('email') as string) || '' };
  }
  const data = (rows as { get: (k: string) => unknown }[]).map((r) => {
    const userId = r.get('user_id') as number;
    return { id: r.get('id'), committee_id: r.get('committee_id'), user_id: userId, role: r.get('role'), duty: r.get('duty'), created_at: r.get('created_at'), user: usersMap[userId] || null };
  });
  const { links, meta } = constructPagination({ count, limit, offset, currentPage, baseUrl: requestUrl });
  return { success: true, data, links, meta };
};

export const addCommitteeMember = async ({
  committeeId, user_id, role = 'member', duty = null,
}: {
  committeeId: string | number; user_id: number; role?: 'admin' | 'member'; duty?: string | null;
}) => {
  const committee = await committeeModelInstance.findByPk(String(committeeId));
  if (!committee) return { success: false, message: 'Committee not found.' };
  const user = await userModelInstance.findByPk(String(user_id));
  if (!user) return { success: false, message: 'User not found.' };
  const existing = await committeeMemberModelInstance.findOne({ where: { committee_id: Number(committeeId), user_id } });
  if (existing) return { success: false, message: 'User is already a committee member.' };
  const created = await committeeMemberModelInstance.create({ committee_id: Number(committeeId), user_id, role, duty, created_at: new Date(), updated_at: new Date() } as Record<string, unknown>);
  return { success: true, data: created };
};

export const updateCommitteeMember = async ({
  committeeId, memberId, role, duty,
}: {
  committeeId: string | number; memberId: string | number; role?: 'admin' | 'member'; duty?: string | null;
}) => {
  const member = await committeeMemberModelInstance.findOne({ where: { id: Number(memberId), committee_id: Number(committeeId) } });
  if (!member) return { success: false, message: 'Committee member not found.' };
  await committeeMemberModelInstance.update({
    role: role ?? (member as { get: (k: string) => unknown }).get('role'),
    duty: duty ?? (member as { get: (k: string) => unknown }).get('duty'),
    updated_at: new Date(),
  } as Record<string, unknown>, { where: { id: Number(memberId) } });
  return { success: true, message: 'Committee member updated successfully.' };
};

export const deleteCommitteeMember = async ({
  committeeId, memberId,
}: {
  committeeId: string | number; memberId: string | number;
}) => {
  const member = await committeeMemberModelInstance.findOne({ where: { id: Number(memberId), committee_id: Number(committeeId) } });
  if (!member) return { success: false, message: 'Committee member not found.' };
  await (member as { destroy: () => Promise<void> }).destroy();
  return { success: true, message: 'Committee member removed successfully.' };
};

export const getCommitteeMemberUserOptions = async ({
  search = '', size = 20,
}: {
  search?: string; size?: number | string;
}) => {
  const limit = Math.min(Math.max(Number(size) || 20, 1), 100);
  const where: Record<string | symbol, unknown> = {};
  if (search && String(search).trim()) where[Op.or] = [{ name: { [Op.like]: `%${search}%` } }, { email: { [Op.like]: `%${search}%` } }];
  const users = await userModelInstance.findAll({ where, attributes: ['id', 'name', 'email'], order: [['name', 'ASC']], limit });
  const data = (users as { get: (k: string) => unknown }[]).map((u) => ({ id: u.get('id'), name: u.get('name'), email: u.get('email') }));
  return { success: true, data };
};
