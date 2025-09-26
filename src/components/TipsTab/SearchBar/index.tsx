// components/TipsTab/SearchBar/index.tsx
import React from 'react';
import { Search, X } from 'lucide-react';
import styles from './styles.module.css';

interface SearchBarProps {
  searchTerm: string;
  onSearchChange: (term: string) => void;
}

export function SearchBar({ searchTerm, onSearchChange }: SearchBarProps) {
  const clearSearch = () => {
    onSearchChange('');
  };

  return (
    <div className={styles.searchContainer}>
      <div className={styles.searchInputWrapper}>
        <Search className={styles.searchIcon} size={20} />
        <input
          type="text"
          placeholder="Buscar dicas por título ou descrição..."
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          className={styles.searchInput}
        />
        {searchTerm && (
          <button 
            onClick={clearSearch}
            className={styles.clearButton}
          >
            <X size={16} />
          </button>
        )}
      </div>
    </div>
  );
}
