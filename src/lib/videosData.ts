
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
      title: "Como Quebrar a Objeção 'VOU PENSAR' em Vendas",
      url: "https://www.youtube.com/watch?v=ac_f-RYd2p8",
      channel: "Thiago Concer",
      publishedAt: "1 ano atrás",
      description: "Técnica prática para lidar com a famosa objeção 'vou pensar' e não perder a venda."
    },
    {
      title: "Como Responder Quando o Cliente Diz que 'TÁ CARO'?",
      url: "https://www.youtube.com/watch?v=w7w0nZ4C7-I",
      channel: "Diego Maia",
      publishedAt: "8 meses atrás",
      description: "Aprenda a justificar o valor do seu produto quando o cliente questiona o preço."
    },
     {
      title: "Objeção: 'Vou falar com meu Sócio/Esposa(o)'",
      url: "https://www.youtube.com/watch?v=z8z4gW3gXmE",
      channel: "Thiago Concer",
      publishedAt: "1 ano atrás",
      description: "Como agir quando a decisão de compra depende de outra pessoa."
    },
    {
      title: "A Melhor Técnica Para Quebrar Objeções em Vendas",
      url: "https://www.youtube.com/watch?v=9g0H7sJ8s_E",
      channel: "Ricardo Jordão",
      publishedAt: "2 anos atrás",
      description: "Uma abordagem direta e eficaz para superar qualquer barreira imposta pelo cliente."
    },
     {
      title: "O Jeito Certo de Lidar com Objeções em Vendas",
      url: "https://www.youtube.com/watch?v=JdGj2a5A3yI",
      channel: "Paixão por Vendas",
      publishedAt: "1 ano atrás",
      description: "Descubra uma mentalidade e uma técnica para transformar objeções em oportunidades."
    },
    {
      title: "Como Contornar a Objeção 'Não Tenho Dinheiro'?",
      url: "https://www.youtube.com/watch?v=Kz6pDqgA3yE",
      channel: "Janderson Santos",
      publishedAt: "2 anos atrás",
      description: "Estratégias para lidar com a falta de orçamento do cliente e ainda assim fechar negócio."
    }
  ],
  "Aumentar Ticket Médio": [
    {
      title: "3 Dicas Para Aumentar o Ticket Médio da Sua Loja",
      url: "https://www.youtube.com/watch?v=0tH8A-A2M9Q",
      channel: "Varejo Inteligente",
      publishedAt: "1 ano atrás",
      description: "Dicas simples e aplicáveis para fazer com que cada cliente compre mais."
    },
    {
      title: "UPSELLING e CROSS-SELLING: Como Fazer do Jeito Certo",
      url: "https://www.youtube.com/watch?v=3A48-v_S-3E",
      channel: "Caio Carneiro",
      publishedAt: "2 anos atrás",
      description: "Aprenda a diferença e como aplicar Upsell e Cross-sell para vender mais."
    },
    {
      title: "Como Aumentar o Ticket Médio da Sua Empresa",
      url: "https://www.youtube.com/watch?v=Y6uXQ7SFApw",
      channel: "Gustavo Cândido",
      publishedAt: "1 ano atrás",
      description: "Estratégias práticas para aumentar o valor médio de cada venda realizada."
    },
    {
      title: "Estratégia Para Aumentar o Ticket Médio",
      url: "https://www.youtube.com/watch?v=Vl8Tz9A3fjA",
      channel: "Rodrigo Noll",
      publishedAt: "1 ano atrás",
      description: "Uma estratégia focada em agregar valor para que o cliente decida gastar mais."
    }
  ],
  "Atendimento ao Cliente": [
    {
      title: "Atendimento ao Cliente: 5 Dicas Para Colocar em Prática!",
      url: "https://www.youtube.com/watch?v=oE9i5-m_q9A",
      channel: "Sebrae",
      publishedAt: "2 anos atrás",
      description: "Dicas fundamentais do Sebrae para oferecer um atendimento que encanta e fideliza."
    },
    {
      title: "Como Fazer um EXCELENTE ATENDIMENTO ao Cliente",
      url: "https://www.youtube.com/watch?v=84E4a5zWjI8",
      channel: "Diego Maia",
      publishedAt: "1 ano atrás",
      description: "Passos práticos para transformar seu atendimento em uma poderosa ferramenta de vendas."
    },
    {
      title: "O Que o Cliente Mais Quer no Atendimento?",
      url: "https://www.youtube.com/watch?v=TqCgWzY9s3Y",
      channel: "Thiago Concer",
      publishedAt: "5 meses atrás",
      description: "Descubra o que realmente faz a diferença na percepção de valor do cliente."
    },
    {
      title: "Técnica de Atendimento que vai MULTIPLICAR suas Vendas",
      url: "https://www.youtube.com/watch?v=Pq86oF2H3W4",
      channel: "Leandro Rosadas",
      publishedAt: "2 anos atrás",
      description: "Uma técnica de abordagem e condução que pode aumentar drasticamente seus resultados."
    }
  ],
  "Técnicas de Conversão": [
    {
      title: "10 Gatilhos Mentais Para Vender Mais",
      url: "https://www.youtube.com/watch?v=4_z7WGgV4_4",
      channel: "Caio Carneiro",
      publishedAt: "2 anos atrás",
      description: "Descubra como os gatilhos mentais podem influenciar positivamente a decisão do seu cliente."
    },
    {
      title: "5 Técnicas Psicológicas Para Vender Mais",
      url: "https://www.youtube.com/watch?v=pD4I4-x6dI0",
      channel: "Igor Borges",
      publishedAt: "2 anos atrás",
      description: "Use a psicologia a seu favor para criar uma conexão mais forte com o cliente e vender mais."
    },
     {
      title: "Como Usar o Gatilho da ESCASSEZ Para Vender Mais?",
      url: "https://www.youtube.com/watch?v=cGiu-F2IfgA",
      channel: "Diego Maia",
      publishedAt: "1 ano atrás",
      description: "Aprenda a criar um senso de urgência que acelera a decisão de compra do cliente."
    },
    {
      title: "A Melhor Técnica de Vendas que eu Conheço",
      url: "https://www.youtube.com/watch?v=453z-t34A3g",
      channel: "Kayky Janiszewski",
      publishedAt: "1 ano atrás",
      description: "Uma técnica poderosa para estruturar sua abordagem de vendas e aumentar a conversão."
    }
  ],
  "Aumentar PA": [
    {
      title: "Como Aumentar o P.A. (Produtos por Atendimento)",
      url: "https://www.youtube.com/watch?v=Fn4KxRBBtuU",
      channel: "Sucesso em Vendas",
      publishedAt: "1 ano atrás",
      description: "Quatro dicas práticas para você aumentar o número de produtos vendidos para cada cliente."
    },
    {
      title: "CROSS SELLING: como oferecer um segundo produto?",
      url: "https://www.youtube.com/watch?v=d_2m5jDk2iQ",
      channel: "Leandro Branquinho",
      publishedAt: "2 anos atrás",
      description: "Aprenda o momento e a forma certa de oferecer um produto adicional sem ser insistente."
    },
    {
      title: "PA (PEÇAS POR ATENDIMENTO), INDICADOR DE VENDA",
      url: "https://www.youtube.com/watch?v=np-ayvscmjs",
      channel: "Mil Bijus",
      publishedAt: "1 ano atrás",
      description: "Entenda a importância do indicador P.A. e como ele pode multiplicar seu faturamento."
    }
  ],
  "Fechamento de Vendas": [
    {
      title: "Aprenda 3 Técnicas de Fechamento Para Vendas",
      url: "https://www.youtube.com/watch?v=GfIiFQkLi_g",
      channel: "Thiago Concer",
      publishedAt: "1 ano atrás",
      description: "Três técnicas poderosas e diretas para conduzir o cliente à decisão final de compra."
    },
    {
      title: "A Melhor Técnica de Fechamento de Vendas",
      url: "https://www.youtube.com/watch?v=Kz6l9f-4iAI",
      channel: "Ricardo Jordão",
      publishedAt: "2 anos atrás",
      description: "Uma abordagem sem rodeios para fechar a venda no momento certo."
    },
    {
      title: "FECHAMENTO DE VENDAS: as 4 perguntas que vendem",
      url: "https://www.youtube.com/watch?v=cM0b3aO9bT8",
      channel: "Janderson Santos",
      publishedAt: "3 anos atrás",
      description: "Quatro perguntas estratégicas para fazer durante a negociação e levar ao fechamento."
    },
    {
      title: "Nunca Mais Perca uma Venda com Essas Dicas de Fechamento",
      url: "https://www.youtube.com/watch?v=1xlbodwW_xo",
      channel: "Leandro Rosadas",
      publishedAt: "1 ano atrás",
      description: "Um conjunto de dicas práticas para aumentar sua taxa de conversão na etapa final da venda."
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
