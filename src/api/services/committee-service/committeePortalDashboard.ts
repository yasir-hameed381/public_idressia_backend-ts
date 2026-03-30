import { Op } from 'sequelize';
import { sequelize } from '../../../config/database';
import committeeMemberModel from '../../models/committee-members';
import committeeMessageModel from '../../models/committee-messages';
import committeePollModel from '../../models/committeePolls';
import { countByCommitteeIfTableExists } from './countByCommitteeIfTableExists';
import { getRecentMeetingsIfTableExists } from './getRecentMeetingsIfTableExists';
import { getCommitteePortalContext } from './committeePortalContext';

const committeeMemberModelInstance = committeeMemberModel(sequelize);
const committeeMessageModelInstance = committeeMessageModel(sequelize);
const committeePollModelInstance = committeePollModel(sequelize);

export const getCommitteePortalDashboard = async ({
  userId, committeeId,
}: {
  userId: number; committeeId?: number | null;
}) => {
  const context = await getCommitteePortalContext(userId);
  if (!context.has_access || !context.selected_committee) return { success: true, has_access: false };
  const effectiveCommitteeId = committeeId || context.selected_committee.committee_id;
  const selected = context.committees.find((c) => c.committee_id === effectiveCommitteeId) || context.selected_committee;
  if (!selected) return { success: true, has_access: false };

  const membersCount = await committeeMemberModelInstance.count({ where: { committee_id: selected.committee_id } });
  const messagesCount = await committeeMessageModelInstance.count({ where: { committee_id: selected.committee_id } });
  const documentsCount = await countByCommitteeIfTableExists('committee_documents', selected.committee_id);
  const meetingsCount = await countByCommitteeIfTableExists('committee_meetings', selected.committee_id);
  const activePolls = await committeePollModelInstance.count({
    where: {
      committee_id: selected.committee_id,
      is_active: true,
      [Op.and]: [sequelize.literal('(expires_at IS NULL OR expires_at > NOW())')],
    },
  });
  const recentMeetings = await getRecentMeetingsIfTableExists(selected.committee_id);
  const activePollRows = await committeePollModelInstance.findAll({
    where: {
      committee_id: selected.committee_id,
      is_active: true,
      [Op.and]: [sequelize.literal('(expires_at IS NULL OR expires_at > NOW())')],
    },
    attributes: ['id', 'hash_id', 'question', 'created_at'],
    order: [['created_at', 'DESC']],
    limit: 5,
  });

  return {
    success: true,
    has_access: true,
    committee: selected.committee,
    role: selected.role,
    duty: selected.duty,
    stats: { members: membersCount, messages: messagesCount, documents: documentsCount, meetings: meetingsCount, active_polls: activePolls },
    recent_meetings: recentMeetings,
    active_polls: (activePollRows as { get: (k: string) => unknown }[]).map((poll) => ({
      id: poll.get('id'),
      hash_id: poll.get('hash_id'),
      question: poll.get('question'),
      created_at: poll.get('created_at'),
    })),
  };
};
