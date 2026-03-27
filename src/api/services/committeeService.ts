import { Op } from 'sequelize';
import logger from '../../config/logger';
import { sequelize } from '../../config/database';
import committeeModel from '../models/committees';
import committeeMemberModel from '../models/committee-members';
import committeeMessageModel from '../models/committee-messages';
import committeePollModel from '../models/committeePolls';
import committeePollOptionModel from '../models/committeePollOptions';
import committeePollVoteModel from '../models/committeePollVotes';
import userAdminModel from '../models/user-admin';
import { paginate, constructPagination } from './utilityServices';
import { randomBytes } from 'crypto';

const committeeModelInstance = committeeModel(sequelize);
const committeeMemberModelInstance = committeeMemberModel(sequelize);
const committeeMessageModelInstance = committeeMessageModel(sequelize);
const committeePollModelInstance = committeePollModel(sequelize);
const committeePollOptionModelInstance = committeePollOptionModel(sequelize);
const committeePollVoteModelInstance = committeePollVoteModel(sequelize);
const userModelInstance = userAdminModel(sequelize);
let pollColumnsCache: Set<string> | null = null;

const getCommitteePollColumns = async () => {
  if (pollColumnsCache) return pollColumnsCache;
  try {
    const columns = await sequelize.getQueryInterface().describeTable('committee_polls');
    pollColumnsCache = new Set(Object.keys(columns));
  } catch {
    pollColumnsCache = new Set<string>();
  }
  return pollColumnsCache;
};

export const getCommittees = async ({
  page = 1,
  size = 25,
  search = '',
  requestUrl = '',
}: {
  page?: number | string;
  size?: number | string;
  search?: string;
  requestUrl?: string;
}) => {
  try {
    const { offset, limit, currentPage } = paginate({ page, size });
    const where: Record<string | symbol, unknown> = {};
    if (search && String(search).trim()) {
      where[Op.or] = [
        { name: { [Op.like]: `%${search}%` } },
        { description: { [Op.like]: `%${search}%` } },
      ];
    }
    const { count, rows } = await committeeModelInstance.findAndCountAll({
      where,
      offset,
      limit,
      order: [
        [sequelize.literal('COALESCE(parent_id, id)'), 'ASC'],
        [sequelize.literal('parent_id IS NOT NULL'), 'ASC'],
        ['id', 'ASC'],
      ],
    });

    const ids = (rows as { get: (k: string) => number }[]).map((r) => r.get('id'));
    const parentIds = [
      ...new Set(
        (rows as { get: (k: string) => number | null }[])
          .map((r) => r.get('parent_id'))
          .filter((id): id is number => id != null),
      ),
    ];
    const memberCounts: Record<number, number> = {};
    const parentNames: Record<number, string> = {};
    if (ids.length > 0) {
      const members = await committeeMemberModelInstance.findAll({
        where: { committee_id: { [Op.in]: ids } },
        attributes: ['committee_id'],
      });
      for (const m of members as { get: (k: string) => number }[]) {
        const cid = m.get('committee_id');
        memberCounts[cid] = (memberCounts[cid] || 0) + 1;
      }
    }
    if (parentIds.length > 0) {
      const parentRows = await committeeModelInstance.findAll({
        where: { id: { [Op.in]: parentIds } },
        attributes: ['id', 'name'],
      });
      for (const p of parentRows as { get: (k: string) => unknown }[]) {
        parentNames[p.get('id') as number] = (p.get('name') as string) || '';
      }
    }

    const data = (rows as { get: (k: string) => unknown }[]).map((r) => {
      const id = r.get('id') as number;
      const parentId = r.get('parent_id') as number | null;
      return {
        id,
        parent_id: parentId,
        name: r.get('name'),
        description: r.get('description'),
        is_active: r.get('is_active'),
        created_by: r.get('created_by'),
        updated_by: r.get('updated_by'),
        created_at: r.get('created_at'),
        updated_at: r.get('updated_at'),
        members_count: memberCounts[id] || 0,
        is_sub_committee: parentId != null,
        parent_name: parentId != null ? parentNames[parentId] || null : null,
      };
    });

    const { links, meta } = constructPagination({
      count,
      limit,
      offset,
      currentPage,
      baseUrl: requestUrl,
    });
    return { data, links, meta };
  } catch (error) {
    logger.error('Error fetching committees:', error as Error);
    throw error;
  }
};

export const getParentCommitteesForSelect = async () => {
  try {
    const rows = await committeeModelInstance.findAll({
      where: { parent_id: null, is_active: true },
      order: [['name', 'ASC']],
      attributes: ['id', 'name'],
    });
    return (rows as { get: (k: string) => unknown }[]).map((r) => ({
      id: r.get('id'),
      name: r.get('name'),
    }));
  } catch (error) {
    logger.error('Error fetching parent committees:', error as Error);
    throw error;
  }
};

