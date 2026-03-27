import { DataTypes, Sequelize } from 'sequelize';

export default (sequelize: Sequelize) => {
  return sequelize.define(
    'new_ehad_follow_ups',
    {
      id: { type: DataTypes.BIGINT.UNSIGNED, autoIncrement: true, primaryKey: true },
      new_ehad_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },
      follow_up_date: { type: DataTypes.DATEONLY, allowNull: false },
      contact_method: {
        type: DataTypes.ENUM('phone', 'visit', 'message', 'other'),
        allowNull: false,
        defaultValue: 'phone',
      },
      status: {
        type: DataTypes.ENUM('contacted', 'not_available', 'interested', 'not_interested', 'committed'),
        allowNull: false,
        defaultValue: 'contacted',
      },
      notes: { type: DataTypes.TEXT, allowNull: true },
      next_follow_up_date: { type: DataTypes.DATEONLY, allowNull: true },
      created_by: { type: DataTypes.BIGINT.UNSIGNED, allowNull: true },
      updated_by: { type: DataTypes.BIGINT.UNSIGNED, allowNull: true },
      created_at: { type: DataTypes.DATE, allowNull: true },
      updated_at: { type: DataTypes.DATE, allowNull: true },
    },
    { tableName: 'new_ehad_follow_ups', timestamps: false, underscored: true },
  );
};
