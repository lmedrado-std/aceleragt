
export interface Video {
  title: string;
  url: string;
  channel: string;
  publishedAt: string;
  description: string;
}

export const videosPorCategoria: Record<string, Video[]> = {
  "Objeções de Vendas": [
    {
      title: "COMO LIDAR COM OBJEÇÕES EM VENDAS",
      url: "https://www.youtube.com/watch?v=_t_ng7BVpZ4",
      channel: "Thiago Concer",
      publishedAt: "2 anos atrás",
      description: "Aprenda a superar as objeções mais comuns dos clientes e feche mais vendas."
    },
    {
      title: "5 DICAS PRÁTICAS PARA ZERAR TODAS AS OBJEÇÕES",
      url: "https://www.youtube.com/watch?v=LgFwSWSbi4g",
      channel: "Thiago Concer",
      publishedAt: "1 ano atrás",
      description: "Dicas práticas e eficazes para lidar com qualquer tipo de objeção."
    },
    {
      title: "Lide com Objeções em Vendas: 7 Técnicas Infalíveis",
      url: "https://www.youtube.com/watch?v=zrsh5WpWjrM",
      channel: "Gilberto Augusto",
      publishedAt: "8 meses atrás",
      description: "Sete técnicas comprovadas para transformar um 'não' em um 'sim'."
    },
    {
      title: "QUEBRA DE OBJEÇÕES: passo a passo para execução",
      url: "https://www.youtube.com/watch?v=86JsyvTQKFw",
      channel: "Meetime",
      publishedAt: "1 ano atrás",
      description: "Um guia passo a passo para quebrar objeções de forma sistemática."
    },
    {
      title: "Cliente falou que tá caro, e agora?",
      url: "https://www.youtube.com/watch?v=pWalt1fX1Qc",
      channel: "Vendas Pro",
      publishedAt: "6 meses atrás",
      description: "Como responder de forma convincente quando o cliente alega que o preço está alto."
    },
    {
      title: "AULA COMPLETA SOBRE CONTORNO DE OBJEÇÕES",
      url: "https://www.youtube.com/watch?v=BvinAAx2heU",
      channel: "Diego Maia",
      publishedAt: "1 ano atrás",
      description: "Uma aula aprofundada com estratégias para contornar objeções de forma eficaz."
    },
    {
      title: "Como responder a “não tenho orçamento”",
      url: "https://www.youtube.com/watch?v=5u8v1mLMmV8",
      channel: "Sales School",
      publishedAt: "1 ano atrás",
      description: "Estratégias para lidar com a clássica objeção de falta de orçamento."
    },
     {
      title: "Objeção “preciso pensar”",
      url: "https://www.youtube.com/watch?v=Tg5Ww2D8H6I",
      channel: "Vendas Inteligentes",
      publishedAt: "4 meses atrás",
      description: "Técnicas eficazes para lidar com a famosa objeção 'preciso de um tempo para pensar'."
    },
    {
      title: "Fechamento após objeções",
      url: "https://www.youtube.com/watch?v=R4_H7-r3gP4",
      channel: "Negociação Pro",
      publishedAt: "1 ano atrás",
      description: "Como fazer a transição suave do contorno da objeção para o fechamento da venda."
    }
  ],
  "Aumentar Ticket Médio": [
    {
      title: "Aprenda a Calcular o TICKET MÉDIO",
      url: "https://www.youtube.com/watch?v=Se4G1vWzU9o",
      channel: "Sebrae",
      publishedAt: "1 ano atrás",
      description: "Entenda o que é o ticket médio e como calculá-lo para sua loja."
    },
    {
      title: "Como Aumentar Seu Ticket Médio",
      url: "https://www.youtube.com/watch?v=Y6uXQ7SFApw",
      channel: "Gustavo Cândido",
      publishedAt: "1 ano atrás",
      description: "Estratégias práticas para fazer cada cliente gastar mais."
    },
    {
      title: "Aumente vendas com upsell e cross-sell",
      url: "https://www.youtube.com/watch?v=gze6SCf0NdA",
      channel: "RD Station",
      publishedAt: "1 ano atrás",
      description: "Domine as técnicas de upsell e cross-sell para aumentar o valor de cada venda."
    },
    {
      title: "03 dicas para aumentar o ticket-médio",
      url: "https://www.youtube.com/watch?v=k5d8ueveP3M",
      channel: "Dicas de Vendas",
      publishedAt: "1 ano atrás",
      description: "Três dicas simples e diretas para aumentar o ticket médio da sua loja."
    },
    {
      title: "CROSS SELLING: Venda Adicional",
      url: "https://www.youtube.com/watch?v=tQSuAj3M2jA",
      channel: "Sales School",
      publishedAt: "1 ano atrás",
      description: "A arte de oferecer produtos complementares de forma natural."
    },
    {
      title: "Up-sell eficaz",
      url: "https://www.youtube.com/watch?v=LzR4xO9f5YQ",
      channel: "Vendas High Performance",
      publishedAt: "1 ano atrás",
      description: "Como fazer um upsell sem parecer insistente ou irritar o cliente."
    },
     {
      title: "Pacotes promocionais",
      url: "https://www.youtube.com/watch?v=Q5a1HdP2bY8",
      channel: "E-commerce Pro",
      publishedAt: "1 ano atrás",
      description: "Como criar pacotes e combos que aumentam o valor percebido pelo cliente."
    },
    {
      title: "Fidelização e ticket",
      url: "https://www.youtube.com/watch?v=F6h0DsQ8x3U",
      channel: "Customer Success Pro",
      publishedAt: "1 ano atrás",
      description: "A relação direta entre a fidelização de clientes e o aumento do ticket médio."
    }
  ],
  "Atendimento ao Cliente": [
    {
      title: "Dicas para excelência no atendimento",
      url: "https://www.youtube.com/watch?v=Flv0LnmSUBM",
      channel: "Endeavor Brasil",
      publishedAt: "1 ano atrás",
      description: "Como se destacar da concorrência através de um atendimento memorável."
    },
    {
      title: "Melhores práticas de atendimento",
      url: "https://www.youtube.com/watch?v=8rjey8HmRxM",
      channel: "CS Academy",
      publishedAt: "1 ano atrás",
      description: "As cinco práticas essenciais que todo profissional de atendimento deve dominar."
    },
    {
      title: "Excelência no atendimento ao cliente",
      url: "https://www.youtube.com/watch?v=UYKjt3mt28k",
      channel: "Senac EAD",
      publishedAt: "1 ano atrás",
      description: "Um treinamento completo sobre cortesia, empatia e resolução de problemas."
    },
    {
      title: "5 etapas para atendimento de excelência",
      url: "https://www.youtube.com/watch?v=WpzXOJ6Ifug",
      channel: "Atendimento Pro",
      publishedAt: "1 ano atrás",
      description: "Um processo estruturado para gerenciar o atendimento de forma eficiente."
    },
    {
      title: "Atingindo excelência no atendimento",
      url: "https://www.youtube.com/watch?v=R5HTguAqZt0",
      channel: "Alfredo Soares",
      publishedAt: "1 ano atrás",
      description: "Aprenda os princípios de um atendimento de excelência com especialistas."
    },
    {
      title: "Empatia no atendimento",
      url: "https://www.youtube.com/watch?v=M4v3ErL1c2N",
      channel: "G4 Educação",
      publishedAt: "1 ano atrás",
      description: "Como desenvolver e aplicar a empatia para se conectar com os clientes."
    },
    {
      title: "Resolução de conflitos",
      url: "https://www.youtube.com/watch?v=G7t6FpQ9a3U",
      channel: "Negociação Pro",
      publishedAt: "1 ano atrás",
      description: "Técnicas para transformar um cliente insatisfeito em um fã da sua marca."
    }
  ],
  "Técnicas de Conversão": [
    {
      title: "7 Técnicas de Vendas para aumentar a CONVERSÃO",
      url: "https://www.youtube.com/watch?v=6SYMRVA0RIU",
      channel: "RD Station",
      publishedAt: "1 ano atrás",
      description: "Técnicas poderosas e práticas para aplicar em cada fase do seu processo comercial."
    },
    {
      title: "10 GATILHOS MENTAIS Para VENDER MAIS",
      url: "https://www.youtube.com/watch?v=4_z7WGgV4_4",
      channel: "Caio Carneiro",
      publishedAt: "1 ano atrás",
      description: "Aprenda a usar os gatilhos mentais mais poderosos para influenciar a decisão de compra."
    },
    {
      title: "Como usar o gatilho da escassez para vender mais",
      url: "https://www.youtube.com/watch?v=cGiu-F2IfgA",
      channel: "Diego Maia",
      publishedAt: "1 ano atrás",
      description: "Aprenda a criar um senso de urgência que acelera a decisão de compra do cliente."
    },
    {
      title: "A Técnica do 'Porquê' para Aumentar a Conversão",
      url: "https://www.youtube.com/watch?v=1sCy8gJ9I9M",
      channel: "Sales School",
      publishedAt: "1 ano atrás",
      description: "Descubra como aprofundar a necessidade do cliente e conectar sua solução de forma mais eficaz."
    }
  ],
  "Aumentar PA": [
    {
      title: "PRODUTOS POR ATENDIMENTO, INDICADOR de VENDA",
      url: "https://www.youtube.com/watch?v=np-ayvscmjs",
      channel: "Mil Bijus",
      publishedAt: "1 ano atrás",
      description: "Entenda a importância do indicador P.A. (Peças por Atendimento) e como ele pode multiplicar seu faturamento."
    },
    {
      title: "Como Aumentar o P.A. (Produtos por Atendimento)",
      url: "https://www.youtube.com/watch?v=Fn4KxRBBtuU",
      channel: "Sucesso em Vendas",
      publishedAt: "1 ano atrás",
      description: "Quatro dicas práticas para você aumentar o número de produtos vendidos para cada cliente."
    },
    {
      title: "Técnicas para Vender Mais Itens para o Mesmo Cliente",
      url: "https://www.youtube.com/watch?v=oB9rP8L4sPE",
      channel: "Sebrae",
      publishedAt: "1 ano atrás",
      description: "Estratégias para identificar oportunidades e oferecer mais produtos em uma única venda."
    }
  ],
  "Fechamento de Vendas": [
    {
      title: "Eu Aumentei Minhas Vendas Com Essas 10 Dicas DE FECHAMENTO",
      url: "https://www.youtube.com/watch?v=1xlbodwW_xo",
      channel: "Leandro Rosadas",
      publishedAt: "1 ano atrás",
      description: "Conheça 10 técnicas de fechamento de vendas infalíveis para você aplicar e vender mais."
    },
    {
      title: "APRENDA 3 TÉCNICAS DE FECHAMENTO PARA VENDAS",
      url: "https://www.youtube.com/watch?v=GfIiFQkLi_g",
      channel: "Thiago Concer",
      publishedAt: "1 ano atrás",
      description: "Aprenda 3 técnicas de fechamento que funcionam para vendas transacionais."
    },
    {
      title: "Técnicas de Fechamento de Vendas que Funcionam",
      url: "https://www.youtube.com/watch?v=mDplp1E2YgE",
      channel: "Gilberto Augusto",
      publishedAt: "1 ano atrás",
      description: "Um compilado de técnicas eficazes para garantir que a venda seja concluída."
    },
    {
      title: "Como Fazer um Fechamento de Vendas por Telefone",
      url: "https://www.youtube.com/watch?v=t5K_LqYrL_s",
      channel: "Vendas por Telefone",
      publishedAt: "1 ano atrás",
      description: "Dicas específicas para fechar negócios quando a interação é remota."
    }
  ]
};

// Função para buscar vídeos por categoria (agora embaralha a lista)
export function getVideosPorCategoria(categoria: string): Video[] {
  const videos = videosPorCategoria[categoria] || videosPorCategoria["Objeções de Vendas"] || [];
  // Embaralha o array para exibir uma ordem diferente a cada vez
  return [...videos].sort(() => Math.random() - 0.5);
}

// Função para buscar vídeos aleatórios de uma categoria
export function getVideosAleatorios(categoria: string, quantidade: number = 6): Video[] {
  const videos = getVideosPorCategoria(categoria);
  const shuffled = [...videos].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, quantidade);
}

// Função para buscar todos os vídeos
export function getTodosOsVideos(): Video[] {
  return Object.values(videosPorCategoria).flat();
}

// Função para buscar vídeos por palavra-chave
export function buscarVideosPorPalavra(palavra: string): Video[] {
  const todosVideos = getTodosOsVideos();
  return todosVideos.filter(video => 
    video.title.toLowerCase().includes(palavra.toLowerCase()) ||
    video.description.toLowerCase().includes(palavra.toLowerCase()) ||
    video.channel.toLowerCase().includes(palavra.toLowerCase())
  );
}
