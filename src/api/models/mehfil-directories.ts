import { DataTypes, Sequelize } from 'sequelize';

export default (sequelize: Sequelize) => {
  return sequelize.define(
    'mehfil_directories',
    {
      id: { type: DataTypes.BIGINT.UNSIGNED, primaryKey: true, autoIncrement: true, allowNull: false },
      zone_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },
      is_published: { type: DataTypes.TINYINT, allowNull: false, defaultValue: 1 },
      mehfil_number: { type: DataTypes.STRING(255), allowNull: false },
      name_en: { type: DataTypes.STRING(255), allowNull: false },
      name_ur: { type: DataTypes.STRING(255), allowNull: false },
      address_en: { type: DataTypes.STRING(255), allowNull: false },
      address_ur: { type: DataTypes.STRING(255), allowNull: false },
      city_en: { type: DataTypes.STRING(255), allowNull: false },
      city_ur: { type: DataTypes.STRING(255), allowNull: false },
      country_en: { type: DataTypes.STRING(255), allowNull: false },
      country_ur: { type: DataTypes.STRING(255), allowNull: false },
      google_location: { type: DataTypes.STRING(255), allowNull: true },
      mediacell_co: { type: DataTypes.STRING(255), allowNull: true },
      co_phone_number: { type: DataTypes.STRING(255), allowNull: true },
      zimdar_bhai: { type: DataTypes.STRING(255), allowNull: true },
      zimdar_bhai_phone_number: { type: DataTypes.STRING(255), allowNull: true },
      zimdar_bhai_phone_number_2: { type: DataTypes.STRING(255), allowNull: true },
      zimdar_bhai_phone_number_3: { type: DataTypes.STRING(255), allowNull: true },
      sarkari_rent: { type: DataTypes.STRING(255), allowNull: true },
      mehfil_open: { type: DataTypes.STRING(255), allowNull: true },
      ipad_serial_number: { type: DataTypes.STRING(255), allowNull: true },
      description: { type: DataTypes.TEXT, allowNull: true },
      created_at: { type: DataTypes.DATE, allowNull: true },
      updated_at: { type: DataTypes.DATE, allowNull: true },
    },
    { tableName: 'mehfil_directories', timestamps: false, underscored: true },
  );
};
