import { DataTypes, Sequelize } from 'sequelize';

export default (sequelize: Sequelize) => {
  return sequelize.define(
    'mehfil_coordinators',
    {
      id: { type: DataTypes.BIGINT.UNSIGNED, autoIncrement: true, primaryKey: true },
      mehfil_directory_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },
      user_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },
      coordinator_type: { type: DataTypes.STRING(255), allowNull: false },
      duty_type_id_monday: { type: DataTypes.BIGINT.UNSIGNED, allowNull: true },
      duty_type_id_tuesday: { type: DataTypes.BIGINT.UNSIGNED, allowNull: true },
      duty_type_id_wednesday: { type: DataTypes.BIGINT.UNSIGNED, allowNull: true },
      duty_type_id_thursday: { type: DataTypes.BIGINT.UNSIGNED, allowNull: true },
      duty_type_id_friday: { type: DataTypes.BIGINT.UNSIGNED, allowNull: true },
      duty_type_id_saturday: { type: DataTypes.BIGINT.UNSIGNED, allowNull: true },
      duty_type_id_sunday: { type: DataTypes.BIGINT.UNSIGNED, allowNull: true },
      created_at: { type: DataTypes.DATE, allowNull: true },
      updated_at: { type: DataTypes.DATE, allowNull: true },
    },
    { tableName: 'mehfil_coordinators', timestamps: false, underscored: true },
  );
};