type CommitteePayload = {
  name: string;
  description?: string | null;
  is_active?: boolean;
  parent_id?: number | null;
};

export const createCommittee = async (payload: CommitteePayload) => {
  try {
    if (payload.parent_id) {
      const parent = await committeeModelInstance.findByPk(String(payload.parent_id));
      const parentRow = parent as { get: (k: string) => unknown } | null;
      if (parentRow && parentRow.get('parent_id') != null) {
        throw new Error('Cannot create a sub-committee of a sub-committee.');
      }
    }
    const createPayload = {
      ...payload,
      parent_id: payload.parent_id || null,
      created_at: new Date(),
      updated_at: new Date(),
    };
    return await committeeModelInstance.create(createPayload as Record<string, unknown>);
  } catch (error) {
    logger.error('Error creating committee:', error as Error);
    throw error;
  }
};

export const updateCommittee = async (id: string | number, payload: CommitteePayload) => {
  try {
    const existing = await committeeModelInstance.findByPk(String(id));
    if (!existing) {
      return { success: false, message: 'Committee not found' };
    }
    if (payload.parent_id) {
      const parent = await committeeModelInstance.findByPk(String(payload.parent_id));
      const parentRow = parent as { get: (k: string) => unknown } | null;
      if (parentRow && parentRow.get('parent_id') != null) {
        return { success: false, message: 'Cannot set parent to a sub-committee.' };
      }
      if (Number(payload.parent_id) === Number(id)) {
        return { success: false, message: 'Committee cannot be its own parent.' };
      }
    }
    const updatePayload = { ...payload, parent_id: payload.parent_id ?? null, updated_at: new Date() };
    await committeeModelInstance.update(updatePayload as Record<string, unknown>, { where: { id } });
    return { success: true, message: 'Committee updated successfully' };
  } catch (error) {
    logger.error('Error updating committee:', error as Error);
    throw error;
  }
};

export const deleteCommittee = async (id: string | number) => {
  try {
    if (!id || (typeof id === 'string' && isNaN(Number(id)))) {
      return { success: false, message: 'Invalid committee ID provided' };
    }
    const row = await committeeModelInstance.findByPk(String(id));
    if (!row) {
      return { success: true, message: 'Committee not found.' };
    }
    const subCount = await committeeModelInstance.count({ where: { parent_id: id } });
    if (subCount > 0) {
      return { success: false, message: 'Cannot delete committee with sub-committees. Remove all sub-committees first.' };
    }
    const memberCount = await committeeMemberModelInstance.count({ where: { committee_id: id } });
    if (memberCount > 0) {
      return { success: false, message: 'Cannot delete committee with members. Remove all members first.' };
    }
    await row.destroy();
    return { success: true, message: 'Committee deleted successfully.' };
  } catch (error) {
    logger.error('Error deleting committee:', error as Error);
    throw error;
  }
};

export const getCommitteeById = async (id: string | number) => {
  try {
    const row = await committeeModelInstance.findByPk(String(id));
    if (!row) return null;
    return (row as { get: (arg: { plain: boolean }) => unknown }).get({ plain: true });
  } catch (error) {
    logger.error('Error getCommitteeById:', error as Error);
    throw error;
  }
};

export const getCommitteeMembers = async ({
  committeeId,
  page = 1,
  size = 10,
  search = '',
  requestUrl = '',
}: {
  committeeId: string | number;
  page?: number | string;
  size?: number | string;
  search?: string;
  requestUrl?: string;
}) => {
  const committee = await committeeModelInstance.findByPk(String(committeeId));
  if (!committee) {
    return { success: false, message: 'Committee not found.' };
  }

  const where: Record<string, unknown> = { committee_id: Number(committeeId) };
  if (search && String(search).trim()) {
    const users = await userModelInstance.findAll({
      where: {
        [Op.or]: [
          { name: { [Op.like]: `%${search}%` } },
          { email: { [Op.like]: `%${search}%` } },
        ],
      },
      attributes: ['id'],
    });
    const userIds = (users as { get: (k: string) => unknown }[]).map((u) => u.get('id') as number);
    if (userIds.length === 0) {
      return {
        success: true,
        data: [],
        links: { first: null, last: null, prev: null, next: null },
        meta: { current_page: 1, from: 0, last_page: 1, path: requestUrl, per_page: String(size), to: 0, total: 0 },
      };
    }
    where.user_id = { [Op.in]: userIds };
  }

  const { offset, limit, currentPage } = paginate({ page, size });
  const { count, rows } = await committeeMemberModelInstance.findAndCountAll({
    where,
    offset,
    limit,
    order: [['created_at', 'DESC']],
  });

  const memberUserIds = (rows as { get: (k: string) => unknown }[]).map((r) => r.get('user_id') as number);
  const users = memberUserIds.length
    ? await userModelInstance.findAll({
        where: { id: { [Op.in]: memberUserIds } },
        attributes: ['id', 'name', 'email'],
      })
    : [];
  const usersMap: Record<number, { id: number; name: string; email: string }> = {};
  for (const u of users as { get: (k: string) => unknown }[]) {
    usersMap[u.get('id') as number] = {
      id: u.get('id') as number,
      name: (u.get('name') as string) || '',
      email: (u.get('email') as string) || '',
    };
  }

  const data = (rows as { get: (k: string) => unknown }[]).map((r) => {
    const userId = r.get('user_id') as number;
    return {
      id: r.get('id'),
      committee_id: r.get('committee_id'),
      user_id: userId,
      role: r.get('role'),
      duty: r.get('duty'),
      created_at: r.get('created_at'),
      user: usersMap[userId] || null,
    };
  });

  const { links, meta } = constructPagination({
    count,
    limit,
    offset,
    currentPage,
    baseUrl: requestUrl,
  });
  return { success: true, data, links, meta };
};

