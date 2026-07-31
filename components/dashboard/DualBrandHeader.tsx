'use client';

import { useState, useEffect } from 'react';
import { Building2, Calendar, Clock, User, Wifi, WifiOff } from 'lucide-react';
import { useRouter } from 'next/navigation';
import type { ChangeEvent } from 'react';
import { useAuth } from '@/lib/auth/auth-context';

// User Avatar Component
function UserAvatar() {
  const { user, getUserAvatar } = useAuth();
  const [avatarUrl, setAvatarUrl] = useState<string>('');
  const [showUpload, setShowUpload] = useState(false);

  useEffect(() => {
    // Check localStorage for custom avatar first
    const customAvatar = localStorage.getItem('userAvatar');
    if (customAvatar) {
      setAvatarUrl(customAvatar);
    } else {
      setAvatarUrl(getUserAvatar());
    }
  }, [user, getUserAvatar]);

  const handleAvatarUpload = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        setAvatarUrl(base64String);
        localStorage.setItem('userAvatar', base64String);
        setShowUpload(false);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAvatarClick = () => {
    setShowUpload(true);
  };

  if (showUpload) {
    return (
      <div className="relative w-full h-full">
        <input
          type="file"
          accept="image/*"
          onChange={handleAvatarUpload}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          title="Cambiar foto de perfil"
        />
        <div className="w-full h-full flex items-center justify-center bg-white/10">
          <User className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
        </div>
      </div>
    );
  }

  if (avatarUrl) {
    return (
      <div
        onClick={handleAvatarClick}
        className="w-full h-full cursor-pointer"
        title="Click para cambiar foto de perfil"
      >
        <img
          src={avatarUrl}
          alt={user?.name || 'Usuario'}
          className="w-full h-full object-cover"
        />
      </div>
    );
  }

  return <User className="w-4 h-4 sm:w-5 sm:h-5 text-white" />;
}

export default function DualBrandHeader() {
  const { user } = useAuth();
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
    <header className="glass-panel border-b border-white/10 px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between fixed top-0 left-0 right-0 z-30 lg:relative lg:top-auto lg:left-auto lg:right-auto">
      <div className="flex items-center gap-3 sm:gap-4">
        <div className="flex items-center gap-2 sm:gap-3">
          {imgError ? (
            <div className="h-10 w-10 sm:h-12 sm:w-auto sm:w-32 rounded-lg bg-gradient-to-br from-cyan-500 to-violet-600 flex items-center justify-center">
              <Building2 className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
            </div>
          ) : (
            <img
              src="/assets/branding/logo-constructora-wm.jpg"
              alt="CONSTRUCTORA WM/M&S"
              className="h-10 w-auto object-contain sm:w-auto"
              onError={() => setImgError(true)}
            />
          )}
          
          <div className="hidden sm:block h-8 w-px bg-gradient-to-b from-transparent via-white/20 to-transparent" />
          
          {imgError ? (
            <div className="hidden sm:flex h-8 w-24 rounded-lg bg-gradient-to-br from-amber-500 to-orange-600 items-center justify-center">
              <span className="text-white text-xs font-bold">M&S</span>
            </div>
          ) : (
            <img
              src="/assets/branding/letterhead-multiservicios.jpg"
              alt="Multi Servicios de Guatemala"
              className="hidden sm:block h-8 w-auto object-contain"
              onError={() => setImgError(true)}
            />
          )}
        </div>

        <div className="hidden md:block ml-2 sm:ml-4">
          <h1 className="text-base sm:text-xl font-bold text-white drop-shadow-lg">CONSTRUCTORA WM/M&S</h1>
          <p className="text-xs sm:text-sm text-cyan-400 italic">
            "CONSTRUYENDO EL FUTURO"
          </p>
        </div>
      </div>

      <div className="flex items-center gap-3 sm:gap-6">
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

        <div className="flex items-center gap-2">
          {isOnline ? (
            <div className="flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-1 sm:py-1.5 rounded-full bg-emerald-500/20 backdrop-blur-sm border border-emerald-500/30">
              <Wifi className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-emerald-400" />
              <span className="text-[10px] sm:text-xs text-emerald-300 font-medium hidden sm:inline">Online</span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-1 sm:py-1.5 rounded-full bg-amber-500/20 border border-amber-500/30">
              <WifiOff className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-amber-400" />
              <span className="text-[10px] sm:text-xs text-amber-300 font-medium hidden sm:inline">Offline</span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          <div className="hidden sm:block text-right">
            <p className="text-sm font-medium text-white">
              {user?.name || user?.email || 'Usuario'}
            </p>
            <p className="text-xs text-cyan-400">
              {user?.email || ''}
            </p>
          </div>
          <div className="relative">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-gradient-to-br from-cyan-500 to-violet-600 flex items-center justify-center shadow-lg shadow-cyan-500/20 border-2 border-cyan-500/50 overflow-hidden">
              <UserAvatar />
            </div>
            <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 sm:w-3 sm:h-3 bg-emerald-500 rounded-full border-2 border-slate-900" />
          </div>
        </div>
      </div>
    </header>
  );
}
