
"use client";

import { useState, Suspense, useEffect } from 'react';
import { useRouter, useSearchParams, useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, KeyRound, Loader2, Store, Eye, EyeOff } from 'lucide-react';
import Link from 'next/link';
import { Store as StoreType } from '@/lib/storage';
import { Logo } from '@/components/logo';

function StoreLoginComponent() {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [store, setStore] = useState<StoreType | null>(null);
  
  const router = useRouter();
  const searchParams = useSearchParams();
  const params = useParams();
  const { toast } = useToast();
  
  const redirectUrl = searchParams.get('redirect') || '/';
  const storeId = params.storeId as string;


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
        <Logo className="h-16 w-auto mb-4" textColor="text-accent" />
        <Card className="w-full shadow-lg border-primary/20">
          <CardHeader className="items-center text-center bg-primary text-primary-foreground p-6 rounded-t-lg">
            <Store className="h-12 w-12 mb-2 text-primary-foreground"/>
            <CardTitle>Login da Loja</CardTitle>
            <CardDescription className="text-primary-foreground/90">
                Insira a senha para acessar a loja <strong>{store.name}</strong>.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            <form onSubmit={handleSubmit} className="space-y-6">
               <div className="space-y-2">
                  <Label htmlFor="password">Senha da Loja</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="********"
                      required
                      className="pr-10"
                    />
                     <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute inset-y-0 right-0 h-full px-3"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      <span className="sr-only">
                        {showPassword ? "Esconder senha" : "Mostrar senha"}
                      </span>
                    </Button>
                  </div>
                </div>
              <Button type="submit" className="w-full" disabled={isSubmitting}>
                 {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Verificando...
                  </>
                  ) : (
                  <>
                    Entrar na Loja <KeyRound className="ml-2"/>
                  </>
                )}
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
