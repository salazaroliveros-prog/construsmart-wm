'use client';

import React from 'react';
import { LucideIcon } from 'lucide-react';

interface AnimatedIconProps {
  icon: LucideIcon;
  className?: string;
  animation?: 'pulse' | 'bounce' | 'spin' | 'shake' | 'float' | 'glow';
  delay?: number;
}

export default function AnimatedIcon({ icon: Icon, className = '', animation = 'pulse', delay = 0 }: AnimatedIconProps) {
  const animationStyles: Record<string, string> = {
    pulse: 'animate-pulse',
    bounce: 'animate-bounce',
    spin: 'animate-spin',
    shake: 'animate-[shake_0.5s_ease-in-out_infinite]',
    float: 'animate-[float_3s_ease-in-out_infinite]',
    glow: 'animate-[glow_2s_ease-in-out_infinite]',
  };

  return (
    <Icon
      className={`${animationStyles[animation]} ${className}`}
      style={{ animationDelay: `${delay}ms` }}
    />
  );
}
