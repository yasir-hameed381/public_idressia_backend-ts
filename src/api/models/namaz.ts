import { DataTypes, Sequelize } from 'sequelize';

export default (sequelize: Sequelize) => {
  return sequelize.define(
    'namaz_timings',
    {
      id: { type: DataTypes.BIGINT.UNSIGNED, autoIncrement: true, primaryKey: true },
      fajr: { type: DataTypes.TIME, allowNull: false },
      dhuhr: { type: DataTypes.TIME, allowNull: false },
      jumma: { type: DataTypes.TIME, allowNull: false },
      description_en: { type: DataTypes.TEXT, allowNull: true },
      description_ur: { type: DataTypes.TEXT, allowNull: true },
      asr: { type: DataTypes.TIME, allowNull: false },
      maghrib: { type: DataTypes.STRING(255), allowNull: false },
      isha: { type: DataTypes.TIME, allowNull: false },
      created_by: { type: DataTypes.BIGINT.UNSIGNED, allowNull: true },
      updated_by: { type: DataTypes.BIGINT.UNSIGNED, allowNull: true },
      created_at: { type: DataTypes.DATE, allowNull: true },
      updated_at: { type: DataTypes.DATE, allowNull: true },
    },
    { tableName: 'namaz_timings', timestamps: false, underscored: true },
  );
};
