import { Op } from 'sequelize';
import logger from '../../config/logger';
import { sequelize } from '../../config/database';
import dutyRosterModel from '../models/dutyRoster';
import dutyRosterAssignmentModel from '../models/dutyRosterAssignment';
import userModel from '../models/user-admin';
import dutyTypeModel from '../models/dutyType';
import mehfilDirectoryModel from '../models/mehfil-directories';

const dutyRosterModelInstance = dutyRosterModel(sequelize);
const dutyRosterAssignmentModelInstance = dutyRosterAssignmentModel(sequelize);
const userModelInstance = userModel(sequelize);
const dutyTypeModelInstance = dutyTypeModel(sequelize);
const mehfilDirectoryModelInstance = mehfilDirectoryModel(sequelize);

let associationsInitialized = false;

function initializeAssociations() {
  if (associationsInitialized) return;

  if (!(dutyRosterModelInstance as { associations?: { user?: unknown } }).associations?.user) {
    dutyRosterModelInstance.belongsTo(userModelInstance, {
      foreignKey: 'user_id',
      as: 'user',
    });
  }
  if (
    !(dutyRosterModelInstance as { associations?: { mehfilDirectory?: unknown } }).associations
      ?.mehfilDirectory
  ) {
    dutyRosterModelInstance.belongsTo(mehfilDirectoryModelInstance, {
      foreignKey: 'mehfil_directory_id',
      as: 'mehfilDirectory',
    });
  }
  if (
    !(dutyRosterModelInstance as { associations?: { assignments?: unknown } }).associations
      ?.assignments
  ) {
    dutyRosterModelInstance.hasMany(dutyRosterAssignmentModelInstance, {
      foreignKey: 'duty_roster_id',
      as: 'assignments',
      onDelete: 'CASCADE',
    });
  }
  if (
    !(dutyRosterAssignmentModelInstance as { associations?: { dutyType?: unknown } }).associations
      ?.dutyType
  ) {
    dutyRosterAssignmentModelInstance.belongsTo(dutyTypeModelInstance, {
      foreignKey: 'duty_type_id',
      as: 'dutyType',
    });
  }
  if (
    !(dutyRosterAssignmentModelInstance as { associations?: { dutyRoster?: unknown } })
      .associations?.dutyRoster
  ) {
    dutyRosterAssignmentModelInstance.belongsTo(dutyRosterModelInstance, {
      foreignKey: 'duty_roster_id',
      as: 'dutyRoster',
      onDelete: 'CASCADE',
    });
  }
  associationsInitialized = true;
}

const DAYS = [
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
  'sunday',
];

