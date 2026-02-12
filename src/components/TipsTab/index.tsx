'use client';

import React, { useState, useEffect, useMemo } from 'react';
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

export function TipsTab() {
  const [categoria, setCategoria] = useState(categorias[0]);
  const [videos, setVideos] = useState<Video[]>([]);
  const [invalidThumbs, setInvalidThumbs] = useState<Record<string, boolean>>({});

  useEffect(() => {
    setVideos(getVideosPorCategoria(categoria));
    setInvalidThumbs({});
  }, [categoria]);

  /**
   * ✅ Memo Premium
   * Evita recriar objetos a cada render
   */
  const videosFormatados = useMemo(() => {
    return videos.map(v => ({
      ...v,
      videoUrl: `https://youtube.com/watch?v=${v.id}`,
      thumbMax: `https://img.youtube.com/vi/${v.id}/maxresdefault.jpg`,
      thumbSd: `https://img.youtube.com/vi/${v.id}/sddefault.jpg`,
      thumbHq: `https://img.youtube.com/vi/${v.id}/hqdefault.jpg`,
    }));
  }, [videos]);

  /**
   * ✅ Remove vídeos inválidos automaticamente
   */
  const videosValidos = videosFormatados.filter(v => !invalidThumbs[v.id]);

  return (
    <div className={styles.tipsContainer}>
      <div className={styles.header}>
        <h2 className="text-3xl font-bold tracking-tight">
          Dicas em Vídeo para Vendedores
        </h2>
        <p className="text-muted-foreground mt-2">
          Conteúdo curado para aprimorar suas habilidades, direto do YouTube.
        </p>
      </div>

      <div className={styles.controls}>
        <div className={styles.categoryFilter}>
          {categorias.map(cat => (
            <Button
              key={cat}
              variant={categoria === cat ? "default" : "outline"}
              onClick={() => setCategoria(cat)}
              className="transition-all rounded-full"
            >
              {cat}
            </Button>
          ))}
        </div>
      </div>

      <Carousel opts={{ align: "start", loop: false }} className="w-full">
        <CarouselContent>

          {videosValidos.map((video) => (
            <CarouselItem key={video.id} className="md:basis-1/2 lg:basis-1/3">
              <div className="p-1 h-full">
                <Card className="group flex flex-col hover:border-primary transition-all h-full shadow-sm hover:shadow-lg hover:-translate-y-[2px] overflow-hidden">

                  <div className={`${styles.videoWrapper} relative overflow-hidden bg-slate-900`}>

                    <button
                      onClick={() => window.open(video.videoUrl, "_blank", "noopener,noreferrer")}
                      className="relative flex items-center justify-center w-full h-full group/link focus:outline-none"
                    >
                      <img
                        src={video.thumbMax}
                        loading="lazy"
                        alt={video.title}
                        onError={(e: any) => {
                          const img = e.currentTarget;

                          if (!img.dataset.fallback1) {
                            img.dataset.fallback1 = "true";
                            img.src = video.thumbSd;
                            return;
                          }

                          if (!img.dataset.fallback2) {
                            img.dataset.fallback2 = "true";
                            img.src = video.thumbHq;
                            return;
                          }

                          // ❌ Thumb inválida → remove vídeo
                          setInvalidThumbs(prev => ({
                            ...prev,
                            [video.id]: true
                          }));
                        }}
                        className="absolute inset-0 w-full h-full object-cover z-0 opacity-80 group-hover/link:opacity-100 transition-all duration-300 group-hover/link:scale-105"
                      />

                      {/* Play Overlay Premium - z-20 para ficar acima do gradiente */}
                      <div className="relative z-20 flex flex-col items-center gap-2 text-white">
                        <div className="w-14 h-14 rounded-full bg-red-600 flex items-center justify-center shadow-xl transition-transform duration-300 group-hover/link:scale-110 ring-4 ring-white/10">
                          <span className="ml-1 text-xl">▶</span>
                        </div>

                        <span className="text-[10px] font-black uppercase tracking-widest bg-black/60 px-3 py-1.5 rounded-full backdrop-blur-sm border border-white/10">
                          Assistir
                        </span>
                      </div>
                    </button>

                    {/* Gradiente Overlay - z-10 para ficar entre a imagem e o botão */}
                    <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent z-10" />
                  </div>

                  <CardHeader className="p-4 pb-2">
                    <CardTitle className="text-base group-hover:text-primary transition-colors line-clamp-2 font-bold leading-tight min-h-[2.5rem]">
                      {video.title}
                    </CardTitle>

                    <CardDescription className="text-[10px] uppercase font-black tracking-tighter opacity-60 flex items-center gap-2">
                      <span className="bg-muted px-1.5 py-0.5 rounded text-primary">
                        {video.channel}
                      </span>
                      <span>•</span>
                      <span>{video.publishedAt}</span>
                    </CardDescription>
                  </CardHeader>

                  <CardContent className="p-4 pt-0 flex-grow">
                    <p className="text-xs text-muted-foreground line-clamp-3 leading-relaxed">
                      {video.description}
                    </p>
                  </CardContent>

                </Card>
              </div>
            </CarouselItem>
          ))}

        </CarouselContent>

        <div className="hidden md:block">
          <CarouselPrevious className="-left-12" />
          <CarouselNext className="-right-12" />
        </div>
      </Carousel>
    </div>
  );
}
