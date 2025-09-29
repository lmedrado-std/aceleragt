
export interface Video {
  title: string;
  url: string;
  channel: string;
  publishedAt: string;
  description: string;
}

export async function buscarVideosGemini(query: string): Promise<Video[]> {
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
    const res = await fetch(GEMINI_API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    });

    if (!res.ok) {
      console.error("Erro na API Gemini:", res.status, await res.text());
      return [];
    }

    const data = await res.json();
    let videos: Video[] = [];

    if (data?.candidates?.[0]?.content?.parts?.[0]?.text) {
      let rawText = data.candidates[0].content.parts[0].text;
      
      rawText = rawText.replace(/```json/g, '').replace(/```/g, '').trim();

      try {
        videos = JSON.parse(rawText);
      } catch (e) {
        console.error("Falha ao fazer parse do JSON principal. Tentando extrair múltiplos objetos.", e);
        try {
            const regex = /{[\s\S]*?}/g;
            const matches = rawText.match(regex);
            if (matches) {
              videos = matches.map(match => {
                  try { return JSON.parse(match) as Video } catch { return null }
              }).filter((v): v is Video => v !== null);
            }
        } catch (fallbackError) {
             console.error("Falha no fallback de extração de JSON.", fallbackError);
             videos = [];
        }
      }
    }
    return videos;

  } catch (error) {
    console.error("Erro ao se comunicar com a API do Gemini:", error);
    return [];
  }
}

export async function buscarVideosGeminiComFallback(query: string): Promise<Video[]> {
  let videos = await buscarVideosGemini(query);
  
  if (!videos || videos.length === 0) {
    console.log(`Fallback 1: Buscando por "vendas ${query}"`);
    videos = await buscarVideosGemini(`vendas ${query}`);
  }
  
  if (!videos || videos.length === 0) {
    console.log(`Fallback 2: Buscando por "sales tips ${query}" em inglês`);
    videos = await buscarVideosGemini(`sales tips ${query}`);
  }

  if (!videos || videos.length === 0) {
    console.log("Fallback final: Retornando vídeos estáticos.");
    videos = [
      {
        title: "8 TÉCNICAS DE VENDAS INFALÍVEIS! | Thiago Concer",
        url: "https://www.youtube.com/watch?v=Q03Xaaipb60",
        channel: "Thiago Concer",
        publishedAt: "1 ano atrás",
        description: "Aprenda 8 técnicas de vendas que funcionam para vender qualquer coisa, para qualquer pessoa, em qualquer lugar."
      },
      {
        title: "Como Vender Mais e Melhor? 10 Dicas Práticas",
        url: "https://www.youtube.com/watch?v=qD35gHk0-i4",
        channel: "Sebrae",
        publishedAt: "4 anos atrás",
        description: "Confira 10 dicas práticas de como vender mais e melhor, para que o seu negócio tenha sucesso no mercado."
      },
      {
        title: "COMO QUEBRAR QUALQUER OBJEÇÃO DE VENDAS - O GUIA DEFINITIVO",
        url: "https://www.youtube.com/watch?v=73z-Y9W-31M",
        channel: "Jordão Felix",
        publishedAt: "2 anos atrás",
        description: "Um guia definitivo para quebrar qualquer objeção que seu cliente apresente na hora da venda."
      }
    ];
  }
  
  return videos;
}