export const getAllDutyRosters = async ({
  zoneId = null,
  mehfilDirectoryId = null,
  userTypeFilter = 'karkun',
  search = '',
}: {
  zoneId?: string | number | null;
  mehfilDirectoryId?: string | number | null;
  userTypeFilter?: string;
  search?: string;
}) => {
  try {
    initializeAssociations();

    const parsedZoneId =
      zoneId != null && zoneId !== '' ? Number(zoneId) : null;
    if (parsedZoneId == null || Number.isNaN(parsedZoneId)) {
      return { success: true, showTable: false, data: [] };
    }

    const parsedMehfilId =
      mehfilDirectoryId != null && mehfilDirectoryId !== ''
        ? Number(mehfilDirectoryId)
        : null;
    const effectiveMehfilId =
      parsedMehfilId != null && !Number.isNaN(parsedMehfilId) ? parsedMehfilId : null;
    const trimmedSearch = (search && String(search).trim()) || '';

    const rosterWhere: Record<string, unknown> = { zone_id: parsedZoneId };
    if (effectiveMehfilId != null) {
      rosterWhere.mehfil_directory_id = effectiveMehfilId;
    }

    const userWhere: Record<string, unknown> = { user_type: userTypeFilter || 'karkun' };
    if (trimmedSearch) {
      const pattern = `%${trimmedSearch}%`;
      (userWhere as Record<string, unknown>)[Op.or as unknown as string] = [
        { name: { [Op.like]: pattern } },
        { email: { [Op.like]: pattern } },
        { phone_number: { [Op.like]: pattern } },
      ];
    }

    if (effectiveMehfilId != null) {
      const rosters = await dutyRosterModelInstance.findAll({
        where: rosterWhere,
        include: [
          { model: userModelInstance, as: 'user', where: userWhere, required: true },
          { model: mehfilDirectoryModelInstance, as: 'mehfilDirectory', required: false },
          {
            model: dutyRosterAssignmentModelInstance,
            as: 'assignments',
            include: [{ model: dutyTypeModelInstance, as: 'dutyType' }],
            required: false,
          },
        ],
        order: [['id', 'ASC']],
      });

      const data = (rosters as unknown as { assignments?: { day: string; id: number; duty_type_id: number; dutyType: unknown }[]; id: number; mehfil_directory_id: number; user_id: number; user: unknown; mehfilDirectory: unknown }[]).map((roster) => {
        const duties: Record<string, { id: number; duty_type_id: number; duty_type: unknown }[]> = {};
        DAYS.forEach((day) => {
          duties[day] = (roster.assignments || [])
            .filter((a) => a.day === day)
            .map((a) => ({
              id: a.id,
              duty_type_id: a.duty_type_id,
              duty_type: a.dutyType,
            }));
        });
        return {
          roster_id: roster.id,
          mehfil_directory_id: roster.mehfil_directory_id,
          user_id: roster.user_id,
          user: roster.user,
          mehfil_directory: roster.mehfilDirectory,
          duties,
        };
      });
      return { success: true, showTable: true, data };
    }

    const rosters = await dutyRosterModelInstance.findAll({
      where: rosterWhere,
      include: [
        { model: userModelInstance, as: 'user', where: userWhere, required: true },
        { model: mehfilDirectoryModelInstance, as: 'mehfilDirectory', required: false },
        {
          model: dutyRosterAssignmentModelInstance,
          as: 'assignments',
          include: [{ model: dutyTypeModelInstance, as: 'dutyType' }],
          required: true,
        },
      ],
      order: [['id', 'ASC']],
    });

    const userRostersMap = new Map<
      number,
      {
        user_id: number;
        user: unknown;
        duties: Record<
          string,
          { id: number; duty_type_id: number; duty_type: unknown; mehfil?: unknown }[]
        >;
      }
    >();
    (
      rosters as unknown as {
        user_id: number;
        user: unknown;
        assignments?: { day: string; id: number; duty_type_id: number; dutyType: unknown }[];
        mehfilDirectory?: unknown;
      }[]
    ).forEach((roster) => {
      const userId = roster.user_id;
      if (!userRostersMap.has(userId)) {
        userRostersMap.set(userId, {
          user_id: userId,
          user: roster.user,
          duties: {},
        });
      }
      const consolidated = userRostersMap.get(userId)!;
      DAYS.forEach((day) => {
        if (!consolidated.duties[day]) consolidated.duties[day] = [];
        (roster.assignments || [])
          .filter((a) => a.day === day)
          .forEach((a) => {
            consolidated.duties[day].push({
              id: a.id,
              duty_type_id: a.duty_type_id,
              duty_type: a.dutyType,
              mehfil: roster.mehfilDirectory,
            });
          });
      });
    });

    const data = Array.from(userRostersMap.values());
    return { success: true, showTable: true, data };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    logger.error(`Error fetching duty rosters: ${message}`, {
      stack: error instanceof Error ? error.stack : undefined,
    });
    throw error;
  }
};

export const getDutyRosterById = async (id: string) => {
  try {
    initializeAssociations();
    const dutyRoster = await dutyRosterModelInstance.findByPk(id, {
      include: [
        { model: userModelInstance, as: 'user' },
        {
          model: dutyRosterAssignmentModelInstance,
          as: 'assignments',
          include: [{ model: dutyTypeModelInstance, as: 'dutyType' }],
        },
      ],
    });
    if (!dutyRoster) {
      throw new Error('Duty roster not found');
    }
    return dutyRoster;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    logger.error(`Error fetching duty roster: ${message}`);
    throw error;
  }
};

export const createDutyRoster = async (data: {
  user_id: number;
  zone_id?: number;
  mehfil_directory_id?: number;
  created_by?: number;
  duties?: Record<string, number>;
}) => {
  try {
    initializeAssociations();
    const { user_id, zone_id, mehfil_directory_id, created_by, duties } = data;

    if (!mehfil_directory_id) {
      throw new Error('Please select a mehfil first.');
    }

    const existing = await dutyRosterModelInstance.findOne({
      where: { user_id, mehfil_directory_id },
    });
    if (existing) {
      throw new Error('Karkun is already in the roster.');
    }

    const dutyRoster = await dutyRosterModelInstance.create({
      user_id,
      zone_id,
      mehfil_directory_id,
      created_by,
      created_at: new Date(),
    } as Parameters<typeof dutyRosterModelInstance.create>[0]);

    if (duties && Object.keys(duties).length > 0) {
      const assignmentsToCreate: { duty_roster_id: number; duty_type_id: number; day: string; created_at: Date }[] = [];
      const rosterId = (dutyRoster as unknown as { id: number }).id;
      for (const [day, dutyTypeId] of Object.entries(duties)) {
        if (dutyTypeId) {
          assignmentsToCreate.push({
            duty_roster_id: rosterId as number,
            duty_type_id: dutyTypeId,
            day,
            created_at: new Date(),
          });
        }
      }
      if (assignmentsToCreate.length > 0) {
        await dutyRosterAssignmentModelInstance.bulkCreate(
          assignmentsToCreate as Parameters<typeof dutyRosterAssignmentModelInstance.bulkCreate>[0],
        );
      }
    }

    return dutyRoster;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    logger.error(`Error creating duty roster: ${message}`);
    throw error;
  }
};

