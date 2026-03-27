import { DataTypes, Sequelize } from 'sequelize';

export default (sequelize: Sequelize) => {
  return sequelize.define(
    'duty_roster_assignments',
    {
      id: { type: DataTypes.BIGINT.UNSIGNED, autoIncrement: true, primaryKey: true },
      duty_roster_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },
      duty_type_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },
      day: {
        type: DataTypes.ENUM('monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'),
        allowNull: false,
      },
      created_at: { type: DataTypes.DATE, allowNull: true },
      updated_at: { type: DataTypes.DATE, allowNull: true },
    },
    { tableName: 'duty_roster_assignments', timestamps: false, underscored: true },
  );
};
