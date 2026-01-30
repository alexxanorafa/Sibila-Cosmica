// ===== SISTEMA SIBILA CÓSMICA - SCRIPT PRINCIPAL =====

// CONSTANTES E CONFIGURAÇÕES
const SISTEMA_VERSION = "2.0";
const SABEDORIA_COLETIVA_URL = "https://api.sibila-colletiva.com/v1";
const CHAVE_LOCALSTORAGE = "sibila_cosmica_state";
const CHAVE_CONFIG = "sibila_cosmica_config";

// ESTADO GLOBAL
let DATA = null;
let SISTEMA = {
  // Estado principal
  estado: {
    sessoes: 0,
    historico: [],
    repeticoes: {},
    padroes: [],
    aprendizados: [],
    feedbacks: []
  },
  
  // Configurações
  config: {
    usuario: {
      nome: "",
      nivelDetalhe: "padrao",
      tema: "escuro",
      notificacoes: true,
      modoIncativo: false,
      contribuicaoColetiva: "anonimo"
    },
    sistema: {
      velocidadeAnimacoes: 1,
      apiExterna: "nenhuma",
      apiKey: "",
      integracaoCalendario: "nenhuma",
      exportarAutomatico: false
    }
  },
  
  // Contexto atual
  contexto: {
    temporal: {},
    ciclico: {},
    coletivo: {},
    pessoal: {}
  },
  
  // Dados em memória
  cartasAtuais: [],
  leituraAtual: null,
  mapaGrafo: null,
  estatisticas: null
};

// MÓDULO DE INICIALIZAÇÃO
async function inicializarSistema() {
  console.log("🔮 Inicializando Sibila Cósmica v" + SISTEMA_VERSION);
  
  // Carregar dados
  await carregarDados();
  
  // Carregar estado salvo
  carregarEstado();
  
  // Carregar configurações
  carregarConfiguracoes();
  
  // Inicializar componentes
  inicializarUI();
  inicializarEventos();
  inicializarCiclos();
  
  // Atualizar interface
  atualizarInterface();
  
  // Inicializar sistema coletivo (se permitido)
  if (SISTEMA.config.usuario.contribuicaoColetiva !== "minimo") {
    inicializarConexaoColetiva();
  }
  
  console.log("✅ Sistema Sibila Cósmica inicializado com sucesso");
  mostrarNotificacao("Sistema Sibila Cósmica pronto", "sucesso");
}

// MÓDULO DE DADOS
async function carregarDados() {
  try {
    const response = await fetch('data.json');
    DATA = await response.json();
    console.log("📚 Dados carregados:", DATA.cartas.length, "cartas");
  } catch (error) {
    console.error("❌ Erro ao carregar dados:", error);
    mostrarNotificacao("Erro ao carregar dados do sistema", "perigo");
    
    // Dados de fallback
    DATA = {
      cartas: [],
      meta: { sistema: "Sibila (Modo Offline)" }
    };
  }
}

// MÓDULO DE ESTADO
function carregarEstado() {
  const estadoSalvo = localStorage.getItem(CHAVE_LOCALSTORAGE);
  if (estadoSalvo) {
    try {
      const parsed = JSON.parse(estadoSalvo);
      SISTEMA.estado = { ...SISTEMA.estado, ...parsed };
      console.log("💾 Estado carregado:", SISTEMA.estado.sessoes, "sessões");
    } catch (error) {
      console.error("❌ Erro ao carregar estado:", error);
    }
  }
}

function salvarEstado() {
  try {
    const estadoParaSalvar = {
      sessoes: SISTEMA.estado.sessoes,
      historico: SISTEMA.estado.historico.slice(-100), // Mantém apenas as 100 últimas
      repeticoes: SISTEMA.estado.repeticoes,
      padroes: SISTEMA.estado.padroes,
      aprendizados: SISTEMA.estado.aprendizados.slice(-50)
    };
    
    localStorage.setItem(CHAVE_LOCALSTORAGE, JSON.stringify(estadoParaSalvar));
    console.log("💾 Estado salvo");
  } catch (error) {
    console.error("❌ Erro ao salvar estado:", error);
  }
}

function carregarConfiguracoes() {
  const configSalva = localStorage.getItem(CHAVE_CONFIG);
  if (configSalva) {
    try {
      SISTEMA.config = JSON.parse(configSalva);
      console.log("⚙️ Configurações carregadas");
    } catch (error) {
      console.error("❌ Erro ao carregar configurações:", error);
    }
  }
  
  // Aplicar configurações imediatamente
  aplicarConfiguracoes();
}

function salvarConfiguracoes() {
  try {
    localStorage.setItem(CHAVE_CONFIG, JSON.stringify(SISTEMA.config));
    console.log("⚙️ Configurações salvas");
    mostrarNotificacao("Configurações salvas", "sucesso");
  } catch (error) {
    console.error("❌ Erro ao salvar configurações:", error);
    mostrarNotificacao("Erro ao salvar configurações", "perigo");
  }
}

