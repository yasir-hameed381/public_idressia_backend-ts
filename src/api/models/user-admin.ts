import { DataTypes, Sequelize } from 'sequelize';

export default (sequelize: Sequelize) => {
  const adminUsersSchema = sequelize.define(
    'users',
    {
      id: { type: DataTypes.BIGINT.UNSIGNED, autoIncrement: true, primaryKey: true },
      zone_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: true },
      region_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: true },
      mehfil_directory_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: true },
      name: { type: DataTypes.STRING(255), allowNull: true },
      name_ur: { type: DataTypes.STRING(255), allowNull: true },
      email: { type: DataTypes.STRING(255), allowNull: true, unique: true },
      father_name: { type: DataTypes.STRING(255), allowNull: true },
      father_name_ur: { type: DataTypes.STRING(255), allowNull: true },
      phone_number: { type: DataTypes.STRING(255), allowNull: true },
      id_card_number: { type: DataTypes.STRING(255), allowNull: true },
      address: { type: DataTypes.TEXT, allowNull: true },
      birth_year: { type: DataTypes.INTEGER, allowNull: true },
      ehad_year: { type: DataTypes.INTEGER, allowNull: true },
      duty_days: { type: DataTypes.JSON, allowNull: true },
      duty_type: { type: DataTypes.STRING(255), allowNull: true },
      avatar: { type: DataTypes.STRING(255), allowNull: true },
      password: { type: DataTypes.STRING(255), allowNull: true },
      city: { type: DataTypes.STRING(100), allowNull: true },
      country: { type: DataTypes.STRING(100), allowNull: true },
      is_zone_admin: { type: DataTypes.BOOLEAN, defaultValue: false },
      is_mehfil_admin: { type: DataTypes.BOOLEAN, defaultValue: false },
      is_super_admin: { type: DataTypes.BOOLEAN, defaultValue: false },
      is_region_admin: { type: DataTypes.BOOLEAN, defaultValue: false },
      is_all_region_admin: { type: DataTypes.BOOLEAN, defaultValue: false },
      has_affidavit_form: { type: DataTypes.BOOLEAN, defaultValue: false },
      is_active: { type: DataTypes.BOOLEAN, defaultValue: false },
      affidavit_form_file: { type: DataTypes.STRING(100), allowNull: true },
      email_verified_at: { type: DataTypes.DATE, allowNull: true },
      user_type: { type: DataTypes.STRING(255), allowNull: true },
      api_token: { type: DataTypes.STRING(255), allowNull: true },
      remember_token: { type: DataTypes.STRING(255), allowNull: true },
      created_by: { type: DataTypes.BIGINT.UNSIGNED, allowNull: true },
      updated_by: { type: DataTypes.BIGINT.UNSIGNED, allowNull: true },
      created_at: { type: DataTypes.DATE, allowNull: true },
      updated_at: { type: DataTypes.DATE, allowNull: true },
    },
    { tableName: 'users', timestamps: false, underscored: true },
  );

  (adminUsersSchema as { associate?: (models: Record<string, unknown>) => void }).associate = (models: Record<string, unknown>) => {
    adminUsersSchema.belongsTo(models.Roles as never, { foreignKey: 'role_id', as: 'role' });
  };

  return adminUsersSchema;
};
