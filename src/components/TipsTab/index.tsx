// components/TipsTab/index.tsx
'use client';

import React, { useState, useEffect, useRef } from 'react';
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
} from "@/components/ui/carousel";

const categorias = [
  "Objeções de Vendas",
  "Aumentar Ticket Médio",
  "Atendimento ao Cliente",
  "Técnicas de Conversão",
  "Aumentar PA",
  "Fechamento de Vendas"
];

const extractVideoId = (url: string): string => {
  if (!url) return "";

  // regex segura que pega SOMENTE o ID real do vídeo
  const regExp =
    /(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/|live\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/;

  const match = url.match(regExp);

  if (match && match[1]) {
    return match[1];
  }

  return "";
};

const getEmbedUrl = (url: string): string => {
  const id = extractVideoId(url);

  if (!id) return "";

  return `https://www.youtube.com/embed/${id}?rel=0&modestbranding=1&playsinline=1&enablejsapi=1`;
};

const getThumb = (url: string) => {
  const id = extractVideoId(url);
  if (!id) return "";
  return `https://img.youtube.com/vi/${id}/hqdefault.jpg`;
};

export function TipsTab() {
  const [videos, setVideos] = useState<Video[]>([]);
  const [categoria, setCategoria] = useState(categorias[0]);
  const iframeRefs = useRef<HTMLIFrameElement[]>([]);
  const [failedEmbeds, setFailedEmbeds] = useState<Record<number, boolean>>({});

  const pauseAllVideos = () => {
    iframeRefs.current.forEach((iframe) => {
      if (!iframe) return;
      iframe.contentWindow?.postMessage(
        JSON.stringify({
          event: "command",
          func: "pauseVideo",
          args: ""
        }),
        "*"
      );
    });
  };

  useEffect(() => {
    setVideos(getVideosPorCategoria(categoria));
    pauseAllVideos();
    iframeRefs.current = [];
    setFailedEmbeds({});
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
        opts={{ align: "start", loop: true }}
        className="w-full"
      >
        <CarouselContent>
          {videosDisponiveis.map((video, index) => {
            const embedUrl = getEmbedUrl(video.url);
            const thumb = getThumb(video.url);
            const failed = failedEmbeds[index];

            return (
              <CarouselItem key={index} className="md:basis-1/2 lg:basis-1/3">
                <div className="p-1 h-full">
                  <Card className="group flex flex-col hover:border-primary transition-all h-full shadow-sm hover:shadow-lg hover:-translate-y-[2px]">

                    <div className={`${styles.videoWrapper} relative overflow-hidden rounded-t-lg`}>

                      {/* Skeleton */}
                      <div className="absolute inset-0 bg-muted animate-pulse group-hover:opacity-0 transition-opacity duration-500" />

                      {!failed && embedUrl ? (
                        <iframe
                          ref={(el) => { if (el) iframeRefs.current[index] = el }}
                          src={embedUrl}
                          title={video.title}
                          referrerPolicy="strict-origin-when-cross-origin"
                          frameBorder="0"
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                          allowFullScreen
                          loading="lazy"
                          onError={() => {
                            setFailedEmbeds(prev => ({ ...prev, [index]: true }));
                          }}
                          className="relative z-10 w-full h-full aspect-video"
                        />
                      ) : (
                        <a
                          href={video.url}
                          target="_blank"
                          className="relative flex items-center justify-center w-full h-full bg-black"
                        >
                          {thumb && (
                            <img
                              src={thumb}
                              className="absolute inset-0 w-full h-full object-cover opacity-70"
                              alt={video.title}
                            />
                          )}

                          <div className="relative z-10 flex flex-col items-center gap-2 text-white">
                            <span className="text-xs uppercase tracking-wide">Assistir no YouTube</span>
                            <div className="w-12 h-12 rounded-full bg-red-600 flex items-center justify-center shadow-lg">
                              <span className="ml-1">▶</span>
                            </div>
                          </div>
                        </a>
                      )}

                      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent z-20" />
                    </div>

                    <CardHeader>
                      <CardTitle className="text-base group-hover:text-primary transition-colors line-clamp-2">
                        {video.title}
                      </CardTitle>
                      <CardDescription className="text-xs">
                        {video.channel} - {video.publishedAt}
                      </CardDescription>
                    </CardHeader>

                    <CardContent className="flex-grow">
                      <p className="text-sm text-muted-foreground line-clamp-3">
                        {video.description}
                      </p>
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
