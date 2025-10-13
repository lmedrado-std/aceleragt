// components/TipsTab/index.tsx
import React, { useState, useEffect } from 'react';
import { getVideosPorCategoria, Video } from '@/lib/videosData';
import styles from './styles.module.css';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
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
            {videos.map((video, index) => {
              const videoId = getYouTubeVideoId(video.url);
              return (
                <SwiperSlide key={index} style={{ height: 'auto' }}>
                    <Card className="group flex flex-col hover:border-primary transition-all h-full">
                        {videoId ? (
                            <div className={styles.videoWrapper}>
                                <iframe
                                    src={`https://www.youtube.com/embed/${videoId}`}
                                    title={video.title}
                                    frameBorder="0"
                                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                    allowFullScreen
                                ></iframe>
                            </div>
                        ) : (
                          <div className="aspect-video bg-muted flex items-center justify-center">
                            <p className="text-sm text-muted-foreground">Vídeo indisponível</p>
                          </div>
                        )}
                        <CardHeader>
                            <CardTitle className="text-base group-hover:text-primary transition-colors">{video.title}</CardTitle>
                            <CardDescription className="text-xs">{video.channel} - {video.publishedAt}</CardDescription>
                        </CardHeader>
                        <CardContent className="flex-grow">
                            <p className="text-sm text-muted-foreground">{video.description}</p>
                        </CardContent>
                    </Card>
                </SwiperSlide>
              )
            })}
        </Swiper>
    </div>
  );
}
