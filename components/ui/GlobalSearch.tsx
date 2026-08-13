'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Search, X, Command } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface SearchItem {
  id: string;
  label: string;
  category: string;
  icon?: React.ReactNode;
  action: () => void;
}

interface GlobalSearchProps {
  items: SearchItem[];
  placeholder?: string;
  className?: string;
}

export function GlobalSearch({ items, placeholder = 'Buscar...', className = '' }: GlobalSearchProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredItems, setFilteredItems] = useState<SearchItem[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);

  // Filter items based on search query
  useEffect(() => {
    if (!searchQuery) {
      setFilteredItems(items);
      setSelectedIndex(0);
      return;
    }

    const filtered = items.filter(item =>
      item.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.category.toLowerCase().includes(searchQuery.toLowerCase())
    );
    setFilteredItems(filtered);
    setSelectedIndex(0);
  }, [searchQuery, items]);

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Cmd/Ctrl + K to open search
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsOpen(prev => !prev);
      }

      // Escape to close
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
        setSearchQuery('');
      }

      // Navigate results with arrow keys
      if (isOpen) {
        if (e.key === 'ArrowDown') {
          e.preventDefault();
          setSelectedIndex(prev => (prev + 1) % filteredItems.length);
        }
        if (e.key === 'ArrowUp') {
          e.preventDefault();
          setSelectedIndex(prev => (prev - 1 + filteredItems.length) % filteredItems.length);
        }
        if (e.key === 'Enter' && filteredItems.length > 0) {
          e.preventDefault();
          filteredItems[selectedIndex].action();
          setIsOpen(false);
          setSearchQuery('');
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, filteredItems, selectedIndex]);

  const handleItemClick = useCallback((item: SearchItem) => {
    item.action();
    setIsOpen(false);
    setSearchQuery('');
  }, []);

  // Group items by category
  const groupedItems = filteredItems.reduce((acc, item) => {
    if (!acc[item.category]) {
      acc[item.category] = [];
    }
    acc[item.category].push(item);
    return acc;
  }, {} as Record<string, SearchItem[]>);

  return (
    <>
      {/* Search trigger button */}
      <button
        onClick={() => setIsOpen(true)}
        className={`flex items-center gap-2 px-3 py-2 bg-white/10 hover:bg-white/15 border border-white/20 rounded-lg text-white/60 hover:text-white transition-all min-h-[44px] ${className}`}
        aria-label="Buscar (Cmd+K)"
      >
        <Search className="w-4 h-4" />
        <span className="text-sm">{placeholder}</span>
        <div className="flex items-center gap-1 ml-auto text-white/40">
          <Command className="w-3 h-3" />
          <span className="text-xs">K</span>
        </div>
      </button>

      {/* Search modal */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
              onClick={() => setIsOpen(false)}
            />

            {/* Search modal */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="fixed inset-0 z-50 flex items-start justify-center pt-[20vh] px-4"
            >
              <div className="w-full max-w-2xl bg-slate-900/95 backdrop-blur-md rounded-xl border border-white/20 shadow-2xl overflow-hidden">
                {/* Search input */}
                <div className="flex items-center gap-3 p-4 border-b border-white/10">
                  <Search className="w-5 h-5 text-white/40" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder={placeholder}
                    className="flex-1 bg-transparent text-white placeholder-white/40 outline-none text-sm"
                    autoFocus
                  />
                  <button
                    onClick={() => {
                      setIsOpen(false);
                      setSearchQuery('');
                    }}
                    className="p-2 text-white/40 hover:text-white hover:bg-white/10 rounded-lg transition-colors min-h-[36px] min-w-[36px] flex items-center justify-center"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Search results */}
                <div className="max-h-[400px] overflow-y-auto p-2">
                  {filteredItems.length === 0 ? (
                    <div className="text-center py-8 text-white/40 text-sm">
                      No se encontraron resultados
                    </div>
                  ) : (
                    Object.entries(groupedItems).map(([category, categoryItems]) => (
                      <div key={category} className="mb-4">
                        <div className="px-3 py-2 text-xs font-medium text-white/40 uppercase tracking-wider">
                          {category}
                        </div>
                        {categoryItems.map((item, index) => {
                          const globalIndex = filteredItems.indexOf(item);
                          const isSelected = globalIndex === selectedIndex;
                          return (
                            <button
                              key={item.id}
                              onClick={() => handleItemClick(item)}
                              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-all ${
                                isSelected
                                  ? 'bg-cyan-500/20 text-cyan-300'
                                  : 'hover:bg-white/5 text-white/80'
                              }`}
                            >
                              {item.icon && <span className="text-white/40">{item.icon}</span>}
                              <span className="flex-1 text-sm">{item.label}</span>
                            </button>
                          );
                        })}
                      </div>
                    ))
                  )}
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between px-4 py-2 border-t border-white/10 text-xs text-white/40">
                  <div className="flex items-center gap-4">
                    <span className="flex items-center gap-1">
                      <span className="bg-white/10 px-1.5 py-0.5 rounded">↑↓</span>
                      Navegar
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="bg-white/10 px-1.5 py-0.5 rounded">↵</span>
                      Seleccionar
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="bg-white/10 px-1.5 py-0.5 rounded">esc</span>
                      Cerrar
                    </span>
                  </div>
                  <span>{filteredItems.length} resultados</span>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}