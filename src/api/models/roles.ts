import { DataTypes, Sequelize } from 'sequelize';

export default (sequelize: Sequelize) => {
  const rolesSchema = sequelize.define(
    'roles',
    {
      id: { type: DataTypes.BIGINT.UNSIGNED, autoIncrement: true, primaryKey: true },
      name: { type: DataTypes.STRING(255), allowNull: true },
      guard_name: { type: DataTypes.STRING(255), allowNull: true },
      created_at: { type: DataTypes.DATE, allowNull: true },
      updated_at: { type: DataTypes.DATE, allowNull: true },
    },
    { tableName: 'roles', timestamps: false, underscored: true },
  );

  (rolesSchema as { associate?: (models: Record<string, unknown>) => void }).associate = (models: Record<string, unknown>) => {
    rolesSchema.belongsToMany(models.Permissions as never, {
      through: 'role_has_permissions',
      foreignKey: 'role_id',
      otherKey: 'permission_id',
      as: 'permissions',
    });
  };

  return rolesSchema;
};
