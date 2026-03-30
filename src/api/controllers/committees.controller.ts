import { Request, Response, NextFunction } from 'express';
import logger from '../../config/logger';
import * as committeeService from '../services/committee-service';
import { AuthRequest } from '../middlewares/authMiddleware';

const getFriendlyPollErrorMessage = (error: unknown) => {
  const raw = String((error as { message?: string })?.message || 'Something went wrong.');
  if (raw.includes('committee_polls.hash_id cannot be null')) {
    return 'Poll schema is outdated. Please run latest migrations for polls.';
  }
  if (raw.includes("Unknown column 'hash_id'")) {
    return 'Poll schema is outdated. Please run latest migrations for polls.';
  }
  if (raw.includes('Validation error')) {
    return 'Invalid poll data. Please check required fields and try again.';
  }
  return raw;
};

export const getCommittees = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const requestUrl = `${req.protocol}://${req.get('host')}${req.baseUrl}`;
    const page = req.query.page as string | undefined;
    const size = req.query.size as string | undefined;
    const search = req.query.search as string | undefined;
    const result = await committeeService.getCommittees({
      page,
      size,
      search,
      requestUrl,
    });
    return res.json(result);
  } catch (error) {
    logger.error('Error fetching committees:', error);
    return next(error);
  }
};

export const getParentCommittees = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await committeeService.getParentCommitteesForSelect();
    return res.json({ data: result });
  } catch (error) {
    logger.error('Error fetching parent committees:', error);
    return next(error);
  }
};

export const createCommittee = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { name, description, is_active, parent_id } = req.body;
    if (!name || String(name).trim() === '') {
      return res.status(400).json({ success: false, message: 'Name is required.' });
    }
    const result = await committeeService.createCommittee({
      name: String(name).trim(),
      description: description ?? null,
      is_active: is_active !== false,
      parent_id: parent_id ?? null,
    });
    return res.status(201).json({
      success: true,
      message: 'Committee created successfully',
      data: result,
    });
  } catch (error) {
    logger.error('Error creating committee:', error as Error);
    return next(error);
  }
};

export const updateCommittee = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { name, description, is_active, parent_id } = req.body;
    if (!id) {
      return res.status(400).json({ success: false, message: 'Committee ID is required.' });
    }
    if (!name || String(name).trim() === '') {
      return res.status(400).json({ success: false, message: 'Name is required.' });
    }
    const result = await committeeService.updateCommittee(id, {
      name: String(name).trim(),
      description: description ?? null,
      is_active: is_active !== false,
      parent_id: parent_id ?? null,
    });
    const r = result as { success?: boolean; message?: string };
    if (!r || !r.success) {
      return res.status(r.message === 'Committee not found' ? 404 : 400).json({
        success: false,
        message: r.message || 'Update failed.',
      });
    }
    return res.status(200).json({ success: true, message: 'Committee updated successfully.' });
  } catch (error) {
    logger.error('Error updating committee:', error as Error);
    return next(error);
  }
};

export const deleteCommittee = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const result = await committeeService.deleteCommittee(id);
    const r = result as { success?: boolean; message?: string };
    if (!r.success) {
      return res.status(400).json({ success: false, message: r.message || 'Delete failed.' });
    }
    return res.json(result);
  } catch (error) {
    logger.error('Error deleting committee:', error);
    return next(error);
  }
};

export const getCommitteeById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const result = await committeeService.getCommitteeById(id);
    if (!result) {
      return res.status(404).json({ success: false, message: 'Committee not found.' });
    }
    return res.json({ success: true, data: result });
  } catch (error) {
    logger.error('Error getCommitteeById:', error);
    return next(error);
  }
};

export const getCommitteeMembers = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const requestUrl = `${req.protocol}://${req.get('host')}${req.baseUrl}/${id}/members`;
    const { page, size, search } = req.query;
    const result = await committeeService.getCommitteeMembers({
      committeeId: id,
      page: page as string | undefined,
      size: size as string | undefined,
      search: search as string | undefined,
      requestUrl,
    });
    if (!result.success) {
      return res.status(404).json(result);
    }
    return res.json(result);
  } catch (error) {
    logger.error('Error getCommitteeMembers:', error);
    return next(error);
  }
};

