import { DataTypes, Sequelize } from 'sequelize';

export default (sequelize: Sequelize) => {
  return sequelize.define(
    'new_ehads',
    {
      id: { type: DataTypes.BIGINT.UNSIGNED, autoIncrement: true, primaryKey: true },
      name: { type: DataTypes.STRING(255), allowNull: false },
      father_name: { type: DataTypes.STRING(255), allowNull: false },
      marfat: { type: DataTypes.STRING(255), allowNull: false },
      phone_number: { type: DataTypes.STRING(255), allowNull: false },
      address: { type: DataTypes.TEXT, allowNull: true },
      mehfil_directory_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: true },
      zone_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },
      created_by: { type: DataTypes.BIGINT.UNSIGNED, allowNull: true },
      updated_by: { type: DataTypes.BIGINT.UNSIGNED, allowNull: true },
      created_at: { type: DataTypes.DATE, allowNull: true },
      updated_at: { type: DataTypes.DATE, allowNull: true },
    },
    { tableName: 'new_ehads', timestamps: false, underscored: true },
  );
};
