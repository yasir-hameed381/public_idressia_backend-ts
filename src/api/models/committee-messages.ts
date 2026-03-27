import { DataTypes, Sequelize } from 'sequelize';

export default (sequelize: Sequelize) => {
  return sequelize.define(
    'committee_messages',
    {
      id: { type: DataTypes.BIGINT.UNSIGNED, primaryKey: true, autoIncrement: true, allowNull: false },
      committee_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },
      title: { type: DataTypes.STRING(255), allowNull: false },
      description: { type: DataTypes.TEXT, allowNull: false },
      recipient_committees: { type: DataTypes.JSON, allowNull: true },
      recipient_user_ids: { type: DataTypes.JSON, allowNull: true },
      sender_type: { type: DataTypes.ENUM('committee', 'user'), allowNull: false, defaultValue: 'committee' },
      attachment: { type: DataTypes.STRING(255), allowNull: true },
      message_type: { type: DataTypes.ENUM('original', 'reply', 'forward'), allowNull: false, defaultValue: 'original' },
      parent_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: true },
      created_by: { type: DataTypes.BIGINT.UNSIGNED, allowNull: true },
      updated_by: { type: DataTypes.BIGINT.UNSIGNED, allowNull: true },
      created_at: { type: DataTypes.DATE, allowNull: true },
      updated_at: { type: DataTypes.DATE, allowNull: true },
    },
    { tableName: 'committee_messages', timestamps: false, underscored: true },
  );
};
