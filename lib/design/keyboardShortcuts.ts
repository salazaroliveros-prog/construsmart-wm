// Sistema de Keyboard Shortcuts Unificado
// Basado en estándares de accesibilidad y patrones comunes

import React from 'react';

export interface KeyboardShortcut {
  key: string;
  ctrlKey?: boolean;
  metaKey?: boolean;
  shiftKey?: boolean;
  altKey?: boolean;
  description: string;
  action: () => void;
  category?: 'navigation' | 'actions' | 'editing' | 'system';
}

export const defaultShortcuts: KeyboardShortcut[] = [
  // Navigation
  {
    key: 'k',
    metaKey: true,
    description: 'Búsqueda global',
    action: () => {}, // Implemented in GlobalSearch component
    category: 'navigation',
  },
  {
    key: '/',
    metaKey: true,
    description: 'Ir al inicio',
    action: () => window.location.href = '/',
    category: 'navigation',
  },
  
  // Actions
  {
    key: 'n',
    metaKey: true,
    description: 'Nuevo elemento',
    action: () => {}, // Context-specific
    category: 'actions',
  },
  {
    key: 's',
    metaKey: true,
    description: 'Guardar',
    action: () => {}, // Context-specific
    category: 'actions',
  },
  {
    key: 'Delete',
    description: 'Eliminar',
    action: () => {}, // Context-specific
    category: 'actions',
  },
  
  // Editing
  {
    key: 'z',
    metaKey: true,
    description: 'Deshacer',
    action: () => {}, // Context-specific
    category: 'editing',
  },
  {
    key: 'y',
    metaKey: true,
    description: 'Rehacer',
    action: () => {}, // Context-specific
    category: 'editing',
  },
  
  // System
  {
    key: '?',
    description: 'Mostrar ayuda',
    action: () => {}, // Show help modal
    category: 'system',
  },
  {
    key: 'Escape',
    description: 'Cerrar modal/dialogo',
    action: () => {}, // Close active modal
    category: 'system',
  },
];

export function useKeyboardShortcuts(shortcuts: KeyboardShortcut[] = defaultShortcuts) {
  const [isModalOpen, setIsModalOpen] = React.useState(false);

  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Check if user is typing in an input field
      const target = e.target as HTMLElement;
      const isInputField = target.tagName === 'INPUT' || 
                          target.tagName === 'TEXTAREA' || 
                          target.isContentEditable;
      
      if (isInputField) return;

      // Find matching shortcut
      const shortcut = shortcuts.find(s => {
        const keyMatch = s.key.toLowerCase() === e.key.toLowerCase();
        const ctrlMatch = s.ctrlKey === e.ctrlKey;
        const metaMatch = s.metaKey === e.metaKey;
        const shiftMatch = s.shiftKey === e.shiftKey;
        const altMatch = s.altKey === e.altKey;
        
        return keyMatch && ctrlMatch && metaMatch && shiftMatch && altMatch;
      });

      if (shortcut) {
        e.preventDefault();
        shortcut.action();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [shortcuts]);

  const getShortcutDisplay = (shortcut: KeyboardShortcut): string => {
    const parts: string[] = [];
    
    if (shortcut.metaKey) parts.push('⌘');
    if (shortcut.ctrlKey) parts.push('Ctrl');
    if (shortcut.altKey) parts.push('Option');
    if (shortcut.shiftKey) parts.push('Shift');
    
    parts.push(shortcut.key.toUpperCase());
    
    return parts.join(' + ');
  };

  return {
    shortcuts,
    isModalOpen,
    setIsModalOpen,
    getShortcutDisplay,
  };
}