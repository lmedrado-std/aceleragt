// components/TipsTab/index.tsx
import React, { useState, useEffect } from 'react';
import { buscarVideosGemini } from '@/lib/geminiSearch';
import styles from './styles.module.css';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Loader2, ExternalLink } from 'lucide-react';
import { Button } from '../ui/button';

interface Video {
  title: string;
  url: string;
  channel: string;
  publishedAt: string;
  description: string;
}

const categorias = [
  "Objeções de Vendas",
  "Aumentar Ticket Médio",
  "Atendimento ao Cliente",
  "Técnicas de Conversão",
  "Aumentar PA",
  "Fechamento de Vendas"
];

export function TipsTab() {
  const [videos, setVideos] = useState<Video[]>([]);
  const [categoria, setCategoria] = useState(categorias[0]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    buscarVideosGemini(categoria)
      .then(res => setVideos(res || []))
      .catch(err => {
        console.error("Erro ao buscar vídeos:", err);
        setVideos([]);
      })
      .finally(() => setLoading(false));
  }, [categoria]);

  return (
    <div className={styles.tipsContainer}>
      <div className={styles.header}>
        <h2>Dicas em Vídeo para Vendedores</h2>
        <p>Conteúdo sempre novo para aprimorar suas habilidades, direto do YouTube.</p>
      </div>

      <div className={styles.controls}>
        <div className={styles.categoryFilter}>
          {categorias.map(cat => (
            <Button
              key={cat}
              variant={categoria === cat ? "default" : "outline"}
              onClick={() => setCategoria(cat)}
              className="transition-all"
            >
              {cat}
            </Button>
          ))}
        </div>
      </div>

      {loading && (
        <div className={styles.loading}>
          <Loader2 className="mr-2 h-8 w-8 animate-spin text-primary" />
          <p>Buscando os melhores vídeos sobre "{categoria}"...</p>
        </div>
      )}

      {!loading && videos.length === 0 && (
        <div className={styles.noResults}>
          <h3>Nenhum vídeo encontrado</h3>
          <p>Não foi possível carregar os vídeos no momento. Por favor, tente outra categoria ou volte mais tarde.</p>
        </div>
      )}
      
      {!loading && videos.length > 0 && (
        <div className={styles.tipsGrid}>
          {videos.map((video, index) => (
            <Card as="a" href={video.url} target="_blank" rel="noopener noreferrer" key={video.url || index} className="group flex flex-col hover:border-primary transition-all">
              <CardHeader>
                <CardTitle className="text-lg group-hover:text-primary transition-colors">{video.title}</CardTitle>
                <CardDescription className="text-xs">{video.channel} - {video.publishedAt}</CardDescription>
              </CardHeader>
              <CardContent className="flex-grow">
                <p className="text-sm text-muted-foreground">{video.description}</p>
              </CardContent>
              <div className="p-4 pt-0 mt-auto">
                 <Button variant="ghost" size="sm" className="w-full justify-start text-primary">
                    <ExternalLink className="mr-2 h-4 w-4"/> Assistir no YouTube
                 </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