// MÓDULO DE INTERFACE
function inicializarUI() {
  // Atualizar contadores
  document.getElementById('contador-sessoes').textContent = SISTEMA.estado.sessoes;
  document.getElementById('contador-padroes').textContent = SISTEMA.estado.padroes.length;
  
  // Configurar elementos de configuração
  if (SISTEMA.config.usuario.nome) {
    document.getElementById('nome-usuario').value = SISTEMA.config.usuario.nome;
  }
  
  document.getElementById('tema-interface').value = SISTEMA.config.usuario.tema;
  document.getElementById('nivel-detalhe').value = SISTEMA.config.usuario.nivelDetalhe;
  document.getElementById('notificacoes').checked = SISTEMA.config.usuario.notificacoes;
  document.getElementById('modo-incognito').checked = SISTEMA.config.usuario.modoIncativo;
  document.getElementById('api-externa').value = SISTEMA.config.sistema.apiExterna;
  document.getElementById('velocidade-animacoes').value = SISTEMA.config.sistema.velocidadeAnimacoes;
  document.getElementById('integracao-calendario').value = SISTEMA.config.sistema.integracaoCalendario;
  document.getElementById('exportar-automatico').checked = SISTEMA.config.sistema.exportarAutomatico;
  
  // Inicializar dropdowns de cartas
  inicializarDropdownsCartas();
  
  // Inicializar gráficos
  inicializarGraficos();
}

function inicializarEventos() {
  // Navegação por abas
  document.querySelectorAll('.nav-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const tab = btn.dataset.tab;
      mudarAba(tab);
    });
  });
  
  // Botão de leitura principal
  document.querySelector('.btn-principal')?.addEventListener('click', realizarLeitura);
  
  // Configurações
  document.getElementById('api-externa').addEventListener('change', function() {
    document.getElementById('api-key').classList.toggle('hidden', this.value === 'nenhuma');
  });
  
  document.getElementById('velocidade-animacoes').addEventListener('input', function() {
    const valor = parseFloat(this.value);
    document.getElementById('valor-velocidade').textContent = 
      valor === 0.5 ? 'Muito lento' :
      valor === 1 ? 'Normal' :
      valor === 1.5 ? 'Rápido' :
      valor === 2 ? 'Muito rápido' : 'Ultra rápido';
  });
  
  // Botões de configuração
  document.querySelectorAll('.coletivo-btn').forEach(btn => {
    btn.addEventListener('click', function() {
      document.querySelectorAll('.coletivo-btn').forEach(b => b.classList.remove('active'));
      this.classList.add('active');
      SISTEMA.config.usuario.contribuicaoColetiva = this.dataset.nivel;
    });
  });
  
  // Eventos de cartas (delegated)
  document.addEventListener('click', function(event) {
    if (event.target.closest('.carta')) {
      const cartaElement = event.target.closest('.carta');
      mostrarDetalhesCarta(cartaElement.dataset.id);
    }
  });
}

function mudarAba(abaId) {
  // Atualizar botões de navegação
  document.querySelectorAll('.nav-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.tab === abaId);
  });
  
  // Atualizar conteúdo
  document.querySelectorAll('.tab-content').forEach(content => {
    content.classList.toggle('active', content.id === abaId);
  });
  
  // Inicializar conteúdo específico da aba
  switch(abaId) {
    case 'mapa':
      inicializarMapa();
      break;
    case 'historico':
      carregarHistorico();
      break;
    case 'estatisticas':
      atualizarEstatisticas();
      break;
  }
}

// MÓDULO DE LEITURA
async function realizarLeitura() {
  if (SISTEMA.config.usuario.modoIncativo) {
    mostrarNotificacao("Modo incógnito ativo - leitura não será salva", "aviso");
  }
  
  // Obter configurações da leitura
  const modo = document.getElementById('modo-leitura').value;
  const pergunta = document.getElementById('pergunta').value;
  const camada = document.querySelector('.camada-btn.active')?.dataset.camada || 'pessoal';
  
  // Limpar área de cartas
  const container = document.getElementById('container-cartas');
  container.innerHTML = '';
  container.classList.remove('hidden');
  
  // Mostrar loader
  container.innerHTML = '<div class="loader"></div><p style="margin-top: 1rem;">Consultando as cartas...</p>';
  
  // Gerar contexto temporal
  await atualizarContextoTemporal();
  
  // Sortear cartas baseado no modo
  let cartas;
  switch(modo) {
    case 'profundo':
      cartas = sortearCartas(5);
      break;
    case 'quantico':
      cartas = sortearCartasQuantico(3);
      break;
    case 'temporal':
      cartas = sortearCartasComTemporalidade(3);
      break;
    case 'coletivo':
      cartas = await sortearCartasColetivo(3);
      break;
    default:
      cartas = sortearCartas(3);
  }
  
  SISTEMA.cartasAtuais = cartas;
  
  // Aguardar um momento para efeito dramático
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // Limpar loader e mostrar cartas
  container.innerHTML = '';
  exibirCartas(cartas);
  
  // Gerar narrativa
  const narrativa = await gerarNarrativa(cartas, pergunta, camada);
  exibirNarrativa(narrativa);
  
  // Atualizar contexto e conexões
  atualizarPainelContexto(cartas);
  atualizarConexoes(cartas);
  
  // Registrar leitura
  if (!SISTEMA.config.usuario.modoIncativo) {
    registrarLeitura(cartas, narrativa, pergunta);
  }
  
  // Atualizar estatísticas
  atualizarContadores();
  
  // Tocar som de revelação
  tocarSom('revelacao');
  
  // Mostrar notificação
  mostrarNotificacao("Leitura concluída", "sucesso");
}

