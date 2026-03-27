import logger from '../../config/logger';
import { Op } from 'sequelize';
import { sequelize } from '../../config/database';
import dutyRosterAssignmentModel from '../models/dutyRosterAssignment';
import dutyTypeModel from '../models/dutyType';
import dutyRosterModel from '../models/dutyRoster';

const assignmentModel = dutyRosterAssignmentModel(sequelize);
const dutyTypeModelInstance = dutyTypeModel(sequelize);
const dutyRosterModelInstance = dutyRosterModel(sequelize);

// Ensure association for include
if (!(assignmentModel as { associations?: { dutyType?: unknown } }).associations?.dutyType) {
  assignmentModel.belongsTo(dutyTypeModelInstance, {
    foreignKey: 'duty_type_id',
    as: 'dutyType',
  });
}

export const createAssignment = async (data: {
  duty_roster_id: number;
  duty_type_id: number;
  day: string;
}) => {
  try {
    const { duty_roster_id, duty_type_id, day } = data;
    const dayLower = day.toLowerCase();

    const existing = await assignmentModel.findOne({
      where: {
        duty_roster_id,
        duty_type_id,
        day: dayLower,
      },
    });
    if (existing) {
      throw new Error('This duty is already assigned for this day.');
    }

    const dutyType = await dutyTypeModelInstance.findByPk(String(duty_type_id));
    if (dutyType && (dutyType.get('name') as string)?.toLowerCase() === 'coordinator') {
      const roster = await dutyRosterModelInstance.findByPk(String(duty_roster_id));
      if (roster && roster.get('mehfil_directory_id')) {
        const mehfilRosters = await dutyRosterModelInstance.findAll({
          where: { mehfil_directory_id: roster.get('mehfil_directory_id') },
        });
        const rosterIds = mehfilRosters.map((r) => r.get('id'));
        const coordinatorExists = await assignmentModel.findOne({
          where: {
            duty_roster_id: { [Op.in]: rosterIds },
            duty_type_id,
            day: dayLower,
          },
        });
        if (coordinatorExists) {
          throw new Error(
            'A coordinator is already assigned for this day. Only one coordinator per day is allowed.',
          );
        }
      }
    }

    const assignment = await assignmentModel.create({
      duty_roster_id,
      duty_type_id,
      day: dayLower,
      created_at: new Date(),
      updated_at: new Date(),
    } as Parameters<typeof assignmentModel.create>[0]);
    return assignment;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    logger.error(`Error creating duty roster assignment: ${message}`);
    throw error;
  }
};

export const deleteAssignment = async (id: string) => {
  try {
    const assignment = await assignmentModel.findByPk(id);
    if (!assignment) {
      throw new Error('Assignment not found');
    }
    await assignment.destroy();
    return { success: true, message: 'Assignment deleted successfully' };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    logger.error(`Error deleting duty roster assignment: ${message}`);
    throw error;
  }
};

export const getAssignmentsByRosterId = async (rosterId: string) => {
  try {
    const assignments = await assignmentModel.findAll({
      where: { duty_roster_id: rosterId },
      include: [
        {
          model: dutyTypeModelInstance,
          as: 'dutyType',
          required: false,
        },
      ],
      order: [['day', 'ASC']],
    });
    return assignments;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    logger.error(`Error fetching assignments by roster ID: ${message}`);
    throw error;
  }
};
