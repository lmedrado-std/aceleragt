
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
      description: "Como lidar com as principais objeções de vendas diretamente com o especialista brasileiro Thiago Concer."
    },
    {
      title: "5 DICAS PRÁTICAS PARA ZERAR TODAS AS OBJEÇÕES",
      url: "https://www.youtube.com/watch?v=LgFwSWSbi4g",
      channel: "Thiago Concer",
      publishedAt: "1 ano atrás",
      description: "Técnicas práticas para eliminar objeções e aumentar suas vendas de forma eficaz."
    },
    {
      title: "Lide com Objeções em Vendas: 7 Técnicas Infalíveis",
      url: "https://www.youtube.com/watch?v=zrsh5WpWjrM",
      channel: "Gilberto Augusto",
      publishedAt: "8 meses atrás",
      description: "Sete técnicas comprovadas para superar qualquer objeção dos clientes."
    },
    {
      title: "QUEBRA DE OBJEÇÕES: passo a passo para execução",
      url: "https://www.youtube.com/watch?v=86JsyvTQKFw",
      channel: "Meetime",
      publishedAt: "1 ano atrás",
      description: "Processo completo para quebrar objeções de forma sistemática."
    },
    {
      title: "Cliente falou que ta caro, e agora? - Série Mestre das Vendas",
      url: "https://www.youtube.com/watch?v=pWalt1fX1Qc",
      channel: "Leandro Rosadas",
      publishedAt: "3 anos atrás",
      description: "Como responder de forma convincente quando o cliente diz que está caro."
    },
    {
      title: "AULA COMPLETA SOBRE CONTORNO DE OBJEÇÕES",
      url: "https://www.youtube.com/watch?v=BvinAAx2heU",
      channel: "Diego Maia",
      publishedAt: "1 ano atrás",
      description: "Aula completa com estratégias para contornar objeções de forma eficaz."
    }
  ],
  "Aumentar Ticket Médio": [
    {
      title: "Aprenda a Calcular o TICKET MÉDIO e Aumente suas Vendas",
      url: "https://www.youtube.com/watch?v=Se4G1vWzU9o",
      channel: "Gustavo Cândido",
      publishedAt: "3 anos atrás",
      description: "Como calcular ticket médio e estratégias para aumentá-lo significativamente."
    },
    {
      title: "Como Aumentar Seu Ticket Médio e Ampliar seu Faturamento",
      url: "https://www.youtube.com/watch?v=Y6uXQ7SFApw",
      channel: "EXTREMO PODCAST",
      publishedAt: "2 anos atrás",
      description: "Estratégias de upsell, cross-sell e fidelização para aumentar ticket médio."
    },
    {
      title: "Como aumentar o ticket médio e vender mais na sua loja",
      url: "https://www.youtube.com/watch?v=gze6SCf0NdA",
      channel: "Fred Alecrim",
      publishedAt: "1 ano atrás",
      description: "4 truques eficazes para aumentar movimento e vendas da loja."
    },
    {
      title: "03 dicas para aumentar o ticket-médio da loja",
      url: "https://www.youtube.com/watch?v=k5d8ueveP3M",
      channel: "Sebrae",
      publishedAt: "2 anos atrás",
      description: "Dicas práticas para elevar produtividade vendendo mais com mesmo movimento."
    },
    {
      title: "CROSS SELLING: Venda Adicional que FUNCIONA",
      url: "https://www.youtube.com/watch?v=tQSuAj3M2jA",
      channel: "Rejiano Vedovatto",
      publishedAt: "3 anos atrás",
      description: "Técnicas de venda adicional para aumentar ticket sem pressionar cliente."
    }
  ],
  "Atendimento ao Cliente": [
    {
      title: "Dicas para alcançar a excelência no atendimento ao cliente",
      url: "https://www.youtube.com/watch?v=Flv0LnmSUBM",
      channel: "Endeavor Brasil",
      publishedAt: "8 anos atrás",
      description: "Estratégias para destacar seu atendimento em mercado competitivo."
    },
    {
      title: "Melhores práticas de Atendimento ao Cliente",
      url: "https://www.youtube.com/watch?v=8rjey8HmRxM",
      channel: "CS Academy",
      publishedAt: "3 anos atrás",
      description: "5 práticas essenciais para fidelizar clientes e aumentar vendas."
    },
    {
      title: "Excelência no Atendimento ao Cliente",
      url: "https://www.youtube.com/watch?v=UYKjt3mt28k",
      channel: "Trecsson",
      publishedAt: "4 anos atrás",
      description: "Treinamento completo sobre cortesia, empatia e resolução de problemas."
    },
    {
      title: "5 etapas para um atendimento de excelência",
      url: "https://www.youtube.com/watch?v=WpzXOJ6Ifug",
      channel: "Varejo de Sucesso",
      publishedAt: "2 anos atrás",
      description: "Processo estruturado para gerenciar atendimento de forma eficiente."
    },
    {
      title: "Atingindo a excelência no atendimento ao cliente",
      url: "https://www.youtube.com/watch?v=R5HTguAqZt0",
      channel: "Senac EAD",
      publishedAt: "1 ano atrás",
      description: "Coordenadora de pós-graduação ensina princípios de excelência."
    }
  ],
  "Técnicas de Conversão": [
    {
      title: "Como Converter Leads em Vendas com Inbound Marketing",
      url: "https://www.youtube.com/watch?v=CoRIl_vfVqg",
      channel: "RD Station",
      publishedAt: "1 mês atrás",
      description: "Estratégias essenciais para atrair, nutrir e converter leads em vendas."
    },
    {
      title: "PROCESSO DE CONVERSÃO: 6 PASSOS PARA AUMENTAR SUAS VENDAS",
      url: "https://www.youtube.com/watch?v=k0SVQhLIdxU",
      channel: "Processo de Vendas",
      publishedAt: "3 anos atrás",
      description: "Processo completo para otimizar conversão em cada etapa do funil."
    },
    {
      title: "Prospecção e Abordagem! Como aumentar as taxas de conversão",
      url: "https://www.youtube.com/watch?v=-T_5qRl6AIA",
      channel: "Sales School por Meetime",
      publishedAt: "2 anos atrás",
      description: "Técnicas multicanais para melhorar taxas de conversão no topo do funil."
    },
    {
      title: "7 Técnicas de Vendas para aumentar a CONVERSÃO",
      url: "https://www.youtube.com/watch?v=6SYMRVA0RIU",
      channel: "Caio Carneiro",
      publishedAt: "7 meses atrás",
      description: "Técnicas específicas para cada fase do processo comercial."
    },
    {
      title: "10 GATILHOS MENTAIS Para VENDER MAIS",
      url: "https://www.youtube.com/watch?v=4_z7WGgV4_4",
      channel: "Diego Maia",
      publishedAt: "1 ano atrás",
      description: "Gatilhos mentais mais poderosos para influenciar decisões de compra."
    }
  ],
  "Aumentar PA": [
    {
      title: "PRODUTOS POR ATENDIMENTO, INDICADOR de VENDA",
      url: "https://www.youtube.com/watch?v=np-ayvscmjs",
      channel: "Mil Bijus",
      publishedAt: "1 ano atrás",
      description: "Como calcular e aumentar PA para multiplicar faturamento da loja."
    },
    {
      title: "Como Aumentar o P.A. (Produtos por Atendimento)",
      url: "https://www.youtube.com/watch?v=Fn4KxRBBtuU",
      channel: "Daniela Almeida",
      publishedAt: "4 anos atrás",
      description: "4 dicas práticas para aumentar número de produtos por atendimento."
    },
    {
      title: "Como vender peças adicionais - Os 3 pilares do atendimento",
      url: "https://www.youtube.com/watch?v=ZbAMgKMLuv8",
      channel: "Sucesso em Vendas",
      publishedAt: "5 anos atrás",
      description: "Estratégias para adicionar mais produtos na venda no varejo."
    },
    {
      title: "PEÇAS POR ATENDIMENTO OU P.A (SÉRIE MÉTRICAS)",
      url: "https://www.youtube.com/watch?v=jFsC2w5ZY3w",
      channel: "Simone Sgarbi",
      publishedAt: "3 anos atrás",
      description: "Série completa sobre como trabalhar indicador de PA."
    },
    {
      title: "Aumente em 40% a sua conversão em Vendas no Varejo",
      url: "https://www.youtube.com/watch?v=q65cMPacxNk",
      channel: "Sebrae",
      publishedAt: "4 anos atrás",
      description: "Técnicas para aumentar conversão e PA no varejo físico."
    }
  ],
  "Fechamento de Vendas": [
    {
      title: "Eu Aumentei Minhas Vendas Com Essas 10 Dicas DE FECHAMENTO",
      url: "https://www.youtube.com/watch?v=1xlbodwW_xo",
      channel: "Leandro Rosadas",
      publishedAt: "6 meses atrás",
      description: "10 técnicas infalíveis de fechamento para aumentar vendas drasticamente."
    },
    {
      title: "APRENDA 3 TÉCNICAS DE FECHAMENTO PARA VENDAS",
      url: "https://www.youtube.com/watch?v=GfIiFQkLi_g",
      channel: "Thiago Concer",
      publishedAt: "2 anos atrás",
      description: "3 técnicas de fechamento para vendas transacionais que funcionam."
    },
    {
      title: "Técnicas de Fechamento de Vendas: Como fechar 9 de 10 clientes",
      url: "https://www.youtube.com/watch?v=p4v04j5z-M0",
      channel: "Gilberto Augusto",
      publishedAt: "1 ano atrás",
      description: "Técnicas de fechamento poderosas para vendedores e empreendedores."
    },
    {
      title: "3 TÉCNICAS DE FECHAMENTO DE VENDAS para ser eficaz",
      url: "https://www.youtube.com/watch?v=n7Zxot3J5Do",
      channel: "Vendas por Telefone",
      publishedAt: "2 anos atrás",
      description: "Principais técnicas de fechamento adaptadas para vendas por telefone."
    },
    {
      title: "AS 7 MELHORES TÉCNICAS DE FECHAMENTO DE VENDAS",
      url: "https://www.youtube.com/watch?v=LqADa4s3-7g",
      channel: "Thiago Concer",
      publishedAt: "1 ano atrás",
      description: "7 técnicas de fechamento mais eficazes testadas no mercado brasileiro."
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
