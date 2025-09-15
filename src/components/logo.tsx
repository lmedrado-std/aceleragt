
import { Rocket } from 'lucide-react';
import * as React from 'react';
import { cn } from '@/lib/utils';

export const Logo = ({ className }: { className?: string }) => (
  <div className={cn("flex items-center gap-3", className)}>
    <div className="rounded-lg bg-white/20 p-2">
      <Rocket className="h-6 w-6 text-white" />
    </div>
    <span className="text-xl font-bold">Acelera GT</span>
  </div>
);
