
"use client";

import { cn } from "@/lib/utils";
import { Store, ArrowRight, Circle } from "lucide-react";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";

type StoreCardProps = {
  name: string;
  subtitle?: string;
  onClick: () => void;
  className?: string;
};

export function StoreCard({ name, subtitle, onClick, className }: StoreCardProps) {
  return (
    <div 
      onClick={onClick}
      className={cn(
        "group bg-white dark:bg-slate-800/50 rounded-2xl shadow-sm hover:shadow-2xl transition-all duration-300 p-6 cursor-pointer border border-border/50 hover:-translate-y-2 relative overflow-hidden",
        className
      )}
    >
      {/* Efeito visual de borda superior */}
      <div className="absolute top-0 left-0 w-full h-1.5 bg-primary/20 group-hover:bg-primary transition-colors" />

      <div className="flex flex-col h-full justify-between gap-6">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div className="bg-primary/10 text-primary p-3 rounded-xl group-hover:bg-primary group-hover:text-white transition-colors">
              <Store className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground/70">Filial</span>
                <Badge variant="secondary" className="h-4 px-1.5 text-[9px] bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-none">
                  <Circle className="h-2 w-2 fill-current mr-1" /> Ativa
                </Badge>
              </div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100 group-hover:text-primary transition-colors leading-tight">
                {name}
              </h3>
              {subtitle && <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>}
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between pt-4 border-t border-border/50">
          <span className="text-xs text-muted-foreground font-medium group-hover:text-foreground transition-colors">
            Ver indicadores
          </span>
          <Button size="sm" variant="ghost" className="rounded-full group-hover:bg-primary group-hover:text-white transition-all">
            Acessar <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
