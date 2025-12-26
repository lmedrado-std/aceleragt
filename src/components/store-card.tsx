
"use client";

import { Store } from "lucide-react";

type StoreCardProps = {
  name: string;
  subtitle?: string;
  onClick: () => void;
};

export function StoreCard({ name, subtitle, onClick }: StoreCardProps) {
  return (
    <div 
      onClick={onClick}
      className="bg-white dark:bg-slate-800/50 rounded-2xl shadow-md hover:shadow-xl transition p-6 cursor-pointer border-b-4 border-blue-500 hover:border-blue-400 hover:-translate-y-1"
    >
      <div className="flex items-center gap-4">
        <div className="bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-300 p-3 rounded-full">
          <Store className="h-6 w-6" />
        </div>
        <div>
          <p className="text-xs text-slate-500 dark:text-slate-400">Loja</p>
          <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
            {name}
          </h3>
        </div>
      </div>
      <p className="text-sm text-slate-500 dark:text-slate-400 mt-4">
        Clique para acessar o painel desta loja.
      </p>
    </div>
  );
}
