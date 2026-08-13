'use client';

import React from 'react';
import { User, Building2, Mail, Phone, Calendar, DollarSign, Package, Settings } from 'lucide-react';

interface AvatarProps {
  src?: string;
  alt?: string;
  initials?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  className?: string;
  icon?: React.ReactNode;
  variant?: 'default' | 'circle' | 'square';
  onClick?: () => void;
}

const avatarSizes = {
  xs: 'w-6 h-6 text-xs',
  sm: 'w-8 h-8 text-sm',
  md: 'w-10 h-10 text-base',
  lg: 'w-12 h-12 text-lg',
  xl: 'w-16 h-16 text-xl',
  '2xl': 'w-20 h-20 text-2xl',
};

const avatarShapes = {
  default: 'rounded-full',
  circle: 'rounded-full',
  square: 'rounded-lg',
};

const avatarColors = [
  'bg-cyan-500',
  'bg-violet-500',
  'bg-emerald-500',
  'bg-amber-500',
  'bg-red-500',
  'bg-pink-500',
  'bg-blue-500',
  'bg-indigo-500',
];

function getAvatarColor(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  return avatarColors[Math.abs(hash) % avatarColors.length];
}

export function Avatar({
  src,
  alt = 'Avatar',
  initials,
  size = 'md',
  className = '',
  icon,
  variant = 'default',
  onClick,
}: AvatarProps) {
  const sizeClass = avatarSizes[size];
  const shapeClass = avatarShapes[variant];
  const baseClass = `${sizeClass} ${shapeClass} flex items-center justify-center font-medium text-white overflow-hidden transition-all ${onClick ? 'cursor-pointer hover:ring-2 hover:ring-cyan-500/50' : ''}`;
  
  if (src) {
    return (
      <img
        src={src}
        alt={alt}
        className={`${baseClass} object-cover ${className}`}
        onClick={onClick}
      />
    );
  }

  if (icon) {
    return (
      <div className={`${baseClass} bg-white/10 ${className}`} onClick={onClick}>
        {icon}
      </div>
    );
  }

  if (initials) {
    const bgColor = getAvatarColor(initials);
    return (
      <div className={`${baseClass} ${bgColor} ${className}`} onClick={onClick}>
        {initials}
      </div>
    );
  }

  // Default fallback
  return (
    <div className={`${baseClass} bg-white/10 ${className}`} onClick={onClick}>
      <User className={size === 'xs' ? 'w-3 h-3' : size === 'sm' ? 'w-4 h-4' : size === 'md' ? 'w-5 h-5' : size === 'lg' ? 'w-6 h-6' : size === 'xl' ? 'w-8 h-8' : 'w-10 h-10'} />
    </div>
  );
}

// AvatarGroup para mostrar múltiples avatares
interface AvatarGroupProps {
  avatars: Array<{ src?: string; initials?: string; alt?: string }>;
  max?: number;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

export function AvatarGroup({ avatars, max = 3, size = 'md', className = '' }: AvatarGroupProps) {
  const visibleAvatars = avatars.slice(0, max);
  const remainingCount = avatars.length - max;

  return (
    <div className={`flex -space-x-2 ${className}`}>
      {visibleAvatars.map((avatar, index) => (
        <Avatar
          key={index}
          {...avatar}
          size={size}
          className="border-2 border-slate-900"
        />
      ))}
      {remainingCount > 0 && (
        <div className={`${avatarSizes[size]} ${avatarShapes.default} bg-white/10 flex items-center justify-center text-xs font-medium text-white border-2 border-slate-900`}>
          +{remainingCount}
        </div>
      )}
    </div>
  );
}

// Avatar with status indicator
interface AvatarWithStatusProps extends AvatarProps {
  status?: 'online' | 'offline' | 'busy' | 'away';
}

export function AvatarWithStatus({ status = 'offline', ...props }: AvatarWithStatusProps) {
  const statusColors = {
    online: 'bg-emerald-500',
    offline: 'bg-gray-400',
    busy: 'bg-red-500',
    away: 'bg-amber-500',
  };

  return (
    <div className="relative inline-block">
      <Avatar {...props} />
      <div
        className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-slate-900 ${statusColors[status]}`}
      />
    </div>
  );
}

// Avatar con iconos específicos por tipo
export function AvatarByType({ type, ...props }: Omit<AvatarProps, 'icon'> & { type: 'user' | 'company' | 'email' | 'phone' | 'project' | 'money' | 'package' | 'settings' }) {
  const icons = {
    user: <User />,
    company: <Building2 />,
    email: <Mail />,
    phone: <Phone />,
    project: <Calendar />,
    money: <DollarSign />,
    package: <Package />,
    settings: <Settings />,
  };

  return <Avatar icon={icons[type]} {...props} />;
}