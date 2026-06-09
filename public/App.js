const { useEffect, useState } = React;

const API_URL = 'http://localhost:3000';

function App() {
  const [tiposArea, setTiposArea] = useState([]);
  const [reservas, setReservas] = useState([]);
  const [tipoForm, setTipoForm] = useState({ nome: '', valorDiaria: '' });
  const [reservaForm, setReservaForm] = useState({
    nomeCliente: '',
    dataEntrada: '',
    dataSaida: '',
    TipoAreaId: '',
    valorTaxasMultas: '',
    justificativaTaxasMultas: ''
  });
  const [mensagem, setMensagem] = useState('');
  const [carregando, setCarregando] = useState(false);

  useEffect(() => {
    carregarDados();
  }, []);

  async function carregarDados(limparMensagem = true) {
    setCarregando(true);

    if (limparMensagem) {
      setMensagem('');
    }

    try {
      const [respostaTipos, respostaReservas] = await Promise.all([
        fetch(`${API_URL}/tipos-area`),
        fetch(`${API_URL}/reservas`)
      ]);

      if (!respostaTipos.ok || !respostaReservas.ok) {
        throw new Error('Erro ao buscar dados da API.');
      }

      const tipos = await respostaTipos.json();
      const reservasApi = await respostaReservas.json();

      setTiposArea(tipos);
      setReservas(reservasApi);

      if (!reservaForm.TipoAreaId && tipos.length > 0) {
        setReservaForm((formAtual) => ({
          ...formAtual,
          TipoAreaId: String(tipos[0].id)
        }));
      }
    } catch (error) {
      setMensagem('Não foi possível carregar os dados. Verifique se a API está rodando em http://localhost:3000.');
    } finally {
      setCarregando(false);
    }
  }

  function atualizarTipoForm(event) {
    const { name, value } = event.target;
    setTipoForm((formAtual) => ({ ...formAtual, [name]: value }));
  }

  function atualizarReservaForm(event) {
    const { name, value } = event.target;
    setReservaForm((formAtual) => ({ ...formAtual, [name]: value }));
  }

  async function criarTipoArea(event) {
    event.preventDefault();
    setMensagem('');

    try {
      const resposta = await fetch(`${API_URL}/tipos-area`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nome: tipoForm.nome,
          valorDiaria: Number(tipoForm.valorDiaria)
        })
      });

      if (!resposta.ok) {
        throw new Error('Erro ao criar tipo de área.');
      }

      setTipoForm({ nome: '', valorDiaria: '' });
      await carregarDados(false);
      setMensagem('Tipo de área cadastrado com sucesso!');
    } catch (error) {
      setMensagem('Erro ao cadastrar tipo de área. Confira os campos e tente novamente.');
    }
  }

  async function excluirTipoArea(id) {
    const confirmar = window.confirm('Deseja excluir este tipo de área?');

    if (!confirmar) {
      return;
    }

    setMensagem('');

    try {
      const resposta = await fetch(`${API_URL}/tipos-area/${id}`, {
        method: 'DELETE'
      });

      if (!resposta.ok) {
        throw new Error('Erro ao excluir tipo de área.');
      }

      await carregarDados(false);
      setMensagem('Tipo de área excluído com sucesso!');
    } catch (error) {
      setMensagem('Erro ao excluir tipo de área. Verifique se não existem reservas usando este tipo.');
    }
  }

  async function criarReserva(event) {
    event.preventDefault();
    setMensagem('');

    try {
      const resposta = await fetch(`${API_URL}/reservas`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nomeCliente: reservaForm.nomeCliente,
          dataEntrada: reservaForm.dataEntrada,
          dataSaida: reservaForm.dataSaida,
          TipoAreaId: Number(reservaForm.TipoAreaId),
          valorTaxasMultas: Number(reservaForm.valorTaxasMultas || 0),
          justificativaTaxasMultas: reservaForm.justificativaTaxasMultas
        })
      });

      if (!resposta.ok) {
        const erro = await resposta.json().catch(() => ({}));
        throw new Error(erro.erro || 'Erro ao criar reserva.');
      }

      setReservaForm({
        nomeCliente: '',
        dataEntrada: '',
        dataSaida: '',
        TipoAreaId: tiposArea.length > 0 ? String(tiposArea[0].id) : '',
        valorTaxasMultas: '',
        justificativaTaxasMultas: ''
      });
      await carregarDados(false);
      setMensagem('Reserva cadastrada com sucesso!');
    } catch (error) {
      setMensagem(error.message || 'Erro ao cadastrar reserva. Confira os campos e tente novamente.');
    }
  }

  async function atualizarTaxasMultas(reserva) {
    const valorAtual = Number(reserva.valorTaxasMultas || 0).toFixed(2);
    const novoValor = window.prompt('Valor das taxas ou multas da reserva:', valorAtual);

    if (novoValor === null) {
      return;
    }

    const valorTaxasMultas = Number(novoValor.replace(',', '.'));

    if (Number.isNaN(valorTaxasMultas) || valorTaxasMultas < 0) {
      setMensagem('Informe um valor válido para taxas ou multas.');
      return;
    }

    let justificativaTaxasMultas = '';

    if (valorTaxasMultas > 0) {
      justificativaTaxasMultas = window.prompt(
        'Justificativa das taxas ou multas:',
        reserva.justificativaTaxasMultas || ''
      );

      if (justificativaTaxasMultas === null) {
        return;
      }
    }

    setMensagem('');

    try {
      const resposta = await fetch(`${API_URL}/reservas/${reserva.id}/taxas-multas`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          valorTaxasMultas,
          justificativaTaxasMultas
        })
      });

      if (!resposta.ok) {
        const erro = await resposta.json().catch(() => ({}));
        throw new Error(erro.erro || 'Erro ao atualizar taxas ou multas.');
      }

      await carregarDados(false);
      setMensagem('Taxas ou multas da reserva atualizadas com sucesso!');
    } catch (error) {
      setMensagem(error.message || 'Erro ao atualizar taxas ou multas. Tente novamente.');
    }
  }

  async function excluirReserva(id) {
    const confirmar = window.confirm('Deseja excluir esta reserva?');

    if (!confirmar) {
      return;
    }

    setMensagem('');

    try {
      const resposta = await fetch(`${API_URL}/reservas/${id}`, {
        method: 'DELETE'
      });

      if (!resposta.ok) {
        throw new Error('Erro ao excluir reserva.');
      }

      await carregarDados(false);
      setMensagem('Reserva excluída com sucesso!');
    } catch (error) {
      setMensagem('Erro ao excluir reserva. Tente novamente.');
    }
  }

  function formatarData(data) {
    if (!data) {
      return '-';
    }

    return new Date(`${data}T00:00:00`).toLocaleDateString('pt-BR');
  }

  function formatarMoeda(valor) {
    return Number(valor || 0).toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    });
  }

  return React.createElement(
    'main',
    { className: 'container' },
    React.createElement('header', { className: 'topo' },
      React.createElement('h1', null, 'Sistema de Camping'),
      React.createElement('p', null, 'Cadastro de áreas, reservas e gerenciamento de clientes.')
    ),

    mensagem && React.createElement('div', { className: 'mensagem' }, mensagem),

    React.createElement('div', { className: 'barra-acoes' },
      React.createElement('button', { type: 'button', onClick: carregarDados, disabled: carregando },
        carregando ? 'Carregando...' : 'Atualizar listas'
      )
    ),

    React.createElement('section', { className: 'grid' },
      React.createElement('div', { className: 'card' },
        React.createElement('h2', null, 'Cadastrar tipo de área'),
        React.createElement('form', { onSubmit: criarTipoArea },
          React.createElement('label', null, 'Nome',
            React.createElement('input', {
              type: 'text',
              name: 'nome',
              value: tipoForm.nome,
              onChange: atualizarTipoForm,
              placeholder: 'Ex: Barraca, Trailer, Chalé',
              required: true
            })
          ),
          React.createElement('label', null, 'Valor da diária',
            React.createElement('input', {
              type: 'number',
              name: 'valorDiaria',
              value: tipoForm.valorDiaria,
              onChange: atualizarTipoForm,
              placeholder: 'Ex: 80.00',
              min: '0',
              step: '0.01',
              required: true
            })
          ),
          React.createElement('button', { type: 'submit' }, 'Salvar tipo de área')
        )
      ),

      React.createElement('div', { className: 'card' },
        React.createElement('h2', null, 'Tipos de área'),
        tiposArea.length === 0
          ? React.createElement('p', { className: 'vazio' }, 'Nenhum tipo de área cadastrado.')
          : React.createElement('table', null,
              React.createElement('thead', null,
                React.createElement('tr', null,
                  React.createElement('th', null, 'Nome'),
                  React.createElement('th', null, 'Diária'),
                  React.createElement('th', null, 'Ações')
                )
              ),
              React.createElement('tbody', null,
                tiposArea.map((tipo) => React.createElement('tr', { key: tipo.id },
                  React.createElement('td', null, tipo.nome),
                  React.createElement('td', null, formatarMoeda(tipo.valorDiaria)),
                  React.createElement('td', null,
                    React.createElement('button', {
                      type: 'button',
                      className: 'botao-excluir',
                      onClick: () => excluirTipoArea(tipo.id)
                    }, 'Excluir')
                  )
                ))
              )
            )
      )
    ),

    React.createElement('section', { className: 'grid' },
      React.createElement('div', { className: 'card' },
        React.createElement('h2', null, 'Cadastrar reserva'),
        React.createElement('form', { onSubmit: criarReserva },
          React.createElement('label', null, 'Nome do cliente',
            React.createElement('input', {
              type: 'text',
              name: 'nomeCliente',
              value: reservaForm.nomeCliente,
              onChange: atualizarReservaForm,
              placeholder: 'Nome completo',
              required: true
            })
          ),
          React.createElement('label', null, 'Data de entrada',
            React.createElement('input', {
              type: 'date',
              name: 'dataEntrada',
              value: reservaForm.dataEntrada,
              onChange: atualizarReservaForm,
              required: true
            })
          ),
          React.createElement('label', null, 'Data de saída',
            React.createElement('input', {
              type: 'date',
              name: 'dataSaida',
              value: reservaForm.dataSaida,
              onChange: atualizarReservaForm,
              required: true
            })
          ),
          React.createElement('label', null, 'Tipo de área',
            React.createElement('select', {
              name: 'TipoAreaId',
              value: reservaForm.TipoAreaId,
              onChange: atualizarReservaForm,
              required: true
            },
              tiposArea.length === 0 && React.createElement('option', { value: '' }, 'Cadastre um tipo de área primeiro'),
              tiposArea.map((tipo) => React.createElement('option', { key: tipo.id, value: tipo.id },
                `${tipo.nome} - ${formatarMoeda(tipo.valorDiaria)}`
              ))
            )
          ),
          React.createElement('label', null, 'Taxas ou multas (opcional)',
            React.createElement('input', {
              type: 'number',
              name: 'valorTaxasMultas',
              value: reservaForm.valorTaxasMultas,
              onChange: atualizarReservaForm,
              placeholder: 'Ex: 50.00',
              min: '0',
              step: '0.01'
            })
          ),
          React.createElement('label', null, 'Justificativa das taxas ou multas',
            React.createElement('textarea', {
              name: 'justificativaTaxasMultas',
              value: reservaForm.justificativaTaxasMultas,
              onChange: atualizarReservaForm,
              placeholder: 'Descreva o motivo da cobrança adicional',
              rows: 3,
              required: Number(reservaForm.valorTaxasMultas || 0) > 0
            })
          ),
          React.createElement('button', { type: 'submit', disabled: tiposArea.length === 0 }, 'Salvar reserva')
        )
      ),

      React.createElement('div', { className: 'card card-grande' },
        React.createElement('h2', null, 'Reservas'),
        reservas.length === 0
          ? React.createElement('p', { className: 'vazio' }, 'Nenhuma reserva cadastrada.')
          : React.createElement('table', null,
              React.createElement('thead', null,
                React.createElement('tr', null,
                  React.createElement('th', null, 'Cliente'),
                  React.createElement('th', null, 'Entrada'),
                  React.createElement('th', null, 'Saída'),
                  React.createElement('th', null, 'Tipo de área'),
                  React.createElement('th', null, 'Diárias'),
                  React.createElement('th', null, 'Valor diárias'),
                  React.createElement('th', null, 'Taxas/Multas'),
                  React.createElement('th', null, 'Justificativa'),
                  React.createElement('th', null, 'Valor total'),
                  React.createElement('th', null, 'Ações')
                )
              ),
              React.createElement('tbody', null,
                reservas.map((reserva) => React.createElement('tr', { key: reserva.id },
                  React.createElement('td', null, reserva.nomeCliente),
                  React.createElement('td', null, formatarData(reserva.dataEntrada)),
                  React.createElement('td', null, formatarData(reserva.dataSaida)),
                  React.createElement('td', null, reserva.TipoArea ? reserva.TipoArea.nome : '-'),
                  React.createElement('td', null, reserva.diarias),
                  React.createElement('td', null, formatarMoeda(reserva.valorDiarias || (reserva.valorTotal - (reserva.valorTaxasMultas || 0)))),
                  React.createElement('td', null, formatarMoeda(reserva.valorTaxasMultas)),
                  React.createElement('td', { className: 'justificativa' }, reserva.justificativaTaxasMultas || '-'),
                  React.createElement('td', null, formatarMoeda(reserva.valorTotal)),
                  React.createElement('td', { className: 'acoes-reserva' },
                    React.createElement('button', {
                      type: 'button',
                      onClick: () => atualizarTaxasMultas(reserva)
                    }, 'Taxa/Multa'),
                    React.createElement('button', {
                      type: 'button',
                      className: 'botao-excluir',
                      onClick: () => excluirReserva(reserva.id)
                    }, 'Excluir')
                  )
                ))
              )
            )
      )
    )
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(React.createElement(App));
