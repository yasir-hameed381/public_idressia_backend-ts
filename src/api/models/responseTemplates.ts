import { DataTypes, Sequelize } from 'sequelize';

export default (sequelize: Sequelize) => {
  return sequelize.define(
    'response_templates',
    {
      id: { type: DataTypes.BIGINT.UNSIGNED, primaryKey: true, autoIncrement: true, allowNull: false },
      title: { type: DataTypes.STRING(255), allowNull: false },
      jawab: { type: DataTypes.TEXT, allowNull: true },
      jawab_links: { type: DataTypes.JSON, allowNull: true },
      created_at: { type: DataTypes.DATE, allowNull: true },
      updated_at: { type: DataTypes.DATE, allowNull: true },
    },
    { tableName: 'response_templates', timestamps: false, underscored: true },
  );
};
