
"use client";

import { useState, Suspense, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, KeyRound, Loader2, Eye, EyeOff } from 'lucide-react';
import Link from 'next/link';
import { Seller } from '@/lib/storage';
import { SellerAvatar } from '@/components/seller-avatar';
import { Logo } from '@/components/logo';

function SellerLoginComponent() {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [seller, setSeller] = useState<Seller | null>(null);
  const [storeId, setStoreId] = useState<string | null>(null);
  
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  
  const redirectUrl = searchParams.get('redirect') || '/';
  const sellerId = searchParams.get('sellerId');

  useEffect(() => {
    const currentStoreId = searchParams.get('storeId');
    if (!sellerId || !currentStoreId) {
        toast({ variant: "destructive", title: "Erro", description: "Vendedor ou loja não especificado." });
        router.push('/');
        return;
    }

    setStoreId(currentStoreId);
    
    async function fetchSeller() {
        try {
            const res = await fetch(`/api/sellers?storeId=${currentStoreId}`);
            if (!res.ok) throw new Error('Failed to fetch sellers');
            const sellers = await res.json();
            const currentSeller = sellers.find((s: Seller) => s.id === sellerId);

            if (currentSeller) {
                setSeller(currentSeller);
                 const sellerAuthenticated = sessionStorage.getItem(`sellerAuthenticated-${sellerId}`) === 'true';
                if (sellerAuthenticated) {
                  router.push(redirectUrl);
                } else {
                  setLoading(false);
                }
            } else {
                toast({ variant: "destructive", title: "Erro", description: "Vendedor não encontrado." });
                router.push(`/loja/${currentStoreId}`);
            }
        } catch (error) {
            console.error(error);
            toast({ variant: "destructive", title: "Erro", description: "Falha ao carregar dados do vendedor." });
            router.push(`/loja/${currentStoreId}`);
        }
    }
    
    fetchSeller();

  }, [router, redirectUrl, sellerId, toast, searchParams]);


  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    if (password === seller?.password) {
      sessionStorage.setItem(`sellerAuthenticated-${sellerId}`, 'true');
      toast({
        title: 'Acesso concedido!',
        description: `Bem-vindo(a), ${seller.name}.`,
      });
      router.push(redirectUrl);
    } else {
      toast({
        variant: 'destructive',
        title: 'Senha incorreta',
        description: 'Por favor, tente novamente.',
      });
      setIsSubmitting(false);
    }
  };

  if (loading || !seller || !storeId) {
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
                <Link href={`/loja/${storeId}`}>
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Voltar para Loja
                </Link>
            </Button>
        </div>
      <div className="flex flex-col items-center gap-6 w-full max-w-sm">
        <Logo className="h-16 w-auto mb-4" />
        <Card className="w-full shadow-lg border-primary/20">
          <CardHeader className="items-center text-center bg-primary text-primary-foreground p-6 rounded-t-lg">
            <SellerAvatar avatarId={seller.avatar_id} className="h-20 w-20 mb-4 border-2 border-primary-foreground/50" />
            <CardTitle>Login do Vendedor</CardTitle>
            <CardDescription className="text-primary-foreground/90">
                <strong>{seller.name}</strong>, insira sua senha para continuar.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            <form onSubmit={handleSubmit} className="space-y-6">
               <div className="space-y-2">
                  <Label htmlFor="password">Sua Senha</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
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
                    Entrar <KeyRound className="ml-2"/>
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

export default function SellerLoginPage() {
    return (
        <Suspense fallback={
            <div className="flex flex-col items-center justify-center min-h-screen bg-background">
                <Loader2 className="mr-2 h-16 w-16 animate-spin text-primary" />
                <p className="mt-4 text-muted-foreground">Carregando...</p>
            </div>
        }>
            <SellerLoginComponent />
        </Suspense>
    )
}
