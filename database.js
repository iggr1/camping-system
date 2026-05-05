import { Sequelize } from 'sequelize';

const sequelize = new Sequelize('banco2', 'postgres', 'admin', {
  host: 'localhost',
  dialect: 'postgres'
});

export default sequelize;
