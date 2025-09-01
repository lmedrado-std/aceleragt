
"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/logo";
import { ArrowRight, Lock, PlusCircle, KeyRound, Trash2, Store as StoreIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { AppState, loadState, saveState, Store, setAdminPassword, getInitialState } from "@/lib/storage";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";


export default function Home() {
  const [state, setState] = useState<AppState | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [newStoreName, setNewStoreName] = useState("");
  const [newAdminPassword, setNewAdminPassword] = useState("");
  const { toast } = useToast();
  const router = useRouter();


  const loadData = () => {
    const loadedState = loadState();
    setState(loadedState);
    const adminAuthenticated = sessionStorage.getItem('adminAuthenticated') === 'true';
    setIsAdmin(adminAuthenticated);
    setLoading(false);
  }

  useEffect(() => {
    loadData();
     // Listen for storage changes to update UI if login status changes in another tab
    window.addEventListener('storage', loadData);
    return () => {
      window.removeEventListener('storage', loadData);
    };
  }, []);

  const handleAddStore = () => {
    if (!newStoreName.trim()) {
      toast({ variant: "destructive", title: "Erro", description: "O nome da loja não pode estar vazio." });
      return;
    }
    const currentState = loadState();
    const newStoreId = new Date().toISOString();
    const newStore: Store = { id: newStoreId, name: newStoreName };
    const newState: AppState = {
      ...currentState,
      stores: [...currentState.stores, newStore],
      sellers: { ...currentState.sellers, [newStoreId]: [] },
      goals: { ...currentState.goals, [newStoreId]: currentState.goals.default || getInitialState().goals.default },
      incentives: { ...currentState.incentives, [newStoreId]: {} }
    };
    saveState(newState);
    setState(newState); // Update local state to re-render
    setNewStoreName("");
    toast({ title: "Sucesso!", description: `Loja "${newStore.name}" adicionada.` });
    // No automatic redirect, admin can see the new store in the list and click it.
  };

  const handleRemoveStore = (id: string) => {
    const currentState = loadState();
    if (currentState.stores.length <= 1) {
      toast({ variant: "destructive", title: "Ação não permitida", description: "Não é possível remover a última loja." });
      return;
    }
    const newState = { ...currentState };
    newState.stores = newState.stores.filter(s => s.id !== id);
    delete newState.sellers[id];
    delete newState.goals[id];
    delete newState.incentives[id];
    saveState(newState);
    setState(newState); // Update UI
    toast({ title: "Loja removida", description: "A loja e todos os seus dados foram removidos." });
  };

  const handleChangePassword = () => {
    if (newAdminPassword.length < 4) {
      toast({ variant: "destructive", title: "Senha muito curta", description: "A senha deve ter pelo menos 4 caracteres." });
      return;
    }
    setAdminPassword(newAdminPassword);
    setNewAdminPassword("");
    toast({ title: "Sucesso!", description: "Sua senha de administrador foi alterada." });
  };


  return (
    <main className="flex flex-col items-center justify-center min-h-screen bg-background p-8 relative">
      <div className="absolute top-2 right-2 bg-yellow-200 text-yellow-800 text-xs font-bold p-1 rounded z-10">PÁGINA: HOME (page.tsx)</div>
      <div className="flex flex-col items-center gap-6 max-w-4xl w-full">
        <Logo />
        <h1 className="text-5xl font-bold font-headline text-primary text-center">
          Bem-vindo ao Corridinha GT
        </h1>
        <p className="text-xl text-muted-foreground text-center">
          Selecione a loja para continuar ou acesse o painel de administrador.
        </p>

        <div className="w-full max-w-md border bg-card p-6 rounded-lg shadow-sm mt-8">
          <h2 className="text-center text-lg font-semibold text-card-foreground mb-6">Acessar Painel da Loja</h2>
          {loading ? (
            <p className="text-center text-muted-foreground">Carregando lojas...</p>
          ) : !state || state.stores.length === 0 ? (
            <div className="text-center text-muted-foreground py-4">
              <p>Nenhuma loja encontrada.</p>
              {isAdmin && <p className="text-sm mt-2">Use o painel de administrador abaixo para adicionar uma loja.</p>}
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {state.stores.map((store) => (
                <Button asChild size="lg" variant="outline" key={store.id} className="justify-start h-auto py-3">
                  <Link href={`/loja/${store.id}`} className="flex items-center gap-4 w-full">
                    <StoreIcon className="h-6 w-6" />
                    <span className="font-semibold text-base flex-grow text-left">{store.name}</span>
                    <ArrowRight className="ml-auto h-5 w-5" />
                  </Link>
                </Button>
              ))}
            </div>
          )}
        </div>

        {isAdmin && (
           <Card className="w-full max-w-4xl mt-10">
              <CardHeader>
                <CardTitle>Painel Administrativo Global</CardTitle>
                <CardDescription>Gerencie todas as lojas e configurações do sistema.</CardDescription>
              </CardHeader>
              <CardContent className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader><CardTitle className="text-lg">Gerenciar Lojas</CardTitle></CardHeader>
                  <CardContent>
                    <div className="space-y-2 mb-4">
                      <Label htmlFor="new-store">Adicionar Nova Loja</Label>
                      <div className="flex items-center gap-2">
                         <Input 
                            id="new-store"
                            placeholder="Ex: SUPERMODA ITABUNA" 
                            value={newStoreName}
                            onChange={(e) => setNewStoreName(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleAddStore()}
                         />
                        <Button type="button" onClick={handleAddStore}><PlusCircle/></Button>
                      </div>
                    </div>
                    <Separator className="my-4"/>
                    <Label>Lojas Atuais</Label>
                    <div className="space-y-2 mt-2 max-h-40 overflow-y-auto pr-2">
                        {state?.stores.map((store) => (
                            <div key={store.id} className="flex items-center justify-between gap-2 p-2 rounded-md bg-muted/50">
                                <span className="font-medium">{store.name}</span>
                                <AlertDialog><AlertDialogTrigger asChild><Button size="icon" variant="ghost" className="text-destructive hover:text-destructive"><Trash2 className="h-4 w-4"/></Button></AlertDialogTrigger>
                                  <AlertDialogContent>
                                    <AlertDialogHeader><AlertDialogTitle>Você tem certeza?</AlertDialogTitle><AlertDialogDescription>Essa ação não pode ser desfeita. Isso irá remover permanentemente a loja e todos os seus dados.</AlertDialogDescription></AlertDialogHeader>
                                    <AlertDialogFooter><AlertDialogCancel>Cancelar</AlertDialogCancel><AlertDialogAction onClick={() => handleRemoveStore(store.id)} className="bg-destructive hover:bg-destructive/90">Remover</AlertDialogAction></AlertDialogFooter>
                                  </AlertDialogContent>
                                </AlertDialog>
                            </div>
                        ))}
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader><CardTitle className="text-lg">Segurança</CardTitle></CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <Label htmlFor="new-password">Alterar Senha de Administrador</Label>
                      <Input 
                        id="new-password"
                        type="password" 
                        placeholder="Pelo menos 4 caracteres"
                        value={newAdminPassword}
                        onChange={(e) => setNewAdminPassword(e.target.value)}
                      />
                    </div>
                    <Button onClick={handleChangePassword} className="w-full mt-4"><KeyRound/> Alterar Senha</Button>
                  </CardContent>
                </Card>
              </CardContent>
            </Card>
        )}

        <div className="text-center mt-8">
          <Button variant="link" asChild>
            <Link href="/login" className="text-sm text-muted-foreground hover:text-primary transition-colors flex items-center gap-2">
                <Lock className="h-4 w-4" />
                {isAdmin ? "Sair do Modo Administrador" : "Acesso Restrito de Administrador"}
            </Link>
          </Button>
        </div>
      </div>
    </main>
  );
}
