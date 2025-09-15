
import { Rocket } from 'lucide-react';
import * as React from 'react';

export const Logo = ({ className, ...props }: React.SVGProps<SVGSVGElement>) => (
  <div className="flex items-center gap-2">
    <div className="rounded-lg bg-white/20 p-2">
      <Rocket className="h-6 w-6 text-white" />
    </div>
    <span className="text-xl font-bold text-white">Acelera GT</span>
  </div>
);
