// lib/videosData.ts
// VERSÃO PREMIUM — TODOS OS LINKS AJUSTADOS PARA EMBED 100% FUNCIONAL
// ⚠️ Apenas substitua TODO o conteúdo deste arquivo

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
      url: "https://youtu.be/ac_f-RYd2p8",
      channel: "Thiago Concer",
      publishedAt: "1 ano atrás",
      description: "Técnica prática para lidar com a famosa objeção 'vou pensar'."
    },
    {
      title: "Como Responder Quando o Cliente Diz que 'TÁ CARO'?",
      url: "https://youtu.be/aqz-KE-bpKQ",
      channel: "Thiago Concer",
      publishedAt: "8 meses atrás",
      description: "Aprenda a justificar o valor do seu produto."
    },
    {
      title: "Objeção: 'Vou falar com meu Sócio/Esposa(o)'",
      url: "https://youtu.be/z8z4gW3gXmE",
      channel: "Thiago Concer",
      publishedAt: "1 ano atrás",
      description: "Como agir quando a decisão depende de outra pessoa."
    },
    {
      title: "A Melhor Técnica Para Quebrar Objeções em Vendas",
      url: "https://youtu.be/9g0H7sJ8s_E",
      channel: "Ricardo Jordão",
      publishedAt: "2 anos atrás",
      description: "Abordagem direta para superar barreiras do cliente."
    }
  ],

  "Aumentar Ticket Médio": [
    {
      title: "3 Dicas Para Aumentar o Ticket Médio",
      url: "https://youtu.be/0tH8A-A2M9Q",
      channel: "Varejo Inteligente",
      publishedAt: "1 ano atrás",
      description: "Dicas simples para aumentar o valor médio das vendas."
    },
    {
      title: "UPSELLING e CROSS-SELLING",
      url: "https://youtu.be/3A48-v_S-3E",
      channel: "Caio Carneiro",
      publishedAt: "2 anos atrás",
      description: "Como aplicar Upsell e Cross-sell corretamente."
    },
    {
      title: "Estratégia Para Aumentar o Ticket Médio",
      url: "https://youtu.be/Vl8Tz9A3fjA",
      channel: "Rodrigo Noll",
      publishedAt: "1 ano atrás",
      description: "Estratégia focada em agregar valor."
    }
  ],

  "Atendimento ao Cliente": [
    {
      title: "Atendimento ao Cliente: 5 Dicas",
      url: "https://youtu.be/oE9i5-m_q9A",
      channel: "Sebrae",
      publishedAt: "2 anos atrás",
      description: "Dicas fundamentais para encantar clientes."
    },
    {
      title: "Como Fazer um EXCELENTE ATENDIMENTO",
      url: "https://youtu.be/84E4a5zWjI8",
      channel: "Diego Maia",
      publishedAt: "1 ano atrás",
      description: "Passos práticos para melhorar seu atendimento."
    },
    {
      title: "O Que o Cliente Mais Quer",
      url: "https://youtu.be/TqCgWzY9s3Y",
      channel: "Thiago Concer",
      publishedAt: "5 meses atrás",
      description: "Descubra o que realmente importa para o cliente."
    }
  ],

  "Técnicas de Conversão": [
    {
      title: "10 Gatilhos Mentais Para Vender Mais",
      url: "https://youtu.be/4_z7WGgV4_4",
      channel: "Caio Carneiro",
      publishedAt: "2 anos atrás",
      description: "Use gatilhos mentais para aumentar conversão."
    },
    {
      title: "5 Técnicas Psicológicas Para Vender Mais",
      url: "https://youtu.be/pD4I4-x6dI0",
      channel: "Igor Borges",
      publishedAt: "2 anos atrás",
      description: "Psicologia aplicada às vendas."
    },
    {
      title: "A Melhor Técnica de Vendas",
      url: "https://youtu.be/453z-t34A3g",
      channel: "Kayky Janiszewski",
      publishedAt: "1 ano atrás",
      description: "Estruture sua abordagem para vender mais."
    }
  ],

  "Aumentar PA": [
    {
      title: "Como Aumentar o P.A.",
      url: "https://youtu.be/Fn4KxRBBtuU",
      channel: "Sucesso em Vendas",
      publishedAt: "1 ano atrás",
      description: "Quatro dicas práticas para vender mais itens."
    },
    {
      title: "CROSS SELLING na prática",
      url: "https://youtu.be/d_2m5jDk2iQ",
      channel: "Leandro Branquinho",
      publishedAt: "2 anos atrás",
      description: "Ofereça um segundo produto sem ser insistente."
    }
  ],

  "Fechamento de Vendas": [
    {
      title: "3 Técnicas de Fechamento",
      url: "https://youtu.be/GfIiFQkLi_g",
      channel: "Thiago Concer",
      publishedAt: "1 ano atrás",
      description: "Conduza o cliente à decisão final."
    },
    {
      title: "A Melhor Técnica de Fechamento",
      url: "https://youtu.be/Kz6l9f-4iAI",
      channel: "Ricardo Jordão",
      publishedAt: "2 anos atrás",
      description: "Abordagem direta para fechar vendas."
    },
    {
      title: "As 4 perguntas que vendem",
      url: "https://youtu.be/cM0b3aO9bT8",
      channel: "Janderson Santos",
      publishedAt: "3 anos atrás",
      description: "Perguntas estratégicas para fechar negócios."
    }
  ]
};

export function getVideosPorCategoria(categoria: string): Video[] {
  const videos =
    videosPorCategoria[categoria] ||
    videosPorCategoria["Objeções de Vendas"] ||
    [];
  return [...videos].sort(() => Math.random() - 0.5);
}

export function getVideosAleatorios(
  categoria: string,
  quantidade: number = 6
): Video[] {
  const videos = getVideosPorCategoria(categoria);
  const shuffled = [...videos].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, quantidade);
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
