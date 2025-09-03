"use client";

import { useState, Suspense, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, KeyRound, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { loadState, Seller } from '@/lib/storage';
import { SellerAvatar } from '@/components/seller-avatar';

function SellerLoginComponent() {
  const [password, setPassword] = useState('');
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
    const state = loadState();
    const currentSeller = state.sellers[currentStoreId]?.find(s => s.id === sellerId);

    if (currentSeller) {
        setSeller(currentSeller);
    } else {
        toast({ variant: "destructive", title: "Erro", description: "Vendedor não encontrado." });
        router.push(`/loja/${currentStoreId}`);
        return;
    }

    const sellerAuthenticated = sessionStorage.getItem(`sellerAuthenticated-${sellerId}`) === 'true';
    if (sellerAuthenticated) {
      router.push(redirectUrl);
    } else {
      setLoading(false);
    }
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
        <div className="flex flex-col items-center justify-center min-h-screen">
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
        <Card className="w-full">
          <CardHeader className="items-center text-center">
            <SellerAvatar avatarId={seller.avatarId} className="h-20 w-20 mb-4" />
            <CardTitle>Olá, {seller.name}!</CardTitle>
            <CardDescription>
                Por favor, insira sua senha para acessar seu painel.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
               <div className="space-y-2">
                  <Label htmlFor="password">Sua Senha</Label>
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
                {isSubmitting ? 'Verificando...' : 'Entrar'}
                <KeyRound className="ml-2 h-4 w-4" />
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
            <div className="flex flex-col items-center justify-center min-h-screen">
                <Loader2 className="mr-2 h-16 w-16 animate-spin text-primary" />
                <p className="mt-4 text-muted-foreground">Carregando...</p>
            </div>
        }>
            <SellerLoginComponent />
        </Suspense>
    )
}

    