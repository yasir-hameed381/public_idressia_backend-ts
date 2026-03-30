import { Op } from 'sequelize';
import logger from '../../../config/logger';
import { sequelize } from '../../../config/database';
import committeeModel from '../../models/committees';
import committeeMemberModel from '../../models/committee-members';
import { paginate, constructPagination } from '../utilityServices';

const committeeModelInstance = committeeModel(sequelize);
const committeeMemberModelInstance = committeeMemberModel(sequelize);

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
    const parentIds = [...new Set((rows as { get: (k: string) => number | null }[]).map((r) => r.get('parent_id')).filter((id): id is number => id != null))];
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

    const { links, meta } = constructPagination({ count, limit, offset, currentPage, baseUrl: requestUrl });
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
    return (rows as { get: (k: string) => unknown }[]).map((r) => ({ id: r.get('id'), name: r.get('name') }));
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
    const createPayload = { ...payload, parent_id: payload.parent_id || null, created_at: new Date(), updated_at: new Date() };
    return await committeeModelInstance.create(createPayload as Record<string, unknown>);
  } catch (error) {
    logger.error('Error creating committee:', error as Error);
    throw error;
  }
};

export const updateCommittee = async (id: string | number, payload: CommitteePayload) => {
  try {
    const existing = await committeeModelInstance.findByPk(String(id));
    if (!existing) return { success: false, message: 'Committee not found' };
    if (payload.parent_id) {
      const parent = await committeeModelInstance.findByPk(String(payload.parent_id));
      const parentRow = parent as { get: (k: string) => unknown } | null;
      if (parentRow && parentRow.get('parent_id') != null) return { success: false, message: 'Cannot set parent to a sub-committee.' };
      if (Number(payload.parent_id) === Number(id)) return { success: false, message: 'Committee cannot be its own parent.' };
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
    if (!id || (typeof id === 'string' && isNaN(Number(id)))) return { success: false, message: 'Invalid committee ID provided' };
    const row = await committeeModelInstance.findByPk(String(id));
    if (!row) return { success: true, message: 'Committee not found.' };
    const subCount = await committeeModelInstance.count({ where: { parent_id: id } });
    if (subCount > 0) return { success: false, message: 'Cannot delete committee with sub-committees. Remove all sub-committees first.' };
    const memberCount = await committeeMemberModelInstance.count({ where: { committee_id: id } });
    if (memberCount > 0) return { success: false, message: 'Cannot delete committee with members. Remove all members first.' };
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
