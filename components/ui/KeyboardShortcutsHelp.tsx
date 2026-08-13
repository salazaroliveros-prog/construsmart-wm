'use client';

import React from 'react';
import { useKeyboardShortcuts, defaultShortcuts } from '@/lib/design/keyboardShortcuts';

export function KeyboardShortcutsHelp({ shortcuts = defaultShortcuts }: { shortcuts?: any[] }) {
  const { isModalOpen, setIsModalOpen, getShortcutDisplay } = useKeyboardShortcuts(shortcuts);

  // Group shortcuts by category
  const groupedShortcuts = shortcuts.reduce((acc: Record<string, any[]>, shortcut: any) => {
    const category = shortcut.category || 'system';
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(shortcut);
    return acc;
  }, {} as Record<string, any[]>);

  const categoryLabels: Record<string, string> = {
    navigation: 'Navegación',
    actions: 'Acciones',
    editing: 'Edición',
    system: 'Sistema',
  };

  return (
    <>
      {/* Help button */}
      <button
        onClick={() => setIsModalOpen(true)}
        className="p-2 text-white/40 hover:text-white hover:bg-white/10 rounded-lg transition-colors min-h-[36px] min-w-[36px] flex items-center justify-center"
        aria-label="Atajos de teclado"
        title="Atajos de teclado (?)"
      >
        <span className="text-sm font-bold">?</span>
      </button>

      {/* Help modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsModalOpen(false)} />
          <div className="relative bg-slate-900/95 backdrop-blur-md rounded-xl border border-white/20 shadow-2xl w-full max-w-2xl max-h-[80vh] overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-white/10">
              <h2 className="text-lg font-semibold text-white">Atajos de Teclado</h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-2 text-white/60 hover:text-white hover:bg-white/10 rounded-lg transition-colors min-h-[36px] min-w-[36px] flex items-center justify-center"
              >
                ✕
              </button>
            </div>

            {/* Content */}
            <div className="p-4 overflow-y-auto max-h-[60vh]">
              {Object.entries(groupedShortcuts).map(([category, categoryShortcuts]) => (
                <div key={category} className="mb-6">
                  <h3 className="text-sm font-medium text-white/60 uppercase tracking-wider mb-3">
                    {categoryLabels[category] || category}
                  </h3>
                  <div className="space-y-2">
                    {categoryShortcuts.map((shortcut: any, index: number) => (
                      <div key={index} className="flex items-center justify-between p-2 bg-white/5 rounded-lg">
                        <span className="text-sm text-white/80">{shortcut.description}</span>
                        <kbd className="px-2 py-1 bg-white/10 rounded text-xs text-white/60 font-mono">
                          {getShortcutDisplay(shortcut)}
                        </kbd>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-white/10 text-center text-xs text-white/40">
              Presiona ESC para cerrar
            </div>
          </div>
        </div>
      )}
    </>
  );
}