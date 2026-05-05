import express from 'express';
import sequelize from './database.js';
import tiposAreaRoutes from './routes/tiposArea.js';
import reservasRoutes from './routes/reservas.js';

import './models/TipoArea.js';
import './models/Reserva.js';

const app = express();

app.use(express.json());

app.get('/', (req, res) => {
  res.json({
    mensagem: 'rodando...'
  });
});

app.use('/tipos-area', tiposAreaRoutes);

app.use('/reservas', reservasRoutes);

sequelize.sync().then(() => {
  app.listen(3000, () => {
    console.log('API Rodando em http://localhost:3000');
  });
}).catch((erro) => {
  console.log('erro ao conectar no banco2:', erro);
});
