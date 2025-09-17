
import { Rocket } from 'lucide-react';
import * as React from 'react';
import { cn } from '@/lib/utils';
import Link from 'next/link';

export const Logo = ({ className }: { className?: string }) => (
  <Link href="/" className={cn("flex items-center gap-3 text-foreground", className)}>
    <div className="rounded-lg bg-primary p-2">
      <Rocket className="h-6 w-6 text-primary-foreground" />
    </div>
    <span className="text-xl font-bold">Acelera GT</span>
  </Link>
);
