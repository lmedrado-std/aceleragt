// components/TipsTab/CategoryFilter/index.tsx
import React from 'react';
import styles from './styles.module.css';

interface Category {
  name: string;
  color: string;
  icon: string;
}

interface CategoryFilterProps {
  categories: Category[];
  selectedCategory: string;
  onCategoryChange: (category: string) => void;
}

export function CategoryFilter({ categories, selectedCategory, onCategoryChange }: CategoryFilterProps) {
  return (
    <div className={styles.categoryFilter}>
      <button
        className={`${styles.categoryButton} ${selectedCategory === 'all' ? styles.active : ''}`}
        onClick={() => onCategoryChange('all')}
      >
        Todas
      </button>
      {categories.map(category => (
        <button
          key={category.name}
          className={`${styles.categoryButton} ${selectedCategory === category.name ? styles.active : ''}`}
          onClick={() => onCategoryChange(category.name)}
          style={{ 
            '--category-color': category.color 
          } as React.CSSProperties}
        >
          <span className={styles.categoryIcon}>{category.icon}</span>
          {category.name}
        </button>
      ))}
    </div>
  );
}
