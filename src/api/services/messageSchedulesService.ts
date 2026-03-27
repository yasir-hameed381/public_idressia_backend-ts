import logger from '../../config/logger';
import { sequelize } from '../../config/database';
import messageSchedulesModel from '../models/messageSchedules';
import messagesModel from '../models/messages';
import userModel from '../models/user-admin';
import { paginate, constructPagination } from './utilityServices';

const messageSchedulesModelInstance = messageSchedulesModel(sequelize);
const messagesModelInstance = messagesModel(sequelize);
const usersModelInstance = userModel(sequelize);

let associationsInitialized = false;

function initializeAssociations() {
  if (associationsInitialized) return;
  const ms = messageSchedulesModelInstance as { associations?: { message?: unknown; createdBy?: unknown; updatedBy?: unknown } };
  if (!ms.associations?.message) {
    messageSchedulesModelInstance.belongsTo(messagesModelInstance, {
      foreignKey: 'message_id',
      as: 'message',
      onDelete: 'CASCADE',
    });
  }
  if (!ms.associations?.createdBy) {
    messageSchedulesModelInstance.belongsTo(usersModelInstance, {
      foreignKey: 'created_by',
      as: 'createdBy',
      onDelete: 'SET NULL',
    });
  }
  if (!ms.associations?.updatedBy) {
    messageSchedulesModelInstance.belongsTo(usersModelInstance, {
      foreignKey: 'updated_by',
      as: 'updatedBy',
      onDelete: 'SET NULL',
    });
  }
  associationsInitialized = true;
}

function calculateNextRunTime(
  scheduledAt: Date,
  repeat: string,
  dayFlags: Record<string, boolean>,
): Date | null {
  if (repeat === 'no-repeat') return null;
  const now = new Date();
  const nextRun = new Date(scheduledAt);
  switch (repeat) {
    case 'daily':
      nextRun.setDate(nextRun.getDate() + 1);
      break;
    case 'weekly': {
      const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
      const currentDay = now.getDay();
      let daysToAdd = 0;
      for (let i = 1; i <= 7; i++) {
        const checkDay = (currentDay + i) % 7;
        const dayName = days[checkDay];
        if (dayFlags[dayName]) {
          daysToAdd = i;
          break;
        }
      }
      if (daysToAdd === 0) {
        for (let i = 0; i < 7; i++) {
          const dayName = days[i];
          if (dayFlags[dayName]) {
            daysToAdd = (i - currentDay + 7) % 7 || 7;
            break;
          }
        }
      }
      nextRun.setDate(nextRun.getDate() + daysToAdd);
      break;
    }
    case 'monthly':
      nextRun.setMonth(nextRun.getMonth() + 1);
      break;
    case 'yearly':
      nextRun.setFullYear(nextRun.getFullYear() + 1);
      break;
    default:
      return null;
  }
  return nextRun;
}

export const createMessageSchedule = async (payload: {
  message_id: number;
  scheduled_date: string;
  scheduled_time: string;
  repeat?: string;
  monday?: boolean;
  tuesday?: boolean;
  wednesday?: boolean;
  thursday?: boolean;
  friday?: boolean;
  saturday?: boolean;
  sunday?: boolean;
  is_active?: boolean;
  send_to_mobile_devices?: boolean;
  created_by?: number | null;
  updated_by?: number | null;
}) => {
  try {
    const message = await messagesModelInstance.findByPk(String(payload.message_id));
    if (!message) throw new Error('Message not found');

    const scheduledAt = new Date(`${payload.scheduled_date}T${payload.scheduled_time}`);
    const dayFlags = {
      monday: payload.monday ?? false,
      tuesday: payload.tuesday ?? false,
      wednesday: payload.wednesday ?? false,
      thursday: payload.thursday ?? false,
      friday: payload.friday ?? false,
      saturday: payload.saturday ?? false,
      sunday: payload.sunday ?? false,
    };
    const nextRunAt = calculateNextRunTime(
      scheduledAt,
      payload.repeat || 'no-repeat',
      dayFlags,
    );

    const scheduleData = {
      message_id: payload.message_id,
      scheduled_at: scheduledAt,
      repeat: payload.repeat || 'no-repeat',
      monday: dayFlags.monday,
      tuesday: dayFlags.tuesday,
      wednesday: dayFlags.wednesday,
      thursday: dayFlags.thursday,
      friday: dayFlags.friday,
      saturday: dayFlags.saturday,
      sunday: dayFlags.sunday,
      is_active: payload.is_active !== undefined ? payload.is_active : true,
      send_to_mobile_devices: payload.send_to_mobile_devices ?? false,
      next_run_at: nextRunAt || scheduledAt,
      created_at: new Date(),
      updated_at: new Date(),
      created_by: payload.created_by ?? null,
      updated_by: payload.updated_by ?? null,
    };

    const newSchedule = await messageSchedulesModelInstance.create(
      scheduleData as Parameters<typeof messageSchedulesModelInstance.create>[0],
    );
    return newSchedule;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    logger.error('Error creating message schedule: ' + message);
    throw error;
  }
};

