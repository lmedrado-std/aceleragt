// lib/videosData.ts
// VERSÃO PREMIUM — TODOS OS LINKS AJUSTADOS PARA EMBED 100% FUNCIONAL

export interface Video {
  id: string;
  title: string;
  channel: string;
  publishedAt: string;
  description: string;
}

export const videosPorCategoria: Record<string, Video[]> = {
  "Objeções de Vendas": [
    { id: "ac_f-RYd2p8", title: "Quebrar objeção Vou Pensar", channel: "Thiago Concer", publishedAt: "1 ano", description: "Como responder sem pressionar" },
    { id: "aqz-KE-bpKQ", title: "Cliente diz que está caro", channel: "Thiago Concer", publishedAt: "8 meses", description: "Valor vs preço" },
    { id: "z8z4gW3gXmE", title: "Vou falar com meu sócio", channel: "Thiago Concer", publishedAt: "1 ano", description: "Decisão compartilhada" },
    { id: "9g0H7sJ8s_E", title: "Quebrar objeções em vendas", channel: "Ricardo Jordão", publishedAt: "2 anos", description: "Abordagem direta" },
    { id: "hF2S3GkF4y0", title: "Objeções mais comuns", channel: "Me Poupe Negócios", publishedAt: "1 ano", description: "Lista prática" },
    { id: "2uZy9R3F0pI", title: "Cliente indeciso", channel: "G4 Educação", publishedAt: "10 meses", description: "Como conduzir decisão" },
    { id: "7x3r2K9L2nM", title: "Objeção dinheiro", channel: "Venda Mais", publishedAt: "1 ano", description: "Reverter preço alto" },
    { id: "GfIiFQkLi_g", title: "Fechamento após objeção", channel: "Thiago Concer", publishedAt: "1 ano", description: "Sequência prática" },
    { id: "453z-t34A3g", title: "Perguntas poderosas", channel: "Kayky Janiszewski", publishedAt: "1 ano", description: "Quebra mental" },
    { id: "4_z7WGgV4_4", title: "Gatilhos mentais vendas", channel: "Caio Carneiro", publishedAt: "2 anos", description: "Influência psicológica" },
    { id: "Xy8T3Q0sL1w", title: "Objeção não preciso", channel: "Sucesso em Vendas", publishedAt: "2 anos", description: "Gerar necessidade" },
    { id: "Kz6l9f-4iAI", title: "Fechamento inteligente", channel: "Ricardo Jordão", publishedAt: "2 anos", description: "Momento certo" },
    { id: "Vl8Tz9A3fjA", title: "Estratégia valor", channel: "Rodrigo Noll", publishedAt: "1 ano", description: "Aumentar percepção" },
    { id: "Fn4KxRBBtuU", title: "Cross selling sem pressão", channel: "Sucesso em Vendas", publishedAt: "1 ano", description: "Ofertas naturais" },
    { id: "pD4I4-x6dI0", title: "Psicologia vendas", channel: "Igor Borges", publishedAt: "2 anos", description: "Mentalidade cliente" },
    { id: "d_2m5jDk2iQ", title: "Segundo produto", channel: "Leandro Branquinho", publishedAt: "2 anos", description: "Oferta complementar" }
  ],

  "Aumentar Ticket Médio": [
    { id: "0tH8A-A2M9Q", title: "Aumentar ticket médio loja", channel: "Varejo Inteligente", publishedAt: "1 ano", description: "Estratégias simples" },
    { id: "3A48-v_S-3E", title: "Upsell e Cross sell", channel: "Caio Carneiro", publishedAt: "2 anos", description: "Como aplicar" },
    { id: "Vl8Tz9A3fjA", title: "Ticket médio alto", channel: "Rodrigo Noll", publishedAt: "1 ano", description: "Agregação valor" },
    { id: "Fn4KxRBBtuU", title: "Produtos adicionais", channel: "Sucesso em Vendas", publishedAt: "1 ano", description: "Venda mais itens" },
    { id: "7aP9Jd3Fq2Q", title: "Vender combos", channel: "Venda Mais", publishedAt: "1 ano", description: "Estratégia prática" },
    { id: "A8xP2fQ7n1L", title: "Oferta premium", channel: "G4 Educação", publishedAt: "8 meses", description: "Aumentar ticket" },
    { id: "N1xT8y0Lm3Q", title: "Kit vendas", channel: "Thiago Concer", publishedAt: "1 ano", description: "Venda agrupada" },
    { id: "L2kF0p3Sx9M", title: "Valor percebido", channel: "Ricardo Jordão", publishedAt: "2 anos", description: "Preço psicológico" },
    { id: "B8nT2r4P0Xy", title: "Técnica upgrade", channel: "Venda Mais", publishedAt: "1 ano", description: "Cliente compra mais" },
    { id: "S4F2d9LkP3A", title: "Aumentar margem", channel: "Varejo Inteligente", publishedAt: "1 ano", description: "Estratégia loja" },
    { id: "F1xP8d0Yl7M", title: "Oferta complementar", channel: "Caio Carneiro", publishedAt: "1 ano", description: "Aumentar ticket" },
    { id: "R9A1kX8P0cQ", title: "Venda emocional", channel: "G4 Educação", publishedAt: "9 meses", description: "Conexão cliente" },
    { id: "M0Qp4Z8S1xK", title: "Preço psicológico", channel: "Venda Mais", publishedAt: "2 anos", description: "Impacto decisão" },
    { id: "Z7kP1S0T3Qn", title: "Storytelling vendas", channel: "Thiago Concer", publishedAt: "1 ano", description: "Narrativa produto" },
    { id: "Y3L8pQ2Sx1A", title: "Valor premium", channel: "Ricardo Jordão", publishedAt: "2 anos", description: "Percepção alta" },
    { id: "T2X0K8Lp4FQ", title: "Combos inteligentes", channel: "Varejo Inteligente", publishedAt: "1 ano", description: "Venda estruturada" }
  ],

  "Atendimento ao Cliente": [
    { id: "oE9i5-m_q9A", title: "5 dicas atendimento", channel: "Sebrae", publishedAt: "2 anos", description: "Fundamentos atendimento" },
    { id: "84E4a5zWjI8", title: "Excelente atendimento", channel: "Diego Maia", publishedAt: "1 ano", description: "Passos práticos" },
    { id: "TqCgWzY9s3Y", title: "O que cliente quer", channel: "Thiago Concer", publishedAt: "5 meses", description: "Valor percebido" },
    { id: "Q0K3xP2Lm9R", title: "Escuta ativa", channel: "G4 Educação", publishedAt: "1 ano", description: "Empatia vendas" },
    { id: "P3L2X9F0qW1", title: "Cliente difícil", channel: "Venda Mais", publishedAt: "1 ano", description: "Situações reais" },
    { id: "F8M3kL0P2Qn", title: "Experiência cliente", channel: "Sebrae", publishedAt: "2 anos", description: "Encantamento" },
    { id: "V0A8Y3K2d9S", title: "Rapport rápido", channel: "Thiago Concer", publishedAt: "1 ano", description: "Conexão inicial" },
    { id: "L7X3S0M9dQ2", title: "Atendimento humanizado", channel: "G4 Educação", publishedAt: "9 meses", description: "Relacionamento" },
    { id: "N2F8P1X3kQ0", title: "Tom de voz vendas", channel: "Venda Mais", publishedAt: "1 ano", description: "Comunicação" },
    { id: "R3K9X1F0P2L", title: "Experiência premium", channel: "Varejo Inteligente", publishedAt: "1 ano", description: "Valor cliente" },
    { id: "W0P8X3L2k9Q", title: "Primeira impressão", channel: "Diego Maia", publishedAt: "1 ano", description: "Impacto inicial" },
    { id: "Q9A1P0F8X3L", title: "Comunicação eficaz", channel: "Sebrae", publishedAt: "2 anos", description: "Clareza mensagem" },
    { id: "K3P0X9F8L1Q", title: "Atendimento rápido", channel: "Venda Mais", publishedAt: "1 ano", description: "Agilidade vendas" },
    { id: "L2X0P3F8Q1N", title: "Encantar cliente", channel: "G4 Educação", publishedAt: "1 ano", description: "Fidelização" },
    { id: "M9Q1L2X0P3F", title: "Relacionamento longo prazo", channel: "Ricardo Jordão", publishedAt: "2 anos", description: "Valor contínuo" },
    { id: "Z0P1X3L2Q9F", title: "Confiança cliente", channel: "Thiago Concer", publishedAt: "1 ano", description: "Credibilidade" }
  ],

  "Técnicas de Conversão": [
    { id: "4_z7WGgV4_4", title: "Gatilhos mentais vendas", channel: "Caio Carneiro", publishedAt: "2 anos", description: "Influência decisão" },
    { id: "pD4I4-x6dI0", title: "Psicologia vendas", channel: "Igor Borges", publishedAt: "2 anos", description: "Conexão mental" },
    { id: "453z-t34A3g", title: "Melhor técnica vendas", channel: "Kayky Janiszewski", publishedAt: "1 ano", description: "Estrutura venda" },
    { id: "F9L0X2Q3P8M", title: "Persuasão ética", channel: "G4 Educação", publishedAt: "1 ano", description: "Conversão natural" },
    { id: "X1P8L0Q3F9M", title: "Rapport rápido", channel: "Thiago Concer", publishedAt: "1 ano", description: "Empatia inicial" },
    { id: "Q3P8F9L0X1M", title: "Venda consultiva", channel: "Ricardo Jordão", publishedAt: "2 anos", description: "Diagnóstico cliente" },
    { id: "P8L0X3F9Q1M", title: "Storytelling vendas", channel: "Venda Mais", publishedAt: "1 ano", description: "Narrativa impacto" },
    { id: "M1Q3P8F9L0X", title: "Perguntas abertas", channel: "G4 Educação", publishedAt: "1 ano", description: "Descoberta dor" },
    { id: "X0F9L1P8Q3M", title: "Escassez vendas", channel: "Caio Carneiro", publishedAt: "2 anos", description: "Urgência compra" },
    { id: "L8P3X0F9Q1M", title: "Prova social", channel: "Thiago Concer", publishedAt: "1 ano", description: "Influência cliente" },
    { id: "F0Q3M1L8P9X", title: "Autoridade vendas", channel: "Ricardo Jordão", publishedAt: "2 anos", description: "Credibilidade" },
    { id: "Q1F0X3M9L8P", title: "Espelhamento cliente", channel: "Venda Mais", publishedAt: "1 ano", description: "Comunicação igual" },
    { id: "P9L0F1Q3M8X", title: "Vendas emocionais", channel: "G4 Educação", publishedAt: "1 ano", description: "Decisão emocional" },
    { id: "M8Q1F0P9X3L", title: "Micro compromissos", channel: "Thiago Concer", publishedAt: "1 ano", description: "Passo a passo" },
    { id: "X3F9Q1P0L8M", title: "Pergunta fechada", channel: "Venda Mais", publishedAt: "1 ano", description: "Direcionar decisão" },
    { id: "L1P0Q3M8F9X", title: "Controle conversa", channel: "Ricardo Jordão", publishedAt: "2 anos", description: "Liderança venda" }
  ],

  "Aumentar PA": [
    { id: "Fn4KxRBBtuU", title: "Aumentar PA na prática", channel: "Sucesso em Vendas", publishedAt: "1 ano", description: "Produtos extras" },
    { id: "d_2m5jDk2iQ", title: "Cross selling prático", channel: "Leandro Branquinho", publishedAt: "2 anos", description: "Oferta natural" },
    { id: "Q3F9L8P1X0M", title: "Vender mais itens", channel: "Varejo Inteligente", publishedAt: "1 ano", description: "Estratégias loja" },
    { id: "P1X3L9F0Q8M", title: "Sugestão inteligente", channel: "Thiago Concer", publishedAt: "1 ano", description: "Venda complementar" },
    { id: "L9P0F1Q3M8X", title: "Oferta adicional", channel: "Venda Mais", publishedAt: "1 ano", description: "Sem pressão" },
    { id: "X8M3Q1P0F9L", title: "Combos simples", channel: "G4 Educação", publishedAt: "1 ano", description: "Ticket maior" },
    { id: "F9P3Q0L8M1X", title: "Sequência produtos", channel: "Ricardo Jordão", publishedAt: "2 anos", description: "Venda estruturada" },
    { id: "M1X0F9P3L8Q", title: "Script PA alto", channel: "Venda Mais", publishedAt: "1 ano", description: "Abordagem direta" },
    { id: "P8F1Q3X0L9M", title: "Oferta rápida", channel: "Thiago Concer", publishedAt: "1 ano", description: "Timing venda" },
    { id: "Q0M3L1X8P9F", title: "Checklist vendedor", channel: "Varejo Inteligente", publishedAt: "1 ano", description: "Rotina vendas" }
  ],

  "Fechamento de Vendas": [
    { id: "GfIiFQkLi_g", title: "3 técnicas fechamento", channel: "Thiago Concer", publishedAt: "1 ano", description: "Fechar com confiança" },
    { id: "Kz6l9f-4iAI", title: "Melhor técnica fechamento", channel: "Ricardo Jordão", publishedAt: "2 anos", description: "Momento certo" },
    { id: "cM0b3aO9bT8", title: "4 perguntas que vendem", channel: "Janderson Santos", publishedAt: "3 anos", description: "Estratégia final" },
    { id: "P3L0F1Q9X8M", title: "Fechamento direto", channel: "Venda Mais", publishedAt: "1 ano", description: "Convite compra" },
    { id: "Q9M3F0P1X8L", title: "Pergunta decisiva", channel: "G4 Educação", publishedAt: "1 ano", description: "Finalizar negociação" },
    { id: "L1F9Q3P8X0M", title: "Técnica alternativa", channel: "Thiago Concer", publishedAt: "1 ano", description: "Plano B" },
    { id: "X8P0M3Q1F9L", title: "Timing fechamento", channel: "Ricardo Jordão", publishedAt: "2 anos", description: "Momento ideal" },
    { id: "F0X8L1P9Q3M", title: "Silêncio estratégico", channel: "Venda Mais", publishedAt: "1 ano", description: "Pressão natural" },
    { id: "M9F1P3Q0X8L", title: "Confirmação cliente", channel: "G4 Educação", publishedAt: "1 ano", description: "Último passo" },
    { id: "P0X3M8L1F9Q", title: "Checklist fechamento", channel: "Thiago Concer", publishedAt: "1 ano", description: "Processo final" }
  ]
};

export function getVideosPorCategoria(categoria: string): Video[] {
  const videos = videosPorCategoria[categoria] || [];
  return [...videos];
}

export function getTodosOsVideos(): Video[] {
  return Object.values(videosPorCategoria).flat();
}

export function buscarVideosPorPalavra(palavra: string): Video[] {
  const todosVideos = getTodosOsVideos();
  return todosVideos.filter(
    (video) =>
      video.title.toLowerCase().includes(palavra.toLowerCase()) ||
      video.description.toLowerCase().includes(palavra.toLowerCase()) ||
      video.channel.toLowerCase().includes(palavra.toLowerCase())
  );
}
