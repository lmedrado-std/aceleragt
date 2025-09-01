
"use client";

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Logo } from '@/components/logo';
import { ArrowLeft, KeyRound } from 'lucide-react';
import Link from 'next/link';
import { getAdminPassword, loadState } from '@/lib/storage';

function LoginComponent() {
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();

  const handleLogout = () => {
    sessionStorage.removeItem('adminAuthenticated');
    toast({
        title: 'Saída segura!',
        description: 'Você saiu do modo de administrador.',
    });
    router.push('/');
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // If user clicks the button and is already logged in, log them out.
    if (sessionStorage.getItem('adminAuthenticated') === 'true') {
        handleLogout();
        return;
    }
    
    setIsSubmitting(true);
    
    const adminPassword = getAdminPassword();

    if (password === adminPassword) {
      sessionStorage.setItem('adminAuthenticated', 'true');
      toast({
        title: 'Acesso concedido!',
        description: 'Bem-vindo, administrador.',
      });

      const redirectUrl = searchParams.get('redirect');
      if (redirectUrl) {
        router.push(redirectUrl);
      } else {
        router.push('/');
      }
    } else {
      toast({
        variant: 'destructive',
        title: 'Senha incorreta',
        description: 'Por favor, tente novamente.',
      });
      setIsSubmitting(false);
    }
  };

  const isAdmin = typeof window !== 'undefined' && sessionStorage.getItem('adminAuthenticated') === 'true';

  return (
    <main className="flex flex-col items-center justify-center min-h-screen bg-background p-8 relative">
       <div className="absolute top-2 right-2 bg-yellow-200 text-yellow-800 text-xs font-bold p-1 rounded z-10">PÁGINA: LOGIN (login/page.tsx)</div>
       <div className="absolute top-4 left-4">
            <Button asChild variant="outline">
                <Link href="/">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Página Inicial
                </Link>
            </Button>
        </div>
      <div className="flex flex-col items-center gap-6 w-full max-w-sm">
        <Logo />
        <Card className="w-full">
          <CardHeader className="text-center">
            <CardTitle>{isAdmin ? "Modo Administrador" : "Acesso Restrito"}</CardTitle>
            <CardDescription>
              {isAdmin ? "Você já está autenticado." : "Por favor, insira a senha de administrador para continuar."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
             {!isAdmin && (
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
              )}
              <Button type="submit" className="w-full" disabled={isSubmitting && !isAdmin}>
                {isAdmin ? 'Sair do Modo Administrador' : (isSubmitting ? 'Verificando...' : 'Entrar')}
                <KeyRound className="ml-2 h-4 w-4" />
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}

export default function LoginPage() {
    return (
        <Suspense fallback={<div>Carregando...</div>}>
            <LoginComponent />
        </Suspense>
    )
}
