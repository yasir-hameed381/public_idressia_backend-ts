import logger from '../../config/logger';
import { Op, literal } from 'sequelize';
import { sequelize } from '../../config/database';
import userAdminModel from '../models/user-admin';
import zoneModel from '../models/zone';
import mehfilDirectoryModel from '../models/mehfil-directories';
import mehfilReportsModel from '../models/mehfilReports';
import newEhadKarkunModel from '../models/newEhadKarkun';
import tabarukatModel from '../models/tabarukat';
import ehadKarkunModel from '../models/ehadKarkun';

const userModelInstance = userAdminModel(sequelize);
const zonesModelInstance = zoneModel(sequelize);
const mehfilDirectoryModelInstance = mehfilDirectoryModel(sequelize);
const mehfilReportsModelInstance = mehfilReportsModel(sequelize);
const newEhadModelInstance = newEhadKarkunModel(sequelize);
const tabarukatModelInstance = tabarukatModel(sequelize);
const ehadKarkunModelInstance = ehadKarkunModel(sequelize);

type DashboardUser = {
  is_super_admin?: boolean;
  is_all_region_admin?: boolean;
  is_region_admin?: boolean;
  is_zone_admin?: boolean;
  zone_id?: number | null;
  region_id?: number | null;
  mehfil_directory_id?: number | null;
};

export const getZonesForUser = async (user: DashboardUser) => {
  try {
    const where: Record<string, unknown> = {};
    if (user.is_all_region_admin === true) {
      // No filter - return all zones
    } else if (user.is_region_admin === true && user.region_id) {
      where.region_id = user.region_id;
    } else if ((user.is_zone_admin === true || user.zone_id) && user.zone_id) {
      where.id = user.zone_id;
    } else if (user.zone_id) {
      where.id = user.zone_id;
    } else {
      return [];
    }
    const queryOptions: {
      order: [string, string][];
      attributes: string[];
      where?: Record<string, unknown>;
    } = {
      order: [['title_en', 'ASC']],
      attributes: ['id', 'title_en', 'city_en', 'country_en', 'region_id'],
    };
    if (Object.keys(where).length > 0) queryOptions.where = where;
    const zones = await zonesModelInstance.findAll(queryOptions);
    return zones;
  } catch (error) {
    logger.error('Error getZonesForUser:', error);
    throw error;
  }
};

export const getMehfilsForZone = async (zoneId: number) => {
  try {
    if (!zoneId) return [];
    const mehfils = await mehfilDirectoryModelInstance.findAll({
      where: { zone_id: zoneId, is_published: 1 },
      order: [['mehfil_number', 'ASC']],
      attributes: [
        'id',
        'mehfil_number',
        'name_en',
        'address_en',
        'zimdar_bhai',
        'zimdar_bhai_phone_number',
      ],
    });
    return mehfils;
  } catch (error) {
    logger.error('Error getMehfilsForZone:', error);
    throw error;
  }
};

async function calculateBasicStats(filters: {
  selectedMonth: number;
  selectedYear: number;
  selectedZoneId: number | null;
  selectedMehfilId: number | null;
}) {
  const { selectedMonth, selectedYear, selectedZoneId, selectedMehfilId } = filters;
  const userWhere: Record<string, unknown> = { is_super_admin: false };
  const ehadKarkunWhere: Record<string, unknown> = {};
  const newEhadWhere: Record<string, unknown> = {};
  const tabarukatWhere: Record<string, unknown> = {};

  if (selectedZoneId) {
    userWhere.zone_id = selectedZoneId;
    ehadKarkunWhere.zone_id = selectedZoneId;
    newEhadWhere.zone_id = selectedZoneId;
    tabarukatWhere.zone_id = selectedZoneId;
  }
  if (selectedMehfilId) {
    userWhere.mehfil_directory_id = selectedMehfilId;
    newEhadWhere.mehfil_directory_id = selectedMehfilId;
    tabarukatWhere.mehfil_directory_id = selectedMehfilId;
  }

  const totalKarkuns = await userModelInstance.count({
    where: { ...userWhere, user_type: 'Karkun' } as Record<string, unknown>,
  });

  const ehadKarkuns = await ehadKarkunModelInstance.count({
    where: ehadKarkunWhere,
  });

  const totalNewEhads = await newEhadModelInstance.count({
    where: {
      ...newEhadWhere,
      [Op.and]: [
        literal(`MONTH(created_at) = ${selectedMonth}`),
        literal(`YEAR(created_at) = ${selectedYear}`),
      ],
    } as Record<string, unknown>,
  });

  const totalTabarukats = await tabarukatModelInstance.count({
    where: {
      ...tabarukatWhere,
      [Op.and]: [
        literal(`MONTH(created_at) = ${selectedMonth}`),
        literal(`YEAR(created_at) = ${selectedYear}`),
      ],
    } as Record<string, unknown>,
  });

  return { totalKarkuns, ehadKarkuns, totalNewEhads, totalTabarukats };
}

