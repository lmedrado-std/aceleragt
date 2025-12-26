
type SellerCardProps = {
  name: string;
  color: "pink" | "green" | "purple" | "orange";
  badge?: string; // ex: "Top", "Novo"
  onClick: () => void;
};

const colorMap = {
  pink: {
    ring: "ring-pink-300",
    border: "border-pink-200",
    from: "from-pink-400",
    to: "to-rose-400",
  },
  green: {
    ring: "ring-emerald-300",
    border: "border-emerald-200",
    from: "from-emerald-400",
    to: "to-teal-400",
  },
  purple: {
    ring: "ring-violet-300",
    border: "border-violet-200",
    from: "from-violet-400",
    to: "to-fuchsia-400",
  },
  orange: {
    ring: "ring-orange-300",
    border: "border-orange-200",
    from: "from-orange-400",
    to: "to-amber-400",
  },
};

export function SellerCard({ name, color, badge, onClick }: SellerCardProps) {
  const cfg = colorMap[color];
  const initial = name.trim().charAt(0).toUpperCase();

  return (
    <button
      onClick={onClick}
      className={`
        group relative flex flex-col items-center justify-between
        rounded-2xl border bg-white/70
        ${cfg.border}
        px-6 py-5
        shadow-[0_6px_18px_rgba(15,23,42,0.06)]
        backdrop-blur-sm
        transition-all duration-300
        hover:-translate-y-1 hover:shadow-[0_12px_30px_rgba(15,23,42,0.12)]
        focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500
      `}
    >
      {/* borda animada no hover */}
      <span
        className={`
          pointer-events-none absolute inset-0 rounded-2xl
          opacity-0 group-hover:opacity-100
          ring-2 ${cfg.ring}
          transition-opacity duration-300
        `}
      />

      {/* avatar */}
      <div className="relative z-[1]">
        <div
          className={`
            flex h-24 w-24 items-center justify-center rounded-full
            bg-gradient-to-br ${cfg.from} ${cfg.to}
            text-white text-4xl font-bold
            shadow-md shadow-slate-900/15
            transition-transform duration-300
            group-hover:scale-105
          `}
        >
          {initial}
        </div>

        {badge && (
          <span
            className="
              absolute -bottom-1 -right-1 rounded-full bg-amber-400
              px-2 py-0.5 text-[10px] font-semibold uppercase
              text-slate-900 shadow-sm
            "
          >
            {badge}
          </span>
        )}
      </div>

      {/* nome + legenda */}
      <div className="relative z-[1] mt-4 flex flex-col items-center gap-1">
        <span className="text-sm font-semibold tracking-[0.16em] text-slate-900">
          {name.toUpperCase()}
        </span>
        <span className="text-xs text-slate-500">
          Ver desempenho
        </span>
      </div>

      {/* efeito de “pulse” no hover */}
      <span
        className="
          pointer-events-none absolute -z-10 h-24 w-24 rounded-full
          bg-sky-100/60 blur-2 opacity-0
          group-hover:opacity-100 group-hover:animate-pulse
        "
      />
    </button>
  );
}
