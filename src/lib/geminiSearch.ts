
export async function buscarVideosGemini(query: string) {
  const GEMINI_API_KEY = "AIzaSyDlKzUk76TeGv0rmeU2qDYLi1mrvz8i5sE";
  const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${GEMINI_API_KEY}`;

  const prompt = `
    Liste os 8 melhores e mais recentes vídeos do YouTube em português sobre "${query}".
    Retorne apenas um array de objetos JSON, sem nenhum outro texto ou formatação.
    O array deve seguir exatamente este formato: 
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
    let videos = [];

    if (data?.candidates?.[0]?.content?.parts?.[0]?.text) {
      let rawText = data.candidates[0].content.parts[0].text;
      
      // Limpa a resposta, removendo os blocos de código ```json e ```
      rawText = rawText.replace(/```json/g, '').replace(/```/g, '').trim();

      try {
        videos = JSON.parse(rawText);
      } catch (e) {
        console.error("Falha ao fazer parse do JSON principal. Tentando extrair múltiplos objetos.", e);
        // Fallback: Tenta extrair múltiplos objetos JSON se o parse do array falhar
        try {
            const regex = /{[\s\S]*?}/g;
            videos = [...rawText.matchAll(regex)].map(match => {
                try { return JSON.parse(match[0]) } catch { return null }
            }).filter(Boolean);
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
