import { DataTypes, Sequelize } from 'sequelize';

export default (sequelize: Sequelize) => {
  return sequelize.define(
    'message_schedules',
    {
      id: { type: DataTypes.BIGINT.UNSIGNED, primaryKey: true, autoIncrement: true, allowNull: false },
      message_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },
      scheduled_at: { type: DataTypes.DATE, allowNull: false },
      repeat: {
        type: DataTypes.ENUM('daily', 'weekly', 'monthly', 'yearly', 'no-repeat'),
        allowNull: true,
        defaultValue: 'no-repeat',
      },
      monday: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
      tuesday: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
      wednesday: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
      thursday: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
      friday: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
      saturday: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
      sunday: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
      last_sent_at: { type: DataTypes.DATE, allowNull: true },
      next_run_at: { type: DataTypes.DATE, allowNull: true },
      is_active: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
      send_to_mobile_devices: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
      created_by: { type: DataTypes.BIGINT.UNSIGNED, allowNull: true },
      updated_by: { type: DataTypes.BIGINT.UNSIGNED, allowNull: true },
      created_at: { type: DataTypes.DATE, allowNull: true },
      updated_at: { type: DataTypes.DATE, allowNull: true },
    },
    { tableName: 'message_schedules', timestamps: false, underscored: true },
  );
};
