// components/TipsTab/TipCard/index.tsx
import React from 'react';
import { ExternalLink, Play, FileText, Clock, Award } from 'lucide-react';
import styles from './styles.module.css';

interface Tip {
  id: number;
  title: string;
  url: string;
  category: string;
  type: 'video' | 'article';
  platform: string;
  duration: string;
  level: 'basico' | 'intermediario' | 'avancado';
  description: string;
  thumbnail?: string;
}

interface Category {
  name: string;
  color: string;
  icon: string;
}

interface TipCardProps {
  tip: Tip;
  category?: Category;
}

export function TipCard({ tip, category }: TipCardProps) {
  const handleOpenTip = () => {
    // Abrir link em nova aba
    window.open(tip.url, '_blank', 'noopener,noreferrer');
  };

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'basico': return '#4CAF50';
      case 'intermediario': return '#FF9800';
      case 'avancado': return '#F44336';
      default: return '#9E9E9E';
    }
  };

  const getTypeIcon = (type: string) => {
    return type === 'video' ? <Play size={16} /> : <FileText size={16} />;
  };

  return (
    <div className={styles.tipCard}>
      <div className={styles.cardHeader} style={{ borderTopColor: category?.color }}>
        <div className={styles.categoryBadge} style={{ backgroundColor: category?.color }}>
          <span className={styles.categoryIcon}>{category?.icon}</span>
          <span className={styles.categoryName}>{tip.category}</span>
        </div>
        <div className={styles.levelBadge} style={{ backgroundColor: getLevelColor(tip.level) }}>
          <Award size={12} />
          <span>{tip.level}</span>
        </div>
      </div>

      <div className={styles.cardContent}>
        <h3 className={styles.tipTitle}>{tip.title}</h3>
        <p className={styles.tipDescription}>{tip.description}</p>
        
        <div className={styles.tipMeta}>
          <div className={styles.metaItem}>
            {getTypeIcon(tip.type)}
            <span>{tip.type === 'video' ? 'Vídeo' : 'Artigo'}</span>
          </div>
          <div className={styles.metaItem}>
            <Clock size={16} />
            <span>{tip.duration}</span>
          </div>
        </div>
      </div>

      <div className={styles.cardFooter}>
        <button 
          className={styles.openButton}
          onClick={handleOpenTip}
        >
          <ExternalLink size={16} />
          Acessar Conteúdo
        </button>
      </div>
    </div>
  );
}
