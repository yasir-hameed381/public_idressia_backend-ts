import { sequelize } from '../../config/database';

import authModel from './auth';
import userAdminModel from './user-admin';
import rolesModel from './roles';
import permissionsModel from './permission';
import roleHasPermissionsModel from './roleHasPermissions';
import modelHasRolesModel from './modelHasRoles';

const UserAdmin = userAdminModel(sequelize);
const Roles = rolesModel(sequelize);
const Permissions = permissionsModel(sequelize);
const RoleHasPermissions = roleHasPermissionsModel(sequelize);
const ModelHasRoles = modelHasRolesModel(sequelize);
const Auth = authModel(sequelize);

const models = {
  UserAdmin,
  Roles,
  Permissions,
  RoleHasPermissions,
  ModelHasRoles,
  Auth,
};

const setupAssociations = () => {
  const userAdmin = UserAdmin as unknown as { associate?: (m: Record<string, unknown>) => void };
  const roles = Roles as unknown as { associate?: (m: Record<string, unknown>) => void };
  const permissions = Permissions as unknown as { associate?: (m: Record<string, unknown>) => void };
  if (userAdmin.associate) userAdmin.associate(models);
  if (roles.associate) roles.associate(models);
  if (permissions.associate) permissions.associate(models);
};

setupAssociations();

export default Object.assign({ sequelize }, models);
