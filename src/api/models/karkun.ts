import { DataTypes, Sequelize } from 'sequelize';

export default (sequelize: Sequelize) => {
  return sequelize.define(
    'karkuns',
    {
      id: { type: DataTypes.BIGINT.UNSIGNED, autoIncrement: true, primaryKey: true },
      zone: { type: DataTypes.STRING(255), allowNull: true },
      name: { type: DataTypes.STRING(255), allowNull: true },
      father_name: { type: DataTypes.STRING(255), allowNull: false },
      mobile_no: { type: DataTypes.STRING(255), allowNull: true },
      cnic_no: { type: DataTypes.STRING(255), allowNull: true },
      address: { type: DataTypes.STRING(255), allowNull: false },
      birth_year: { type: DataTypes.STRING(4), allowNull: true },
      ehad_year: { type: DataTypes.STRING(4), allowNull: true },
      mehfile: { type: DataTypes.STRING(500), allowNull: true },
      duty_days: { type: DataTypes.JSON, allowNull: true },
      duty_type: { type: DataTypes.STRING(255), allowNull: true },
      email: { type: DataTypes.STRING(255), allowNull: true, unique: true },
      password: { type: DataTypes.STRING(255), allowNull: true },
      city: { type: DataTypes.STRING(100), allowNull: true },
      country: { type: DataTypes.STRING(100), allowNull: true },
      is_zone_admin: { type: DataTypes.BOOLEAN, defaultValue: false },
      is_mehfile_admin: { type: DataTypes.BOOLEAN, defaultValue: false },
      user_type: { type: DataTypes.STRING(255), allowNull: true },
      created_at: { type: DataTypes.DATE, allowNull: true },
      updated_at: { type: DataTypes.DATE, allowNull: true },
    },
    { tableName: 'karkuns', timestamps: false, underscored: true },
  );
};