export const addCommitteeMember = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { user_id, role, duty } = req.body;
    if (!user_id) {
      return res.status(400).json({ success: false, message: 'user_id is required.' });
    }
    const result = await committeeService.addCommitteeMember({
      committeeId: id,
      user_id: Number(user_id),
      role: role === 'admin' ? 'admin' : 'member',
      duty: duty ?? null,
    });
    if (!result.success) {
      return res.status(400).json(result);
    }
    return res.status(201).json(result);
  } catch (error) {
    logger.error('Error addCommitteeMember:', error);
    return next(error);
  }
};

export const updateCommitteeMember = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id, memberId } = req.params;
    const { role, duty } = req.body;
    const result = await committeeService.updateCommitteeMember({
      committeeId: id,
      memberId,
      role: role ? (role === 'admin' ? 'admin' : 'member') : undefined,
      duty: duty ?? undefined,
    });
    if (!result.success) {
      return res.status(404).json(result);
    }
    return res.json(result);
  } catch (error) {
    logger.error('Error updateCommitteeMember:', error);
    return next(error);
  }
};

export const deleteCommitteeMember = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id, memberId } = req.params;
    const result = await committeeService.deleteCommitteeMember({
      committeeId: id,
      memberId,
    });
    if (!result.success) {
      return res.status(404).json(result);
    }
    return res.json(result);
  } catch (error) {
    logger.error('Error deleteCommitteeMember:', error);
    return next(error);
  }
};

export const getCommitteeMemberUserOptions = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { search, size } = req.query;
    const result = await committeeService.getCommitteeMemberUserOptions({
      search: search as string | undefined,
      size: size as string | undefined,
    });
    return res.json(result);
  } catch (error) {
    logger.error('Error getCommitteeMemberUserOptions:', error);
    return next(error);
  }
};

export const getCommitteePortalContext = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: 'User not authenticated' });
    }
    const result = await committeeService.getCommitteePortalContext(userId);
    return res.json(result);
  } catch (error) {
    logger.error('Error getCommitteePortalContext:', error);
    return next(error);
  }
};

export const getCommitteePortalDashboard = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: 'User not authenticated' });
    }
    const committeeIdRaw = req.query.committee_id as string | undefined;
    const committeeId = committeeIdRaw ? Number(committeeIdRaw) : null;
    const result = await committeeService.getCommitteePortalDashboard({ userId, committeeId });
    return res.json(result);
  } catch (error) {
    logger.error('Error getCommitteePortalDashboard:', error);
    return next(error);
  }
};

export const getCommitteePortalInbox = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: 'User not authenticated' });
    }
    const requestUrl = `${req.protocol}://${req.get('host')}${req.baseUrl}${req.path}`;
    const tab = ((req.query.tab as string) || 'received').toLowerCase() === 'sent' ? 'sent' : 'received';
    const page = req.query.page as string | undefined;
    const size = req.query.size as string | undefined;
    const result = await committeeService.getCommitteePortalInbox({ userId, tab, page, size, requestUrl });
    return res.json(result);
  } catch (error) {
    logger.error('Error getCommitteePortalInbox:', error);
    return next(error);
  }
};

export const getCommitteePortalMeetings = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: 'User not authenticated' });
    }
    const requestUrl = `${req.protocol}://${req.get('host')}${req.baseUrl}${req.path}`;
    const page = req.query.page as string | undefined;
    const size = req.query.size as string | undefined;
    const search = req.query.search as string | undefined;
    const result = await committeeService.getCommitteePortalMeetings({
      userId,
      page,
      size,
      search,
      requestUrl,
    });
    return res.json(result);
  } catch (error) {
    logger.error('Error getCommitteePortalMeetings:', error);
    return next(error);
  }
};

export const getCommitteePortalMeetingById = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: 'User not authenticated' });
    }
    const { id } = req.params;
    const result = await committeeService.getCommitteePortalMeetingById({ userId, id });
    if (!result.success) return res.status(404).json(result);
    return res.json(result);
  } catch (error) {
    logger.error('Error getCommitteePortalMeetingById:', error);
    return next(error);
  }
};

