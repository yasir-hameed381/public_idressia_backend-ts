import { DataTypes, Sequelize } from 'sequelize';

export default (sequelize: Sequelize) => {
  return sequelize.define(
    'regions',
    {
      id: { type: DataTypes.BIGINT.UNSIGNED, autoIncrement: true, primaryKey: true },
      name: { type: DataTypes.STRING(255), allowNull: false },
      description: { type: DataTypes.TEXT, allowNull: true },
      co: { type: DataTypes.STRING(255), allowNull: true },
      primary_phone_number: { type: DataTypes.STRING(20), allowNull: true },
      secondary_phone_number: { type: DataTypes.STRING(20), allowNull: true },
      created_at: { type: DataTypes.DATE, allowNull: true },
      updated_at: { type: DataTypes.DATE, allowNull: true },
    },
    { tableName: 'regions', timestamps: false, underscored: true },
  );
};
