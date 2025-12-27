import { Rocket } from 'lucide-react';
import * as React from 'react';
import { cn } from '@/lib/utils';

export const Logo = ({ className, textColor = 'text-white' }: { className?: string, textColor?: string }) => (
  <div className={cn("flex items-center justify-center gap-2", className)}>
    <div className="rounded-lg bg-primary p-2 shadow-inner">
      <Rocket className="h-6 w-6 text-primary-foreground" />
    </div>
    <span className={cn("text-2xl font-bold tracking-tighter", textColor)}>Acelera GT</span>
  </div>
);
