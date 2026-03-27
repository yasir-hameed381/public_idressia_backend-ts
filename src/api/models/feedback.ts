import { DataTypes, Sequelize } from 'sequelize';

export default (sequelize: Sequelize) => {
  return sequelize.define(
    'feedback',
    {
      id: { type: DataTypes.BIGINT.UNSIGNED, autoIncrement: true, primaryKey: true },
      name: { type: DataTypes.STRING(255), allowNull: false },
      contact_no: { type: DataTypes.STRING(255), allowNull: true },
      type: { type: DataTypes.STRING(255), allowNull: true },
      subject: { type: DataTypes.STRING(255), allowNull: true },
      description: { type: DataTypes.TEXT, allowNull: true },
      screenshot: { type: DataTypes.STRING(255), allowNull: true },
      app_type: { type: DataTypes.STRING(255), allowNull: true, defaultValue: 'idreesia_app' },
      is_resolved: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
      created_at: { type: DataTypes.DATE, allowNull: true },
      updated_at: { type: DataTypes.DATE, allowNull: true },
    },
    { tableName: 'feedback', timestamps: false, underscored: true },
  );
};
