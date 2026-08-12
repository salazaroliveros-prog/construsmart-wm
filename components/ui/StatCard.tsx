'use client';

import React from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string;
  subtitle: string;
  icon: React.ReactNode;
  trend?: string;
  trendUp?: boolean;
  color?: 'cyan' | 'emerald' | 'violet' | 'amber' | 'red' | 'blue';
  size?: 'sm' | 'md' | 'lg';
}

const colorClasses: Record<string, string> = {
  cyan: 'text-cyan-400 bg-cyan-500/10',
  emerald: 'text-emerald-400 bg-emerald-500/10',
  violet: 'text-violet-400 bg-violet-500/10',
  amber: 'text-amber-400 bg-amber-500/10',
  red: 'text-red-400 bg-red-500/10',
  blue: 'text-blue-400 bg-blue-500/10',
};

const sizeClasses: Record<string, string> = {
  sm: 'p-2 rounded-lg',
  md: 'p-3 rounded-xl',
  lg: 'p-4 rounded-2xl',
};

const iconSizeClasses: Record<string, string> = {
  sm: 'w-4 h-4',
  md: 'w-5 h-5',
  lg: 'w-6 h-6',
};

const titleSizeClasses: Record<string, string> = {
  sm: 'text-[10px]',
  md: 'text-xs',
  lg: 'text-sm',
};

const valueSizeClasses: Record<string, string> = {
  sm: 'text-sm',
  md: 'text-base',
  lg: 'text-lg',
};

const subtitleSizeClasses: Record<string, string> = {
  sm: 'text-[10px]',
  md: 'text-xs',
  lg: 'text-sm',
};

function StatCard({ 
  title, 
  value, 
  subtitle, 
  icon, 
  trend, 
  trendUp, 
  color = 'cyan',
  size = 'md'
}: StatCardProps) {
  return (
    <div className={`glass-card ${sizeClasses[size]} transition-all active:bg-white/5 flex flex-col gap-1 touch-manipulation`}>
      <div className="flex items-center justify-between">
        <div className={`${iconSizeClasses[size]} rounded-lg flex items-center justify-center ${colorClasses[color] || colorClasses.cyan}`}>
          {icon}
        </div>
        {trend && (
          <div className={`flex items-center gap-0.5 text-[10px] px-1 py-0.5 rounded-md border ${
            trendUp
              ? 'text-emerald-400 bg-emerald-400/10 border-emerald-500/30'
              : 'text-red-400 bg-red-400/10 border-red-500/30'
          }`}>
            {trendUp ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
            {trend}
          </div>
        )}
      </div>
      <div>
        <h3 className={`${titleSizeClasses[size]} font-medium text-white/50 mb-0.5 truncate`}>{title}</h3>
        <p className={`${valueSizeClasses[size]} font-bold text-white drop-shadow-lg truncate`}>{value}</p>
        <p className={`${subtitleSizeClasses[size]} text-white/40 truncate`}>{subtitle}</p>
      </div>
    </div>
  );
}

const MemoizedStatCard = React.memo(StatCard);

export default MemoizedStatCard;