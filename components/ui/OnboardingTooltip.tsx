'use client';

import { useState, useEffect } from 'react';
import { X, Lightbulb } from 'lucide-react';

interface OnboardingTooltipProps {
  id: string;
  title: string;
  description: string;
  children: React.ReactNode;
}

export default function OnboardingTooltip({ id, title, description, children }: OnboardingTooltipProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    try {
      const seen = localStorage.getItem(`onboarding_${id}`);
      if (!seen) {
        setIsVisible(true);
      }
    } catch {
      // localStorage no disponible
    }
  }, [id]);

  const dismiss = () => {
    try {
      localStorage.setItem(`onboarding_${id}`, 'true');
    } catch {
      // ignorar
    }
    setIsVisible(false);
  };

  if (!isVisible) return <>{children}</>;

  return (
    <div className="relative">
      {children}
      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-72 glass-panel rounded-xl p-4 border border-cyan-500/30 shadow-xl z-50">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-full bg-cyan-500/20 flex items-center justify-center flex-shrink-0">
            <Lightbulb className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="text-white font-medium text-sm">{title}</h4>
            <p className="text-white/60 text-xs mt-1">{description}</p>
          </div>
          <button
            onClick={dismiss}
            className="flex-shrink-0 text-white/40 hover:text-white"
            aria-label="Cerrar consejo"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
