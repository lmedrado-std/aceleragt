'use client';

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
  const regExp = /(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/|live\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/;
  const match = url.match(regExp);
  return match && match[1] ? match[1] : "";
};

const getThumb = (url: string) => {
  const id = extractVideoId(url);
  if (!id) return "";
  return `https://img.youtube.com/vi/${id}/hqdefault.jpg`;
};

export function TipsTab() {
  const [videos, setVideos] = useState<Video[]>([]);
  const [categoria, setCategoria] = useState(categorias[0]);

  useEffect(() => {
    setVideos(getVideosPorCategoria(categoria));
  }, [categoria]);

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
          {videos.map((video, index) => {
            const thumb = getThumb(video.url);

            return (
              <CarouselItem key={index} className="md:basis-1/2 lg:basis-1/3">
                <div className="p-1 h-full">
                  <Card className="group flex flex-col hover:border-primary transition-all h-full shadow-sm hover:shadow-lg hover:-translate-y-[2px]">
                    <div className={`${styles.videoWrapper} relative overflow-hidden rounded-t-lg bg-black`}>
                      {thumb ? (
                        <a
                          href={video.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="relative flex items-center justify-center w-full h-full group/link"
                        >
                          <img
                            src={thumb}
                            className="absolute inset-0 w-full h-full object-cover opacity-80 group-hover/link:opacity-100 transition-opacity duration-300"
                            alt={video.title}
                          />

                          <div className="relative z-10 flex flex-col items-center gap-2 text-white">
                            <div className="w-14 h-14 rounded-full bg-red-600 flex items-center justify-center shadow-xl scale-100 group-hover/link:scale-110 transition-transform duration-300">
                              <span className="ml-1 text-xl">▶</span>
                            </div>
                            <span className="text-[10px] font-black uppercase tracking-widest bg-black/60 px-2 py-1 rounded backdrop-blur-sm">
                              Assistir no YouTube
                            </span>
                          </div>
                        </a>
                      ) : (
                        <div className="flex items-center justify-center h-full text-sm text-muted-foreground bg-muted">
                          Vídeo indisponível
                        </div>
                      )}
                    </div>

                    <CardHeader>
                      <CardTitle className="text-base group-hover:text-primary transition-colors line-clamp-2 font-bold leading-tight">
                        {video.title}
                      </CardTitle>
                      <CardDescription className="text-[10px] uppercase font-bold tracking-tight opacity-70">
                        {video.channel} • {video.publishedAt}
                      </CardDescription>
                    </CardHeader>

                    <CardContent className="flex-grow">
                      <p className="text-xs text-muted-foreground line-clamp-3 leading-relaxed">
                        {video.description}
                      </p>
                    </CardContent>
                  </Card>
                </div>
              </CarouselItem>
            )
          })}
        </CarouselContent>

        <CarouselPrevious className="hidden md:flex -left-12" />
        <CarouselNext className="hidden md:flex -right-12" />
      </Carousel>
    </div>
  );
}
