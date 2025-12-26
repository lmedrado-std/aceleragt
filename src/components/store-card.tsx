"use client";

import { Store } from "lucide-react";

type StoreCardProps = {
  name: string;
  subtitle?: string;
  onClick: () => void;
};

export function StoreCard({ name, subtitle, onClick }: StoreCardProps) {
  return (
    <button
      onClick={onClick}
      className="
        group relative flex flex-col items-start gap-2 rounded-2xl
        bg-gradient-to-br from-sky-50/80 via-white to-emerald-50/80
        dark:from-sky-900/40 dark:via-slate-800/50 dark:to-emerald-900/40
        border border-sky-100/60 dark:border-sky-900/60 shadow-sm
        px-6 py-5 text-left
        transition-all duration-300
        hover:-translate-y-1 hover:shadow-xl
        hover:border-sky-300/80 dark:hover:border-sky-700/80
        focus-visible:outline-none focus-visible:ring-2
        focus-visible:ring-sky-500/80 focus-visible:ring-offset-2
      "
    >
      {/* brilho na borda ao hover */}
      <span
        className="
          pointer-events-none absolute inset-0 rounded-2xl
          opacity-0 group-hover:opacity-100
          bg-gradient-to-r from-sky-300/20 via-transparent to-emerald-300/20
          dark:from-sky-600/30 dark:to-emerald-600/30
          transition-opacity duration-300
        "
      />

      {/* conteúdo */}
      <div className="relative z-[1] flex items-center gap-3">
        <div
          className="
            flex h-10 w-10 items-center justify-center rounded-xl
            bg-sky-500/10 dark:bg-sky-500/20 text-sky-600 dark:text-sky-300
            ring-2 ring-sky-100 dark:ring-sky-900/80
            transition-all duration-300
            group-hover:bg-sky-500 group-hover:text-white
            group-hover:ring-sky-300 dark:group-hover:ring-sky-600
          "
        >
          <Store className="h-5 w-5" strokeWidth={1.8} />
        </div>

        <div className="flex flex-col">
          <span className="text-sm font-medium text-sky-700/80 dark:text-sky-400/80">
            Loja
          </span>
          <span className="text-base font-semibold text-slate-900 dark:text-slate-50">
            {name}
          </span>
          {subtitle && (
            <span className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              {subtitle}
            </span>
          )}
        </div>
      </div>

      <p className="relative z-[1] mt-3 text-xs text-slate-500 dark:text-slate-400">
        Clique para acessar o painel desta loja.
      </p>
    </button>
  );
}
