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

const getEmbedUrl = (url: string): string => {
  if (!url) return "";

  try {
    const parsed = new URL(url);

    if (parsed.pathname.includes("/embed/")) {
      const id = parsed.pathname.split("/embed/")[1];
      return `https://www.youtube.com/embed/${id}`;
    }

    let videoId = "";

    if (parsed.searchParams.get("v")) {
      videoId = parsed.searchParams.get("v")!;
    }

    if (parsed.hostname.includes("youtu.be")) {
      videoId = parsed.pathname.replace("/", "");
    }

    if (parsed.pathname.includes("/shorts/")) {
      videoId = parsed.pathname.split("/shorts/")[1];
    }

    if (parsed.pathname.includes("/live/")) {
      videoId = parsed.pathname.split("/live/")[1];
    }

    videoId = videoId.split("?")[0].split("&")[0];

    if (videoId.length === 11) {
      return `https://www.youtube.com/embed/${videoId}`;
    }

    return "";
  } catch {
    return "";
  }
};


export function TipsTab() {
  const [videos, setVideos] = useState<Video[]>([]);
  const [categoria, setCategoria] = useState(categorias[0]);

  useEffect(() => {
    setVideos(getVideosPorCategoria(categoria));
  }, [categoria]);

  const videosDisponiveis = videos.filter(video => {
      const embedUrl = getEmbedUrl(video.url);
      return embedUrl !== "";
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
                    const embedUrl = getEmbedUrl(video.url);
                    return (
                        <CarouselItem key={index} className="md:basis-1/2 lg:basis-1/3">
                            <div className="p-1 h-full">
                                <Card className="group flex flex-col hover:border-primary transition-all h-full">
                                    <div className={styles.videoWrapper}>
                                        {embedUrl ? (
                                          <iframe
                                            src={embedUrl}
                                            title={video.title}
                                            frameBorder="0"
                                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                            allowFullScreen
                                            loading="lazy"
                                          />
                                        ) : (
                                          <div className="flex items-center justify-center h-full text-sm text-muted-foreground bg-muted">
                                            Vídeo indisponível
                                          </div>
                                        )}
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
