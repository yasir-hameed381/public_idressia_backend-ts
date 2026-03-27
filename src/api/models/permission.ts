import { DataTypes, Sequelize } from 'sequelize';

export default (sequelize: Sequelize) => {
  const permissionSchema = sequelize.define(
    'permissions',
    {
      id: { type: DataTypes.BIGINT.UNSIGNED, autoIncrement: true, primaryKey: true },
      name: { type: DataTypes.STRING(255), allowNull: true },
      guard_name: { type: DataTypes.STRING(255), allowNull: true },
      created_at: { type: DataTypes.DATE, allowNull: true },
      updated_at: { type: DataTypes.DATE, allowNull: true },
    },
    { tableName: 'permissions', timestamps: false, underscored: true },
  );

  (permissionSchema as { associate?: (models: Record<string, unknown>) => void }).associate = (models: Record<string, unknown>) => {
    permissionSchema.belongsToMany(models.Roles as never, {
      through: 'role_has_permissions',
      foreignKey: 'permission_id',
      otherKey: 'role_id',
      as: 'roles',
    });
  };

  return permissionSchema;
};
