import { Op } from 'sequelize';
import { sequelize } from '../../../config/database';
import committeePollModel from '../../models/committeePolls';
import committeePollOptionModel from '../../models/committeePollOptions';
import committeePollVoteModel from '../../models/committeePollVotes';
import { paginate, constructPagination } from '../utilityServices';
import { getCommitteePollColumns } from './getCommitteePollColumns';
import { generatePollHashId, getPollByIdOrHash } from './pollHelpers';
import { getSelectedCommitteeMembership } from './committeePortalContext';

const committeePollModelInstance = committeePollModel(sequelize);
const committeePollOptionModelInstance = committeePollOptionModel(sequelize);
const committeePollVoteModelInstance = committeePollVoteModel(sequelize);

export const getCommitteePortalPolls = async ({
  userId, filter = 'active', search = '', page = 1, size = 10, requestUrl = '',
}: {
  userId: number; filter?: 'active' | 'closed' | 'all'; search?: string; page?: number | string; size?: number | string; requestUrl?: string;
}) => {
  const columns = await getCommitteePollColumns();
  const hasHashId = columns.has('hash_id');
  const selected = await getSelectedCommitteeMembership(userId);
  if (!selected) return { success: true, has_access: false, is_admin: false, data: [], links: { first: null, last: null, prev: null, next: null }, meta: { current_page: 1, from: 0, last_page: 1, path: requestUrl, per_page: String(size), to: 0, total: 0 } };
  const { offset, limit, currentPage } = paginate({ page, size });
  const where: Record<string | symbol, unknown> = { committee_id: selected.committee_id };
  if (search && String(search).trim()) where[Op.or] = [{ question: { [Op.like]: `%${search}%` } }, { description: { [Op.like]: `%${search}%` } }];
  if (filter === 'active') { where.is_active = true; where[Op.and] = [sequelize.literal('(expires_at IS NULL OR expires_at > NOW())')]; }
  else if (filter === 'closed') where[Op.and] = [sequelize.literal('(is_active = 0 OR (expires_at IS NOT NULL AND expires_at <= NOW()))')];
  const baseAttributes = ['id', 'committee_id', 'question', 'description', 'is_active', 'allow_multiple', 'expires_at', 'created_by', 'updated_by', 'created_at', 'updated_at'];
  const attributes = hasHashId ? (['hash_id', ...baseAttributes] as string[]) : baseAttributes;
  const { count, rows } = await committeePollModelInstance.findAndCountAll({ where, attributes, order: [['created_at', 'DESC']], offset, limit });
  const pollIds = (rows as { get: (k: string) => unknown }[]).map((r) => Number(r.get('id')));
  const options = pollIds.length ? await committeePollOptionModelInstance.findAll({ where: { committee_poll_id: { [Op.in]: pollIds } }, attributes: ['id', 'committee_poll_id'] }) : [];
  const votes = pollIds.length ? await committeePollVoteModelInstance.findAll({ where: { committee_poll_id: { [Op.in]: pollIds } }, attributes: ['committee_poll_id', 'user_id'] }) : [];
  const optionsCountMap: Record<number, number> = {};
  for (const option of options as { get: (k: string) => unknown }[]) { const pid = Number(option.get('committee_poll_id')); optionsCountMap[pid] = (optionsCountMap[pid] || 0) + 1; }
  const uniqueVotesMap: Record<number, Set<number>> = {};
  const userVotedPollIds = new Set<number>();
  for (const vote of votes as { get: (k: string) => unknown }[]) { const pid = Number(vote.get('committee_poll_id')); const uid = Number(vote.get('user_id')); if (!uniqueVotesMap[pid]) uniqueVotesMap[pid] = new Set<number>(); uniqueVotesMap[pid].add(uid); if (uid === userId) userVotedPollIds.add(pid); }
  const data = (rows as { get: (k: string) => unknown }[]).map((row) => { const pollId = Number(row.get('id')); return { id: pollId, hash_id: hasHashId ? String(row.get('hash_id') || pollId) : String(pollId), question: String(row.get('question') || ''), description: (row.get('description') as string | null) ?? null, is_active: Boolean(row.get('is_active')), allow_multiple: Boolean(row.get('allow_multiple')), expires_at: row.get('expires_at'), created_at: row.get('created_at'), created_by: row.get('created_by'), total_votes: uniqueVotesMap[pollId]?.size || 0, options_count: optionsCountMap[pollId] || 0, has_user_voted: userVotedPollIds.has(pollId) }; });
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
  const options = await committeePollOptionModelInstance.findAll({ where: { committee_poll_id: pollId }, order: [['sort_order', 'ASC'], ['id', 'ASC']] });
  const votes = await committeePollVoteModelInstance.findAll({ where: { committee_poll_id: pollId } });
  const userVotes = (votes as { get: (k: string) => unknown }[]).filter((v) => Number(v.get('user_id')) === userId).map((v) => Number(v.get('committee_poll_option_id')));
  const totalUniqueVoters = new Set((votes as { get: (k: string) => unknown }[]).map((v) => Number(v.get('user_id')))).size;
  const voteCountByOption: Record<number, number> = {};
  for (const vote of votes as { get: (k: string) => unknown }[]) { const optionId = Number(vote.get('committee_poll_option_id')); voteCountByOption[optionId] = (voteCountByOption[optionId] || 0) + 1; }
  const optionsData = (options as { get: (k: string) => unknown }[]).map((option) => { const optionId = Number(option.get('id')); const voteCount = voteCountByOption[optionId] || 0; const percentage = totalUniqueVoters > 0 ? Math.round((voteCount / totalUniqueVoters) * 100) : 0; return { id: optionId, option: String(option.get('option') || ''), vote_count: voteCount, percentage }; });
  const expiresAt = poll.get('expires_at') as Date | null;
  const isExpired = !!expiresAt && new Date(expiresAt).getTime() <= Date.now();
  const canVote = Boolean(poll.get('is_active')) && !isExpired;
  return { success: true, has_access: true, is_admin: selected.role === 'admin', poll: { id: pollId, hash_id: hasHashId ? String(poll.get('hash_id') || pollId) : String(pollId), committee_id: Number(poll.get('committee_id')), question: String(poll.get('question') || ''), description: (poll.get('description') as string | null) ?? null, is_active: Boolean(poll.get('is_active')), allow_multiple: Boolean(poll.get('allow_multiple')), expires_at: poll.get('expires_at'), created_at: poll.get('created_at'), created_by: poll.get('created_by'), options: optionsData, total_votes: totalUniqueVoters, has_voted: userVotes.length > 0, user_selected_option_ids: userVotes, can_vote: canVote, is_expired: isExpired, created_by_name: selected.committee.name } };
};

