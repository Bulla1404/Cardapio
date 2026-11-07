// PIMENTA ROZA — Para editar os sabores ou preços, altere apenas CATEGORIAS.
// Os preços "precoCento" correspondem a 100 salgadinhos em cada categoria.
// ATENÇÃO: o valor de 50 unidades é calculado como metade do cento,
// mas o preço de meio cento precisa ser confirmado com a loja.
const CATEGORIAS = [
  {
    id: 'fritos', nome: 'Fritos', precoCento: 55,
    sabores: [
      'Coxinha', 'Risole', 'Quibe', 'Trouxinha',
      'Enroladinho', 'Salsicha', 'Bolinha catupiry', 'Presuntinho'
    ]
  },
  {
    id: 'assados', nome: 'Assados', precoCento: 70,
    sabores: [
      'Empadinha frango', 'Empadinha queijo', 'Bombom de goiabada',
      'Pastelzinho de carne', 'Pastelzinho de frango', 'Pastelzinho de pizza'
    ]
  },
  {
    id: 'assadinhos', nome: 'Assadinhos', precoCento: 90,
    sabores: [
      'Mini hamburguinho', 'Mini esfirra carne', 'Mini esfirra de frango',
      'Assadinho de pizza', 'Barquetinha de maionese',
      'Barquetinha de salpicão', 'Ovinho de codorna'
    ]
  }
];

const WHATSAPP = '5532999528648';
// Uma nova chave evita que pedidos antigos, com quantidade por sabor, apareçam aqui.
const CHAVE_CARRINHO = 'pimenta-roza-carrinho-v2';
const formatoReais = valor => valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
const el = id => document.getElementById(id);
let categoriaAberta = null;
let carrinho = carregarCarrinho();

function criarElemento(tag, classe, texto) {
  const elemento = document.createElement(tag);
  if (classe) elemento.className = classe;
  if (texto !== undefined) elemento.textContent = texto;
  return elemento;
}

function precoPacote(categoria, unidades) {
  return categoria.precoCento * unidades / 100;
}

function categoriaPorId(id) {
  return CATEGORIAS.find(categoria => categoria.id === id);
}

function carregarCarrinho() {
  try {
    const dados = JSON.parse(localStorage.getItem(CHAVE_CARRINHO) || '[]');
    if (!Array.isArray(dados)) return [];
    return dados.filter(item => {
      const categoria = categoriaPorId(item?.categoriaId);
      return categoria && (item.unidades === 50 || item.unidades === 100)
        && typeof item.id === 'string' && typeof item.sortido === 'boolean'
        && Array.isArray(item.sabores) && item.sabores.every(s => categoria.sabores.includes(s))
        && (item.sortido || item.sabores.length > 0);
    });
  } catch (_) { return []; }
}

function salvarCarrinho() {
  try { localStorage.setItem(CHAVE_CARRINHO, JSON.stringify(carrinho)); } catch (_) { /* Armazenamento indisponível. */ }
}

function totalUnidades() {
  return carrinho.reduce((total, item) => total + item.unidades, 0);
}

function totalPedido() {
  return carrinho.reduce((total, item) => total + precoPacote(categoriaPorId(item.categoriaId), item.unidades), 0);
}

function renderizarCategorias() {
  const grade = el('grade-categorias');
  grade.replaceChildren();
  CATEGORIAS.forEach((cat, indice) => {
    const card = criarElemento('article', 'cartao-categoria');
    const cabecalho = criarElemento('div', 'cartao-cabecalho');
    cabecalho.append(
      criarElemento('small', '', `CATEGORIA 0${indice + 1}`),
      criarElemento('h3', '', cat.nome),
      criarElemento('span', 'preco-categoria', `${formatoReais(cat.precoCento)} / cento`),
      criarElemento('span', 'legenda-preco', `Meio cento (50 un.): ${formatoReais(precoPacote(cat, 50))}*`)
    );

    const corpo = criarElemento('div', 'cartao-corpo');
    corpo.append(criarElemento('p', '', 'Sabores disponíveis'));
    const lista = criarElemento('ul', 'lista-sabores-card');
    cat.sabores.forEach(sabor => lista.append(criarElemento('li', '', sabor)));
    corpo.append(lista);

    const rodape = criarElemento('div', 'cartao-rodape');
    const botao = criarElemento('button', 'botao botao-dourado', 'Montar meu pedido +');
    botao.type = 'button';
    botao.addEventListener('click', () => abrirPedido(cat.id));
    rodape.append(botao);
    card.append(cabecalho, corpo, rodape);
    grade.append(card);
  });
}

