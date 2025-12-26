
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Shield, Home, Moon, Sun, Database, LineChart } from "lucide-react";
import { useTheme } from "next-themes";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Logo } from "./logo";
import { Tooltip, TooltipProvider, TooltipTrigger, TooltipContent } from "./ui/tooltip";


export function Sidebar() {
  const pathname = usePathname();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const NavLink = ({ href, children, icon, isActive }: { href: string, children: React.ReactNode, icon: React.ReactNode, isActive?: boolean }) => (
    <Button
      asChild
      variant="ghost"
      className={cn(
        "w-full justify-start text-base font-normal",
        isActive ? "bg-black/20 text-white font-semibold" : "text-white/80 hover:bg-black/10 hover:text-white"
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
      return <Skeleton className="h-10 w-10 rounded-full bg-black/20" />;
    }
    return (
      <Tooltip>
        <TooltipTrigger asChild>
            <Button onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} variant="ghost" size="lg" className="rounded-full text-white/80 hover:bg-black/20 hover:text-white">
                {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
                <span className="sr-only">Toggle theme</span>
            </Button>
        </TooltipTrigger>
        <TooltipContent side="right">
            <p>Alterar tema (claro/escuro)</p>
        </TooltipContent>
      </Tooltip>
    )
  }

  const isAdminPage = pathname.startsWith('/admin');

  return (
    <TooltipProvider>
      <aside className="flex h-full max-h-screen flex-col gap-2 bg-[#2B344D] text-white">
        <div className="flex h-14 items-center border-b border-white/20 px-4 lg:h-[60px] lg:px-6">
          <Link href="/" className="flex items-center gap-3 text-white">
              <Logo />
          </Link>
        </div>

        <nav className="flex-1 p-2 space-y-1 overflow-y-auto">
          <div className="px-2 py-2">
            <Tooltip>
                <TooltipTrigger asChild><NavLink href="/" icon={<Home size={20} />} isActive={pathname === '/'}>Início</NavLink></TooltipTrigger>
                <TooltipContent side="right"><p>Voltar para a seleção de lojas</p></TooltipContent>
            </Tooltip>
            <Tooltip>
                <TooltipTrigger asChild><NavLink href="/admin" icon={<Shield size={20} />} isActive={pathname.startsWith('/admin')}>Admin</NavLink></TooltipTrigger>
                <TooltipContent side="right"><p>Acessar painel de controle global</p></TooltipContent>
            </Tooltip>
            {isAdminPage && (
              <div className="pl-4 mt-1 space-y-1">
                 <Tooltip>
                    <TooltipTrigger asChild><NavLink href="/admin/dashboard" icon={<LineChart size={20} />} isActive={pathname === '/admin/dashboard'}>Dashboard</NavLink></TooltipTrigger>
                    <TooltipContent side="right"><p>Ver estatísticas consolidadas</p></TooltipContent>
                </Tooltip>
                <Tooltip>
                    <TooltipTrigger asChild><NavLink href="/admin/db-schema" icon={<Database size={20} />} isActive={pathname === '/admin/db-schema'}>DB Schema</NavLink></TooltipTrigger>
                    <TooltipContent side="right"><p>Visualizar a estrutura do banco de dados</p></TooltipContent>
                </Tooltip>
              </div>
            )}
          </div>
          <Separator className="my-2 bg-white/20" />
          <p className="px-3 pt-2 text-sm text-muted-foreground">Você está em:</p>
          <p className="px-3 font-semibold text-lg">{pathname.split('/')[2]?.replace(/-/g, ' ') || 'Navegação'}</p>
        </nav>

        <div className="mt-auto p-4 border-t border-white/20">
          <div className="flex justify-center mb-4">
              {renderThemeToggle()}
          </div>
          <div className="px-3 py-2 text-xs text-center text-white/70 space-y-1">
              <p>V2.0.0 Build Estavel</p>
              <p>RyannBreston desenvolvedor</p>
              <p>© {new Date().getFullYear()} Acelera GT.</p>
          </div>
        </div>
      </aside>
    </TooltipProvider>
  );
}
