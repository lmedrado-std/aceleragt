"use client";

import { cn } from "@/lib/utils";
import { User, ArrowRight, Circle } from "lucide-react";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";

type SellerCardProps = {
  name: string;
  badge?: string; // ex: "Top", "Novo"
  onClick: () => void;
  className?: string;
};

export function SellerCard({ name, badge, onClick, className }: SellerCardProps) {
  const initial = name.trim().charAt(0).toUpperCase();

  return (
    <div 
      onClick={onClick}
      className={cn(
        "group bg-white dark:bg-slate-800/50 rounded-xl shadow-sm hover:shadow-xl transition-all duration-300 p-4 cursor-pointer border border-border/50 hover:-translate-y-1 relative overflow-hidden",
        className
      )}
    >
      {/* Efeito visual de borda superior institucional */}
      <div className="absolute top-0 left-0 w-full h-1 bg-primary/20 group-hover:bg-primary transition-colors" />

      <div className="flex flex-col h-full justify-between gap-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            {/* Avatar Institucional Compacto */}
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary text-xl font-bold group-hover:bg-primary group-hover:text-white transition-colors">
              {initial}
            </div>
            
            <div className="min-w-0">
              <div className="flex items-center gap-2 mb-0.5">
                <span className="text-[9px] uppercase tracking-widest font-bold text-muted-foreground/70">Vendedor</span>
                {badge && (
                  <Badge variant="secondary" className="h-3.5 px-1 text-[8px] bg-amber-500/10 text-amber-600 dark:text-amber-400 border-none">
                    {badge}
                  </Badge>
                )}
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 group-hover:text-primary transition-colors leading-tight truncate">
                {name}
              </h3>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between pt-3 border-t border-border/40">
          <span className="text-[10px] text-muted-foreground font-medium group-hover:text-foreground transition-colors hidden sm:inline-block">
            Meu desempenho
          </span>
          <Button size="sm" variant="ghost" className="h-8 rounded-full px-3 text-xs group-hover:bg-primary group-hover:text-white transition-all ml-auto">
            Acessar <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
    </div>
  );
}
