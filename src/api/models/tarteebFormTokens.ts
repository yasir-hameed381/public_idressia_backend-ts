import { DataTypes, Sequelize } from 'sequelize';

export default (sequelize: Sequelize) => {
  return sequelize.define(
    'tarteeb_form_tokens',
    {
      id: { type: DataTypes.BIGINT.UNSIGNED, autoIncrement: true, primaryKey: true },
      token: { type: DataTypes.STRING(64), allowNull: false, unique: true },
      expires_at: { type: DataTypes.DATE, allowNull: false },
      created_by: { type: DataTypes.BIGINT.UNSIGNED, allowNull: true },
      zone_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: true },
      mehfil_directory_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: true },
      used: { type: DataTypes.TINYINT, allowNull: false, defaultValue: 0 },
      used_at: { type: DataTypes.DATE, allowNull: true },
      created_at: { type: DataTypes.DATE, allowNull: true },
      updated_at: { type: DataTypes.DATE, allowNull: true },
    },
    {
      tableName: 'tarteeb_form_tokens',
      timestamps: false,
      underscored: true,
      indexes: [{ unique: true, fields: ['token'] }, { fields: ['expires_at'] }],
    },
  );
};
