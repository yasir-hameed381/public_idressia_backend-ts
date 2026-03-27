import { DataTypes, Sequelize } from 'sequelize';

export default (sequelize: Sequelize) => {
  return sequelize.define(
    'duty_rosters',
    {
      id: { type: DataTypes.BIGINT.UNSIGNED, autoIncrement: true, primaryKey: true },
      zone_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: true },
      mehfil_directory_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: true },
      user_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },
      created_by: { type: DataTypes.BIGINT.UNSIGNED, allowNull: true },
      updated_by: { type: DataTypes.BIGINT.UNSIGNED, allowNull: true },
      created_at: { type: DataTypes.DATE, allowNull: true },
      updated_at: { type: DataTypes.DATE, allowNull: true },
    },
    { tableName: 'duty_rosters', timestamps: false, underscored: true },
  );
};
