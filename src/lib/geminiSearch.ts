
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
  const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${GEMINI_API_KEY}`;

  const prompt = `
    Liste no mínimo 3 e no máximo 8 vídeos do YouTube lançados nos últimos anos, em português, sobre "${query}".
    Se não for possível, liste vídeos relacionados ao tema, incluindo conteúdos motivacionais, técnicas, dicas ou exemplos práticos para vendedores.
    Responda SEMPRE apenas o array de objetos JSON, sem explicação, sem código, sem nada antes ou depois:
    [
      {
        "title": "Título do Vídeo",
        "url": "https://www.youtube.com/watch?v=...",
        "channel": "Nome do Canal",
        "publishedAt": "Data de Publicação (ex: '3 meses atrás' ou '20/05/2024')",
        "description": "Uma breve descrição do vídeo com no máximo 150 caracteres."
      }
    ]
  `;
  
  const body = {
    contents: [
      { role: "user", parts: [{ text: prompt }] }
    ]
  };

  try {
    console.log("🔍 Buscando vídeos para:", query);

    const res = await fetch(GEMINI_API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    });

    if (!res.ok) {
      console.error("❌ Erro na API Gemini:", res.status, await res.text());
      return getVideosFallback(query);
    }

    const data = await res.json();
    console.log("📊 Resposta da API:", data);

    let videos: Video[] = [];

    if (data?.candidates?.[0]?.content?.parts?.[0]?.text) {
      let rawText = data.candidates[0].content.parts[0].text;
      console.log("📝 Texto bruto:", rawText);
      
      rawText = rawText.replace(/```json/g, '').replace(/```/g, '').trim();

      try {
        videos = JSON.parse(rawText);
        console.log("✅ Vídeos parseados:", videos);
      } catch (e) {
        console.error("❌ Falha no parse JSON:", e);
        return getVideosFallback(query);
      }
    }

    if (!videos || videos.length === 0) {
      console.log("⚠️ Nenhum vídeo retornado, usando fallback");
      return getVideosFallback(query);
    }

    return videos;

  } catch (error) {
    console.error("💥 Erro geral:", error);
    return getVideosFallback(query);
  }
}
