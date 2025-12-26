"use client";

import Link from "next/link";

interface AdminButtonProps {
    onClick: () => void;
}

export function AdminButton({ onClick }: AdminButtonProps) {
  return (
    <button
      onClick={onClick}
      className="
        group relative inline-flex items-center gap-2 rounded-full
        bg-slate-900 text-slate-50 px-6 py-2.5 text-sm font-semibold
        shadow-md shadow-slate-900/20
        transition-all duration-200
        hover:-translate-y-0.5 hover:shadow-lg hover:bg-slate-800
        active:translate-y-0 active:shadow-sm
        focus-visible:outline-none focus-visible:ring-2
        focus-visible:ring-sky-500 focus-visible:ring-offset-2
        overflow-hidden
      "
    >
      {/* brilho animado passando */}
      <span
        className="
          pointer-events-none absolute inset-y-0 left-0 w-1/3
          translate-x-[-150%] bg-gradient-to-r from-transparent via-white/30 to-transparent
          opacity-0
          group-hover:translate-x-[250%] group-hover:opacity-100
          transition-all duration-500
        "
      />
      <span className="relative z-[1]">Acessar Painel de Administrador</span>
    </button>
  );
}
