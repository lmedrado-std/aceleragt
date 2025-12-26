"use client";

import { Sidebar } from "@/components/sidebar";
import { Button } from "./ui/button";
import { Menu } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "./ui/sheet";
import { usePathname } from "next/navigation";
import { Logo } from "./logo";
import { Home } from "lucide-react";
import Link from "next/link";

export default function AppLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const isRoot = pathname === '/';
    // Verifica se é a página da loja (ex: /loja/some-id), mas não sub-rotas (ex: /loja/some-id/dashboard)
    const isStorePage = /^\/loja\/[^/]+$/.test(pathname);
    
    // Oculta a sidebar na página inicial e na página de seleção de vendedores da loja
    const hideSidebar = isRoot || isStorePage;

    if (hideSidebar) {
        return <main className="flex-1 flex flex-col">{children}</main>;
    }

    return (
        <div className="grid min-h-screen w-full md:grid-cols-[220px_1fr] lg:grid-cols-[280px_1fr]">
            <div className="hidden md:block">
                <Sidebar />
            </div>
            <div className="flex flex-col">
                <header className="flex h-14 items-center justify-between border-b bg-muted/40 px-4 lg:h-[60px] lg:px-6 md:hidden">
                    <Sheet>
                        <SheetTrigger asChild>
                        <Button
                            variant="outline"
                            size="icon"
                            className="shrink-0"
                        >
                            <Menu className="h-5 w-5" />
                            <span className="sr-only">Toggle navigation menu</span>
                        </Button>
                        </SheetTrigger>
                        <SheetContent side="left" className="flex flex-col p-0">
                            <span className="sr-only">
                                <SheetTitle>Menu de Navegação</SheetTitle>
                            </span>
                            <Sidebar />
                        </SheetContent>
                    </Sheet>
                    <Link href="/">
                        <Home className="h-5 w-5"/>
                        <span className="sr-only">Página Inicial</span>
                    </Link>
                </header>
                 <main className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6">
                    {children}
                </main>
            </div>
        </div>
    );
}
