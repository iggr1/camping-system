import { DataTypes } from 'sequelize';
import sequelize from '../database.js';
import TipoArea from './TipoArea.js';

const Reserva = sequelize.define('Reserva', {
  nomeCliente: {
    type: DataTypes.STRING,
    allowNull: false
  },
  dataEntrada: {
    type: DataTypes.DATEONLY,
    allowNull: false
  },
  dataSaida: {
    type: DataTypes.DATEONLY,
    allowNull: false
  },
  diarias: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  valorDiarias: {
    type: DataTypes.FLOAT,
    allowNull: false,
    defaultValue: 0
  },
  valorTaxasMultas: {
    type: DataTypes.FLOAT,
    allowNull: false,
    defaultValue: 0
  },
  justificativaTaxasMultas: {
    type: DataTypes.TEXT,
    allowNull: true,
    defaultValue: ''
  },
  valorTotal: {
    type: DataTypes.FLOAT,
    allowNull: false
  }
});

Reserva.belongsTo(TipoArea);
TipoArea.hasMany(Reserva);

export default Reserva;
