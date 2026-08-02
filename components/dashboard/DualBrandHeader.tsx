'use client';

import { useState, useEffect, useCallback } from 'react';
import { Building2, Calendar, Clock, Wifi, WifiOff } from 'lucide-react';
import UserAvatar from '@/components/ui/UserAvatar';
import { useAuth } from '@/lib/auth/auth-context';

interface DualBrandHeaderProps {
  onMenuToggle?: () => void;
}

export default function DualBrandHeader({ onMenuToggle }: DualBrandHeaderProps) {
  const { user } = useAuth();
  const [isOnline, setIsOnline] = useState(true);
  const [currentTime, setCurrentTime] = useState<Date | null>(null);
  const [isMounted, setIsMounted] = useState(false);
  const [imgError, setImgError] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    setCurrentTime(new Date());
    
    const updateOnlineStatus = () => {
      if (typeof window !== 'undefined') {
        setIsOnline(navigator.onLine);
      }
    };
    
    if (typeof window !== 'undefined') {
      window.addEventListener('online', updateOnlineStatus);
      window.addEventListener('offline', updateOnlineStatus);
    }
    
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    
    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('online', updateOnlineStatus);
        window.removeEventListener('offline', updateOnlineStatus);
      }
      clearInterval(timer);
    };
  }, []);

  const formatTime = useCallback((date: Date) => {
    return new Intl.DateTimeFormat('es-GT', {
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  }, []);

  return (
    <header className="glass-panel border-b border-white/10 px-3 sm:px-6 py-2.5 sm:py-4 flex items-center justify-between fixed top-0 left-0 right-0 z-30 lg:relative lg:top-auto lg:left-auto lg:right-auto">
      <div className="flex items-center gap-2 sm:gap-4 flex-1 min-w-0">
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-violet-600 flex items-center justify-center flex-shrink-0">
            <Building2 className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
          </div>
          <div className="hidden sm:block flex-1 min-w-0">
            <h1 className="text-sm sm:text-lg font-bold text-white truncate">CONSTRUCTORA WM/M&S</h1>
            <p className="text-[10px] sm:text-xs text-cyan-400 italic truncate">
              "CONSTRUYENDO EL FUTURO"
            </p>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 sm:gap-4">
        {isMounted && currentTime && (
          <div className="hidden md:flex items-center gap-3 text-xs sm:text-sm text-white/70">
            <div className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span>{formatTime(currentTime)}</span>
            </div>
          </div>
        )}

        <div className="flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-1 sm:py-1.5 rounded-full bg-emerald-500/20 backdrop-blur-sm border border-emerald-500/30 active:bg-emerald-500/30 transition-colors">
          {isOnline ? (
            <Wifi className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-emerald-400" />
          ) : (
            <WifiOff className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-amber-400" />
          )}
          <span className="text-[10px] sm:text-xs font-medium text-emerald-300 hidden sm:inline">
            {isOnline ? 'Online' : 'Offline'}
          </span>
        </div>

        <div className="relative flex-shrink-0">
          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-gradient-to-br from-cyan-500 to-violet-600 flex items-center justify-center shadow-lg shadow-cyan-500/20 border-2 border-cyan-500/50 overflow-hidden active:scale-95 transition-transform">
            <UserAvatar size="sm" />
          </div>
          <div className="absolute -bottom-0.5 -right-0.5 w-2 h-2 sm:w-2.5 sm:h-2.5 bg-emerald-500 rounded-full border-2 border-slate-900" />
        </div>
      </div>
    </header>
  );
}