export const addCommitteeMember = async ({
  committeeId,
  user_id,
  role = 'member',
  duty = null,
}: {
  committeeId: string | number;
  user_id: number;
  role?: 'admin' | 'member';
  duty?: string | null;
}) => {
  const committee = await committeeModelInstance.findByPk(String(committeeId));
  if (!committee) return { success: false, message: 'Committee not found.' };

  const user = await userModelInstance.findByPk(String(user_id));
  if (!user) return { success: false, message: 'User not found.' };

  const existing = await committeeMemberModelInstance.findOne({
    where: { committee_id: Number(committeeId), user_id },
  });
  if (existing) return { success: false, message: 'User is already a committee member.' };

  const created = await committeeMemberModelInstance.create({
    committee_id: Number(committeeId),
    user_id,
    role,
    duty,
    created_at: new Date(),
    updated_at: new Date(),
  } as Record<string, unknown>);
  return { success: true, data: created };
};

export const updateCommitteeMember = async ({
  committeeId,
  memberId,
  role,
  duty,
}: {
  committeeId: string | number;
  memberId: string | number;
  role?: 'admin' | 'member';
  duty?: string | null;
}) => {
  const member = await committeeMemberModelInstance.findOne({
    where: { id: Number(memberId), committee_id: Number(committeeId) },
  });
  if (!member) return { success: false, message: 'Committee member not found.' };

  await committeeMemberModelInstance.update(
    {
      role: role ?? (member as { get: (k: string) => unknown }).get('role'),
      duty: duty ?? (member as { get: (k: string) => unknown }).get('duty'),
      updated_at: new Date(),
    } as Record<string, unknown>,
    { where: { id: Number(memberId) } },
  );
  return { success: true, message: 'Committee member updated successfully.' };
};

export const deleteCommitteeMember = async ({
  committeeId,
  memberId,
}: {
  committeeId: string | number;
  memberId: string | number;
}) => {
  const member = await committeeMemberModelInstance.findOne({
    where: { id: Number(memberId), committee_id: Number(committeeId) },
  });
  if (!member) return { success: false, message: 'Committee member not found.' };
  await (member as { destroy: () => Promise<void> }).destroy();
  return { success: true, message: 'Committee member removed successfully.' };
};

export const getCommitteeMemberUserOptions = async ({
  search = '',
  size = 20,
}: {
  search?: string;
  size?: number | string;
}) => {
  const limit = Math.min(Math.max(Number(size) || 20, 1), 100);
  const where: Record<string | symbol, unknown> = {};
  if (search && String(search).trim()) {
    where[Op.or] = [
      { name: { [Op.like]: `%${search}%` } },
      { email: { [Op.like]: `%${search}%` } },
    ];
  }
  const users = await userModelInstance.findAll({
    where,
    attributes: ['id', 'name', 'email'],
    order: [['name', 'ASC']],
    limit,
  });
  const data = (users as { get: (k: string) => unknown }[]).map((u) => ({
    id: u.get('id'),
    name: u.get('name'),
    email: u.get('email'),
  }));
  return { success: true, data };
};

