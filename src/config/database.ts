import { Sequelize } from 'sequelize';
import mysql2 from 'mysql2';
import logger from './logger';
import vars from './vars';

const sequelize = new Sequelize(
  vars.mysqlConfig.database,
  vars.mysqlConfig.user,
  vars.mysqlConfig.password,
  {
    host: vars.mysqlConfig.host,
    port: vars.mysqlConfig.port,
    dialect: 'mysql',
    dialectModule: mysql2,
    pool: {
      max: 10,
      min: 0,
      acquire: 30000,
      idle: 10000,
    },
    logging: process.env.NODE_ENV === 'development' ? console.log : false,
  },
);

if (process.env.NODE_ENV !== 'production' || process.env.VERCEL !== '1') {
  async function checkConnection() {
    try {
      await sequelize.authenticate();
      logger.info(`Database connected: ${vars.mysqlConfig.host}:${vars.mysqlConfig.port}/${vars.mysqlConfig.database}`);
    } catch (error) {
      logger.error(`Database connection failed (${vars.mysqlConfig.host}:${vars.mysqlConfig.port}/${vars.mysqlConfig.database}):`, error);
    }
  }
  checkConnection();
}

export { sequelize };
