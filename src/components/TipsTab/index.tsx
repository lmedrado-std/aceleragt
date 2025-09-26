// components/TipsTab/index.tsx
import React, { useState, useEffect } from 'react';
import { TipCard } from './TipCard';
import { CategoryFilter } from './CategoryFilter';
import { SearchBar } from './SearchBar';
import styles from './styles.module.css';
import salesTips from '@/lib/sales-tips.json';

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

export function TipsTab() {
  const [tips, setTips] = useState<Tip[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTipsData();
  }, []);

  const loadTipsData = () => {
    try {
      setTips(salesTips.educational_content as Tip[]);
      setCategories(salesTips.categories);
    } catch (error) {
      console.error('Erro ao carregar dicas:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredTips = tips.filter(tip => {
    const matchesCategory = selectedCategory === 'all' || tip.category === selectedCategory;
    const matchesSearch = tip.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         tip.description.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  if (loading) {
    return <div className={styles.loading}>Carregando dicas...</div>;
  }

  return (
    <div className={styles.tipsContainer}>
      <div className={styles.header}>
        <h2>Dicas para Vendedores</h2>
        <p>Aprimore suas habilidades com conteúdo selecionado</p>
      </div>

      <div className={styles.controls}>
        <SearchBar 
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
        />
        <CategoryFilter
          categories={categories}
          selectedCategory={selectedCategory}
          onCategoryChange={setSelectedCategory}
        />
      </div>

      <div className={styles.tipsGrid}>
        {filteredTips.map(tip => (
          <TipCard
            key={tip.id}
            tip={tip}
            category={categories.find(cat => cat.name === tip.category)}
          />
        ))}
      </div>

      {filteredTips.length === 0 && (
        <div className={styles.noResults}>
          <p>Nenhuma dica encontrada para os filtros selecionados.</p>
        </div>
      )}
    </div>
  );
}
