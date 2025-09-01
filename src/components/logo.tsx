
"use client"

import { Target } from 'lucide-react';
import { cn } from '@/lib/utils';

export function Logo({ className, themeColor }: { className?: string, themeColor?: string | null }) {
  const style = themeColor ? { backgroundColor: themeColor } : {};
  return (
    <div 
        className={cn("flex items-center justify-center bg-primary text-primary-foreground w-14 h-14 rounded-full shadow-md", className)}
        style={style}
    >
      <Target className="w-7 h-7" />
    </div>
  )
}

    