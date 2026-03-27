import { DataTypes, Sequelize } from 'sequelize';

export default (sequelize: Sequelize) => {
  return sequelize.define(
    'naats',
    {
      id: { type: DataTypes.BIGINT.UNSIGNED, primaryKey: true, autoIncrement: true, allowNull: false },
      slug: { type: DataTypes.STRING(255), allowNull: true },
      title_en: { type: DataTypes.STRING(255), allowNull: false },
      title_ur: { type: DataTypes.STRING(255), allowNull: false },
      category_id: { type: DataTypes.INTEGER, allowNull: true },
      is_published: { type: DataTypes.TINYINT, allowNull: false, defaultValue: 1 },
      track: { type: DataTypes.STRING(25), allowNull: true },
      filename: { type: DataTypes.STRING(255), allowNull: true },
      filepath: { type: DataTypes.STRING(255), allowNull: true },
      created_at: { type: DataTypes.DATE, allowNull: true },
      updated_at: { type: DataTypes.DATE, allowNull: true },
      created_by: { type: DataTypes.INTEGER, allowNull: true },
      updated_by: { type: DataTypes.INTEGER, allowNull: true },
    },
    { tableName: 'naats', timestamps: false, underscored: true },
  );
};
