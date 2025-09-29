
export interface Video {
  title: string;
  url: string;
  channel: string;
  publishedAt: string;
  description: string;
}

// FALLBACK: Vídeos estáticos por categoria
function getVideosFallback(query: string): Video[] {
  console.log("🔄 Usando fallback para:", query);
  
  const videosPorCategoria: Record<string, Video[]> = {
    "Objeções de Vendas": [
      {
        title: "COMO QUEBRAR QUALQUER OBJEÇÃO DE VENDAS - O GUIA DEFINITIVO",
        url: "https://www.youtube.com/watch?v=73z-Y9W-31M",
        channel: "Jordão Felix",
        publishedAt: "2 anos atrás",
        description: "Um guia definitivo para quebrar qualquer objeção que seu cliente apresente na hora da venda."
      },
      {
        title: "5 Objeções Mais Comuns e Como Responder",
        url: "https://www.youtube.com/watch?v=NffzHwX32nU",
        channel: "Vendedor Expert",
        publishedAt: "1 mês atrás", 
        description: "Aprenda a transformar objeções em oportunidades de venda."
      }
    ],
    "Aumentar Ticket Médio": [
      {
        title: "Como aumentar o Ticket Médio da sua loja",
        url: "https://www.youtube.com/watch?v=2z4xYfO-ySk",
        channel: "Varejo Inteligente",
        publishedAt: "3 semanas atrás",
        description: "Estratégias para aumentar o valor médio das vendas e o lucro da sua loja."
      }
    ],
    "Atendimento ao Cliente": [
      {
        title: "Atendimento que Encanta e Fideliza",
        url: "https://www.youtube.com/watch?v=m4x3cT8wTz0",
        channel: "Customer Success",
        publishedAt: "1 semana atrás",
        description: "Como criar experiências memoráveis no atendimento ao cliente para fidelizar e vender mais."
      }
    ],
    "Técnicas de Conversão": [
      {
        title: "10 GATILHOS MENTAIS Para VENDER MAIS | Técnicas de Persuasão",
        url: "https://www.youtube.com/watch?v=4_z7WGgV4_4",
        channel: "Diego Maia",
        publishedAt: "6 meses atrás",
        description: "Aprenda os gatilhos mentais mais poderosos para aumentar suas conversões e vender mais."
      }
    ],
    "Aumentar PA": [
      {
        title: "Aumente em 40% a sua conversão em Vendas no Varejo com essa técnica",
        url: "https://www.youtube.com/watch?v=3bGrB4Fk4sk",
        channel: "Sebrae",
        publishedAt: "4 anos atrás",
        description: "Técnicas eficazes para aumentar o número de peças vendidas por cliente e a conversão."
      }
    ],
    "Fechamento de Vendas": [
      {
        title: "AS 7 MELHORES TÉCNICAS DE FECHAMENTO DE VENDAS",
        url: "https://www.youtube.com/watch?v=B11j2uX-s3g",
        channel: "Thiago Concer",
        publishedAt: "2 anos atrás",
        description: "Domine as técnicas de fechamento mais eficazes para converter prospects em clientes."
      }
    ]
  };

  // Busca por categoria exata ou usa "genérico"
  return videosPorCategoria[query] || videosPorCategoria["Objeções de Vendas"] || [
    {
      title: "8 TÉCNICAS DE VENDAS INFALÍVEIS! | Thiago Concer",
      url: "https://www.youtube.com/watch?v=Q03Xaaipb60",
      channel: "Thiago Concer",
      publishedAt: "1 ano atrás",
      description: "Aprenda 8 técnicas de vendas que funcionam para vender qualquer coisa, para qualquer pessoa, em qualquer lugar."
    }
  ];
}


export async function buscarVideosGeminiComFallback(query: string): Promise<Video[]> {
  const GEMINI_API_KEY = "AIzaSyDlKzUk76TeGv0rmeU2qDYLi1mrvz8i5sE";
  const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/chat-bison-001:generateMessage?key=${GEMINI_API_KEY}`;

  const prompt = {
    // prompt id para chat API
    "prompt": {
      "messages": [
        { "author": "user", "content": `
Liste no mínimo 3 e no máximo 8 vídeos do YouTube lançados nos últimos anos, em português, sobre "${query}".
Se não for possível, liste vídeos relacionados ao tema.
Responda apenas o array JSON de objetos:
[
  {
    "title": "Título do Vídeo",
    "url": "https://www.youtube.com/watch?v=...",
    "channel": "Nome do Canal",
    "publishedAt": "Data",
    "description": "Descrição curta."
  }
]
` }
      ]
    }
  };

  try {
    const res = await fetch(GEMINI_API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(prompt)
    });
    if (!res.ok) return getVideosFallback(query);
    const data = await res.json();
    const text = data?.candidates?.[0]?.message?.content || "";
    const raw = text.replace(/``````/g, "").trim();
    let videos: Video[] = [];
    try { videos = JSON.parse(raw); }
    catch { return getVideosFallback(query); }
    return videos.length ? videos : getVideosFallback(query);
  } catch {
    return getVideosFallback(query);
  }
}
