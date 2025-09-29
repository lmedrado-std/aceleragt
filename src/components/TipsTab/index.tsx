// components/TipsTab/index.tsx
import React, { useState, useEffect } from 'react';
import { getVideosPorCategoria, Video } from '@/lib/videosData';
import styles from './styles.module.css';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { ExternalLink } from 'lucide-react';
import { Button } from '../ui/button';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/navigation';

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

  useEffect(() => {
    setVideos(getVideosPorCategoria(categoria));
  }, [categoria]);

  const handleOpenVideo = (url: string) => {
    const videoUrl = url.startsWith('http') ? url : `https://${url}`;
    window.open(videoUrl, '_blank', 'noopener,noreferrer');
  };

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
      
        <Swiper
            modules={[Navigation]}
            slidesPerView={1}
            spaceBetween={24}
            navigation
            breakpoints={{
            640: { slidesPerView: 1 },
            900: { slidesPerView: 2 },
            1200: { slidesPerView: 3 }
            }}
            style={{ padding: '4px 4px 32px 4px' }}
        >
            {videos.map((video, index) => (
            <SwiperSlide key={index} style={{ height: 'auto' }}>
                <Card className="group flex flex-col hover:border-primary transition-all h-full">
                    <CardHeader>
                    <CardTitle className="text-lg group-hover:text-primary transition-colors">{video.title}</CardTitle>
                    <CardDescription className="text-xs">{video.channel} - {video.publishedAt}</CardDescription>
                    </CardHeader>
                    <CardContent className="flex-grow">
                    <p className="text-sm text-muted-foreground">{video.description}</p>
                    </CardContent>
                    <div className="p-4 pt-0 mt-auto">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-full justify-start text-primary"
                      onClick={(e) => {
                        e.preventDefault();
                        handleOpenVideo(video.url);
                      }}
                    >
                      <ExternalLink className="mr-2 h-4 w-4" /> Assistir no YouTube
                    </Button>
                    </div>
                </Card>
            </SwiperSlide>
            ))}
        </Swiper>
    </div>
  );
}
