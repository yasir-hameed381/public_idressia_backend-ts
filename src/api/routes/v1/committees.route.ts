import { Router } from 'express';
import * as controller from '../../controllers/committees.controller';
import authMiddleware from '../../middlewares/authMiddleware';

const router = Router();
router.use(authMiddleware);

router.get('/portal/context', controller.getCommitteePortalContext);
router.get('/portal/dashboard', controller.getCommitteePortalDashboard);
router.get('/portal/polls', controller.getCommitteePortalPolls);
router.post('/portal/polls', controller.createCommitteePortalPoll);
router.get('/portal/polls/:id', controller.getCommitteePortalPollById);
router.put('/portal/polls/:id', controller.updateCommitteePortalPoll);
router.delete('/portal/polls/:id', controller.deleteCommitteePortalPoll);
router.post('/portal/polls/:id/vote', controller.voteCommitteePortalPoll);
router.get('/portal/inbox', controller.getCommitteePortalInbox);
router.post('/portal/inbox/compose', controller.composeCommitteePortalMessage);
router.get('/portal/recipients/options', controller.getCommitteePortalRecipientOptions);
router.get('/users/options', controller.getCommitteeMemberUserOptions);
router.get('/', controller.getCommittees);
router.get('/parents', controller.getParentCommittees);
router.post('/add', controller.createCommittee);
router.put('/update/:id', controller.updateCommittee);
router.get('/:id/members', controller.getCommitteeMembers);
router.post('/:id/members', controller.addCommitteeMember);
router.put('/:id/members/:memberId', controller.updateCommitteeMember);
router.delete('/:id/members/:memberId', controller.deleteCommitteeMember);
router.get('/:id', controller.getCommitteeById);
router.delete('/:id', controller.deleteCommittee);

export default router;
