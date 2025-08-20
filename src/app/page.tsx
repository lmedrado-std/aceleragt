import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/logo";
import { ArrowRight } from "lucide-react";

export default function Home() {
  return (
    <main className="flex flex-col items-center justify-center min-h-screen bg-background p-8 text-center">
      <div className="flex flex-col items-center gap-6 max-w-2xl">
        <Logo />
        <h1 className="text-5xl font-bold font-headline text-primary">
          Bem-vindo ao Corridinha GT
        </h1>
        <p className="text-xl text-muted-foreground">
          Sua ferramenta para acompanhar metas, calcular incentivos e impulsionar suas vendas para o próximo nível.
        </p>
        <p className="text-muted-foreground">
          Acesse o painel para começar a gerenciar sua equipe e acompanhar o progresso.
        </p>
        <Button asChild size="lg" className="mt-4">
          <Link href="/dashboard">
            Acessar Painel
            <ArrowRight className="ml-2 h-5 w-5" />
          </Link>
        </Button>
      </div>
    </main>
  );
}