function sortearCartas(numero) {
  const cartasDisponiveis = [...DATA.cartas];
  const sorteadas = [];
  
  // Se houver carta "portal" disponível, considerar incluir (10% de chance)
  if (Math.random() < 0.1) {
    const portal = cartasDisponiveis.find(c => c.id === 'portal');
    if (portal) {
      sorteadas.push(portal);
      cartasDisponiveis.splice(cartasDisponiveis.indexOf(portal), 1);
    }
  }
  
  // Sortear cartas restantes
  while (sorteadas.length < numero && cartasDisponiveis.length > 0) {
    const indice = Math.floor(Math.random() * cartasDisponiveis.length);
    sorteadas.push(cartasDisponiveis.splice(indice, 1)[0]);
  }
  
  // Atualizar contadores de repetição
  sorteadas.forEach(carta => {
    SISTEMA.estado.repeticoes[carta.id] = (SISTEMA.estado.repeticoes[carta.id] || 0) + 1;
  });
  
  return sorteadas;
}

function sortearCartasQuantico(numero) {
  // Simula superposição quântica - cartas têm estados múltiplos
  const cartas = sortearCartas(numero);
  
  // Adicionar propriedade quântica
  cartas.forEach(carta => {
    carta.quantico = {
      superposicao: Math.random() > 0.7,
      colapsada: false,
      estadosAlternativos: gerarEstadosAlternativos(carta)
    };
  });
  
  return cartas;
}

async function sortearCartasColetivo(numero) {
  try {
    // Tentar obter influência coletiva
    const resposta = await fetch(`${SABEDORIA_COLETIVA_URL}/influencia`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contexto: SISTEMA.contexto.temporal,
        historicoLocal: SISTEMA.estado.historico.slice(-10)
      })
    });
    
    if (resposta.ok) {
      const influencia = await resposta.json();
      return aplicarInfluenciaColetiva(sortearCartas(numero), influencia);
    }
  } catch (error) {
    console.log("🔶 Modo coletivo offline, usando sorteio local");
  }
  
  return sortearCartas(numero);
}

function sortearCartasComTemporalidade(numero) {
  const cartas = sortearCartas(numero);
  
  // Ajustar baseado no contexto temporal
  const faseLunar = SISTEMA.contexto.temporal.faseLunar;
  const periodoDia = SISTEMA.contexto.temporal.periodoDia;
  
  // Exemplo: Lua cheia favorece cartas de revelação
  if (faseLunar === 'cheia' && Math.random() > 0.7) {
    const reflexao = DATA.cartas.find(c => c.id === 'reflexao');
    if (reflexao && !cartas.find(c => c.id === 'reflexao')) {
      cartas[Math.floor(Math.random() * cartas.length)] = reflexao;
    }
  }
  
  return cartas;
}

function exibirCartas(cartas) {
  const container = document.getElementById('container-cartas');
  container.innerHTML = '';
  
  // Calcular posições
  const centroX = container.offsetWidth / 2;
  const centroY = container.offsetHeight / 2;
  const raio = Math.min(centroX, centroY) * 0.6;
  
  cartas.forEach((carta, index) => {
    const angulo = (index / cartas.length) * Math.PI * 2;
    const x = centroX + Math.cos(angulo) * raio - 90;
    const y = centroY + Math.sin(angulo) * raio - 125;
    
    const cartaElement = document.createElement('div');
    cartaElement.className = 'carta';
    cartaElement.dataset.id = carta.id;
    cartaElement.style.cssText = `
      left: ${x}px;
      top: ${y}px;
      transform: rotate(${angulo * 0.2}rad);
      --cor-carta: ${carta.cor || '#6c63ff'};
      animation: surgir-carta 0.8s cubic-bezier(0.4, 0, 0.2, 1) ${index * 0.2}s both;
    `;
    
    cartaElement.innerHTML = `
      <div class="carta-icon">${carta.icon || '🃏'}</div>
      <div class="carta-nome">${carta.nome}</div>
      <div class="carta-tipo">${carta.tipo}</div>
      <div class="carta-descricao">${carta.descricao}</div>
      ${carta.arquetipo ? `<div class="carta-arquetipo">${carta.arquetipo}</div>` : ''}
    `;
    
    // Adicionar efeito quântico se aplicável
    if (carta.quantico) {
      cartaElement.classList.add('brilhante');
      cartaElement.title = "Carta em superposição quântica - clique para colapsar";
    }
    
    container.appendChild(cartaElement);
  });
  
  // Animar entrada
  container.style.animation = 'none';
  setTimeout(() => {
    container.style.animation = 'pulsar 2s infinite alternate';
  }, 100);
}

async function gerarNarrativa(cartas, pergunta, camada) {
  const narrativa = {
    texto: '',
    analise: '',
    pergunta: '',
    contexto: {}
  };
  
  // Baseado no nível de detalhe configurado
  const nivel = SISTEMA.config.usuario.nivelDetalhe;
  
  // Gerar texto narrativo base
  narrativa.texto = gerarTextoNarrativo(cartas);
  
  // Adicionar análise se necessário
  if (nivel === 'completo' || nivel === 'profundo') {
    narrativa.analise = await gerarAnaliseProfunda(cartas, camada);
  }
  
  // Adicionar pergunta provocativa
  narrativa.pergunta = gerarPerguntaProvocativa(cartas);
  
  // Adicionar contexto coletivo se permitido
  if (nivel === 'profundo' && SISTEMA.config.usuario.contribuicaoColetiva !== 'minimo') {
    narrativa.contexto.coletivo = await obterContextoColetivo(cartas);
  }
  
  return narrativa;
}

