'use client';

import { ReactNode } from 'react';
import { Inbox } from 'lucide-react';

interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description: string;
  action?: ReactNode;
}

export default function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4">
      <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-4">
        {icon || <Inbox className="w-8 h-8 text-white/30" />}
      </div>
      <h3 className="text-lg font-medium text-white/70 mb-2">{title}</h3>
      <p className="text-sm text-white/40 text-center max-w-sm mb-6">{description}</p>
      {action}
    </div>
  );
}
