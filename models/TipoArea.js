import { DataTypes } from 'sequelize';
import sequelize from '../database.js';

const TipoArea = sequelize.define('TipoArea', {
  nome: {
    type: DataTypes.STRING,
    allowNull: false
  },
  valorDiaria: {
    type: DataTypes.FLOAT,
    allowNull: false
  }
});

export default TipoArea;