export const getCommitteePortalContext = async (userId: number) => {
  const memberships = await committeeMemberModelInstance.findAll({
    where: { user_id: userId },
    attributes: ['id', 'committee_id', 'role', 'duty', 'created_at'],
    order: [['role', 'ASC'], ['created_at', 'ASC']],
  });

  if (!memberships.length) {
    return { success: true, has_access: false, committees: [], selected_committee: null };
  }

  const committeeIds = (memberships as { get: (k: string) => unknown }[]).map((m) => Number(m.get('committee_id')));
  const committees = await committeeModelInstance.findAll({
    where: { id: { [Op.in]: committeeIds } },
    attributes: ['id', 'name', 'description', 'parent_id'],
  });
  const committeeRows = committees as { get: (k: string) => unknown }[];
  const parentIds = [
    ...new Set(committeeRows.map((c) => c.get('parent_id')).filter((x): x is number => Number(x) > 0)),
  ];
  const parentNames: Record<number, string> = {};
  if (parentIds.length > 0) {
    const parents = await committeeModelInstance.findAll({
      where: { id: { [Op.in]: parentIds } },
      attributes: ['id', 'name'],
    });
    for (const p of parents as { get: (k: string) => unknown }[]) {
      parentNames[Number(p.get('id'))] = String(p.get('name') || '');
    }
  }

  const committeeMap = new Map<number, { id: number; name: string; description: string | null; parent_id: number | null; parent_name: string | null }>();
  for (const c of committeeRows) {
    const id = Number(c.get('id'));
    const parentId = c.get('parent_id') ? Number(c.get('parent_id')) : null;
    committeeMap.set(id, {
      id,
      name: String(c.get('name') || ''),
      description: (c.get('description') as string | null) ?? null,
      parent_id: parentId,
      parent_name: parentId ? parentNames[parentId] || null : null,
    });
  }

  const enrichedMemberships = (memberships as { get: (k: string) => unknown }[])
    .map((m) => {
      const committeeId = Number(m.get('committee_id'));
      const committee = committeeMap.get(committeeId);
      if (!committee) return null;
      return {
        membership_id: Number(m.get('id')),
        committee_id: committeeId,
        role: String(m.get('role') || 'member'),
        duty: (m.get('duty') as string | null) ?? null,
        committee,
      };
    })
    .filter(Boolean) as {
      membership_id: number;
      committee_id: number;
      role: string;
      duty: string | null;
      committee: { id: number; name: string; description: string | null; parent_id: number | null; parent_name: string | null };
    }[];

  const selected = enrichedMemberships[0] ?? null;

  return {
    success: true,
    has_access: enrichedMemberships.length > 0,
    committees: enrichedMemberships,
    selected_committee: selected,
  };
};

export const getCommitteePortalDashboard = async ({
  userId,
  committeeId,
}: {
  userId: number;
  committeeId?: number | null;
}) => {
  const context = await getCommitteePortalContext(userId);
  if (!context.has_access || !context.selected_committee) {
    return { success: true, has_access: false };
  }

  const effectiveCommitteeId = committeeId || context.selected_committee.committee_id;
  const selected = context.committees.find((c) => c.committee_id === effectiveCommitteeId) || context.selected_committee;
  if (!selected) return { success: true, has_access: false };

  const membersCount = await committeeMemberModelInstance.count({
    where: { committee_id: selected.committee_id },
  });
  const activePolls = await committeePollModelInstance.count({
    where: {
      committee_id: selected.committee_id,
      is_active: true,
      [Op.and]: [sequelize.literal('(expires_at IS NULL OR expires_at > NOW())')],
    },
  });

  return {
    success: true,
    has_access: true,
    committee: selected.committee,
    role: selected.role,
    duty: selected.duty,
    stats: {
      members: membersCount,
      messages: 0,
      documents: 0,
      meetings: 0,
      active_polls: activePolls,
    },
    recent_meetings: [],
    active_polls: [],
  };
};

export const getCommitteePortalInbox = async ({
  userId,
  tab = 'received',
  page = 1,
  size = 10,
  requestUrl = '',
}: {
  userId: number;
  tab?: 'received' | 'sent';
  page?: number | string;
  size?: number | string;
  requestUrl?: string;
}) => {
  const context = await getCommitteePortalContext(userId);
  if (!context.has_access || !context.selected_committee) {
    return {
      success: true,
      has_access: false,
      data: [],
      links: { first: null, last: null, prev: null, next: null },
      meta: { current_page: 1, from: 0, last_page: 1, path: requestUrl, per_page: String(size), to: 0, total: 0 },
    };
  }

  const selectedCommitteeId = context.selected_committee.committee_id;
  const { offset, limit, currentPage } = paginate({ page, size });
  const where: Record<string | symbol, unknown> = {};

  if (tab === 'sent') {
    where.committee_id = selectedCommitteeId;
  } else {
    where[Op.or] = [
      sequelize.where(
        sequelize.fn('JSON_CONTAINS', sequelize.col('recipient_committees'), sequelize.literal(`'"${selectedCommitteeId}"'`)),
        1,
      ),
      sequelize.where(
        sequelize.fn('JSON_CONTAINS', sequelize.col('recipient_committees'), sequelize.literal(`${selectedCommitteeId}`)),
        1,
      ),
    ];
  }

  const { count, rows } = await committeeMessageModelInstance.findAndCountAll({
    where,
    order: [['created_at', 'DESC']],
    offset,
    limit,
  });

  const senderCommitteeIds = [
    ...new Set((rows as { get: (k: string) => unknown }[]).map((r) => Number(r.get('committee_id'))).filter(Boolean)),
  ];
  const senderCommittees = senderCommitteeIds.length
    ? await committeeModelInstance.findAll({ where: { id: { [Op.in]: senderCommitteeIds } }, attributes: ['id', 'name'] })
    : [];
  const senderMap: Record<number, string> = {};
  for (const c of senderCommittees as { get: (k: string) => unknown }[]) {
    senderMap[Number(c.get('id'))] = String(c.get('name') || '');
  }

  const data = (rows as { get: (k: string) => unknown }[]).map((r) => {
    const recipientCommittees = (r.get('recipient_committees') as number[] | string[] | null) || [];
    const recipientIds = recipientCommittees.map((x) => Number(x)).filter(Boolean);
    const recipientNames = context.committees
      .filter((c) => recipientIds.includes(c.committee_id))
      .map((c) => c.committee.name);

    return {
      id: Number(r.get('id')),
      committee_id: Number(r.get('committee_id')),
      title: String(r.get('title') || ''),
      description: String(r.get('description') || ''),
      recipient_committees: recipientCommittees,
      sender_type: String(r.get('sender_type') || 'committee'),
      attachment: (r.get('attachment') as string | null) ?? null,
      message_type: String(r.get('message_type') || 'original'),
      created_at: r.get('created_at'),
      from: senderMap[Number(r.get('committee_id'))] || null,
      to: recipientNames,
    };
  });

  const { links, meta } = constructPagination({
    count,
    limit,
    offset,
    currentPage,
    baseUrl: requestUrl,
  });

  return { success: true, has_access: true, tab, data, links, meta };
};

