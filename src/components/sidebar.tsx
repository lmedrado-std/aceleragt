
"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Store } from "@/lib/storage";
import { usePathname } from "next/navigation";
import { LayoutDashboard, LogOut, Store as StoreIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Logo } from "./logo";
import { Button } from "./ui/button";
import { Footer } from "./footer";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import { Skeleton } from "./ui/skeleton";
import { Switch } from "./ui/switch";

const SidebarLink = ({ href, icon: Icon, children, active }: { href: string; icon: React.ElementType; children: React.ReactNode; active: boolean }) => (
  <Link href={href} passHref>
    <div
      className={cn(
        "flex items-center gap-3 px-4 py-2 text-sm font-medium text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition-colors cursor-pointer",
        active && "bg-white/20 text-white"
      )}
    >
      <Icon className="h-5 w-5" />
      <span>{children}</span>
    </div>
  </Link>
);

export function Sidebar() {
  const [stores, setStores] = useState<Store[]>([]);
  const [loading, setLoading] = useState(true);
  const pathname = usePathname();
  const { toast } = useToast();
  const router = useRouter();

  useEffect(() => {
    async function fetchStores() {
      try {
        const response = await fetch("/api/stores");
        if (!response.ok) throw new Error("Falha ao buscar lojas");
        const data = await response.json();
        setStores(data);
      } catch (error) {
        console.error(error);
        toast({
          variant: "destructive",
          title: "Erro de Rede",
          description: "Não foi possível carregar as lojas.",
        });
      } finally {
        setLoading(false);
      }
    }
    fetchStores();
  }, [toast]);

  const handleLogout = () => {
    sessionStorage.clear();
    toast({ title: "Saída segura!", description: "Você saiu da sua conta." });
    router.push("/");
  };

  return (
    <aside className="w-64 flex-shrink-0 bg-gradient-to-b from-blue-700 via-purple-700 to-red-600 text-primary-foreground p-4 flex flex-col sidebar-gradient">
      <div className="flex items-center gap-3 mb-8 p-2">
        <Link href="/">
          <Logo />
        </Link>
      </div>
      <nav className="flex-1 space-y-4">
        <SidebarLink href="/admin" icon={LayoutDashboard} active={pathname.startsWith("/admin")}>
          Admin
        </SidebarLink>

        <div className="pt-4 mt-4 border-t border-white/20">
          <h2 className="px-4 mb-2 text-xs font-semibold tracking-wider text-white/50 uppercase">
            Lojas
          </h2>
          {loading ? (
            <div className="space-y-2">
              <Skeleton className="h-8 w-full bg-white/20" />
              <Skeleton className="h-8 w-full bg-white/20" />
            </div>
          ) : (
            stores.map((store) => (
              <SidebarLink
                key={store.id}
                href={`/loja/${store.id}`}
                icon={StoreIcon}
                active={pathname.includes(`/loja/${store.id}`) || pathname.includes(`/dashboard/${store.id}`)}
              >
                {store.name}
              </SidebarLink>
            ))
          )}
        </div>
      </nav>

      <div className="space-y-3">
          <Button variant="ghost" onClick={handleLogout} className="w-full justify-start text-base text-white/80 hover:text-white hover:bg-white/10">
              <LogOut />
              Sair de todas as contas
          </Button>
          <Footer />
      </div>
    </aside>
  );
}
