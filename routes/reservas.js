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


function normalizarTaxasMultas(corpo) {
  const valorTaxasMultas = Number(corpo.valorTaxasMultas || 0);
  const justificativaTaxasMultas = (corpo.justificativaTaxasMultas || '').trim();

  if (Number.isNaN(valorTaxasMultas) || valorTaxasMultas < 0) {
    throw new Error('Informe um valor válido para taxas ou multas');
  }

  if (valorTaxasMultas > 0 && !justificativaTaxasMultas) {
    throw new Error('Informe a justificativa das taxas ou multas');
  }

  return {
    valorTaxasMultas,
    justificativaTaxasMultas: valorTaxasMultas > 0 ? justificativaTaxasMultas : ''
  };
}

function calcularValoresReserva(diarias, valorDiaria, valorTaxasMultas = 0) {
  const valorDiarias = diarias * valorDiaria;
  const valorTotal = valorDiarias + valorTaxasMultas;

  return {
    valorDiarias,
    valorTotal
  };
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
    const { valorTaxasMultas, justificativaTaxasMultas } = normalizarTaxasMultas(req.body);
    const { valorDiarias, valorTotal } = calcularValoresReserva(
      diarias,
      tipoArea.valorDiaria,
      valorTaxasMultas
    );

    const reserva = await Reserva.create({
      nomeCliente: req.body.nomeCliente,
      dataEntrada: req.body.dataEntrada,
      dataSaida: req.body.dataSaida,
      TipoAreaId: req.body.TipoAreaId,
      diarias,
      valorDiarias,
      valorTaxasMultas,
      justificativaTaxasMultas,
      valorTotal
    });

    res.status(201).json(reserva);
  } catch (error) {
    res.status(400).json({ erro: error.message || 'Erro ao cadastrar reserva' });
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

  try {
    const diarias = calcularDiarias(req.body.dataEntrada, req.body.dataSaida);
    const { valorTaxasMultas, justificativaTaxasMultas } = normalizarTaxasMultas(req.body);
    const { valorDiarias, valorTotal } = calcularValoresReserva(
      diarias,
      tipoArea.valorDiaria,
      valorTaxasMultas
    );

    await reserva.update({
      nomeCliente: req.body.nomeCliente,
      dataEntrada: req.body.dataEntrada,
      dataSaida: req.body.dataSaida,
      TipoAreaId: req.body.TipoAreaId,
      diarias,
      valorDiarias,
      valorTaxasMultas,
      justificativaTaxasMultas,
      valorTotal
    });

    res.json(reserva);
  } catch (error) {
    res.status(400).json({ erro: error.message || 'Erro ao atualizar reserva' });
  }
});

router.patch('/:id/taxas-multas', async (req, res) => {
  const reserva = await Reserva.findByPk(req.params.id, {
    include: TipoArea
  });

  if (!reserva) {
    return res.status(404).json({ erro: 'Reserva não encontrada' });
  }

  try {
    const { valorTaxasMultas, justificativaTaxasMultas } = normalizarTaxasMultas(req.body);
    const { valorDiarias, valorTotal } = calcularValoresReserva(
      reserva.diarias,
      reserva.TipoArea.valorDiaria,
      valorTaxasMultas
    );

    await reserva.update({
      valorDiarias,
      valorTaxasMultas,
      justificativaTaxasMultas,
      valorTotal
    });

    res.json(reserva);
  } catch (error) {
    res.status(400).json({ erro: error.message || 'Erro ao atualizar taxas ou multas' });
  }
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