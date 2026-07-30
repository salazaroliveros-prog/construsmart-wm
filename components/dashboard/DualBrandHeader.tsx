'use client';

import { Building2, Calendar, Clock, User, Wifi, WifiOff } from 'lucide-react';
import { useState, useEffect } from 'react';

export default function DualBrandHeader() {
  const [isOnline, setIsOnline] = useState(true);
  const [currentTime, setCurrentTime] = useState<Date | null>(null);
  const [isMounted, setIsMounted] = useState(false);

  const [imgError, setImgError] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    setCurrentTime(new Date());
    
    const updateOnlineStatus = () => setIsOnline(navigator.onLine);
    window.addEventListener('online', updateOnlineStatus);
    window.addEventListener('offline', updateOnlineStatus);
    
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    
    return () => {
      window.removeEventListener('online', updateOnlineStatus);
      window.removeEventListener('offline', updateOnlineStatus);
      clearInterval(timer);
    };
  }, []);

  const handleImageError = () => setImgError(true);

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('es-GT', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }).format(date);
  };

  const formatTime = (date: Date) => {
    return new Intl.DateTimeFormat('es-GT', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    }).format(date);
  };

  return (
    <header className="glass-panel border-b border-white/10 px-6 py-4 flex items-center justify-between lg:relative fixed top-0 left-0 right-0 z-30">
      {/* Dual Brand Container */}
      <div className="flex items-center gap-4">
        {/* Constructora WM Logo */}
        <div className="flex items-center gap-3">
          <div className="relative">
            {imgError ? (
              <div className="h-12 w-12 rounded-lg bg-gradient-to-br from-cyan-500 to-violet-600 flex items-center justify-center">
                <Building2 className="w-7 h-7 text-white" />
              </div>
            ) : (
              <img
                src="/assets/branding/logo-constructora-wm.jpg"
                alt="CONSTRUCTORA WM/M&S"
                className="h-12 w-auto object-contain"
                onError={handleImageError}
              />
            )}
          </div>
          
          {/* Glass Divider */}
          <div className="h-8 w-px bg-gradient-to-b from-transparent via-white/20 to-transparent" />
          
          {/* Multiservicios Logo */}
          <div className="relative">
            {imgError ? (
              <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center">
                <span className="text-white text-xs font-bold">M&S</span>
              </div>
            ) : (
              <img
                src="/assets/branding/letterhead-multiservicios.jpg"
                alt="Multi Servicios de Guatemala"
                className="h-10 w-auto object-contain"
                onError={handleImageError}
              />
            )}
          </div>
        </div>

        {/* Company Name & Slogan */}
        <div className="hidden md:block ml-4">
          <h1 className="text-xl font-bold text-white drop-shadow-lg" style={{ textShadow: '0 0 10px rgba(56, 189, 248, 0.5)' }}>
            CONSTRUCTORA WM/M&S
          </h1>
          <p className="text-sm text-cyan-400 italic">
            "CONSTRUYENDO EL FUTURO"
          </p>
        </div>
      </div>

      {/* Right Side - User Info & Status */}
      <div className="flex items-center gap-6">
        {/* Date & Time */}
        {isMounted && currentTime && (
          <div className="hidden lg:flex items-center gap-4 text-sm text-white/70">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              <span>{formatDate(currentTime)}</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4" />
              <span>{formatTime(currentTime)}</span>
            </div>
          </div>
        )}

        {/* Sync Status Badge */}
        <div className="flex items-center gap-2">
          {isOnline ? (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/20 backdrop-blur-sm border border-emerald-500/30">
              <Wifi className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-xs text-emerald-300 font-medium">Online</span>
            </div>
          ) : (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-500/20 border border-amber-500/30">
              <WifiOff className="w-3.5 h-3.5 text-amber-400" />
              <span className="text-xs text-amber-300 font-medium">Offline</span>
            </div>
          )}
        </div>

        {/* User Profile with Glowing Ring */}
        <div className="flex items-center gap-3">
          <div className="hidden sm:block text-right">
            <p className="text-sm font-medium text-white">Ing. Carlos Martínez</p>
            <p className="text-xs text-cyan-400">Director de Proyectos</p>
          </div>
          <div className="relative">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-500 to-violet-600 flex items-center justify-center shadow-lg shadow-cyan-500/20 border-2 border-cyan-500/50">
              <User className="w-5 h-5 text-white" />
            </div>
            <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 rounded-full border-2 border-slate-900" />
          </div>
        </div>
      </div>
    </header>
  );
}