function gerarTextoNarrativo(cartas) {
  const padroes = DATA.narrativas_base;
  const padrao = padroes[Math.floor(Math.random() * padroes.length)];
  
  let texto = padrao;
  cartas.forEach((carta, index) => {
    texto = texto.replace(`{${index}}`, 
      index === 0 ? carta.descricao : carta.descricao.toLowerCase());
  });
  
  // Adicionar insights baseados em repetições
  const repetidas = cartas.filter(c => (SISTEMA.estado.repeticoes[c.id] || 0) > 2);
  if (repetidas.length > 0) {
    texto += ` Esta energia de ${repetidas[0].nome} aparece com frequência.`;
  }
  
  // Adicionar contexto temporal
  if (SISTEMA.contexto.temporal.faseLunar === 'cheia') {
    texto += " A lua cheia traz clareza a esta situação.";
  }
  
  return texto;
}

async function gerarAnaliseProfunda(cartas, camada) {
  let analise = "";
  
  // Análise por camada
  switch(camada) {
    case 'pessoal':
      analise = analisarCamadaPessoal(cartas);
      break;
    case 'relacional':
      analise = analisarCamadaRelacional(cartas);
      break;
    case 'temporal':
      analise = analisarCamadaTemporal(cartas);
      break;
    case 'arquetipica':
      analise = analisarCamadaArquetipica(cartas);
      break;
  }
  
  // Se API externa estiver configurada, aprimorar análise
  if (SISTEMA.config.sistema.apiExterna !== 'nenhuma') {
    try {
      const analiseAprimorada = await aprimorarAnaliseComIA(analise, cartas);
      if (analiseAprimorada) {
        analise = analiseAprimorada;
      }
    } catch (error) {
      console.log("🔶 Análise IA indisponível, usando análise local");
    }
  }
  
  return analise;
}

function gerarPerguntaProvocativa(cartas) {
  const perguntas = DATA.perguntas_provocativas || [
    "O que esta leitura está pedindo que você observe?",
    "Que ação esta situação requer de você?"
  ];
  
  // Selecionar pergunta baseada nas cartas
  let pergunta;
  
  if (cartas.some(c => ['tristeza', 'solidao', 'reflexao'].includes(c.id))) {
    pergunta = "O que precisa ser aceito para seguir em frente?";
  } else if (cartas.some(c => ['alegria', 'celebracao', 'fortuna'].includes(c.id))) {
    pergunta = "Como pode compartilhar esta energia positiva?";
  } else if (cartas.some(c => ['decisao', 'mudanca', 'portal'].includes(c.id))) {
    pergunta = "Que medo está impedindo seu próximo passo?";
  } else {
    pergunta = perguntas[Math.floor(Math.random() * perguntas.length)];
  }
  
  return pergunta;
}

function exibirNarrativa(narrativa) {
  const container = document.getElementById('container-narrativa');
  container.classList.remove('hidden');
  
  // Texto principal
  document.getElementById('texto-narrativa').textContent = narrativa.texto;
  
  // Análise (se disponível)
  const analiseContainer = document.getElementById('container-analise');
  const textoAnalise = document.getElementById('texto-analise');
  
  if (narrativa.analise) {
    analiseContainer.classList.remove('hidden');
    textoAnalise.innerHTML = `<p>${narrativa.analise}</p>`;
    
    // Adicionar contexto coletivo se disponível
    if (narrativa.contexto.coletivo) {
      textoAnalise.innerHTML += `<p class="contexto-coletivo"><em>${narrativa.contexto.coletivo}</em></p>`;
    }
  } else {
    analiseContainer.classList.add('hidden');
  }
  
  // Pergunta
  document.getElementById('container-pergunta').classList.remove('hidden');
  document.getElementById('texto-pergunta').textContent = narrativa.pergunta;
}

// MÓDULO DE CONTEXTO TEMPORAL
async function atualizarContextoTemporal() {
  SISTEMA.contexto.temporal = {
    data: new Date(),
    faseLunar: calcularFaseLunar(),
    periodoDia: calcularPeriodoDia(),
    estacao: calcularEstacao(),
    diaSemana: new Date().toLocaleDateString('pt-PT', { weekday: 'long' })
  };
  
  // Atualizar UI
  document.getElementById('fase-lunar').textContent = 
    SISTEMA.contexto.temporal.faseLunar.charAt(0).toUpperCase() + 
    SISTEMA.contexto.temporal.faseLunar.slice(1);
  
  document.getElementById('periodo-dia').textContent = 
    SISTEMA.contexto.temporal.periodoDia.charAt(0).toUpperCase() + 
    SISTEMA.contexto.temporal.periodoDia.slice(1);
  
  // Atualizar barra de conexão (simulação)
  const barra = document.getElementById('barra-conexao');
  const nivelConexao = calcularNivelConexao();
  barra.style.width = `${nivelConexao}%`;
}

function calcularFaseLunar() {
  // Cálculo simplificado da fase lunar
  const cicloLunar = 29.53;
  const inicioLuaNova = new Date(2024, 0, 11); // Data de referência
  const hoje = new Date();
  const dias = Math.floor((hoje - inicioLuaNova) / (1000 * 60 * 60 * 24)) % cicloLunar;
  
  if (dias < 1) return 'nova';
  if (dias < 7.4) return 'crescente';
  if (dias < 14.8) return 'cheia';
  if (dias < 22.1) return 'minguante';
  return 'nova';
}