export const createCommitteePortalPoll = async ({ userId, question, description, is_active = true, allow_multiple = false, expires_at = null, options, }: { userId: number; question: string; description?: string | null; is_active?: boolean; allow_multiple?: boolean; expires_at?: string | null; options: string[]; }) => {
  const columns = await getCommitteePollColumns();
  const hasHashId = columns.has('hash_id') || columns.size === 0;
  const selected = await getSelectedCommitteeMembership(userId);
  if (!selected) return { success: false, message: 'No committee access.' };
  if (selected.role !== 'admin') return { success: false, message: 'Only committee admins can manage polls.' };
  if (!Array.isArray(options) || options.map((o) => String(o).trim()).filter(Boolean).length < 2) return { success: false, message: 'At least 2 options are required.' };
  let hashId = '';
  if (hasHashId) {
    hashId = generatePollHashId();
    for (let i = 0; i < 5; i += 1) { const exists = await committeePollModelInstance.findOne({ where: { hash_id: hashId } }); if (!exists) break; hashId = generatePollHashId(); }
  }
  const createdPayload: Record<string, unknown> = { committee_id: selected.committee_id, question: question.trim(), description: description ? description.trim() : null, is_active: is_active !== false, allow_multiple: !!allow_multiple, expires_at: expires_at ? new Date(expires_at) : null, created_by: userId, updated_by: userId, created_at: new Date(), updated_at: new Date() };
  if (hasHashId) createdPayload.hash_id = hashId;
  let createdPoll;
  try { createdPoll = await committeePollModelInstance.create(createdPayload); } catch (error) {
    const message = String((error as { message?: string })?.message || '');
    if (message.includes("Unknown column 'hash_id'")) { const fallbackPayload = { ...createdPayload }; delete fallbackPayload.hash_id; createdPoll = await committeePollModelInstance.create(fallbackPayload); }
    else throw error;
  }
  const pollId = Number((createdPoll as { get: (k: string) => unknown }).get('id'));
  const cleanOptions = options.map((o) => String(o).trim()).filter(Boolean);
  for (let i = 0; i < cleanOptions.length; i += 1) await committeePollOptionModelInstance.create({ committee_poll_id: pollId, option: cleanOptions[i], sort_order: i, created_at: new Date(), updated_at: new Date() } as Record<string, unknown>);
  return { success: true, message: 'Poll created successfully.' };
};

