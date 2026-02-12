'use client';

import React, { useState, useMemo } from 'react';
import { getVideosPorCategoria } from '@/lib/videosData';
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

  const videos = useMemo(
    () => getVideosPorCategoria(categoria),
    [categoria]
  );

  const videosFormatados = useMemo(() => {
    return videos.map(v => ({
      ...v,
      videoUrl: `https://youtube.com/watch?v=${v.id}`,
      thumb: `https://img.youtube.com/vi/${v.id}/hqdefault.jpg`,
    }));
  }, [videos]);

  return (
    <div className={styles.tipsContainer}>
      <div className={styles.header}>
        <h2 className="text-3xl font-bold tracking-tight">
          Dicas em Vídeo para Vendedores
        </h2>
        <p className="text-muted-foreground mt-2">
          Conteúdo curado inteligente para acelerar seus resultados.
        </p>
      </div>

      <div className="flex flex-wrap gap-2 justify-center mb-8">
        {categorias.map(cat => (
          <Button
            key={cat}
            variant={categoria === cat ? "default" : "outline"}
            onClick={() => setCategoria(cat)}
            className="rounded-full transition-all"
          >
            {cat}
          </Button>
        ))}
      </div>

      {videosFormatados.length > 0 ? (
        <Carousel opts={{ align: "start", loop: false }} className="w-full">
          <CarouselContent>
            {videosFormatados.map(video => (
              <CarouselItem key={video.id} className="md:basis-1/2 lg:basis-1/3">
                <div className="p-1 h-full">
                  <Card className="group flex flex-col h-full overflow-hidden hover:shadow-lg transition-all duration-300">
                    <div className={`${styles.videoWrapper} relative bg-slate-900 aspect-video`}>
                      <button
                        onClick={() => window.open(video.videoUrl, "_blank", "noopener,noreferrer")}
                        className="relative flex items-center justify-center w-full h-full focus:outline-none"
                      >
                        <img
                          src={video.thumb}
                          loading="lazy"
                          alt={video.title}
                          className="absolute inset-0 w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-all duration-300 group-hover:scale-105"
                        />

                        <div className="relative z-20 flex flex-col items-center gap-2 text-white">
                          <div className="w-14 h-14 rounded-full bg-red-600 flex items-center justify-center shadow-xl group-hover:scale-110 transition-transform">
                            <span className="ml-1 text-xl">▶</span>
                          </div>
                          <span className="text-[10px] font-black uppercase bg-black/60 px-3 py-1.5 rounded-full backdrop-blur-sm border border-white/10">
                            Assistir
                          </span>
                        </div>
                      </button>

                      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent z-10" />
                    </div>

                    <CardHeader className="p-4 pb-2">
                      <CardTitle className="text-base line-clamp-2 font-bold leading-tight min-h-[2.5rem] group-hover:text-primary transition-colors">
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
      ) : (
        <div className="text-center py-12 bg-muted/20 rounded-xl border-2 border-dashed">
          <p className="text-muted-foreground">Nenhum vídeo disponível nesta categoria no momento.</p>
        </div>
      )}
    </div>
  );
}
