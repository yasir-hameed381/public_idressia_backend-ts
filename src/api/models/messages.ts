import { DataTypes, Sequelize } from 'sequelize';

export default (sequelize: Sequelize) => {
  return sequelize.define(
    'messages',
    {
      id: { type: DataTypes.BIGINT.UNSIGNED, primaryKey: true, autoIncrement: true, allowNull: false },
      title_en: { type: DataTypes.STRING(255), allowNull: false },
      title_ur: { type: DataTypes.STRING(255), allowNull: false },
      description_en: { type: DataTypes.TEXT, allowNull: true },
      description_ur: { type: DataTypes.TEXT, allowNull: true },
      is_published: { type: DataTypes.TINYINT, allowNull: false },
      at_top: { type: DataTypes.TINYINT, allowNull: true },
      show_notice: { type: DataTypes.TINYINT, allowNull: true },
      created_by: { type: DataTypes.STRING(255), allowNull: false },
      updated_by: { type: DataTypes.STRING(255), allowNull: true },
      created_at: { type: DataTypes.DATE, allowNull: true },
      updated_at: { type: DataTypes.DATE, allowNull: true },
      link_1_id: { type: DataTypes.SMALLINT, allowNull: true },
      link_1_category_id: { type: DataTypes.SMALLINT, allowNull: true },
      link_2_id: { type: DataTypes.SMALLINT, allowNull: true },
      link_2_category_id: { type: DataTypes.SMALLINT, allowNull: true },
      link_3_id: { type: DataTypes.SMALLINT, allowNull: true },
      link_3_category_id: { type: DataTypes.SMALLINT, allowNull: true },
      link_4_id: { type: DataTypes.SMALLINT, allowNull: true },
      link_4_category_id: { type: DataTypes.SMALLINT, allowNull: true },
      wazaif_id: { type: DataTypes.SMALLINT, allowNull: true },
    },
    { tableName: 'messages', timestamps: false, underscored: true },
  );
};
