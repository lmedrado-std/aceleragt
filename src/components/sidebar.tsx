
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Shield, Store as StoreIcon, Rocket, Moon, Sun, Database } from "lucide-react";
import { useTheme } from "next-themes";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Store } from "@/lib/storage";
import { Logo } from "./logo";

export function Sidebar() {
  const pathname = usePathname();
  const [stores, setStores] = useState<Store[]>([]);
  const [loading, setLoading] = useState(true);
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

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

  const NavLink = ({ href, children, icon, isActive }: { href: string, children: React.ReactNode, icon: React.ReactNode, isActive?: boolean }) => (
    <Button
      asChild
      variant="ghost"
      className={cn(
        "w-full justify-start text-base font-normal",
        isActive ? "bg-white/20 text-white font-semibold" : "text-white/80 hover:bg-white/10 hover:text-white"
      )}
    >
      <Link href={href}>
        <div className="mr-3">{icon}</div>
        {children}
      </Link>
    </Button>
  );

  const renderThemeToggle = () => {
    if (!mounted) {
      return <Skeleton className="h-10 w-10 rounded-full bg-white/10" />;
    }
    return (
      <Button onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} variant="ghost" size="icon" className="rounded-full text-white/80 hover:bg-white/20 hover:text-white">
          {theme === 'light' ? <Moon /> : <Sun />}
          <span className="sr-only">Toggle theme</span>
      </Button>
    )
  }

  const isAdminPage = pathname.startsWith('/admin');

  return (
    <aside className="w-64 flex-shrink-0 bg-gradient-to-b from-[#4A55A2] via-[#D45079] to-[#D45079] text-white flex flex-col">
      <div className="p-4 flex items-center gap-2 border-b border-white/20 h-20">
         <Logo className="text-white" />
      </div>

      <nav className="flex-1 p-2 space-y-1 overflow-y-auto">
        <div className="px-2 py-2">
            <NavLink href="/admin" icon={<Shield size={20} />} isActive={pathname === '/admin'}>Admin</NavLink>
             {isAdminPage && (
              <div className="pl-4 mt-1">
                 <NavLink href="/admin/db" icon={<Database size={20} />} isActive={pathname === '/admin/db'}>DB Dashboard</NavLink>
              </div>
            )}
        </div>
        <Separator className="bg-white/20 my-2" />
        <h2 className="text-sm font-semibold tracking-wider text-white/70 uppercase px-3 mt-4 mb-2">
          Lojas
        </h2>
        {loading ? (
            <div className="space-y-2 px-2">
                <Skeleton className="h-9 w-full bg-white/10" />
                <Skeleton className="h-9 w-full bg-white/10" />
            </div>
        ) : stores.length > 0 ? (
          stores.map((store) => (
            <NavLink 
                key={store.id} 
                href={`/loja/${store.id}`} 
                icon={<StoreIcon size={20} />} 
                isActive={pathname.startsWith(`/loja/${store.id}`) || pathname.startsWith(`/dashboard/${store.id}`)}
            >
              {store.name}
            </NavLink>
          ))
        ) : (
          <p className="px-3 text-sm text-white/60">Nenhuma loja cadastrada.</p>
        )}
      </nav>

      <div className="p-2 border-t border-white/20 space-y-2">
        <div className="flex justify-center">
            {renderThemeToggle()}
        </div>
        <div className="px-3 py-2 text-xs text-center text-white/60 space-y-1">
            <p>v1.0 - Build Estável</p>
            <p>RyannBreston desenvolvedor</p>
            <p>© {new Date().getFullYear()} Acelera GT.</p>
        </div>
      </div>
    </aside>
  );
}