function tamanhoEscolhido() {
  return Number(document.querySelector('input[name="tamanho-pedido"]:checked')?.value || 100);
}

function saboresEscolhidos() {
  const sortido = el('sabor-sortido')?.checked || false;
  const sabores = [...document.querySelectorAll('.opcao-sabor-individual:checked')]
    .map(input => input.value);
  return { sortido, sabores };
}

function atualizarModal() {
  if (!categoriaAberta) return;
  const unidades = tamanhoEscolhido();
  const { sortido, sabores } = saboresEscolhidos();
  const preco = precoPacote(categoriaAberta, unidades);
  el('total-unidades-modal').textContent = `${unidades} unidades · ${formatoReais(preco)}${unidades === 50 ? '*' : ''}`;
  el('preco-modal-pedido').textContent = `${unidades === 50 ? 'Meio cento' : 'Cento inteiro'} · ${formatoReais(preco)}${unidades === 50 ? '*' : ''}`;
  el('adicionar-pedido').disabled = !sortido && sabores.length === 0;
}

function abrirPedido(id) {
  categoriaAberta = categoriaPorId(id);
  if (!categoriaAberta) return;
  el('titulo-modal-pedido').textContent = categoriaAberta.nome;
  el('observacao-pedido').value = '';
  document.querySelector('input[name="tamanho-pedido"][value="100"]').checked = true;
  el('preco-meio-cento').textContent = `${formatoReais(precoPacote(categoriaAberta, 50))}*`;
  el('preco-cento-inteiro').textContent = formatoReais(categoriaAberta.precoCento);

  const lista = el('lista-sabores-modal');
  lista.replaceChildren();

  const opcaoSortido = criarElemento('label', 'linha-sabor linha-sabor-sortido');
  const checkSortido = document.createElement('input');
  checkSortido.id = 'sabor-sortido';
  checkSortido.type = 'checkbox';
  const textoSortido = criarElemento('span', 'rotulo-sabor');
  textoSortido.append(criarElemento('strong', '', 'Sortido (todos os sabores)'),
    criarElemento('small', '', 'A loja faz a mistura dos sabores desta categoria.'));
  opcaoSortido.append(checkSortido, textoSortido);
  lista.append(opcaoSortido);

  categoriaAberta.sabores.forEach((sabor, indice) => {
    const linha = criarElemento('label', 'linha-sabor');
    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.className = 'opcao-sabor-individual';
    checkbox.value = sabor;
    checkbox.id = `sabor-${indice}`;
    linha.append(checkbox, criarElemento('span', '', sabor));
    lista.append(linha);
  });

  checkSortido.addEventListener('change', () => {
    if (checkSortido.checked) {
      lista.querySelectorAll('.opcao-sabor-individual').forEach(caixa => { caixa.checked = false; });
    }
    atualizarModal();
  });
  lista.querySelectorAll('.opcao-sabor-individual').forEach(caixa => {
    caixa.addEventListener('change', () => {
      if (caixa.checked) checkSortido.checked = false;
      atualizarModal();
    });
  });
  atualizarModal();
  el('modal-pedido').showModal();
  el('modal-pedido').querySelector('.modal-corpo').scrollTop = 0;
}

