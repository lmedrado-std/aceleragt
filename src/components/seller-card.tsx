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

const colorMap = [
  {
    avatar: "from-pink-400 to-rose-500",
    border: "hover:ring-pink-400/30",
    glow: "hover:shadow-[0_10px_25px_rgba(244,114,182,0.25)]",
  },
  {
    avatar: "from-emerald-400 to-teal-500",
    border: "hover:ring-emerald-400/30",
    glow: "hover:shadow-[0_10px_25px_rgba(16,185,129,0.25)]",
  },
  {
    avatar: "from-violet-400 to-purple-500",
    border: "hover:ring-violet-400/30",
    glow: "hover:shadow-[0_10px_25px_rgba(139,92,246,0.25)]",
  },
  {
    avatar: "from-orange-400 to-amber-500",
    border: "hover:ring-orange-400/30",
    glow: "hover:shadow-[0_10px_25px_rgba(251,146,60,0.25)]",
  },
];

function getColor(name: string) {
  const index = name.charCodeAt(0) % colorMap.length;
  return colorMap[index];
}

export function SellerCard({
  name,
  badge,
  onClick,
  className,
}: SellerCardProps) {
  const initial = name.trim().charAt(0).toUpperCase();
  const color = getColor(name);

  return (
    <Card
      onClick={onClick}
      className={cn(
        "group relative overflow-hidden",
        "bg-gradient-to-b from-white to-primary/[0.04] dark:from-slate-900 dark:to-primary/[0.08]",
        "border border-border/50",
        "transition-all duration-300 ease-out",
        "hover:-translate-y-[4px]",
        "hover:ring-2",
        color.border,
        color.glow,
        "p-5",
        "flex flex-col justify-between",
        "min-h-[120px]",
        "cursor-pointer card select-none",
        className
      )}
    >
      {/* Linha glow superior */}
      <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-primary via-accent to-primary opacity-60 group-hover:opacity-100 transition-all duration-300" />

      {/* Conteúdo */}
      <div className="flex items-start gap-4">
        {/* Avatar dinâmico */}
        <div
          className={cn(
            "h-14 w-14 rounded-full flex items-center justify-center",
            "text-lg font-bold text-white",
            "bg-gradient-to-br",
            color.avatar,
            "shadow-md transition-all duration-300",
            "group-hover:scale-110"
          )}
        >
          {initial}
        </div>

        {/* Info */}
        <div className="flex flex-col min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] uppercase tracking-widest text-muted-foreground font-medium">
              Vendedor
            </span>

            {badge && (
              <span className="px-2 py-[2px] rounded-full bg-amber-500/10 text-amber-600 text-[9px] font-semibold uppercase">
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
