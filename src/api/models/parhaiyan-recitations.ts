import { DataTypes, Sequelize } from 'sequelize';

export default (sequelize: Sequelize) => {
  return sequelize.define(
    'parhaiyan_recitations',
    {
      id: { type: DataTypes.BIGINT.UNSIGNED, primaryKey: true, autoIncrement: true },
      parhaiyan_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },
      darood_ibrahimi: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
      qul_shareef: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
      yaseen_shareef: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
      quran_pak: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
      name: { type: DataTypes.STRING(255), allowNull: false },
      father_name: { type: DataTypes.STRING(255), allowNull: false },
      city: { type: DataTypes.STRING(255), allowNull: false },
      mobile_number: { type: DataTypes.STRING(255), allowNull: false },
      created_at: { type: DataTypes.DATE, allowNull: true },
      updated_at: { type: DataTypes.DATE, allowNull: true },
      ip_address: { type: DataTypes.STRING(255), allowNull: true },
      user_agent: { type: DataTypes.STRING(255), allowNull: true },
      browser: { type: DataTypes.STRING(255), allowNull: true },
      device: { type: DataTypes.STRING(255), allowNull: true },
      operating_system: { type: DataTypes.STRING(255), allowNull: true },
      referrer: { type: DataTypes.STRING(255), allowNull: true },
    },
    { tableName: 'parhaiyan_recitations', timestamps: false, underscored: true },
  );
};