async function calculateZoneAdminStats(filters: {
  selectedMonth: number;
  selectedYear: number;
  selectedZoneId: number | null;
}) {
  const { selectedMonth, selectedYear, selectedZoneId } = filters;
  if (!selectedZoneId) {
    return {
      totalMehfils: 0,
      mehfilsWithReports: 0,
      mehfilsWithoutReports: 0,
      reportSubmissionRate: 0,
      mehfilsWithReportsList: [],
      mehfilsWithoutReportsList: [],
    };
  }

  const allMehfils = await mehfilDirectoryModelInstance.findAll({
    where: { zone_id: selectedZoneId, is_published: 1 },
  });
  const totalMehfils = allMehfils.length;

  const reportsInMonth = await mehfilReportsModelInstance.findAll({
    where: {
      zone_id: selectedZoneId,
      report_month: selectedMonth,
      report_year: selectedYear,
    },
    attributes: [
      'mehfil_directory_id',
      'coordinator_name',
      'total_duty_karkuns',
      'mehfil_days_in_month',
      'created_at',
    ],
  });

  const mehfilsWithReportsIds = [...new Set(reportsInMonth.map((r) => r.get('mehfil_directory_id') as number))];

  const mehfilsWithReportsList = (
    await Promise.all(
      mehfilsWithReportsIds.map(async (mehfilId) => {
        const mehfil = allMehfils.find((m) => (m.get('id') as number) === mehfilId);
        const report = reportsInMonth.find((r) => (r.get('mehfil_directory_id') as number) === mehfilId);
        if (!mehfil) return null;
        return {
          id: mehfil.get('id') as number,
          mehfil_number: mehfil.get('mehfil_number') as string,
          name: mehfil.get('name_en') as string,
          address: mehfil.get('address_en') as string,
          submitted_at: report ? new Date((report.get('created_at') as Date).getTime()).toISOString() : null,
          coordinator_name: (report?.get('coordinator_name') as string) || null,
          total_duty_karkuns: (report?.get('total_duty_karkuns') as number) || 0,
          mehfil_days_in_month: (report?.get('mehfil_days_in_month') as number) || 0,
        };
      }),
    )
  ).filter(Boolean) as {
    id: number;
    mehfil_number: string;
    name: string;
    address: string;
    submitted_at: string | null;
    coordinator_name: string | null;
    total_duty_karkuns: number;
    mehfil_days_in_month: number;
  }[];

  const mehfilsWithoutReportsIds = allMehfils
    .filter((m) => !mehfilsWithReportsIds.includes(m.get('id') as number))
    .map((m) => m.get('id') as number);

  const mehfilsWithoutReportsList = (
    await Promise.all(
      mehfilsWithoutReportsIds.map(async (mehfilId) => {
        const mehfil = allMehfils.find((m) => (m.get('id') as number) === mehfilId);
        if (!mehfil) return null;
        const lastReport = await mehfilReportsModelInstance.findOne({
          where: { mehfil_directory_id: mehfilId },
          order: [['created_at', 'DESC']],
          attributes: ['report_month', 'report_year'],
        });
        return {
          id: mehfil.get('id') as number,
          mehfil_number: mehfil.get('mehfil_number') as string,
          name: mehfil.get('name_en') as string,
          address: mehfil.get('address_en') as string,
          zimdar_bhai_name: (mehfil.get('zimdar_bhai') as string) || null,
          zimdar_bhai_phone: (mehfil.get('zimdar_bhai_phone_number') as string) || null,
          last_report: lastReport
            ? `${lastReport.get('report_month')}/${lastReport.get('report_year')}`
            : 'Never',
        };
      }),
    )
  ).filter(Boolean) as {
    id: number;
    mehfil_number: string;
    name: string;
    address: string;
    zimdar_bhai_name: string | null;
    zimdar_bhai_phone: string | null;
    last_report: string;
  }[];

  const mehfilsWithReports = mehfilsWithReportsIds.length;
  const mehfilsWithoutReports = totalMehfils - mehfilsWithReports;
  const reportSubmissionRate =
    totalMehfils > 0 ? Math.round((mehfilsWithReports / totalMehfils) * 1000) / 10 : 0;

  return {
    totalMehfils,
    mehfilsWithReports,
    mehfilsWithoutReports,
    reportSubmissionRate,
    mehfilsWithReportsList,
    mehfilsWithoutReportsList,
  };
}

async function calculateMehfilAdminStats(
  filters: { selectedMonth: number; selectedYear: number },
  user: DashboardUser,
) {
  const { selectedMonth, selectedYear } = filters;
  const mehfilDirectoryId = user.mehfil_directory_id;
  if (!mehfilDirectoryId) {
    return { hasSubmittedReport: false, monthlyAttendanceDays: 0, totalDutyKarkuns: 0 };
  }

  const report = await mehfilReportsModelInstance.findOne({
    where: {
      mehfil_directory_id: mehfilDirectoryId,
      report_month: selectedMonth,
      report_year: selectedYear,
    },
  });

  return {
    hasSubmittedReport: !!report,
    monthlyAttendanceDays: (report?.get('coordinator_monthly_attendance_days') as number) || 0,
    totalDutyKarkuns: (report?.get('total_duty_karkuns') as number) || 0,
  };
}

