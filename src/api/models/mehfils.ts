import { DataTypes, Sequelize } from 'sequelize';

export default (sequelize: Sequelize) => {
  return sequelize.define(
    'mehfils',
    {
      id: { type: DataTypes.BIGINT.UNSIGNED, primaryKey: true, autoIncrement: true, allowNull: false },
      slug: { type: DataTypes.STRING(255), allowNull: false, unique: true },
      title_en: { type: DataTypes.STRING(255), allowNull: false },
      title_ur: { type: DataTypes.STRING(255), allowNull: false },
      description: { type: DataTypes.TEXT, allowNull: true },
      time: { type: DataTypes.STRING(255), allowNull: true },
      type: { type: DataTypes.STRING(255), allowNull: true },
      date: { type: DataTypes.DATEONLY, allowNull: true },
      is_published: { type: DataTypes.TINYINT, allowNull: false, defaultValue: 1 },
      old: { type: DataTypes.TINYINT, allowNull: false, defaultValue: 0 },
      filename: { type: DataTypes.STRING(255), allowNull: false },
      filepath: { type: DataTypes.STRING(255), allowNull: false },
      created_at: { type: DataTypes.DATE, allowNull: true },
      updated_at: { type: DataTypes.DATE, allowNull: true },
      created_by: { type: DataTypes.INTEGER, allowNull: true },
      updated_by: { type: DataTypes.INTEGER, allowNull: true },
      description_en: { type: DataTypes.TEXT, allowNull: true },
    },
    { tableName: 'mehfils', timestamps: false, underscored: true },
  );
};
