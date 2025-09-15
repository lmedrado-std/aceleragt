
"use client";

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Loader2, Shield, Home } from 'lucide-react';
import ClientOnly from '@/components/client-only';


function AdminDashboard() {
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        const isAdmin = sessionStorage.getItem('adminAuthenticated') === 'true';
        if (!isAdmin) {
            router.push('/login?redirect=/admin/dashboard');
        } else {
            setLoading(false);
        }
    }, [router]);

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)]">
                <Loader2 className="mr-2 h-16 w-16 animate-spin text-primary" />
                <p className="mt-4 text-muted-foreground">Carregando dashboard...</p>
            </div>
        );
    }
    
    return (
        <div className="flex flex-col gap-6 w-full">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold text-foreground">
                    Dashboard Geral
                </h1>
                <div className="flex items-center gap-2">
                    <Button asChild variant="outline">
                      <Link href="/admin">
                        <Shield className="mr-2 h-4 w-4" />
                        Admin
                      </Link>
                    </Button>
                    <Button asChild variant="outline">
                      <Link href="/">
                        <Home className="mr-2 h-4 w-4" />
                        Início
                      </Link>
                    </Button>
                </div>
            </div>


            <Card>
                <CardHeader>
                    <CardTitle>Dashboard em Manutenção</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-muted-foreground">
                        Esta área de dashboard geral está sendo reconstruída para usar dados em tempo real do banco de dados.
                        Por enquanto, por favor, gerencie as lojas e acesse os dashboards individuais através do painel de administração.
                    </p>
                </CardContent>
            </Card>
        </div>
    );
}

export default function AdminDashboardPage() {
    return (
        <ClientOnly>
            <AdminDashboard />
        </ClientOnly>
    )
}
