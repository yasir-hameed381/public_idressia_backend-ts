import { DataTypes, Sequelize } from 'sequelize';

export default (sequelize: Sequelize) => {
  return sequelize.define(
    'parhaiyans',
    {
      id: { type: DataTypes.BIGINT.UNSIGNED, primaryKey: true, autoIncrement: true, allowNull: false },
      title_en: { type: DataTypes.STRING(255), allowNull: false },
      title_ur: { type: DataTypes.STRING(255), allowNull: false },
      description_ur: { type: DataTypes.TEXT, allowNull: true },
      description_en: { type: DataTypes.TEXT, allowNull: true },
      start_date: { type: DataTypes.DATE, allowNull: false },
      end_date: { type: DataTypes.DATE, allowNull: false },
      url_slug: { type: DataTypes.STRING(255), allowNull: false, unique: true },
      is_active: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
      created_at: { type: DataTypes.DATE, allowNull: true },
      updated_at: { type: DataTypes.DATE, allowNull: true },
    },
    { tableName: 'parhaiyans', timestamps: false, underscored: true },
  );
};