function calcularPeriodoDia() {
  const hora = new Date().getHours();
  if (hora < 6) return 'madrugada';
  if (hora < 12) return 'manha';
  if (hora < 18) return 'tarde';
  if (hora < 22) return 'noite';
  return 'meia-noite';
}

function calcularEstacao() {
  const mes = new Date().getMonth() + 1;
  if (mes >= 3 && mes <= 5) return 'primavera';
  if (mes >= 6 && mes <= 8) return 'verao';
  if (mes >= 9 && mes <= 11) return 'outono';
  return 'inverno';
}

function calcularNivelConexao() {
  // Baseado em sessões, padrões identificados e feedback
  const base = Math.min(100, SISTEMA.estado.sessoes * 2);
  const padroesBonus = Math.min(30, SISTEMA.estado.padroes.length * 5);
  const feedbackBonus = Math.min(20, 
    SISTEMA.estado.feedbacks.filter(f => f.tipo === 'positivo').length * 2);
  
  return Math.min(100, base + padroesBonus + feedbackBonus);
}

// MÓDULO DE MAPA DE RELAÇÕES
function inicializarMapa() {
  const canvas = document.getElementById('canvas-mapa');
  const ctx = canvas.getContext('2d');
  
  // Limpar canvas
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  
  // Construir grafo se necessário
  if (!SISTEMA.mapaGrafo) {
    SISTEMA.mapaGrafo = construirGrafo();
  }
  
  // Renderizar grafo
  renderizarGrafo(ctx, SISTEMA.mapaGrafo);
  
  // Atualizar estatísticas do mapa
  atualizarEstatisticasMapa();
}

function construirGrafo() {
  const nodes = [];
  const edges = [];
  
  // Criar nós (cartas)
  DATA.cartas.forEach((carta, index) => {
    const frequencia = SISTEMA.estado.repeticoes[carta.id] || 1;
    nodes.push({
      id: carta.id,
      label: carta.nome,
      tipo: carta.tipo,
      cor: carta.cor || '#6c63ff',
      x: Math.random() * 1000 + 100,
      y: Math.random() * 600 + 100,
      vx: 0,
      vy: 0,
      tamanho: 20 + Math.log(frequencia) * 5,
      frequencia: frequencia
    });
  });
  
  // Criar arestas (conexões)
  DATA.cartas.forEach(carta => {
    carta.liga.forEach(conexaoId => {
      // Verificar se conexão já existe (não duplicar)
      if (!edges.some(e => 
        (e.from === carta.id && e.to === conexaoId) ||
        (e.from === conexaoId && e.to === carta.id)
      )) {
        edges.push({
          from: carta.id,
          to: conexaoId,
          peso: 1
        });
      }
    });
  });
  
  return { nodes, edges };
}

function renderizarGrafo(ctx, grafo) {
  // Configurações
  ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
  
  // Desenhar arestas primeiro
  grafo.edges.forEach(edge => {
    const fromNode = grafo.nodes.find(n => n.id === edge.from);
    const toNode = grafo.nodes.find(n => n.id === edge.to);
    
    if (fromNode && toNode) {
      ctx.beginPath();
      ctx.moveTo(fromNode.x, fromNode.y);
      ctx.lineTo(toNode.x, toNode.y);
      ctx.strokeStyle = `rgba(108, 99, 255, ${0.3 + edge.peso * 0.2})`;
      ctx.lineWidth = 1 + edge.peso;
      ctx.stroke();
    }
  });
  
  // Desenhar nós
  grafo.nodes.forEach(node => {
    // Glow effect
    ctx.beginPath();
    ctx.arc(node.x, node.y, node.tamanho + 3, 0, Math.PI * 2);
    ctx.fillStyle = `${node.cor}20`;
    ctx.fill();
    
    // Nó principal
    ctx.beginPath();
    ctx.arc(node.x, node.y, node.tamanho, 0, Math.PI * 2);
    ctx.fillStyle = node.cor;
    ctx.fill();
    
    // Borda
    ctx.beginPath();
    ctx.arc(node.x, node.y, node.tamanho, 0, Math.PI * 2);
    ctx.strokeStyle = 'white';
    ctx.lineWidth = 2;
    ctx.stroke();
    
    // Label
    ctx.fillStyle = 'white';
    ctx.font = 'bold 12px Inter';
    ctx.textAlign = 'center';
    ctx.fillText(node.label, node.x, node.y + node.tamanho + 15);
    
    // Frequência (se > 1)
    if (node.frequencia > 1) {
      ctx.font = '10px Inter';
      ctx.fillText(`×${node.frequencia}`, node.x, node.y - node.tamanho - 5);
    }
  });
}

function atualizarEstatisticasMapa() {
  document.getElementById('contador-nos').textContent = SISTEMA.mapaGrafo.nodes.length;
  document.getElementById('contador-conexoes').textContent = SISTEMA.mapaGrafo.edges.length;
  
  const densidade = (SISTEMA.mapaGrafo.edges.length / 
    (SISTEMA.mapaGrafo.nodes.length * (SISTEMA.mapaGrafo.nodes.length - 1) / 2)) * 100;
  document.getElementById('densidade-rede').textContent = densidade.toFixed(1) + '%';
  
  // Encontrar nós centrais (mais conexões)
  const nosCentrais = encontrarNosCentrais(SISTEMA.mapaGrafo);
  document.getElementById('nos-centrais').innerHTML = nosCentrais
    .slice(0, 3)
    .map(n => `<div>${n.label} (${n.grau} conexões)</div>`)
    .join('');
}