export const getMessageSchedules = async ({
  page = 1,
  size = 25,
  message_id,
  requestUrl = '',
}: {
  page?: number | string;
  size?: number | string;
  message_id?: string | number;
  requestUrl?: string;
}) => {
  try {
    initializeAssociations();
    const { offset, limit, currentPage } = paginate({ page, size });
    const where: Record<string, unknown> = {};
    if (message_id) where.message_id = message_id;

    const { count, rows: data } = await messageSchedulesModelInstance.findAndCountAll({
      where,
      offset,
      limit,
      order: [['next_run_at', 'ASC']],
      include: [
        {
          model: messagesModelInstance,
          as: 'message',
          attributes: ['id', 'title_en', 'title_ur', 'description_en', 'description_ur', 'is_published'],
          required: false,
        },
        {
          model: usersModelInstance,
          as: 'createdBy',
          attributes: ['id', 'name', 'email'],
          required: false,
        },
        {
          model: usersModelInstance,
          as: 'updatedBy',
          attributes: ['id', 'name', 'email'],
          required: false,
        },
      ],
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
    const message = error instanceof Error ? error.message : String(error);
    logger.error('Error fetching message schedules: ' + message);
    throw error;
  }
};

export const getMessageScheduleById = async (id: string) => {
  try {
    initializeAssociations();
    const schedule = await messageSchedulesModelInstance.findByPk(id, {
      include: [
        {
          model: messagesModelInstance,
          as: 'message',
          attributes: ['id', 'title_en', 'title_ur', 'description_en', 'description_ur', 'is_published'],
          required: false,
        },
        {
          model: usersModelInstance,
          as: 'createdBy',
          attributes: ['id', 'name', 'email'],
          required: false,
        },
        {
          model: usersModelInstance,
          as: 'updatedBy',
          attributes: ['id', 'name', 'email'],
          required: false,
        },
      ],
    });
    if (!schedule) throw new Error('Message schedule not found');
    return schedule;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    logger.error('Error fetching message schedule by id: ' + message);
    throw error;
  }
};

export const updateMessageSchedule = async (
  id: string,
  payload: Partial<{
    scheduled_date: string;
    scheduled_time: string;
    repeat: string;
    monday: boolean;
    tuesday: boolean;
    wednesday: boolean;
    thursday: boolean;
    friday: boolean;
    saturday: boolean;
    sunday: boolean;
    is_active: boolean;
    send_to_mobile_devices: boolean;
    updated_by: number | null;
  }>,
) => {
  try {
    const schedule = await messageSchedulesModelInstance.findByPk(id);
    if (!schedule) throw new Error('Message schedule not found');

    let scheduledAt = schedule.get('scheduled_at') as Date;
    if (payload.scheduled_date && payload.scheduled_time) {
      scheduledAt = new Date(`${payload.scheduled_date}T${payload.scheduled_time}`);
    }

    const dayFlags = {
      monday: payload.monday !== undefined ? payload.monday : (schedule.get('monday') as boolean),
      tuesday: payload.tuesday !== undefined ? payload.tuesday : (schedule.get('tuesday') as boolean),
      wednesday: payload.wednesday !== undefined ? payload.wednesday : (schedule.get('wednesday') as boolean),
      thursday: payload.thursday !== undefined ? payload.thursday : (schedule.get('thursday') as boolean),
      friday: payload.friday !== undefined ? payload.friday : (schedule.get('friday') as boolean),
      saturday: payload.saturday !== undefined ? payload.saturday : (schedule.get('saturday') as boolean),
      sunday: payload.sunday !== undefined ? payload.sunday : (schedule.get('sunday') as boolean),
    };
    const repeat = payload.repeat !== undefined ? payload.repeat : (schedule.get('repeat') as string);
    const nextRunAt = calculateNextRunTime(scheduledAt, repeat, dayFlags);

    await schedule.update({
      scheduled_at: scheduledAt,
      repeat,
      ...dayFlags,
      is_active: payload.is_active !== undefined ? payload.is_active : (schedule.get('is_active') as boolean),
      send_to_mobile_devices:
        payload.send_to_mobile_devices !== undefined
          ? payload.send_to_mobile_devices
          : (schedule.get('send_to_mobile_devices') as boolean),
      next_run_at: nextRunAt || scheduledAt,
      updated_at: new Date(),
      updated_by: payload.updated_by !== undefined ? payload.updated_by : (schedule.get('updated_by') as number | null),
    } as Parameters<typeof schedule.update>[0]);
    return schedule;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    logger.error('Error updating message schedule: ' + message);
    throw error;
  }
};

export const deleteMessageSchedule = async (id: string) => {
  try {
    const deletedRows = await messageSchedulesModelInstance.destroy({ where: { id } });
    if (deletedRows === 0) throw new Error('Message schedule not found');
    return { message: 'Message schedule deleted successfully' };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    logger.error('Error deleting message schedule: ' + message);
    throw error;
  }
};
