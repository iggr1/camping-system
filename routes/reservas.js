import express from 'express';
import { Op } from 'sequelize';
const router = express.Router();

import Reserva from '../models/Reserva.js';
import TipoArea from '../models/TipoArea.js';

function calcularDiarias(dataEntrada, dataSaida) {
  const entrada = new Date(dataEntrada);
  const saida = new Date(dataSaida);

  const diferenca = saida - entrada;
  let diarias = diferenca / (1000 * 60 * 60 * 24);

  if (diarias < 1) {
    diarias = 1;
  }

  return diarias;
}

async function existeReservaNoPeriodo(TipoAreaId, dataEntrada, dataSaida, reservaId = null) {
  const where = {
    TipoAreaId,
    dataEntrada: {
      [Op.lt]: dataSaida
    },
    dataSaida: {
      [Op.gt]: dataEntrada
    }
  };

  if (reservaId) {
    where.id = {
      [Op.ne]: reservaId
    };
  }

  const reserva = await Reserva.findOne({ where });

  return reserva;
}

router.post('/', async (req, res) => {
  try {
    const tipoArea = await TipoArea.findByPk(req.body.TipoAreaId);

    if (!tipoArea) {
      return res.status(404).json({ erro: 'Tipo de área não encontrado' });
    }

    const reservaExistente = await existeReservaNoPeriodo(
      req.body.TipoAreaId,
      req.body.dataEntrada,
      req.body.dataSaida
    );

    if (reservaExistente) {
      return res.status(400).json({
        erro: 'Já existe uma reserva para este tipo de área nesse período'
      });
    }

    const diarias = calcularDiarias(req.body.dataEntrada, req.body.dataSaida);
    const valorTotal = diarias * tipoArea.valorDiaria;

    const reserva = await Reserva.create({
      nomeCliente: req.body.nomeCliente,
      dataEntrada: req.body.dataEntrada,
      dataSaida: req.body.dataSaida,
      TipoAreaId: req.body.TipoAreaId,
      diarias,
      valorTotal
    });

    res.status(201).json(reserva);
  } catch (error) {
    res.status(400).json({ erro: 'Erro ao cadastrar reserva' });
  }
});

router.get('/', async (req, res) => {
  const reservas = await Reserva.findAll({
    include: TipoArea
  });

  res.json(reservas);
});

router.get('/:id', async (req, res) => {
  const reserva = await Reserva.findByPk(req.params.id, {
    include: TipoArea
  });

  if (!reserva) {
    return res.status(404).json({ erro: 'Reserva não encontrada' });
  }

  res.json(reserva);
});

router.put('/:id', async (req, res) => {
  const reserva = await Reserva.findByPk(req.params.id);

  if (!reserva) {
    return res.status(404).json({ erro: 'Reserva não encontrada' });
  }

  const tipoArea = await TipoArea.findByPk(req.body.TipoAreaId);

  if (!tipoArea) {
    return res.status(404).json({ erro: 'Tipo de área não encontrado' });
  }

  const reservaExistente = await existeReservaNoPeriodo(
    req.body.TipoAreaId,
    req.body.dataEntrada,
    req.body.dataSaida,
    req.params.id
  );

  if (reservaExistente) {
    return res.status(400).json({
      erro: 'Já existe uma reserva para este tipo de área nesse período'
    });
  }

  const diarias = calcularDiarias(req.body.dataEntrada, req.body.dataSaida);
  const valorTotal = diarias * tipoArea.valorDiaria;

  await reserva.update({
    nomeCliente: req.body.nomeCliente,
    dataEntrada: req.body.dataEntrada,
    dataSaida: req.body.dataSaida,
    TipoAreaId: req.body.TipoAreaId,
    diarias,
    valorTotal
  });

  res.json(reserva);
});

router.delete('/:id', async (req, res) => {
  const reserva = await Reserva.findByPk(req.params.id);

  if (!reserva) {
    return res.status(404).json({ erro: 'Reserva não encontrada' });
  }

  await reserva.destroy();

  res.json({ mensagem: 'Reserva excluída com sucesso!' });
});

export default router;