async function calculateRegionAdminStats(
  filters: { selectedMonth: number; selectedYear: number },
  user: DashboardUser,
) {
  const { selectedMonth, selectedYear } = filters;
  const zones = await getZonesForUser(user);
  const totalZones = zones.length;

  const zoneReportStats = await Promise.all(
    zones.map(async (zone) => {
      const zoneId = zone.get('id') as number;
      const totalMehfils = await mehfilDirectoryModelInstance.count({
        where: { zone_id: zoneId, is_published: 1 },
      });
      const karkun = await userModelInstance.count({
        where: { zone_id: zoneId, user_type: 'Karkun' },
      });
      const ehadKarkun = await ehadKarkunModelInstance.count({
        where: { zone_id: zoneId },
      });
      const tabarukats = await tabarukatModelInstance.count({
        where: { zone_id: zoneId },
      });
      const newEhad = await newEhadModelInstance.count({
        where: {
          zone_id: zoneId,
          [Op.and]: [
            literal(`MONTH(created_at) = ${selectedMonth}`),
            literal(`YEAR(created_at) = ${selectedYear}`),
          ],
        } as Record<string, unknown>,
      });
      const reportsRows = await mehfilReportsModelInstance.findAll({
        where: {
          zone_id: zoneId,
          report_month: selectedMonth,
          report_year: selectedYear,
        },
        attributes: ['mehfil_directory_id'],
      });
      const reportsSubmitted = new Set(reportsRows.map((r) => r.get('mehfil_directory_id'))).size;
      const submissionRate =
        totalMehfils > 0 ? Math.round((reportsSubmitted / totalMehfils) * 1000) / 10 : 0;
      return {
        zone_id: zoneId,
        zone_name: zone.get('title_en') as string,
        total_mehfils: totalMehfils,
        karkun,
        ehad_karkun: ehadKarkun,
        tabarukats,
        new_ehad: newEhad,
        reports_submitted: reportsSubmitted,
        submission_rate: submissionRate,
      };
    }),
  );

  return { totalZones, zonesWithReports: 0, zoneReportStats };
}

export const getDashboardStats = async (
  filters: {
    selectedMonth: number;
    selectedYear: number;
    selectedZoneId: number | null;
    selectedMehfilId: number | null;
  },
  user: DashboardUser,
) => {
  try {
    const { selectedZoneId, selectedMehfilId } = filters;

    const basicStats = await calculateBasicStats(filters);
    const zoneStats = await calculateZoneAdminStats(filters);
    const mehfilStats = await calculateMehfilAdminStats(filters, user);
    const regionStats = await calculateRegionAdminStats(filters, user);

    const zones = await getZonesForUser(user);
    const mehfils = selectedZoneId ? await getMehfilsForZone(selectedZoneId) : [];

    let mehfilDirectory: Record<string, unknown> | null = null;
    if (selectedMehfilId) {
      try {
        const mehfil = await mehfilDirectoryModelInstance.findByPk(String(selectedMehfilId), {
          attributes: [
            'id',
            'mehfil_number',
            'name_en',
            'name_ur',
            'address_en',
            'address_ur',
            'zimdar_bhai',
            'zimdar_bhai_phone_number',
            'zone_id',
            'is_published',
          ],
        });
        if (mehfil) {
          mehfilDirectory = {
            id: mehfil.get('id'),
            mehfil_number: mehfil.get('mehfil_number'),
            name_en: mehfil.get('name_en'),
            name_ur: mehfil.get('name_ur'),
            address_en: mehfil.get('address_en'),
            address_ur: mehfil.get('address_ur'),
            zimdar_bhai: mehfil.get('zimdar_bhai'),
            zimdar_bhai_phone_number: mehfil.get('zimdar_bhai_phone_number'),
            zone_id: mehfil.get('zone_id'),
            is_published: mehfil.get('is_published'),
          };
        }
      } catch {
        mehfilDirectory = null;
      }
    }

    return {
      ...basicStats,
      ...zoneStats,
      ...mehfilStats,
      ...regionStats,
      zones,
      mehfils,
      mehfil_directory: selectedMehfilId ? mehfilDirectory : undefined,
    };
  } catch (error) {
    logger.error('Error getting dashboard stats:', error);
    throw error;
  }
};

export const getOverallTotals = async () => {
  try {
    const totalKarkunans = await userModelInstance.count({
      where: { user_type: 'Karkun' },
    });
    const totalEhadKarkuns = await ehadKarkunModelInstance.count();
    const totalMehfils = await mehfilDirectoryModelInstance.count({
      where: { is_published: 1 },
    });
    const totalZones = await zonesModelInstance.count();
    const totalMehfilReports = await mehfilReportsModelInstance.count();

    return {
      totalKarkunans,
      totalEhadKarkuns,
      totalMehfils,
      totalZones,
      totalMehfilReports,
      totalDutyTypes: 0,
      totalCoordinators: 0,
    };
  } catch (error) {
    logger.error('Error getting overall totals:', error);
    throw error;
  }
};