export const createCommitteePortalMeeting = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: 'User not authenticated' });
    }
    const { title, meeting_date, description } = req.body as {
      title?: string;
      meeting_date?: string | null;
      description?: string | null;
    };
    if (!title || String(title).trim() === '') {
      return res.status(400).json({ success: false, message: 'Title is required.' });
    }
    const result = await committeeService.createCommitteePortalMeeting({
      userId,
      title: String(title),
      meeting_date: meeting_date ?? null,
      description: description ?? null,
    });
    if (!result.success) return res.status(403).json(result);
    return res.status(201).json(result);
  } catch (error) {
    logger.error('Error createCommitteePortalMeeting:', error);
    return next(error);
  }
};

export const updateCommitteePortalMeeting = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: 'User not authenticated' });
    }
    const { id } = req.params;
    const { title, meeting_date, description } = req.body as {
      title?: string;
      meeting_date?: string | null;
      description?: string | null;
    };
    if (!title || String(title).trim() === '') {
      return res.status(400).json({ success: false, message: 'Title is required.' });
    }
    const result = await committeeService.updateCommitteePortalMeeting({
      userId,
      id,
      title: String(title),
      meeting_date: meeting_date ?? null,
      description: description ?? null,
    });
    if (!result.success) return res.status(403).json(result);
    return res.json(result);
  } catch (error) {
    logger.error('Error updateCommitteePortalMeeting:', error);
    return next(error);
  }
};

export const deleteCommitteePortalMeeting = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: 'User not authenticated' });
    }
    const { id } = req.params;
    const result = await committeeService.deleteCommitteePortalMeeting({ userId, id });
    if (!result.success) return res.status(403).json(result);
    return res.json(result);
  } catch (error) {
    logger.error('Error deleteCommitteePortalMeeting:', error);
    return next(error);
  }
};

export const getCommitteePortalMeetingAttendance = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: 'User not authenticated' });
    }
    const { id } = req.params;
    const result = await committeeService.getCommitteePortalMeetingAttendance({ userId, id });
    if (!result.success) return res.status(404).json(result);
    return res.json(result);
  } catch (error) {
    logger.error('Error getCommitteePortalMeetingAttendance:', error);
    return next(error);
  }
};

export const saveCommitteePortalMeetingAttendance = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: 'User not authenticated' });
    }
    const { id } = req.params;
    const { attendance } = req.body as {
      attendance?: { user_id: number; status: 'present' | 'absent' | 'excused'; note?: string }[];
    };
    const result = await committeeService.saveCommitteePortalMeetingAttendance({
      userId,
      id,
      attendance: Array.isArray(attendance) ? attendance : [],
    });
    if (!result.success) return res.status(403).json(result);
    return res.json(result);
  } catch (error) {
    logger.error('Error saveCommitteePortalMeetingAttendance:', error);
    return next(error);
  }
};

export const composeCommitteePortalMessage = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: 'User not authenticated' });
    }

    const { title, description, recipient_committees, attachment } = req.body as {
      title?: string;
      description?: string;
      recipient_committees?: number[];
      attachment?: string | null;
    };

    if (!title || !description) {
      return res.status(400).json({ success: false, message: 'Title and description are required.' });
    }
    if (!Array.isArray(recipient_committees) || recipient_committees.length === 0) {
      return res.status(400).json({ success: false, message: 'At least one recipient committee is required.' });
    }

    const result = await committeeService.composeCommitteePortalMessage({
      userId,
      title,
      description,
      recipientCommittees: recipient_committees,
      attachment: attachment ?? null,
    });
    if (!result.success) {
      return res.status(403).json(result);
    }
    return res.status(201).json(result);
  } catch (error) {
    logger.error('Error composeCommitteePortalMessage:', error);
    return next(error);
  }
};

export const getCommitteePortalRecipientOptions = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: 'User not authenticated' });
    }
    const search = req.query.search as string | undefined;
    const result = await committeeService.getCommitteePortalRecipientOptions({ userId, search });
    return res.json(result);
  } catch (error) {
    logger.error('Error getCommitteePortalRecipientOptions:', error);
    return next(error);
  }
};

