
"use client";

import Link from "next/link";
import { Shield } from "lucide-react";

interface AdminButtonProps {
    onClick: () => void;
}

export function AdminButton({ onClick }: AdminButtonProps) {
  return (
    <button
      onClick={onClick}
      className="bg-slate-900 hover:bg-slate-800 text-white font-semibold px-8 py-3 rounded-full shadow-lg transition-transform hover:-translate-y-0.5 active:translate-y-0"
    >
      <div className="flex items-center gap-2">
        <Shield className="h-5 w-5"/>
        <span>Acessar Painel de Administrador</span>
      </div>
    </button>
  );
}
