"use client";

import { cn } from "@/lib/utils";
import { ArrowRight } from "lucide-react";
import { Button } from "./ui/button";
import { Card } from "./ui/card";

type SellerCardProps = {
  name: string;
  badge?: string;
  onClick: () => void;
  className?: string;
};

export function SellerCard({ name, badge, onClick, className }: SellerCardProps) {
  const initial = name.trim().charAt(0).toUpperCase();

  return (
    <Card
      onClick={onClick}
      className={cn(
        "group relative overflow-hidden",
        "border border-border/60",
        "bg-white dark:bg-card",
        "transition-all duration-300 ease-out",
        "hover:shadow-md hover:border-primary/40",
        "p-4 sm:p-5",
        "flex flex-col justify-between",
        "min-h-[110px]",
        "cursor-pointer card",
        "select-none",
        className
      )}
    >
      {/* Linha superior institucional */}
      <div className="absolute top-0 left-0 w-full h-[2px] bg-primary/40 opacity-70 group-hover:opacity-100 transition-all" />

      <div className="flex items-start gap-4">
        {/* Avatar */}
        <div className="h-12 w-12 rounded-xl bg-primary/10 dark:bg-primary/20 flex items-center justify-center text-base font-semibold text-primary shrink-0 transition-all group-hover:bg-primary group-hover:text-white">
          {initial}
        </div>

        {/* Info */}
        <div className="flex flex-col min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <span className="text-[10px] uppercase tracking-widest text-muted-foreground font-medium">
              Vendedor
            </span>
            {badge && (
              <span className="px-1.5 py-0.5 rounded-full bg-amber-500/10 text-amber-600 text-[8px] font-semibold uppercase">
                {badge}
              </span>
            )}
          </div>

          <h3 className="text-lg sm:text-xl font-semibold leading-tight truncate text-foreground">
            {name}
          </h3>
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between pt-4 border-t border-border/40 mt-4">
        <span className="text-xs sm:text-sm text-muted-foreground font-normal">
          Meu desempenho
        </span>

        <Button
          variant="ghost"
          size="sm"
          className="font-medium tracking-tight group-hover:translate-x-1 transition-all h-8 px-2 text-primary"
        >
          Acessar <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
        </Button>
      </div>
    </Card>
  );
}
