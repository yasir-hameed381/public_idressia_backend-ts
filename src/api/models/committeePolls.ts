import { DataTypes, Sequelize } from 'sequelize';

export default (sequelize: Sequelize) => {
  return sequelize.define(
    'committee_polls',
    {
      id: { type: DataTypes.BIGINT.UNSIGNED, primaryKey: true, autoIncrement: true, allowNull: false },
      hash_id: { type: DataTypes.STRING(64), allowNull: false },
      committee_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },
      question: { type: DataTypes.STRING(255), allowNull: false },
      description: { type: DataTypes.TEXT, allowNull: true },
      is_active: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
      allow_multiple: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
      expires_at: { type: DataTypes.DATE, allowNull: true },
      created_by: { type: DataTypes.BIGINT.UNSIGNED, allowNull: true },
      updated_by: { type: DataTypes.BIGINT.UNSIGNED, allowNull: true },
      created_at: { type: DataTypes.DATE, allowNull: true },
      updated_at: { type: DataTypes.DATE, allowNull: true },
    },
    { tableName: 'committee_polls', timestamps: false, underscored: true },
  );
};

