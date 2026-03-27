import { DataTypes, Sequelize } from 'sequelize';

export default (sequelize: Sequelize) => {
  return sequelize.define(
    'taleems',
    {
      id: { type: DataTypes.BIGINT, allowNull: false, primaryKey: true, autoIncrement: true },
      category_id: { type: DataTypes.INTEGER, allowNull: false },
      slug: { type: DataTypes.STRING(255), allowNull: true },
      title_en: { type: DataTypes.STRING(255), allowNull: true },
      title_ur: { type: DataTypes.STRING(255), allowNull: true },
      description: { type: DataTypes.TEXT, allowNull: true },
      track: { type: DataTypes.STRING(255), allowNull: true },
      is_published: { type: DataTypes.TINYINT, allowNull: false, defaultValue: 0 },
      filename: { type: DataTypes.STRING(255), allowNull: true },
      filepath: { type: DataTypes.STRING(255), allowNull: true },
      created_at: { type: DataTypes.DATE, allowNull: false },
      updated_at: { type: DataTypes.DATE, allowNull: true },
      created_by: { type: DataTypes.INTEGER, allowNull: true },
      updated_by: { type: DataTypes.INTEGER, allowNull: true },
    },
    { tableName: 'taleems', timestamps: false, underscored: true },
  );
};