function encontrarNosCentrais(grafo) {
  return grafo.nodes.map(node => {
    const grau = grafo.edges.filter(e => e.from === node.id || e.to === node.id).length;
    return { ...node, grau };
  }).sort((a, b) => b.grau - a.grau);
}

// MÓDULO DE HISTÓRICO
function carregarHistorico() {
  const container = document.getElementById('lista-historico');
  const historico = SISTEMA.estado.historico;
  
  if (historico.length === 0) {
    container.innerHTML = '<div class="vazio">Nenhuma leitura registrada ainda</div>';
    return;
  }
  
  container.innerHTML = historico
    .slice(-20) // Mostrar apenas as 20 últimas
    .reverse() // Mais recente primeiro
    .map((leitura, index) => {
      const data = new Date(leitura.timestamp).toLocaleDateString('pt-PT', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
      
      return `
        <div class="leitura-card" onclick="abrirLeituraDetalhada(${historico.length - 1 - index})">
          <div class="leitura-header">
            <h4>Leitura #${historico.length - index}</h4>
            <div class="leitura-data">${data}</div>
          </div>
          <div class="leitura-cartas">
            ${leitura.cartas.map(cartaId => {
              const carta = DATA.cartas.find(c => c.id === cartaId);
              return carta ? 
                `<div class="carta-pequena" style="border-color:${carta.cor}" title="${carta.nome}">${carta.icon}</div>` :
                '<div class="carta-pequena">?</div>';
            }).join('')}
          </div>
          <div class="leitura-resumo">${leitura.narrativa.texto.substring(0, 100)}...</div>
          ${leitura.pergunta ? `<div class="leitura-pergunta"><small>Pergunta: "${leitura.pergunta}"</small></div>` : ''}
        </div>
      `;
    })
    .join('');
}

function registrarLeitura(cartas, narrativa, pergunta) {
  const leitura = {
    timestamp: new Date().toISOString(),
    cartas: cartas.map(c => c.id),
    narrativa: narrativa,
    pergunta: pergunta,
    contexto: { ...SISTEMA.contexto.temporal },
    modo: document.getElementById('modo-leitura').value
  };
  
  SISTEMA.estado.historico.push(leitura);
  SISTEMA.estado.sessoes++;
  
  // Identificar padrões
  identificarPadroes(leitura);
  
  // Salvar estado
  salvarEstado();
  
  // Atualizar interface
  atualizarContadores();
  
  // Exportar automático se configurado
  if (SISTEMA.config.sistema.exportarAutomatico) {
    exportarLeituraAtual();
  }
}

function identificarPadroes(leitura) {
  const sequencia = leitura.cartas.join('-');
  
  // Verificar se sequência já ocorreu antes
  const ocorrenciasAnteriores = SISTEMA.estado.historico
    .slice(0, -1)
    .filter(l => l.cartas.join('-') === sequencia);
  
  if (ocorrenciasAnteriores.length >= 2) {
    // Padrão identificado!
    const padrao = {
      sequencia: leitura.cartas,
      primeiraOcorrencia: ocorrenciasAnteriores[0].timestamp,
      ocorrencias: ocorrenciasAnteriores.length + 1,
      contextoComum: encontrarContextoComum([...ocorrenciasAnteriores, leitura])
    };
    
    // Verificar se já existe
    const existe = SISTEMA.estado.padroes.some(p => 
      p.sequencia.join('-') === padrao.sequencia.join('-')
    );
    
    if (!existe) {
      SISTEMA.estado.padroes.push(padrao);
      
      // Notificar usuário
      if (SISTEMA.config.usuario.notificacoes) {
        mostrarNotificacao(`Padrão identificado: ${leitura.cartas.length} cartas recorrentes`, "sucesso");
      }
    }
  }
}

// MÓDULO DE ESTATÍSTICAS
function atualizarEstatisticas() {
  atualizarGraficoDiario();
  atualizarListaFrequentes();
  atualizarEstadoEmocional();
  atualizarGraficoEvolucao();
  atualizarSequenciasRecorrentes();
  atualizarPadroesPessoais();
}

function atualizarGraficoDiario() {
  const ctx = document.getElementById('chart-diario').getContext('2d');
  
  // Agrupar leituras por dia da semana
  const dias = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
  const contagem = Array(7).fill(0);
  
  SISTEMA.estado.historico.forEach(leitura => {
    const dia = new Date(leitura.timestamp).getDay();
    contagem[dia]++;
  });
  
  new Chart(ctx, {
    type: 'bar',
    data: {
      labels: dias,
      datasets: [{
        label: 'Leituras',
        data: contagem,
        backgroundColor: 'rgba(108, 99, 255, 0.6)',
        borderColor: 'rgba(108, 99, 255, 1)',
        borderWidth: 1
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        y: {
          beginAtZero: true,
          ticks: { color: 'var(--cor-texto)' },
          grid: { color: 'rgba(255,255,255,0.1)' }
        },
        x: {
          ticks: { color: 'var(--cor-texto)' },
          grid: { color: 'rgba(255,255,255,0.1)' }
        }
      },
      plugins: {
        legend: { labels: { color: 'var(--cor-texto)' } }
      }
    }
  });
}

function atualizarListaFrequentes() {
  const container = document.getElementById('lista-frequentes');
  const frequentes = Object.entries(SISTEMA.estado.repeticoes)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);
  
  container.innerHTML = frequentes
    .map(([id, count]) => {
      const carta = DATA.cartas.find(c => c.id === id);
      if (!carta) return '';
      
      return `
        <div class="frequente-item">
          <div class="frequente-icon" style="color:${carta.cor}">${carta.icon}</div>
          <div class="frequente-info">
            <div class="frequente-nome">${carta.nome}</div>
            <div class="frequente-contador">${count} vez${count !== 1 ? 'es' : ''}</div>
          </div>
        </div>
      `;
    })
    .join('');
}

function atualizarGraficoEvolucao() {
  const ctx = document.getElementById('chart-evolucao').getContext('2d');
  
  // Últimas 30 leituras
  const ultimasLeituras = SISTEMA.estado.historico.slice(-30);
  const datas = ultimasLeituras.map(l => 
    new Date(l.timestamp).toLocaleDateString('pt-PT', { month: 'short', day: 'numeric' })
  );
  
  // Contar cartas emocionais por leitura
  const cartasEmocionais = ['alegria', 'tristeza', 'esperanca', 'ciumes', 'solidao'];
  const dados = ultimasLeituras.map(leitura => 
    leitura.cartas.filter(id => cartasEmocionais.includes(id)).length
  );
  
  new Chart(ctx, {
    type: 'line',
    data: {
      labels: datas,
      datasets: [{
        label: 'Intensidade Emocional',
        data: dados,
        borderColor: 'rgba(255, 107, 107, 1)',
        backgroundColor: 'rgba(255, 107, 107, 0.1)',
        tension: 0.4,
        fill: true
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        y: {
          beginAtZero: true,
          ticks: { color: 'var(--cor-texto)' },
          grid: { color: 'rgba(255,255,255,0.1)' }
        },
        x: {
          ticks: { color: 'var(--cor-texto)' },
          grid: { color: 'rgba(255,255,255,0.1)' }
        }
      },
      plugins: {
        legend: { labels: { color: 'var(--cor-texto)' } }
      }
    }
  });
}

// MÓDULO DE CONFIGURAÇÃO
function aplicarConfiguracoes() {
  // Aplicar tema
  document.documentElement.setAttribute('data-tema', SISTEMA.config.usuario.tema);
  
  // Aplicar velocidade de animações
  document.documentElement.style.setProperty(
    '--transicao-rapida', 
    `all ${0.2 / SISTEMA.config.sistema.velocidadeAnimacoes}s ease`
  );
  
  // Atualizar barra de progresso da conexão
  const nivelConexao = calcularNivelConexao();
  document.getElementById('barra-conexao').style.width = `${nivelConexao}%`;
}

function salvarConfiguracoes() {
  // Coletar valores da UI
  SISTEMA.config.usuario.nome = document.getElementById('nome-usuario').value;
  SISTEMA.config.usuario.tema = document.getElementById('tema-interface').value;
  SISTEMA.config.usuario.nivelDetalhe = document.getElementById('nivel-detalhe').value;
  SISTEMA.config.usuario.notificacoes = document.getElementById('notificacoes').checked;
  SISTEMA.config.usuario.modoIncativo = document.getElementById('modo-incognito').checked;
  
  SISTEMA.config.sistema.velocidadeAnimacoes = parseFloat(document.getElementById('velocidade-animacoes').value);
  SISTEMA.config.sistema.apiExterna = document.getElementById('api-externa').value;
  SISTEMA.config.sistema.apiKey = document.getElementById('api-key').value;
  SISTEMA.config.sistema.integracaoCalendario = document.getElementById('integracao-calendario').value;
  SISTEMA.config.sistema.exportarAutomatico = document.getElementById('exportar-automatico').checked;
  
  // Salvar
  salvarConfiguracoes();
  aplicarConfiguracoes();
}

// MÓDULO DE REALIDADE AUMENTADA
function ativarModoAR() {
  mostrarNotificacao("Iniciando modo de realidade expandida...", "sucesso");
  
  // Mostrar overlay AR
  const overlay = document.getElementById('ar-overlay');
  overlay.classList.remove('hidden');
  
  // Inicializar câmera
  iniciarCamera();
  
  // Posicionar cartas no AR
  if (SISTEMA.cartasAtuais.length > 0) {
    posicionarCartasAR(SISTEMA.cartasAtuais);
  }
}

function iniciarCamera() {
  const video = document.getElementById('ar-video');
  const canvas = document.getElementById('ar-canvas');
  
  // Solicitar acesso à câmera
  navigator.mediaDevices.getUserMedia({ 
    video: { facingMode: 'environment' } 
  })
  .then(stream => {
    video.srcObject = stream;
    
    // Processar vídeo para detecção
    processarVideoAR(video, canvas);
  })
  .catch(error => {
    console.error("Erro ao acessar câmera:", error);
    mostrarNotificacao("Não foi possível acessar a câmera", "perigo");
    sairModoAR();
  });
}

function posicionarCartasAR(cartas) {
  const container = document.getElementById('ar-cartas');
  container.innerHTML = '';
  
  // Posicionar cartas em posições iniciais
  cartas.forEach((carta, index) => {
    const cartaAR = document.createElement('div');
    cartaAR.className = 'carta-ar';
    cartaAR.innerHTML = `<div style="text-align:center;padding:10px;color:white">${carta.icon}<br><small>${carta.nome}</small></div>`;
    cartaAR.style.cssText = `
      left: ${20 + (index * 25)}%;
      top: ${30 + (index * 5)}%;
      background: ${carta.cor}dd;
    `;
    
    // Tornar arrastável
    tornarElementoArrastavel(cartaAR);
    
    container.appendChild(cartaAR);
  });
}

function sairModoAR() {
  document.getElementById('ar-overlay').classList.add('hidden');
  
  // Parar câmera
  const video = document.getElementById('ar-video');
  if (video.srcObject) {
    video.srcObject.getTracks().forEach(track => track.stop());
  }
}

// MÓDULO DE UTILITÁRIOS
function mostrarNotificacao(mensagem, tipo = 'info') {
  const container = document.getElementById('notificacoes-container');
  
  const notificacao = document.createElement('div');
  notificacao.className = `notificacao tipo-${tipo}`;
  notificacao.innerHTML = `
    <div style="display:flex;align-items:center;gap:10px">
      <i class="fas fa-${tipo === 'sucesso' ? 'check-circle' : tipo === 'perigo' ? 'exclamation-circle' : 'info-circle'}"></i>
      <div>${mensagem}</div>
    </div>
  `;
  
  container.appendChild(notificacao);
  
  // Remover após 5 segundos
  setTimeout(() => {
    notificacao.style.animation = 'surgir-notificacao 0.3s ease reverse forwards';
    setTimeout(() => notificacao.remove(), 300);
  }, 5000);
}

function tocarSom(tipo) {
  const som = document.getElementById(`som-${tipo}`);
  if (som) {
    som.currentTime = 0;
    som.play().catch(e => console.log("Som não pôde ser reproduzido:", e));
  }
}

function atualizarInterface() {
  // Atualizar todos os contadores e displays
  atualizarContadores();
  atualizarContextoDisplay();
  
  // Atualizar status do sistema
  const status = document.getElementById('status-sistema');
  const textoStatus = document.getElementById('texto-status');
  
  if (navigator.onLine) {
    status.style.background = '#4CAF50';
    textoStatus.textContent = 'Sistema online';
  } else {
    status.style.background = '#ff9800';
    textoStatus.textContent = 'Modo offline';
  }
}

function atualizarContadores() {
  document.getElementById('contador-sessoes').textContent = SISTEMA.estado.sessoes;
  document.getElementById('contador-padroes').textContent = SISTEMA.estado.padroes.length;
}

// FUNÇÕES DE EXPORTAÇÃO
function exportarLeituraAtual() {
  if (!SISTEMA.leituraAtual) {
    mostrarNotificacao("Nenhuma leitura atual para exportar", "aviso");
    return;
  }
  
  const dados = {
    sistema: "Sibila Cósmica",
    versao: SISTEMA_VERSION,
    leitura: SISTEMA.leituraAtual,
    contexto: SISTEMA.contexto,
    timestamp: new Date().toISOString()
  };
  
  exportarJSON(dados, `sibila-leitura-${Date.now()}.json`);
}

function exportarDadosCompletos() {
  const dados = {
    sistema: "Sibila Cósmica",
    versao: SISTEMA_VERSION,
    estado: SISTEMA.estado,
    config: SISTEMA.config,
    exportadoEm: new Date().toISOString()
  };
  
  exportarJSON(dados, `sibila-dados-completos-${Date.now()}.json`);
}

function exportarJSON(dados, nomeArquivo) {
  const blob = new Blob([JSON.stringify(dados, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = nomeArquivo;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  
  mostrarNotificacao("Dados exportados com sucesso", "sucesso");
}

// FUNÇÕES DE RESET
function limparTodosDados() {
  if (confirm("Tem certeza que deseja limpar TODOS os dados? Esta ação não pode ser desfeita.")) {
    localStorage.clear();
    SISTEMA.estado = {
      sessoes: 0,
      historico: [],
      repeticoes: {},
      padroes: [],
      aprendizados: [],
      feedbacks: []
    };
    
    inicializarUI();
    mostrarNotificacao("Todos os dados foram limpos", "sucesso");
  }
}

// FUNÇÕES AUXILIARES (simplificadas para brevidade)
function mostrarDetalhesCarta(cartaId) {
  const carta = DATA.cartas.find(c => c.id === cartaId);
  if (!carta) return;
  
  // Mostrar modal ou atualizar painel
  console.log("Detalhes da carta:", carta);
  // Implementar modal de detalhes
}

function darFeedback(tipo) {
  const feedback = {
    tipo,
    leituraAtual: SISTEMA.leituraAtual?.timestamp,
    cartas: SISTEMA.cartasAtuais.map(c => c.id),
    timestamp: new Date().toISOString()
  };
  
  SISTEMA.estado.feedbacks.push(feedback);
  
  // Atualizar aprendizado do sistema
  atualizarAprendizado(tipo);
  
  mostrarNotificacao(`Feedback ${tipo} registrado. Obrigado!`, "sucesso");
}

// INICIALIZAÇÃO
document.addEventListener('DOMContentLoaded', () => {
  // Aguardar um momento para mostrar animação de inicialização
  setTimeout(() => {
    inicializarSistema();
  }, 500);
});

// Módulos que precisam ser completados em produção:
// - Integração com APIs externas (OpenAI, etc.)
// - Sistema de aprendizado por reforço completo
// - Detecção de AR mais avançada (com TensorFlow.js)
// - Sincronização com nuvem para modo coletivo
// - Sistema completo de exportação/importação
// - Cache mais sofisticado para performance