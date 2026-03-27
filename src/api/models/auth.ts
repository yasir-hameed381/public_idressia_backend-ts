import { DataTypes, Model, Sequelize } from 'sequelize';

export default (sequelize: Sequelize) => {
  const usersSchema = sequelize.define(
    'users',
    {
      id: {
        type: DataTypes.BIGINT.UNSIGNED,
        autoIncrement: true,
        primaryKey: true,
      },
      name: {
        type: DataTypes.STRING(255),
        allowNull: false,
      },
      name_ur: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      email: {
        type: DataTypes.STRING(255),
        allowNull: false,
        unique: true,
      },
      phone_number: { type: DataTypes.STRING(255), allowNull: true },
      id_card_number: { type: DataTypes.STRING(255), allowNull: true },
      father_name: { type: DataTypes.STRING(255), allowNull: true },
      father_name_ur: { type: DataTypes.STRING(255), allowNull: true },
      avatar: { type: DataTypes.STRING(255), allowNull: true },
      user_type: { type: DataTypes.STRING(255), allowNull: false, defaultValue: 'karkun' },
      zone_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: true },
      region_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: true },
      mehfil_directory_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: true },
      is_super_admin: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
      is_zone_admin: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
      is_mehfil_admin: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
      is_region_admin: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
      is_all_region_admin: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
      birth_year: { type: DataTypes.INTEGER, allowNull: true },
      ehad_year: { type: DataTypes.INTEGER, allowNull: true },
      duty_days: { type: DataTypes.JSON, allowNull: true },
      duty_type: { type: DataTypes.STRING(255), allowNull: true },
      address: { type: DataTypes.TEXT, allowNull: true },
      city: { type: DataTypes.STRING(255), allowNull: true },
      country: { type: DataTypes.STRING(255), allowNull: true },
      email_verified_at: { type: DataTypes.DATE, allowNull: true },
      password: { type: DataTypes.STRING(255), allowNull: false },
      remember_token: { type: DataTypes.STRING(100), allowNull: true },
      api_token: { type: DataTypes.STRING(255), allowNull: false },
      has_affidavit_form: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
      affidavit_form_file: { type: DataTypes.STRING(100), allowNull: true },
      is_active: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
      created_at: { type: DataTypes.DATE, allowNull: true },
      created_by: { type: DataTypes.BIGINT.UNSIGNED, allowNull: true },
      updated_at: { type: DataTypes.DATE, allowNull: true },
      updated_by: { type: DataTypes.BIGINT.UNSIGNED, allowNull: true },
    },
    { tableName: 'users', timestamps: true, underscored: true },
  );

  return usersSchema;
};
