"use client";

import { cn } from "@/lib/utils";
import { ArrowRight } from "lucide-react";
import { Button } from "./ui/button";
import { Card } from "./ui/card";

type SellerCardProps = {
  name: string;
  badge?: string; // ex: "Top", "Novo"
  onClick: () => void;
  className?: string;
};

export function SellerCard({ name, badge, onClick, className }: SellerCardProps) {
  const initial = name.trim().charAt(0).toUpperCase();

  return (
    <Card 
      onClick={onClick}
      className={cn(
        "group relative overflow-hidden border border-slate-200/60 dark:border-slate-700/40 bg-white/80 dark:bg-slate-900/70 backdrop-blur-md transition-all duration-300 hover:shadow-xl hover:-translate-y-[2px] p-4 sm:p-5 flex flex-col justify-between min-h-[110px] cursor-pointer card",
        className
      )}
    >
      {/* Efeito visual de borda superior institucional */}
      <div className="absolute top-0 left-0 w-full h-1 bg-primary/20 group-hover:bg-primary transition-colors" />

      <div className="flex items-start gap-4">
        {/* Avatar Institucional Compacto */}
        <div className="h-12 w-12 rounded-xl bg-slate-200 dark:bg-slate-700 flex items-center justify-center font-black text-lg text-primary shrink-0 transition-colors group-hover:bg-primary group-hover:text-white">
          {initial}
        </div>

        {/* Info */}
        <div className="flex flex-col min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <span className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">
              Vendedor
            </span>
            {badge && (
              <span className="px-1.5 py-0.5 rounded-full bg-amber-500/10 text-amber-600 text-[8px] font-bold uppercase">
                {badge}
              </span>
            )}
          </div>

          <h3 className="text-lg sm:text-xl font-black leading-tight truncate">
            {name}
          </h3>
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between pt-4 border-t border-border/40 mt-4">
        <span className="text-xs sm:text-sm text-muted-foreground font-medium transition-colors group-hover:text-foreground">
          Meu desempenho
        </span>

        <Button
          variant="ghost"
          size="sm"
          className="font-bold tracking-tight group-hover:translate-x-1 transition-all h-8 px-2"
        >
          Acessar <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
        </Button>
      </div>
    </Card>
  );
}
