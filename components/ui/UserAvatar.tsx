'use client';

import { useState, useEffect, useCallback } from 'react';
import type { ChangeEvent } from 'react';
import { useAuth } from '@/lib/auth/auth-context';
import { User } from 'lucide-react';

interface UserAvatarProps {
  size?: 'sm' | 'md' | 'lg';
  showName?: boolean;
  className?: string;
  onClick?: () => void;
}

const SIZE_CLASSES = {
  sm: 'w-6 h-6 sm:w-8 sm:h-8',
  md: 'w-8 h-8 sm:w-10 sm:h-10',
  lg: 'w-10 h-10 sm:w-12 sm:h-12',
};

export default function UserAvatar({ size = 'md', showName = false, className = '', onClick }: UserAvatarProps) {
  const { user, getUserAvatar } = useAuth();
  const [avatarUrl, setAvatarUrl] = useState<string>('');
  const [showUpload, setShowUpload] = useState(false);

  useEffect(() => {
    const customAvatar = localStorage.getItem('userAvatar');
    setAvatarUrl(customAvatar || getUserAvatar());
  }, [user, getUserAvatar]);

  const handleAvatarUpload = useCallback((event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      setAvatarUrl(base64String);
      localStorage.setItem('userAvatar', base64String);
      setShowUpload(false);
    };
    reader.readAsDataURL(file);
  }, []);

  const handleClick = useCallback(() => {
    setShowUpload((prev) => !prev);
    onClick?.();
  }, [onClick]);

  const avatarSizeClass = SIZE_CLASSES[size];

  if (showUpload) {
    return (
      <div className={`relative ${avatarSizeClass} flex-shrink-0 ${className}`}>
        <input
          type="file"
          accept="image/*"
          onChange={handleAvatarUpload}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          title="Cambiar foto de perfil"
        />
        <div className={`${avatarSizeClass} flex items-center justify-center bg-white/10 rounded-full`}>
          <User className={`${size === 'sm' ? 'w-3 h-3 sm:w-4 sm:h-4' : size === 'md' ? 'w-4 h-4 sm:w-5 sm:h-5' : 'w-5 h-5 sm:w-6 sm:h-6'} text-white`} />
        </div>
      </div>
    );
  }

  if (avatarUrl) {
    return (
      <div onClick={handleClick} className={`${avatarSizeClass} cursor-pointer rounded-full overflow-hidden flex-shrink-0 ${className}`} title="Click para cambiar foto de perfil">
        <img src={avatarUrl} alt={user?.name || 'Usuario'} className={`${avatarSizeClass} object-cover`} />
      </div>
    );
  }

  return (
    <div onClick={handleClick} className={`${avatarSizeClass} rounded-full bg-gradient-to-br from-cyan-500 to-violet-600 flex items-center justify-center flex-shrink-0 ${className}`} title="Click para cambiar foto de perfil">
      <User className={`${size === 'sm' ? 'w-3 h-3 sm:w-4 sm:h-4' : size === 'md' ? 'w-4 h-4 sm:w-5 sm:h-5' : 'w-5 h-5 sm:w-6 sm:h-6'} text-white`} />
    </div>
  );
}