export const getCommitteePortalPolls = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ success: false, message: 'User not authenticated' });
    const requestUrl = `${req.protocol}://${req.get('host')}${req.baseUrl}${req.path}`;
    const filterRaw = String(req.query.filter || 'active').toLowerCase();
    const filter = filterRaw === 'closed' || filterRaw === 'all' ? filterRaw : 'active';
    const search = req.query.search as string | undefined;
    const page = req.query.page as string | undefined;
    const size = req.query.size as string | undefined;
    const result = await committeeService.getCommitteePortalPolls({
      userId,
      filter: filter as 'active' | 'closed' | 'all',
      search,
      page,
      size,
      requestUrl,
    });
    return res.json(result);
  } catch (error) {
    logger.error('Error getCommitteePortalPolls:', error);
    return next(error);
  }
};

export const getCommitteePortalPollById = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ success: false, message: 'User not authenticated' });
    const { id } = req.params;
    const result = await committeeService.getCommitteePortalPollById({ userId, idOrHash: id });
    if (!result.success) return res.status(404).json(result);
    return res.json(result);
  } catch (error) {
    logger.error('Error getCommitteePortalPollById:', error);
    return next(error);
  }
};

export const createCommitteePortalPoll = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ success: false, message: 'User not authenticated' });
    const { question, description, is_active, allow_multiple, expires_at, options } = req.body as {
      question?: string;
      description?: string | null;
      is_active?: boolean;
      allow_multiple?: boolean;
      expires_at?: string | null;
      options?: string[];
    };
    if (!question || String(question).trim() === '') {
      return res.status(400).json({ success: false, message: 'Question is required.' });
    }
    const result = await committeeService.createCommitteePortalPoll({
      userId,
      question,
      description,
      is_active: is_active !== false,
      allow_multiple: !!allow_multiple,
      expires_at: expires_at ?? null,
      options: Array.isArray(options) ? options : [],
    });
    if (!result.success) return res.status(403).json(result);
    return res.status(201).json(result);
  } catch (error) {
    logger.error('Error createCommitteePortalPoll:', error);
    return res.status(400).json({ success: false, message: getFriendlyPollErrorMessage(error) });
  }
};

export const updateCommitteePortalPoll = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ success: false, message: 'User not authenticated' });
    const { id } = req.params;
    const { question, description, is_active, allow_multiple, expires_at, options } = req.body as {
      question?: string;
      description?: string | null;
      is_active?: boolean;
      allow_multiple?: boolean;
      expires_at?: string | null;
      options?: string[];
    };
    if (!question || String(question).trim() === '') {
      return res.status(400).json({ success: false, message: 'Question is required.' });
    }
    const result = await committeeService.updateCommitteePortalPoll({
      userId,
      idOrHash: id,
      question,
      description,
      is_active: is_active !== false,
      allow_multiple: !!allow_multiple,
      expires_at: expires_at ?? null,
      options: Array.isArray(options) ? options : [],
    });
    if (!result.success) return res.status(403).json(result);
    return res.json(result);
  } catch (error) {
    logger.error('Error updateCommitteePortalPoll:', error);
    return res.status(400).json({ success: false, message: getFriendlyPollErrorMessage(error) });
  }
};

export const deleteCommitteePortalPoll = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ success: false, message: 'User not authenticated' });
    const { id } = req.params;
    const result = await committeeService.deleteCommitteePortalPoll({ userId, idOrHash: id });
    if (!result.success) return res.status(403).json(result);
    return res.json(result);
  } catch (error) {
    logger.error('Error deleteCommitteePortalPoll:', error);
    return res.status(400).json({ success: false, message: getFriendlyPollErrorMessage(error) });
  }
};

export const voteCommitteePortalPoll = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ success: false, message: 'User not authenticated' });
    const { id } = req.params;
    const { option_ids } = req.body as { option_ids?: number[] };
    const result = await committeeService.voteCommitteePortalPoll({
      userId,
      idOrHash: id,
      optionIds: Array.isArray(option_ids) ? option_ids : [],
    });
    if (!result.success) return res.status(400).json(result);
    return res.json(result);
  } catch (error) {
    logger.error('Error voteCommitteePortalPoll:', error);
    return res.status(400).json({ success: false, message: getFriendlyPollErrorMessage(error) });
  }
};
