// components/TipsTab/index.tsx
import React, { useState, useEffect } from 'react';
import { getVideosPorCategoria, Video } from '@/lib/videosData';
import styles from './styles.module.css';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel"


const categorias = [
  "Objeções de Vendas",
  "Aumentar Ticket Médio", 
  "Atendimento ao Cliente",
  "Técnicas de Conversão",
  "Aumentar PA",
  "Fechamento de Vendas"
];

// Helper para extrair o ID do vídeo do YouTube
const getYouTubeVideoId = (url: string): string | null => {
  try {
    const urlObj = new URL(url);
    if (urlObj.hostname === 'www.youtube.com' || urlObj.hostname === 'youtube.com') {
      return urlObj.searchParams.get('v');
    }
    if (urlObj.hostname === 'youtu.be') {
      return urlObj.pathname.slice(1);
    }
  } catch (e) {
    console.error("URL de vídeo inválida:", url, e);
  }
  return null;
};


export function TipsTab() {
  const [videos, setVideos] = useState<Video[]>([]);
  const [categoria, setCategoria] = useState(categorias[0]);

  useEffect(() => {
    // A função getVideosPorCategoria agora retorna vídeos aleatórios
    setVideos(getVideosPorCategoria(categoria));
  }, [categoria]);

  // Filtra apenas os vídeos que têm um ID de vídeo válido extraível da URL
  const videosDisponiveis = videos.filter(video => {
      const videoId = getYouTubeVideoId(video.url);
      return videoId && videoId.trim() !== "";
  });

  return (
    <div className={styles.tipsContainer}>
      <div className={styles.header}>
        <h2>Dicas em Vídeo para Vendedores</h2>
        <p>Conteúdo curado para aprimorar suas habilidades, direto do YouTube.</p>
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
      
        <Carousel
            opts={{
                align: "start",
                loop: true,
            }}
            className="w-full"
        >
            <CarouselContent>
                 {videosDisponiveis.map((video, index) => {
                    const videoId = getYouTubeVideoId(video.url);
                    return (
                        <CarouselItem key={index} className="md:basis-1/2 lg:basis-1/3">
                            <div className="p-1 h-full">
                                <Card className="group flex flex-col hover:border-primary transition-all h-full">
                                    <div className={styles.videoWrapper}>
                                        <iframe
                                            src={`https://www.youtube.com/embed/${videoId}`}
                                            title={video.title}
                                            frameBorder="0"
                                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                            allowFullScreen
                                        ></iframe>
                                    </div>
                                    <CardHeader>
                                        <CardTitle className="text-base group-hover:text-primary transition-colors">{video.title}</CardTitle>
                                        <CardDescription className="text-xs">{video.channel} - {video.publishedAt}</CardDescription>
                                    </CardHeader>
                                    <CardContent className="flex-grow">
                                        <p className="text-sm text-muted-foreground">{video.description}</p>
                                    </CardContent>
                                </Card>
                            </div>
                        </CarouselItem>
                    )
                })}
            </CarouselContent>
            <CarouselPrevious className="ml-12" />
            <CarouselNext className="mr-12" />
        </Carousel>
    </div>
  );
}