export const updateDutyRoster = async (
  id: string,
  data: {
    user_id?: number;
    zone_id?: number;
    mehfil_directory_id?: number;
    updated_by?: number;
  },
) => {
  try {
    initializeAssociations();
    const dutyRoster = await dutyRosterModelInstance.findByPk(id);
    if (!dutyRoster) {
      throw new Error('Duty roster not found');
    }
    await dutyRoster.update({
      ...data,
      updated_at: new Date(),
    } as Parameters<typeof dutyRoster.update>[0]);
    return dutyRoster;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    logger.error(`Error updating duty roster: ${message}`);
    throw error;
  }
};

export const deleteDutyRoster = async (id: string) => {
  try {
    initializeAssociations();
    const dutyRoster = await dutyRosterModelInstance.findByPk(id);
    if (!dutyRoster) {
      throw new Error('Duty roster not found');
    }
    await dutyRoster.destroy();
    return { success: true, message: 'Duty roster deleted successfully' };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    logger.error(`Error deleting duty roster: ${message}`);
    throw error;
  }
};

export const getDutyRosterByKarkun = async (userId: string) => {
  try {
    initializeAssociations();
    const dutyRosters = await dutyRosterModelInstance.findAll({
      where: { user_id: userId },
      include: [
        {
          model: dutyRosterAssignmentModelInstance,
          as: 'assignments',
          include: [{ model: dutyTypeModelInstance, as: 'dutyType' }],
        },
      ],
      order: [['created_at', 'DESC']],
    });
    return dutyRosters;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    logger.error(`Error fetching duty roster by user: ${message}`);
    throw error;
  }
};

export const getAvailableKarkuns = async ({
  zoneId,
  mehfilDirectoryId = null,
  userTypeFilter = 'karkun',
  search = '',
}: {
  zoneId?: string | number | null;
  mehfilDirectoryId?: string | number | null;
  userTypeFilter?: string;
  search?: string;
}) => {
  try {
    initializeAssociations();
    if (!zoneId) return [];

    const parsedZoneId = Number(zoneId);
    if (Number.isNaN(parsedZoneId)) {
      throw new Error('Invalid zoneId provided');
    }

    const parsedMehfilIdRaw =
      typeof mehfilDirectoryId !== 'undefined' && mehfilDirectoryId !== null
        ? Number(mehfilDirectoryId)
        : null;
    const parsedMehfilId =
      parsedMehfilIdRaw !== null && !Number.isNaN(parsedMehfilIdRaw) ? parsedMehfilIdRaw : null;

    const whereClause: Record<string, unknown> = {
      zone_id: parsedZoneId,
      is_super_admin: false,
    };
    if (userTypeFilter) {
      whereClause.user_type = userTypeFilter;
    }
    if (userTypeFilter === 'karkun') {
      if (!parsedMehfilId) return [];
      whereClause.mehfil_directory_id = parsedMehfilId;
      whereClause.is_mehfil_admin = false;
      whereClause.is_zone_admin = false;
      whereClause.is_region_admin = false;
      whereClause.is_all_region_admin = false;
    } else if (parsedMehfilId) {
      whereClause.mehfil_directory_id = parsedMehfilId;
    }

    const trimmedSearch = search ? String(search).trim() : '';
    if (trimmedSearch) {
      (whereClause as Record<string, unknown>)[Op.or as unknown as string] = [
        { name: { [Op.like]: `%${trimmedSearch}%` } },
        { email: { [Op.like]: `%${trimmedSearch}%` } },
        { phone_number: { [Op.like]: `%${trimmedSearch}%` } },
      ];
    }

    const karkuns = await userModelInstance.findAll({
      where: whereClause,
      order: [
        ['name', 'ASC'],
        ['id', 'ASC'],
      ],
      attributes: [
        'id',
        'name',
        'father_name',
        'email',
        'phone_number',
        'user_type',
        'zone_id',
        'mehfil_directory_id',
        'avatar',
      ],
    });
    return karkuns;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    logger.error(`Error fetching available karkuns: ${message}`);
    throw error;
  }
};
