import { randomBytes } from 'crypto';
import committeePollModel from '../../models/committeePolls';
import { sequelize } from '../../../config/database';
import { getCommitteePollColumns } from './getCommitteePollColumns';

const committeePollModelInstance = committeePollModel(sequelize);

export const generatePollHashId = () => randomBytes(6).toString('base64url');

export const getPollByIdOrHash = async (committeeId: number, idOrHash: string) => {
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