function adicionarAoCarrinho() {
  if (!categoriaAberta) return;
  const { sortido, sabores } = saboresEscolhidos();
  if (!sortido && sabores.length === 0) return;
  carrinho.push({
    id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
    categoriaId: categoriaAberta.id,
    unidades: tamanhoEscolhido(),
    sortido,
    sabores: sortido ? [] : sabores,
    observacao: el('observacao-pedido').value.trim()
  });
  salvarCarrinho();
  atualizarIndicadores();
  el('modal-pedido').close();
  abrirCarrinho();
}

function atualizarIndicadores() {
  const numero = carrinho.length;
  el('contagem-carrinho').textContent = String(numero);
  el('resumo-carrinho').textContent = `${numero} ${numero === 1 ? 'pacote' : 'pacotes'} · ${totalUnidades()} unidades`;
  el('preco-barra-carrinho').textContent = `Total estimado: ${formatoReais(totalPedido())}`;
  el('barra-carrinho').hidden = numero === 0;
}

function renderizarCarrinho() {
  const lista = el('lista-carrinho');
  lista.replaceChildren();
  carrinho.forEach(item => {
    const categoria = categoriaPorId(item.categoriaId);
    if (!categoria) return;
    const card = criarElemento('article', 'item-carrinho');
    const topo = criarElemento('div', 'item-carrinho-topo');
    const titulo = `${categoria.nome} · ${item.unidades === 50 ? 'Meio cento' : 'Cento inteiro'} (${item.unidades} unidades)`;
    const nome = criarElemento('h3', '', titulo);
    const remover = criarElemento('button', 'btn-remover', 'Remover');
    remover.type = 'button';
    remover.setAttribute('aria-label', `Remover ${titulo}`);
    remover.addEventListener('click', () => {
      carrinho = carrinho.filter(pedido => pedido.id !== item.id);
      salvarCarrinho();
      atualizarIndicadores();
      renderizarCarrinho();
    });
    topo.append(nome, remover);
    const sabores = criarElemento('p', 'escolha-sabores-carrinho', item.sortido
      ? 'Sabores: sortido (todos os sabores da categoria)'
      : `Sabores: ${item.sabores.join(', ')}`);
    card.append(topo, sabores);
    if (item.observacao) card.append(criarElemento('p', '', `Observação: ${item.observacao}`));
    card.append(criarElemento('strong', 'valor-item', `Subtotal estimado: ${formatoReais(precoPacote(categoria, item.unidades))}${item.unidades === 50 ? '*' : ''}`));
    lista.append(card);
  });
  el('contador-resumo-carrinho').textContent = `Total estimado: ${formatoReais(totalPedido())}`;
  el('finalizar-pedido').disabled = carrinho.length === 0;
}

// No próprio carrinho, o cliente pode escolher a próxima categoria
// sem precisar fechar a janela e procurar o produto no cardápio.
function renderizarOpcoesMaisProdutos() {
  const area = el('opcoes-mais-produtos');
  area.replaceChildren();
  CATEGORIAS.forEach(categoria => {
    const botao = criarElemento('button', 'botao-outra-categoria', categoria.nome);
    botao.type = 'button';
    botao.addEventListener('click', () => {
      el('modal-carrinho').close();
      abrirPedido(categoria.id);
    });
    area.append(botao);
  });
}

function abrirCarrinho() {
  renderizarCarrinho();
  el('modal-carrinho').showModal();
  el('modal-carrinho').querySelector('.modal-corpo').scrollTop = 0;
}

// Impede o envio sem nome, data e horário. Mostra o campo que falta preencher.
function validarDadosCliente() {
  const campos = [el('nome-cliente'), el('data-pedido'), el('horario-pedido')];
  const camposInvalidos = campos.filter(campo => !campo.value.trim() || !campo.checkValidity());
  campos.forEach(campo => {
    if (camposInvalidos.includes(campo)) campo.setAttribute('aria-invalid', 'true');
    else campo.removeAttribute('aria-invalid');
  });
  el('aviso-campos-obrigatorios').hidden = camposInvalidos.length === 0;
  if (camposInvalidos.length) {
    camposInvalidos[0].focus();
    return false;
  }
  return true;
}

