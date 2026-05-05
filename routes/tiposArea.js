import express from 'express';
const router = express.Router();
import TipoArea from '../models/TipoArea.js';

router.post('/', async (req, res) => {
  try {
    const tipo = await TipoArea.create(req.body);
    res.status(201).json(tipo);
  } catch (error) {
    res.status(400).json({ erro: 'Erro ao cadastrar tipo de área' });
  }
});

router.get('/', async (req, res) => {
  const tipos = await TipoArea.findAll();
  res.json(tipos);
});

router.get('/:id', async (req, res) => {
  const tipo = await TipoArea.findByPk(req.params.id);

  if (!tipo) {
    return res.status(404).json({ erro: 'Tipo de área não encontrado' });
  }

  res.json(tipo);
});

router.put('/:id', async (req, res) => {
  const tipo = await TipoArea.findByPk(req.params.id);

  if (!tipo) {
    return res.status(404).json({ erro: 'Tipo de área não encontrado' });
  }

  await tipo.update(req.body);
  res.json(tipo);
});

router.delete('/:id', async (req, res) => {
  const tipo = await TipoArea.findByPk(req.params.id);

  if (!tipo) {
    return res.status(404).json({ erro: 'Tipo de área não encontrado' });
  }

  await tipo.destroy();
  res.json({ mensagem: 'Tipo de área excluído com sucesso!' });
});

export default router;
