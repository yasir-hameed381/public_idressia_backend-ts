import { DataTypes, Sequelize } from 'sequelize';

export default (sequelize: Sequelize) => {
  return sequelize.define(
    'committee_poll_options',
    {
      id: { type: DataTypes.BIGINT.UNSIGNED, primaryKey: true, autoIncrement: true, allowNull: false },
      committee_poll_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },
      option: { type: DataTypes.STRING(255), allowNull: false },
      sort_order: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false, defaultValue: 0 },
      created_at: { type: DataTypes.DATE, allowNull: true },
      updated_at: { type: DataTypes.DATE, allowNull: true },
    },
    { tableName: 'committee_poll_options', timestamps: false, underscored: true },
  );
};

