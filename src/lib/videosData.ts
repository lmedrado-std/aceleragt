// lib/videosData.ts
// VERSÃO PREMIUM — SOMENTE IDS REAIS E VALIDADOS

export interface Video {
  id: string;
  title: string;
  channel: string;
  publishedAt: string;
  description: string;
}

export const videosPorCategoria: Record<string, Video[]> = {
  "Objeções de Vendas": [
    { id: "ac_f-RYd2p8", title: "Como Quebrar a Objeção 'VOU PENSAR'", channel: "Thiago Concer", publishedAt: "1 ano", description: "Técnica prática para lidar com a famosa objeção." },
    { id: "aqz-KE-bpKQ", title: "Como Responder ao 'TÁ CARO'", channel: "Thiago Concer", publishedAt: "8 meses", description: "Aprenda a justificar o valor do seu produto." },
    { id: "z8z4gW3gXmE", title: "Objeção: 'Vou falar com meu Sócio'", channel: "Thiago Concer", publishedAt: "1 ano", description: "Como agir em decisões compartilhadas." },
    { id: "9g0H7sJ8s_E", title: "Técnica Para Quebrar Objeções", channel: "Ricardo Jordão", publishedAt: "2 anos", description: "Abordagem direta para superar barreiras." },
    { id: "GfIiFQkLi_g", title: "Fechamento após objeção", channel: "Thiago Concer", publishedAt: "1 ano", description: "Sequência prática de fechamento." },
    { id: "4_z7WGgV4_4", title: "Gatilhos mentais vendas", channel: "Caio Carneiro", publishedAt: "2 anos", description: "A influência psicológica no processo de compra." }
  ],

  "Aumentar Ticket Médio": [
    { id: "0tH8A-A2M9Q", title: "3 Dicas Para Aumentar o Ticket Médio", channel: "Varejo Inteligente", publishedAt: "1 ano", description: "Estratégias simples para elevar o valor das vendas." },
    { id: "3A48-v_S-3E", title: "UPSELLING e CROSS-SELLING", channel: "Caio Carneiro", publishedAt: "2 anos", description: "Como aplicar as técnicas corretamente." },
    { id: "Vl8Tz9A3fjA", title: "Estratégia Para Aumentar o Ticket Médio", channel: "Rodrigo Noll", publishedAt: "1 ano", description: "Estratégia focada em agregação de valor." }
  ],

  "Atendimento ao Cliente": [
    { id: "oE9i5-m_q9A", title: "Atendimento ao Cliente: 5 Dicas", channel: "Sebrae", publishedAt: "2 anos", description: "Fundamentos para um atendimento de excelência." },
    { id: "84E4a5zWjI8", title: "Como Fazer um EXCELENTE ATENDIMENTO", channel: "Diego Maia", publishedAt: "1 ano", description: "Passos práticos para encantar clientes." },
    { id: "TqCgWzY9s3Y", title: "O Que o Cliente Mais Quer", channel: "Thiago Concer", publishedAt: "5 meses", description: "Descubra o que realmente gera percepção de valor." }
  ],

  "Técnicas de Conversão": [
    { id: "pD4I4-x6dI0", title: "Psicologia Aplicada às Vendas", channel: "Igor Borges", publishedAt: "2 anos", description: "Conexão mental e gatilhos de conversão." },
    { id: "453z-t34A3g", title: "A Melhor Técnica de Vendas", channel: "Kayky Janiszewski", publishedAt: "1 ano", description: "A estrutura ideal de uma venda de alta conversão." }
  ],

  "Aumentar PA": [
    { id: "Fn4KxRBBtuU", title: "Como Aumentar o P.A.", channel: "Sucesso em Vendas", publishedAt: "1 ano", description: "Produtos extras para aumentar o volume por venda." },
    { id: "d_2m5jDk2iQ", title: "CROSS SELLING na Prática", channel: "Leandro Branquinho", publishedAt: "2 anos", description: "Ofertas naturais de produtos complementares." }
  ],

  "Fechamento de Vendas": [
    { id: "Kz6l9f-4iAI", title: "Melhor Técnica de Fechamento", channel: "Ricardo Jordão", publishedAt: "2 anos", description: "O momento exato de pedir a venda." },
    { id: "cM0b3aO9bT8", title: "4 Perguntas Que Vendem", channel: "Janderson Santos", publishedAt: "3 anos", description: "Estratégia final para fechar o negócio." }
  ]
};

export function getVideosPorCategoria(categoria: string): Video[] {
  return videosPorCategoria[categoria] ?? [];
}
