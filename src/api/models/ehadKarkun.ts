import { DataTypes, Sequelize } from 'sequelize';

export default (sequelize: Sequelize) => {
  return sequelize.define(
    'ehad_karkuns',
    {
      id: { type: DataTypes.BIGINT.UNSIGNED, autoIncrement: true, primaryKey: true },
      zone_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },
      name_en: { type: DataTypes.STRING(255), allowNull: false },
      name_ur: { type: DataTypes.STRING(255), allowNull: false },
      so_en: { type: DataTypes.STRING(255), allowNull: true },
      so_ur: { type: DataTypes.STRING(255), allowNull: true },
      mobile_no: { type: DataTypes.STRING(255), allowNull: true },
      cnic: { type: DataTypes.STRING(255), allowNull: true },
      city_en: { type: DataTypes.STRING(255), allowNull: false },
      city_ur: { type: DataTypes.STRING(255), allowNull: false },
      country_en: { type: DataTypes.STRING(255), allowNull: false },
      country_ur: { type: DataTypes.STRING(255), allowNull: false },
      birth_year: { type: DataTypes.STRING(4), allowNull: true },
      ehad_year: { type: DataTypes.STRING(4), allowNull: true },
      ehad_ijazat_year: { type: DataTypes.STRING(4), allowNull: true },
      description: { type: DataTypes.TEXT, allowNull: true },
      created_at: { type: DataTypes.DATE, allowNull: true },
      updated_at: { type: DataTypes.DATE, allowNull: true },
    },
    { tableName: 'ehad_karkuns', timestamps: false, underscored: true },
  );
};
