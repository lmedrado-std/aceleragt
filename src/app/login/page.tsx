
"use client";

import { useState, Suspense, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { KeyRound, Loader2, Eye, EyeOff } from 'lucide-react';
import { Logo } from '@/components/logo';

function LoginComponent() {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
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


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
        const res = await fetch('/api/auth/admin', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ password })
        });

        if (res.ok) {
            sessionStorage.setItem('adminAuthenticated', 'true');
            toast({
                title: 'Acesso concedido!',
                description: 'Bem-vindo, administrador.',
            });
            router.push(redirectUrl);
        } else {
            const data = await res.json();
            throw new Error(data.error || "Senha incorreta");
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
        <Logo className="h-16 w-auto mb-4" />
        <Card className="w-full shadow-lg border-primary/20">
          <CardHeader className="text-center bg-primary text-primary-foreground p-6 rounded-t-lg">
            <CardTitle>Login do Administrador Global</CardTitle>
            <CardDescription className="text-primary-foreground/90">
                Por favor, insira a senha de administrador para continuar.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            <form onSubmit={handleSubmit} className="space-y-6">
               <div className="space-y-2">
                  <Label htmlFor="password">Senha</Label>
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
