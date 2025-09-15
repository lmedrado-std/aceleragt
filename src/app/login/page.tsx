
"use client";

import { useState, Suspense, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { KeyRound, Loader2, Database } from 'lucide-react';
import Link from 'next/link';
import { Logo } from '@/components/logo';

function LoginComponent() {
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  
  const redirectUrl = searchParams.get('redirect') || '/admin';

  useEffect(() => {
    const adminAuthenticated = sessionStorage.getItem('adminAuthenticated') === 'true';
    if (adminAuthenticated) {
      router.push(redirectUrl);
    } else {
      setLoading(false);
    }
  }, [router, redirectUrl]);


  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // This password should be managed via a secure backend in a real app
    const adminPassword = process.env.NEXT_PUBLIC_ADMIN_PASSWORD || 'supermoda';

    if (password === adminPassword) {
      sessionStorage.setItem('adminAuthenticated', 'true');
      toast({
        title: 'Acesso concedido!',
        description: 'Bem-vindo, administrador.',
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

  if (loading) {
     return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-background">
            <Loader2 className="mr-2 h-16 w-16 animate-spin text-primary" />
            <p className="mt-4 text-muted-foreground">Verificando acesso...</p>
        </div>
    )
  }

  return (
    <main className="flex flex-col items-center justify-center min-h-screen bg-background p-8">
      <div className="flex flex-col items-center gap-6 w-full max-w-sm">
        <Link href="/" className="mb-4">
          <Logo className="h-16 w-auto text-foreground" />
        </Link>
        <Card className="w-full">
          <CardHeader className="text-center">
            <CardTitle>Acesso Restrito</CardTitle>
            <CardDescription>
                Por favor, insira a senha de administrador para continuar.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
               <div className="space-y-2">
                  <Label htmlFor="password">Senha</Label>
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
                <KeyRound />
              </Button>
            </form>
          </CardContent>
        </Card>
        <Button variant="link" asChild>
          <Link href="/api/setup-db" target="_blank">
            <Database className="mr-2 h-4 w-4" />
            Configurar/Resetar Banco de Dados
          </Link>
        </Button>
      </div>
    </main>
  );
}

export default function LoginPage() {
    return (
        <Suspense fallback={
            <div className="flex flex-col items-center justify-center min-h-screen bg-background">
                <Loader2 className="mr-2 h-16 w-16 animate-spin text-primary" />
                <p className="mt-4 text-muted-foreground">Carregando...</p>
            </div>
        }>
            <LoginComponent />
        </Suspense>
    )
}
