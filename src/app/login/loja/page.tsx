
"use client";

import { useState, Suspense, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, KeyRound, Loader2, Store } from 'lucide-react';
import Link from 'next/link';
import { Store as StoreType } from '@/lib/storage';
import { Logo } from '@/components/logo';

function StoreLoginComponent() {
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [store, setStore] = useState<StoreType | null>(null);
  
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  
  const redirectUrl = searchParams.get('redirect') || '/';
  const storeId = searchParams.get('storeId');

  useEffect(() => {
    if (!storeId) {
        toast({ variant: "destructive", title: "Erro", description: "Loja não especificada." });
        router.push('/');
        return;
    }
    
    async function fetchStore() {
        try {
            const res = await fetch(`/api/stores/${storeId}`);
            if (!res.ok) throw new Error('Falha ao buscar dados da loja');
            const currentStore = await res.json();

            if (currentStore) {
                // Fetch the store with password info separately for the check
                const passRes = await fetch(`/api/stores/${storeId}?includePassword=true`);
                const storeWithPass = await passRes.json();
                
                setStore(storeWithPass);
                // If the store is not password protected OR already authenticated, redirect
                if (storeWithPass.password === null || sessionStorage.getItem(`storeAuthenticated-${storeId}`) === 'true') {
                  sessionStorage.setItem(`storeAuthenticated-${storeId}`, 'true'); // Ensure it is set for non-password stores
                  router.push(redirectUrl);
                } else {
                  setLoading(false);
                }
            } else {
                toast({ variant: "destructive", title: "Erro", description: "Loja não encontrada." });
                router.push(`/`);
            }
        } catch (error) {
            console.error(error);
            toast({ variant: "destructive", title: "Erro", description: "Falha ao carregar dados da loja." });
            router.push(`/`);
        }
    }
    
    fetchStore();

  }, [router, redirectUrl, storeId, toast]);


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      const res = await fetch('/api/auth/loja', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ storeId: storeId, password: password.trim() })
      });

      if (res.ok) {
        const data = await res.json();
        if (data.success) {
            sessionStorage.setItem(`storeAuthenticated-${storeId}`, 'true');
            toast({
              title: 'Acesso concedido!',
              description: `Bem-vindo(a) à ${store?.name}.`,
            });
            router.push(redirectUrl);
        } else {
            throw new Error(data.error || 'Senha incorreta');
        }
      } else {
        const data = await res.json();
        throw new Error(data.error || 'Senha incorreta');
      }
    } catch(error) {
      toast({
        variant: 'destructive',
        title: 'Senha incorreta',
        description: 'Por favor, tente novamente.',
      });
      setIsSubmitting(false);
    }
  };

  if (loading || !store || !storeId) {
     return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-background">
            <Loader2 className="mr-2 h-16 w-16 animate-spin text-primary" />
            <p className="mt-4 text-muted-foreground">Carregando...</p>
        </div>
    )
  }

  return (
    <main className="flex flex-col items-center justify-center min-h-screen bg-background p-8 relative">
       <div className="absolute top-4 left-4">
            <Button asChild variant="outline">
                <Link href={`/`}>
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Voltar para o Início
                </Link>
            </Button>
        </div>
      <div className="flex flex-col items-center gap-6 w-full max-w-sm">
        <Link href="/" className="mb-4">
          <Logo className="h-16 w-auto text-foreground" />
        </Link>
        <Card className="w-full">
          <CardHeader className="items-center text-center">
            <Store className="h-16 w-16 mb-4 text-primary"/>
            <CardTitle>Login da Loja</CardTitle>
            <CardDescription>
                Insira a senha para acessar a loja <strong>{store.name}</strong>.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
               <div className="space-y-2">
                  <Label htmlFor="password">Senha da Loja</Label>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="********"
                    required
                  />
                </div>
              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? 'Verificando...' : 'Entrar na Loja'}
                <KeyRound />
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}

export default function StoreLoginPage() {
    return (
        <Suspense fallback={
            <div className="flex flex-col items-center justify-center min-h-screen bg-background">
                <Loader2 className="mr-2 h-16 w-16 animate-spin text-primary" />
                <p className="mt-4 text-muted-foreground">Carregando...</p>
            </div>
        }>
            <StoreLoginComponent />
        </Suspense>
    )
}
