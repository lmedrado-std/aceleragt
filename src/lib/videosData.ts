// lib/videosData.ts — VERSÃO PRO DEFINITIVA

export interface Video {
  id: string;
  title: string;
  channel: string;
  publishedAt: string;
  description: string;
  tags: string[];
}

export const videos: Video[] = [
  {
    id: "ac_f-RYd2p8",
    title: "Como Quebrar a Objeção 'VOU PENSAR'",
    channel: "Thiago Concer",
    publishedAt: "1 ano",
    description: "Técnica prática para lidar com a famosa objeção que trava muitas vendas no varejo.",
    tags: ["objeção", "conversão", "fechamento"]
  },
  {
    id: "aqz-KE-bpKQ",
    title: "Como Responder ao 'TÁ CARO'",
    channel: "Thiago Concer",
    publishedAt: "8 meses",
    description: "Aprenda a justificar o valor do seu produto sem precisar dar desconto logo de cara.",
    tags: ["objeção", "valor"]
  },
  {
    id: "Fn4KxRBBtuU",
    title: "Como Aumentar o P.A. (Produtos por Atendimento)",
    channel: "Sucesso em Vendas",
    publishedAt: "1 ano",
    description: "Dicas práticas de cross-selling para oferecer itens complementares e aumentar o volume por venda.",
    tags: ["pa", "ticket", "cross"]
  },
  {
    id: "Kz6l9f-4iAI",
    title: "Melhor Técnica de Fechamento de Vendas",
    channel: "Ricardo Jordão",
    publishedAt: "2 anos",
    description: "Descubra o momento ideal de pedir a venda e como conduzir o cliente ao fechamento natural.",
    tags: ["fechamento", "conversão"]
  },
  {
    id: "84E4a5zWjI8",
    title: "Como Fazer um EXCELENTE ATENDIMENTO",
    channel: "Diego Maia",
    publishedAt: "1 ano",
    description: "Os pilares fundamentais para encantar o cliente desde o primeiro segundo de contato.",
    tags: ["atendimento"]
  },
  {
    id: "oE9i5-m_q9A",
    title: "Atendimento ao Cliente: 5 Dicas de Ouro",
    channel: "Sebrae",
    publishedAt: "2 anos",
    description: "Dicas fundamentais do Sebrae para garantir a satisfação e fidelização do seu cliente.",
    tags: ["atendimento"]
  },
  {
    id: "0tH8A-A2M9Q",
    title: "3 Dicas Para Aumentar o Ticket Médio",
    channel: "Varejo Inteligente",
    publishedAt: "1 ano",
    description: "Estratégias de exposição e abordagem para elevar o valor médio de cada cupom fiscal.",
    tags: ["ticket"]
  },
  {
    id: "pD4I4-x6dI0",
    title: "Psicologia Aplicada às Vendas",
    channel: "Igor Borges",
    publishedAt: "2 anos",
    description: "Entenda o comportamento humano e use gatilhos mentais éticos para converter mais.",
    tags: ["conversão"]
  }
];

export function getVideosPorCategoria(cat: string) {
  const map: Record<string, string[]> = {
    "Objeções de Vendas": ["objeção"],
    "Aumentar Ticket Médio": ["ticket", "valor"],
    "Atendimento ao Cliente": ["atendimento"],
    "Técnicas de Conversão": ["conversão"],
    "Aumentar PA": ["pa", "cross"],
    "Fechamento de Vendas": ["fechamento"]
  };

  const tags = map[cat] ?? [];
  return videos.filter(v => v.tags.some(t => tags.includes(t)));
}
