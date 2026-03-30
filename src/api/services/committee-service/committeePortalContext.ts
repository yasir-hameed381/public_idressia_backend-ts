import { Op } from 'sequelize';
import { sequelize } from '../../../config/database';
import committeeModel from '../../models/committees';
import committeeMemberModel from '../../models/committee-members';

const committeeModelInstance = committeeModel(sequelize);
const committeeMemberModelInstance = committeeMemberModel(sequelize);

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
  const parentIds = [...new Set(committeeRows.map((c) => c.get('parent_id')).filter((x): x is number => Number(x) > 0))];
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

export const getSelectedCommitteeMembership = async (userId: number) => {
  const context = await getCommitteePortalContext(userId);
  if (!context.has_access || !context.selected_committee) return null;
  return context.selected_committee;
};