export const updateCommitteePortalPoll = async ({ userId, idOrHash, question, description, is_active, allow_multiple, expires_at, options, }: { userId: number; idOrHash: string; question: string; description?: string | null; is_active: boolean; allow_multiple: boolean; expires_at?: string | null; options: string[]; }) => {
  const selected = await getSelectedCommitteeMembership(userId);
  if (!selected) return { success: false, message: 'No committee access.' };
  if (selected.role !== 'admin') return { success: false, message: 'Only committee admins can manage polls.' };
  const poll = (await getPollByIdOrHash(selected.committee_id, idOrHash)) as { get: (k: string) => unknown } | null;
  if (!poll) return { success: false, message: 'Poll not found.' };
  if (!Array.isArray(options) || options.map((o) => String(o).trim()).filter(Boolean).length < 2) return { success: false, message: 'At least 2 options are required.' };
  const pollId = Number(poll.get('id'));
  await committeePollModelInstance.update({ question: question.trim(), description: description ? description.trim() : null, is_active: is_active !== false, allow_multiple: !!allow_multiple, expires_at: expires_at ? new Date(expires_at) : null, updated_by: userId, updated_at: new Date() } as Record<string, unknown>, { where: { id: pollId } });
  await committeePollOptionModelInstance.destroy({ where: { committee_poll_id: pollId } });
  const cleanOptions = options.map((o) => String(o).trim()).filter(Boolean);
  for (let i = 0; i < cleanOptions.length; i += 1) await committeePollOptionModelInstance.create({ committee_poll_id: pollId, option: cleanOptions[i], sort_order: i, created_at: new Date(), updated_at: new Date() } as Record<string, unknown>);
  await committeePollVoteModelInstance.destroy({ where: { committee_poll_id: pollId } });
  return { success: true, message: 'Poll updated successfully.' };
};

export const deleteCommitteePortalPoll = async ({ userId, idOrHash }: { userId: number; idOrHash: string }) => {
  const selected = await getSelectedCommitteeMembership(userId);
  if (!selected) return { success: false, message: 'No committee access.' };
  if (selected.role !== 'admin') return { success: false, message: 'Only committee admins can manage polls.' };
  const poll = (await getPollByIdOrHash(selected.committee_id, idOrHash)) as ({ get: (k: string) => unknown; destroy: () => Promise<void> } & object) | null;
  if (!poll) return { success: false, message: 'Poll not found.' };
  const pollId = Number(poll.get('id'));
  await committeePollVoteModelInstance.destroy({ where: { committee_poll_id: pollId } });
  await committeePollOptionModelInstance.destroy({ where: { committee_poll_id: pollId } });
  await poll.destroy();
  return { success: true, message: 'Poll deleted successfully.' };
};

export const voteCommitteePortalPoll = async ({ userId, idOrHash, optionIds, }: { userId: number; idOrHash: string; optionIds: number[]; }) => {
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
  const validOptions = await committeePollOptionModelInstance.findAll({ where: { committee_poll_id: pollId, id: { [Op.in]: normalized } }, attributes: ['id'] });
  const validOptionIds = (validOptions as { get: (k: string) => unknown }[]).map((o) => Number(o.get('id')));
  if (validOptionIds.length === 0) return { success: false, message: 'Selected option is invalid.' };
  for (const optionId of allowMultiple ? validOptionIds : [validOptionIds[0]]) {
    await committeePollVoteModelInstance.create({ committee_poll_id: pollId, committee_poll_option_id: optionId, user_id: userId, created_at: new Date(), updated_at: new Date() } as Record<string, unknown>);
  }
  return { success: true, message: 'Your vote has been recorded.' };
};