function finalizarPedido() {
  if (!carrinho.length || !validarDadosCliente()) return;
  const linhas = ['🌹 *Olá, Pimenta Roza! Gostaria de fazer uma encomenda:*', ''];
  const nome = el('nome-cliente').value.trim();
  const data = el('data-pedido').value;
  const horario = el('horario-pedido').value;
  const [ano, mes, dia] = data.split('-');
  const dataFormatada = `${dia}/${mes}/${ano}`;
  const detalhes = el('detalhes-cliente').value.trim();
  linhas.push(`*Nome:* ${nome}`, `*Data da encomenda:* ${dataFormatada}`, `*Horário desejado:* ${horario}`, '');

  carrinho.forEach((item, indice) => {
    const categoria = categoriaPorId(item.categoriaId);
    if (!categoria) return;
    const tamanho = item.unidades === 50 ? 'Meio cento (50 unidades)' : 'Cento inteiro (100 unidades)';
    linhas.push(`*${indice + 1}. ${categoria.nome} — ${tamanho}*`);
    linhas.push(item.sortido ? 'Sabores: Sortido (todos os sabores da categoria)'
      : `Sabores escolhidos: ${item.sabores.join(', ')}`);
    if (item.observacao) linhas.push(`Observação: ${item.observacao}`);
    linhas.push(`Subtotal estimado: ${formatoReais(precoPacote(categoria, item.unidades))}${item.unidades === 50 ? ' (meio cento a confirmar)' : ''}`, '');
  });

  linhas.push(`*Quantidade total:* ${totalUnidades()} salgadinhos`);
  linhas.push(`*Total estimado:* ${formatoReais(totalPedido())}`);
  if (detalhes) linhas.push(`*Informações sobre retirada/entrega:* ${detalhes}`);
  linhas.push('', 'A quantidade por sabor será definida pela loja. Poderiam confirmar a disponibilidade e o valor final, especialmente o preço do meio cento? Obrigado!');

  const url = `https://wa.me/${WHATSAPP}?text=${encodeURIComponent(linhas.join('\n'))}`;
  window.open(url, '_blank', 'noopener,noreferrer');
}

function iniciar() {
  renderizarCategorias();
  renderizarOpcoesMaisProdutos();
  atualizarIndicadores();
  document.querySelectorAll('input[name="tamanho-pedido"]').forEach(input => {
    input.addEventListener('change', atualizarModal);
  });
  el('fechar-modal-pedido').addEventListener('click', () => el('modal-pedido').close());
  el('fechar-modal-carrinho').addEventListener('click', () => el('modal-carrinho').close());
  el('adicionar-pedido').addEventListener('click', adicionarAoCarrinho);
  el('btn-carrinho-topo').addEventListener('click', abrirCarrinho);
  el('btn-abrir-carrinho').addEventListener('click', abrirCarrinho);
  el('finalizar-pedido').addEventListener('click', finalizarPedido);
  // Se o cliente corrigir um campo, removemos o destaque de erro.
  [el('nome-cliente'), el('data-pedido'), el('horario-pedido')].forEach(campo => {
    const limparAviso = () => {
      if (campo.value.trim() && campo.checkValidity()) campo.removeAttribute('aria-invalid');
      if ([el('nome-cliente'), el('data-pedido'), el('horario-pedido')]
        .every(campoObrigatorio => campoObrigatorio.value.trim() && campoObrigatorio.checkValidity())) {
        el('aviso-campos-obrigatorios').hidden = true;
      }
    };
    campo.addEventListener('input', limparAviso);
    campo.addEventListener('change', limparAviso);
  });
  [el('modal-pedido'), el('modal-carrinho')].forEach(dialogo => {
    dialogo.addEventListener('click', evento => {
      if (evento.target === dialogo) dialogo.close();
    });
  });
}

iniciar();
