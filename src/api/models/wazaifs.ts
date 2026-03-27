import { DataTypes, Sequelize } from 'sequelize';

export default (sequelize: Sequelize) => {
  return sequelize.define(
    'wazaifs',
    {
      id: { type: DataTypes.BIGINT.UNSIGNED, primaryKey: true, autoIncrement: true, allowNull: false },
      title_en: { type: DataTypes.STRING(255), allowNull: false },
      title_ur: { type: DataTypes.STRING(255), allowNull: false },
      slug: { type: DataTypes.STRING(255), allowNull: false, unique: true },
      description: { type: DataTypes.TEXT, allowNull: true },
      description_en: { type: DataTypes.TEXT, allowNull: true },
      images: { type: DataTypes.TEXT, allowNull: true },
      category: { type: DataTypes.STRING(255), allowNull: true },
      is_published: { type: DataTypes.TINYINT, allowNull: false, defaultValue: 1 },
      is_for_karkun: { type: DataTypes.TINYINT, allowNull: false, defaultValue: 0 },
      is_for_ehad_karkun: { type: DataTypes.TINYINT, allowNull: false, defaultValue: 0 },
      wazaif_number: { type: DataTypes.STRING(255), allowNull: true },
      created_at: { type: DataTypes.DATE, allowNull: true },
      updated_at: { type: DataTypes.DATE, allowNull: true },
      created_by: { type: DataTypes.INTEGER, allowNull: true },
      updated_by: { type: DataTypes.INTEGER, allowNull: true },
    },
    { tableName: 'wazaifs', timestamps: false, underscored: true },
  );
};
