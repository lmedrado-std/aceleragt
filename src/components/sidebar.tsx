
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Home, Shield, Store as StoreIcon, Rocket, Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Store } from "@/lib/storage";

export function Sidebar() {
  const pathname = usePathname();
  const [stores, setStores] = useState<Store[]>([]);
  const [loading, setLoading] = useState(true);
  const { theme, setTheme } = useTheme();

  useEffect(() => {
    async function fetchStores() {
      try {
        const res = await fetch("/api/stores");
        if (!res.ok) throw new Error("Failed to fetch stores");
        const data = await res.json();
        setStores(data);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    }
    fetchStores();
  }, []);

  const NavLink = ({ href, children, icon }: { href: string, children: React.ReactNode, icon: React.ReactNode }) => (
    <Button
      asChild
      variant="ghost"
      className={cn(
        "w-full justify-start text-base",
        pathname === href ? "bg-white/10 text-white" : "text-white/80 hover:bg-white/10 hover:text-white"
      )}
    >
      <Link href={href}>
        <div className="mr-2">{icon}</div>
        {children}
      </Link>
    </Button>
  );

  return (
    <aside className="w-64 flex-shrink-0 bg-gradient-to-b from-blue-600 via-purple-600 to-red-600 text-white flex flex-col">
      <div className="p-4 flex items-center gap-2 border-b border-white/20">
         <div className="rounded-lg bg-white/20 p-2">
            <Rocket className="h-6 w-6 text-white" />
        </div>
        <h1 className="text-xl font-bold">Acelera GT</h1>
      </div>

      <nav className="flex-1 p-4 space-y-2">
        <NavLink href="/admin" icon={<Shield />}>Admin</NavLink>
        <Separator className="bg-white/20 my-4" />
        <h2 className="text-sm font-semibold tracking-wider text-white/70 uppercase px-3">
          Lojas
        </h2>
        {loading ? (
            <div className="space-y-2 px-2">
                <Skeleton className="h-9 w-full bg-white/10" />
                <Skeleton className="h-9 w-full bg-white/10" />
            </div>
        ) : stores.length > 0 ? (
          stores.map((store) => (
            <NavLink key={store.id} href={`/loja/${store.id}`} icon={<StoreIcon />}>
              {store.name}
            </NavLink>
          ))
        ) : (
          <p className="px-3 text-sm text-white/60">Nenhuma loja cadastrada.</p>
        )}
      </nav>

      <div className="p-4 border-t border-white/20 space-y-4">
         <Button onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} variant="ghost" className="w-full justify-start text-base text-white/80 hover:bg-white/10 hover:text-white">
            {theme === 'light' ? <Moon className="mr-2" /> : <Sun className="mr-2" />}
            Modo {theme === 'light' ? 'Escuro' : 'Claro'}
        </Button>
        <div className="text-xs text-white/50 text-center">
            <p>Build Teste 0.0.1 Version</p>
            <p>RyannBreston desenvolvedor</p>
            <p>© {new Date().getFullYear()} Acelera GT. Todos os direitos reservados.</p>
        </div>
      </div>
    </aside>
  );
}
