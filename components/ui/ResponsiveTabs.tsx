'use client';

import React, { useState, useRef, useEffect } from 'react';
import { ChevronLeft, ChevronRight, MoreHorizontal } from 'lucide-react';

interface TabsProps {
  tabs: Array<{ id: string; label: string; icon?: React.ReactNode }>;
  activeTab: string;
  onTabChange: (tabId: string) => void;
  className?: string;
  variant?: 'default' | 'pills' | 'underline';
}

export function ResponsiveTabs({ tabs, activeTab, onTabChange, className = '', variant = 'default' }: TabsProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [hiddenTabs, setHiddenTabs] = useState<Array<{ id: string; label: string; icon?: React.ReactNode }>>([]);

  // Check scroll position to show/hide arrows
  const checkScroll = () => {
    if (containerRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = containerRef.current;
      setShowLeftArrow(scrollLeft > 0);
      setShowRightArrow(scrollLeft < scrollWidth - clientWidth - 10);
    }
  };

  // Calculate hidden tabs for dropdown
  const calculateHiddenTabs = () => {
    if (!containerRef.current) return;

    const containerWidth = containerRef.current.clientWidth;
    let totalWidth = 0;
    const visibleTabs: Array<{ id: string; label: string; icon?: React.ReactNode }> = [];
    const hidden: Array<{ id: string; label: string; icon?: React.ReactNode }> = [];

    tabs.forEach(tab => {
      const tabWidth = 120; // Estimated width per tab
      if (totalWidth + tabWidth <= containerWidth - 50) {
        visibleTabs.push(tab);
        totalWidth += tabWidth;
      } else {
        hidden.push(tab);
      }
    });

    setHiddenTabs(hidden);
  };

  useEffect(() => {
    checkScroll();
    calculateHiddenTabs();
    window.addEventListener('resize', () => {
      checkScroll();
      calculateHiddenTabs();
    });
    return () => window.removeEventListener('resize', checkScroll);
  }, [tabs]);

  const scroll = (direction: 'left' | 'right') => {
    if (containerRef.current) {
      const scrollAmount = 200;
      containerRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth',
      });
    }
  };

  const variantStyles = {
    default: 'flex gap-2 bg-white/5 rounded-lg p-1',
    pills: 'flex gap-2',
    underline: 'flex gap-4 border-b border-white/10',
  };

  const tabStyles = {
    default: `px-3 py-2.5 min-h-[44px] rounded-lg text-xs font-medium transition-all ${
      variant === 'default' 
        ? activeTab === 'active' 
          ? 'bg-gradient-to-r from-cyan-500/20 to-violet-500/20 text-white' 
          : 'text-white/60 hover:text-white hover:bg-white/10'
        : ''
    }`,
    pills: `px-4 py-2 min-h-[44px] rounded-full text-xs font-medium transition-all ${
      activeTab === 'active' 
        ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30' 
        : 'text-white/60 hover:text-white hover:bg-white/10'
    }`,
    underline: `px-3 py-2 min-h-[44px] text-xs font-medium transition-all border-b-2 ${
      activeTab === 'active' 
        ? 'border-cyan-500 text-cyan-300' 
        : 'border-transparent text-white/60 hover:text-white'
    }`,
  };

  return (
    <div className={`relative ${className}`}>
      {/* Left scroll button */}
      {showLeftArrow && (
        <button
          onClick={() => scroll('left')}
          className="absolute left-0 top-1/2 -translate-y-1/2 z-10 p-2 bg-slate-900/95 backdrop-blur-md border border-white/20 rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition-all min-h-[44px] min-w-[44px] flex items-center justify-center"
          aria-label="Scroll izquierda"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
      )}

      {/* Tabs container */}
      <div
        ref={containerRef}
        className={`${variantStyles[variant]} overflow-x-auto scrollbar-hide`}
        onScroll={checkScroll}
      >
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`flex items-center gap-2 whitespace-nowrap ${tabStyles[variant]}`}
            aria-label={tab.label}
            aria-selected={activeTab === tab.id}
            role="tab"
          >
            {tab.icon && <span className="text-white/40">{tab.icon}</span>}
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Right scroll button */}
      {showRightArrow && (
        <button
          onClick={() => scroll('right')}
          className="absolute right-0 top-1/2 -translate-y-1/2 z-10 p-2 bg-slate-900/95 backdrop-blur-md border border-white/20 rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition-all min-h-[44px] min-w-[44px] flex items-center justify-center"
          aria-label="Scroll derecha"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      )}

      {/* Dropdown for hidden tabs */}
      {hiddenTabs.length > 0 && (
        <div className="relative">
          <button
            onClick={() => setShowDropdown(!showDropdown)}
            className="p-2 bg-white/10 hover:bg-white/20 border border-white/20 rounded-lg text-white/60 hover:text-white transition-all min-h-[44px] min-w-[44px] flex items-center justify-center"
            aria-label="Más tabs"
          >
            <MoreHorizontal className="w-4 h-4" />
            <span className="text-xs ml-1">+{hiddenTabs.length}</span>
          </button>

          {showDropdown && (
            <div className="absolute right-0 top-full mt-2 w-48 bg-slate-900/95 backdrop-blur-md border border-white/20 rounded-lg shadow-xl z-20">
              {hiddenTabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => {
                    onTabChange(tab.id);
                    setShowDropdown(false);
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-left text-sm text-white/80 hover:text-white hover:bg-white/10 transition-all min-h-[36px]"
                >
                  {tab.icon && <span className="text-white/40">{tab.icon}</span>}
                  <span>{tab.label}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}