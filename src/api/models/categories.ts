import { DataTypes, Sequelize } from 'sequelize';

export default (sequelize: Sequelize) => {
  return sequelize.define(
    'categories',
    {
      id: {
        type: DataTypes.BIGINT.UNSIGNED,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },
      slug: { type: DataTypes.STRING(255), allowNull: false, unique: true },
      title_en: { type: DataTypes.STRING(255), allowNull: false },
      title_ur: { type: DataTypes.STRING(255), allowNull: false },
      status: {
        type: DataTypes.TINYINT,
        allowNull: false,
        defaultValue: 1,
      },
      created_at: { type: DataTypes.DATE, allowNull: true },
      updated_at: { type: DataTypes.DATE, allowNull: true },
    },
    { tableName: 'categories', timestamps: false },
  );
};