export const composeCommitteePortalMessage = async ({
  userId,
  title,
  description,
  recipientCommittees,
  attachment,
}: {
  userId: number;
  title: string;
  description: string;
  recipientCommittees: number[];
  attachment?: string | null;
}) => {
  const context = await getCommitteePortalContext(userId);
  if (!context.has_access || !context.selected_committee) {
    return { success: false, message: 'You are not assigned to any committee.' };
  }

  const selected = context.selected_committee;
  if (selected.role !== 'admin') {
    return { success: false, message: 'Only committee admins can compose messages.' };
  }

  const allowedRecipients = context.committees.map((c) => c.committee_id);
  const sanitizedRecipients = recipientCommittees
    .map((id) => Number(id))
    .filter((id) => Number.isFinite(id) && allowedRecipients.includes(id));

  if (!sanitizedRecipients.length) {
    return { success: false, message: 'At least one valid recipient committee is required.' };
  }

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

export const getCommitteePortalRecipientOptions = async ({
  userId,
  search = '',
}: {
  userId: number;
  search?: string;
}) => {
  const context = await getCommitteePortalContext(userId);
  if (!context.has_access) {
    return { success: true, has_access: false, committees: [], admins: [] };
  }

  const q = String(search || '').trim().toLowerCase();
  const committees = context.committees
    .filter((c) => (q ? c.committee.name.toLowerCase().includes(q) : true))
    .map((c) => ({
      membership_id: c.membership_id,
      committee_id: c.committee_id,
      role: c.role,
      committee: c.committee,
    }));

  const adminWhere: Record<string | symbol, unknown> = {
    [Op.or]: [{ is_super_admin: true }, { is_mehfil_admin: true }, { is_zone_admin: true }, { is_region_admin: true }, { is_all_region_admin: true }],
  };
  if (q) {
    adminWhere[Op.and] = [
      {
        [Op.or]: [{ name: { [Op.like]: `%${q}%` } }, { email: { [Op.like]: `%${q}%` } }, { phone_number: { [Op.like]: `%${q}%` } }],
      },
    ];
  }

  const admins = await userModelInstance.findAll({
    where: adminWhere,
    attributes: ['id', 'name', 'email', 'phone_number', 'zone_id'],
    order: [['name', 'ASC']],
    limit: 25,
  });

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

const generatePollHashId = () => randomBytes(6).toString('base64url');

const getSelectedCommitteeMembership = async (userId: number) => {
  const context = await getCommitteePortalContext(userId);
  if (!context.has_access || !context.selected_committee) return null;
  return context.selected_committee;
};

const getPollByIdOrHash = async (committeeId: number, idOrHash: string) => {
  const columns = await getCommitteePollColumns();
  const hasHashId = columns.has('hash_id');
  if (/^\d+$/.test(idOrHash)) {
    return committeePollModelInstance.findOne({
      where: { id: Number(idOrHash), committee_id: committeeId },
    });
  }
  if (!hasHashId) return null;
  return committeePollModelInstance.findOne({
    where: { hash_id: idOrHash, committee_id: committeeId },
  });
};

export const getCommitteePortalPolls = async ({
  userId,
  filter = 'active',
  search = '',
  page = 1,
  size = 10,
  requestUrl = '',
}: {
  userId: number;
  filter?: 'active' | 'closed' | 'all';
  search?: string;
  page?: number | string;
  size?: number | string;
  requestUrl?: string;
}) => {
  const columns = await getCommitteePollColumns();
  const hasHashId = columns.has('hash_id');
  const selected = await getSelectedCommitteeMembership(userId);
  if (!selected) {
    return {
      success: true,
      has_access: false,
      is_admin: false,
      data: [],
      links: { first: null, last: null, prev: null, next: null },
      meta: { current_page: 1, from: 0, last_page: 1, path: requestUrl, per_page: String(size), to: 0, total: 0 },
    };
  }

  const { offset, limit, currentPage } = paginate({ page, size });
  const where: Record<string | symbol, unknown> = { committee_id: selected.committee_id };
  if (search && String(search).trim()) {
    where[Op.or] = [{ question: { [Op.like]: `%${search}%` } }, { description: { [Op.like]: `%${search}%` } }];
  }

  if (filter === 'active') {
    where.is_active = true;
    where[Op.and] = [sequelize.literal('(expires_at IS NULL OR expires_at > NOW())')];
  } else if (filter === 'closed') {
    where[Op.and] = [
      sequelize.literal('(is_active = 0 OR (expires_at IS NOT NULL AND expires_at <= NOW()))'),
    ];
  }

  const baseAttributes = [
    'id',
    'committee_id',
    'question',
    'description',
    'is_active',
    'allow_multiple',
    'expires_at',
    'created_by',
    'updated_by',
    'created_at',
    'updated_at',
  ];
  const attributes = hasHashId ? (['hash_id', ...baseAttributes] as string[]) : baseAttributes;

  const { count, rows } = await committeePollModelInstance.findAndCountAll({
    where,
    attributes,
    order: [['created_at', 'DESC']],
    offset,
    limit,
  });

  const pollIds = (rows as { get: (k: string) => unknown }[]).map((r) => Number(r.get('id')));
  const options = pollIds.length
    ? await committeePollOptionModelInstance.findAll({
        where: { committee_poll_id: { [Op.in]: pollIds } },
        attributes: ['id', 'committee_poll_id'],
      })
    : [];
  const votes = pollIds.length
    ? await committeePollVoteModelInstance.findAll({
        where: { committee_poll_id: { [Op.in]: pollIds } },
        attributes: ['committee_poll_id', 'user_id'],
      })
    : [];

  const optionsCountMap: Record<number, number> = {};
  for (const option of options as { get: (k: string) => unknown }[]) {
    const pid = Number(option.get('committee_poll_id'));
    optionsCountMap[pid] = (optionsCountMap[pid] || 0) + 1;
  }

  const uniqueVotesMap: Record<number, Set<number>> = {};
  const userVotedPollIds = new Set<number>();
  for (const vote of votes as { get: (k: string) => unknown }[]) {
    const pid = Number(vote.get('committee_poll_id'));
    const uid = Number(vote.get('user_id'));
    if (!uniqueVotesMap[pid]) uniqueVotesMap[pid] = new Set<number>();
    uniqueVotesMap[pid].add(uid);
    if (uid === userId) userVotedPollIds.add(pid);
  }

  const data = (rows as { get: (k: string) => unknown }[]).map((row) => {
    const pollId = Number(row.get('id'));
    return {
      id: pollId,
      hash_id: hasHashId ? String(row.get('hash_id') || pollId) : String(pollId),
      question: String(row.get('question') || ''),
      description: (row.get('description') as string | null) ?? null,
      is_active: Boolean(row.get('is_active')),
      allow_multiple: Boolean(row.get('allow_multiple')),
      expires_at: row.get('expires_at'),
      created_at: row.get('created_at'),
      created_by: row.get('created_by'),
      total_votes: uniqueVotesMap[pollId]?.size || 0,
      options_count: optionsCountMap[pollId] || 0,
      has_user_voted: userVotedPollIds.has(pollId),
    };
  });

  const { links, meta } = constructPagination({ count, limit, offset, currentPage, baseUrl: requestUrl });
  return { success: true, has_access: true, is_admin: selected.role === 'admin', data, links, meta };
};

export const getCommitteePortalPollById = async ({ userId, idOrHash }: { userId: number; idOrHash: string }) => {
  const columns = await getCommitteePollColumns();
  const hasHashId = columns.has('hash_id');
  const selected = await getSelectedCommitteeMembership(userId);
  if (!selected) return { success: true, has_access: false };

  const poll = (await getPollByIdOrHash(selected.committee_id, idOrHash)) as { get: (k: string) => unknown } | null;
  if (!poll) return { success: false, message: 'Poll not found.' };

  const pollId = Number(poll.get('id'));
  const options = await committeePollOptionModelInstance.findAll({
    where: { committee_poll_id: pollId },
    order: [['sort_order', 'ASC'], ['id', 'ASC']],
  });
  const votes = await committeePollVoteModelInstance.findAll({ where: { committee_poll_id: pollId } });
  const userVotes = (votes as { get: (k: string) => unknown }[])
    .filter((v) => Number(v.get('user_id')) === userId)
    .map((v) => Number(v.get('committee_poll_option_id')));

  const totalUniqueVoters = new Set((votes as { get: (k: string) => unknown }[]).map((v) => Number(v.get('user_id')))).size;
  const voteCountByOption: Record<number, number> = {};
  for (const vote of votes as { get: (k: string) => unknown }[]) {
    const optionId = Number(vote.get('committee_poll_option_id'));
    voteCountByOption[optionId] = (voteCountByOption[optionId] || 0) + 1;
  }

  const optionsData = (options as { get: (k: string) => unknown }[]).map((option) => {
    const optionId = Number(option.get('id'));
    const voteCount = voteCountByOption[optionId] || 0;
    const percentage = totalUniqueVoters > 0 ? Math.round((voteCount / totalUniqueVoters) * 100) : 0;
    return { id: optionId, option: String(option.get('option') || ''), vote_count: voteCount, percentage };
  });

  const expiresAt = poll.get('expires_at') as Date | null;
  const isExpired = !!expiresAt && new Date(expiresAt).getTime() <= Date.now();
  const canVote = Boolean(poll.get('is_active')) && !isExpired;

  return {
    success: true,
    has_access: true,
    is_admin: selected.role === 'admin',
    poll: {
      id: pollId,
      hash_id: hasHashId ? String(poll.get('hash_id') || pollId) : String(pollId),
      committee_id: Number(poll.get('committee_id')),
      question: String(poll.get('question') || ''),
      description: (poll.get('description') as string | null) ?? null,
      is_active: Boolean(poll.get('is_active')),
      allow_multiple: Boolean(poll.get('allow_multiple')),
      expires_at: poll.get('expires_at'),
      created_at: poll.get('created_at'),
      created_by: poll.get('created_by'),
      options: optionsData,
      total_votes: totalUniqueVoters,
      has_voted: userVotes.length > 0,
      user_selected_option_ids: userVotes,
      can_vote: canVote,
      is_expired: isExpired,
      created_by_name: selected.committee.name,
    },
  };
};

export const createCommitteePortalPoll = async ({
  userId,
  question,
  description,
  is_active = true,
  allow_multiple = false,
  expires_at = null,
  options,
}: {
  userId: number;
  question: string;
  description?: string | null;
  is_active?: boolean;
  allow_multiple?: boolean;
  expires_at?: string | null;
  options: string[];
}) => {
  const columns = await getCommitteePollColumns();
  const hasHashId = columns.has('hash_id') || columns.size === 0;
  const selected = await getSelectedCommitteeMembership(userId);
  if (!selected) return { success: false, message: 'No committee access.' };
  if (selected.role !== 'admin') return { success: false, message: 'Only committee admins can manage polls.' };
  if (!Array.isArray(options) || options.map((o) => String(o).trim()).filter(Boolean).length < 2) {
    return { success: false, message: 'At least 2 options are required.' };
  }

  let hashId = '';
  if (hasHashId) {
    hashId = generatePollHashId();
    for (let i = 0; i < 5; i += 1) {
      const exists = await committeePollModelInstance.findOne({ where: { hash_id: hashId } });
      if (!exists) break;
      hashId = generatePollHashId();
    }
  }

  const createdPayload: Record<string, unknown> = {
    committee_id: selected.committee_id,
    question: question.trim(),
    description: description ? description.trim() : null,
    is_active: is_active !== false,
    allow_multiple: !!allow_multiple,
    expires_at: expires_at ? new Date(expires_at) : null,
    created_by: userId,
    updated_by: userId,
    created_at: new Date(),
    updated_at: new Date(),
  };
  if (hasHashId) createdPayload.hash_id = hashId;

  let createdPoll;
  try {
    createdPoll = await committeePollModelInstance.create(createdPayload);
  } catch (error) {
    const message = String((error as { message?: string })?.message || '');
    const isUnknownHashColumn = message.includes("Unknown column 'hash_id'");
    if (isUnknownHashColumn) {
      const fallbackPayload = { ...createdPayload };
      delete fallbackPayload.hash_id;
      createdPoll = await committeePollModelInstance.create(fallbackPayload);
    } else {
      throw error;
    }
  }

  const pollId = Number((createdPoll as { get: (k: string) => unknown }).get('id'));
  const cleanOptions = options.map((o) => String(o).trim()).filter(Boolean);
  for (let i = 0; i < cleanOptions.length; i += 1) {
    await committeePollOptionModelInstance.create({
      committee_poll_id: pollId,
      option: cleanOptions[i],
      sort_order: i,
      created_at: new Date(),
      updated_at: new Date(),
    } as Record<string, unknown>);
  }

  return { success: true, message: 'Poll created successfully.' };
};

export const updateCommitteePortalPoll = async ({
  userId,
  idOrHash,
  question,
  description,
  is_active,
  allow_multiple,
  expires_at,
  options,
}: {
  userId: number;
  idOrHash: string;
  question: string;
  description?: string | null;
  is_active: boolean;
  allow_multiple: boolean;
  expires_at?: string | null;
  options: string[];
}) => {
  const selected = await getSelectedCommitteeMembership(userId);
  if (!selected) return { success: false, message: 'No committee access.' };
  if (selected.role !== 'admin') return { success: false, message: 'Only committee admins can manage polls.' };

  const poll = (await getPollByIdOrHash(selected.committee_id, idOrHash)) as { get: (k: string) => unknown } | null;
  if (!poll) return { success: false, message: 'Poll not found.' };
  if (!Array.isArray(options) || options.map((o) => String(o).trim()).filter(Boolean).length < 2) {
    return { success: false, message: 'At least 2 options are required.' };
  }

  const pollId = Number(poll.get('id'));
  await committeePollModelInstance.update(
    {
      question: question.trim(),
      description: description ? description.trim() : null,
      is_active: is_active !== false,
      allow_multiple: !!allow_multiple,
      expires_at: expires_at ? new Date(expires_at) : null,
      updated_by: userId,
      updated_at: new Date(),
    } as Record<string, unknown>,
    { where: { id: pollId } },
  );

  await committeePollOptionModelInstance.destroy({ where: { committee_poll_id: pollId } });
  const cleanOptions = options.map((o) => String(o).trim()).filter(Boolean);
  for (let i = 0; i < cleanOptions.length; i += 1) {
    await committeePollOptionModelInstance.create({
      committee_poll_id: pollId,
      option: cleanOptions[i],
      sort_order: i,
      created_at: new Date(),
      updated_at: new Date(),
    } as Record<string, unknown>);
  }

  await committeePollVoteModelInstance.destroy({ where: { committee_poll_id: pollId } });
  return { success: true, message: 'Poll updated successfully.' };
};

export const deleteCommitteePortalPoll = async ({ userId, idOrHash }: { userId: number; idOrHash: string }) => {
  const selected = await getSelectedCommitteeMembership(userId);
  if (!selected) return { success: false, message: 'No committee access.' };
  if (selected.role !== 'admin') return { success: false, message: 'Only committee admins can manage polls.' };
  const poll = (await getPollByIdOrHash(selected.committee_id, idOrHash)) as
    | ({ get: (k: string) => unknown; destroy: () => Promise<void> } & object)
    | null;
  if (!poll) return { success: false, message: 'Poll not found.' };
  const pollId = Number(poll.get('id'));
  await committeePollVoteModelInstance.destroy({ where: { committee_poll_id: pollId } });
  await committeePollOptionModelInstance.destroy({ where: { committee_poll_id: pollId } });
  await poll.destroy();
  return { success: true, message: 'Poll deleted successfully.' };
};

export const voteCommitteePortalPoll = async ({
  userId,
  idOrHash,
  optionIds,
}: {
  userId: number;
  idOrHash: string;
  optionIds: number[];
}) => {
  const selected = await getSelectedCommitteeMembership(userId);
  if (!selected) return { success: false, message: 'No committee access.' };

  const poll = (await getPollByIdOrHash(selected.committee_id, idOrHash)) as { get: (k: string) => unknown } | null;
  if (!poll) return { success: false, message: 'Poll not found.' };

  const pollId = Number(poll.get('id'));
  const isActive = Boolean(poll.get('is_active'));
  const expiresAt = poll.get('expires_at') as Date | null;
  const isExpired = !!expiresAt && new Date(expiresAt).getTime() <= Date.now();
  if (!isActive || isExpired) return { success: false, message: 'Voting is closed for this poll.' };

  const existingVote = await committeePollVoteModelInstance.findOne({ where: { committee_poll_id: pollId, user_id: userId } });
  if (existingVote) return { success: false, message: 'You have already voted for this poll.' };

  const allowMultiple = Boolean(poll.get('allow_multiple'));
  const normalized = [...new Set(optionIds.map((x) => Number(x)).filter((x) => Number.isFinite(x) && x > 0))];
  if (normalized.length === 0) return { success: false, message: 'Please select at least one option.' };
  if (!allowMultiple && normalized.length > 1) return { success: false, message: 'Multiple choices are not allowed for this poll.' };

  const validOptions = await committeePollOptionModelInstance.findAll({
    where: { committee_poll_id: pollId, id: { [Op.in]: normalized } },
    attributes: ['id'],
  });
  const validOptionIds = (validOptions as { get: (k: string) => unknown }[]).map((o) => Number(o.get('id')));
  if (validOptionIds.length === 0) return { success: false, message: 'Selected option is invalid.' };

  for (const optionId of allowMultiple ? validOptionIds : [validOptionIds[0]]) {
    await committeePollVoteModelInstance.create({
      committee_poll_id: pollId,
      committee_poll_option_id: optionId,
      user_id: userId,
      created_at: new Date(),
      updated_at: new Date(),
    } as Record<string, unknown>);
  }

  return { success: true, message: 'Your vote has been recorded.' };
};
