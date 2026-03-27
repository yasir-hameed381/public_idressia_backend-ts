import { DataTypes, Sequelize } from 'sequelize';

export default (sequelize: Sequelize) => {
  return sequelize.define(
    'model_has_roles',
    {
      role_id: {
        type: DataTypes.BIGINT.UNSIGNED,
        allowNull: false,
        primaryKey: true,
        references: { model: 'roles', key: 'id' },
        onDelete: 'CASCADE',
      },
      model_type: { type: DataTypes.STRING(255), allowNull: false, primaryKey: true },
      model_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false, primaryKey: true },
    },
    {
      tableName: 'model_has_roles',
      timestamps: false,
      underscored: true,
      indexes: [{ name: 'model_has_roles_model_id_model_type_index', fields: ['model_id', 'model_type'] }],
    },
  );
};
