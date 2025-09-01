
"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/logo";
import { ArrowRight, Lock, Store as StoreIcon, PlusCircle, Trash2, KeyRound } from "lucide-react";
import { useEffect, useState } from "react";
import { AppState, loadState, saveState, Store, getInitialState, setAdminPassword, Goals } from "@/lib/storage";
import { Input } from "@/components/ui/input";
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
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";


export default function Home() {
  const [state, setState] = useState<AppState>(getInitialState());
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [newStoreName, setNewStoreName] = useState("");
  const [newAdminPassword, setNewAdminPassword] = useState("");
  const { toast } = useToast();

  useEffect(() => {
    // This effect runs once on component mount on the client side.
    const loadedState = loadState();
    setState(loadedState);
    setLoading(false);
    
    // Check for admin authentication in session storage.
    const adminAuthenticated = sessionStorage.getItem('adminAuthenticated') === 'true';
    setIsAdmin(adminAuthenticated);

  }, []);

  const handleAddStore = () => {
    if (!newStoreName.trim()) {
        toast({
            variant: "destructive",
            title: "Erro",
            description: "O nome da loja não pode estar vazio.",
        });
        return;
    }
    
    const newStoreId = new Date().toISOString();
    const newStore: Store = {
        id: newStoreId,
        name: newStoreName,
    };
    
    // Create a new state object based on the current one
    const newState: AppState = {
        ...state,
        stores: [...state.stores, newStore],
        sellers: {
            ...state.sellers,
            [newStoreId]: [], // Start with an empty list of sellers for the new store
        },
        goals: {
            ...state.goals,
            // Initialize with default goals, ensuring the object exists.
            [newStoreId]: state.goals.default || getInitialState().goals.default,
        },
        incentives: {
            ...state.incentives,
            [newStoreId]: {}, // Start with empty incentives
        }
    };
    
    // Save the entire new state to localStorage first
    saveState(newState);
    
    // Then, update the component's state to reflect the change
    setState(newState);
    
    setNewStoreName("");

    toast({
        title: "Sucesso!",
        description: `Loja "${newStore.name}" adicionada.`,
    });
};
    
    const handleRemoveStore = (storeId: string) => {
        if (state.stores.length <= 1) {
             toast({
                variant: "destructive",
                title: "Ação não permitida",
                description: "Não é possível remover a última loja.",
            });
            return;
        }

        const newState = { ...state };
        newState.stores = newState.stores.filter(s => s.id !== storeId);
        delete newState.sellers[storeId];
        delete newState.goals[storeId];
        delete newState.incentives[storeId];
        
        saveState(newState);
        setState(newState);

        toast({
            title: "Loja removida",
            description: "A loja e todos os seus dados foram removidos.",
        });
    };

    const handleChangePassword = () => {
        if (newAdminPassword.length < 4) {
          toast({
            variant: "destructive",
            title: "Senha muito curta",
            description: "A senha deve ter pelo menos 4 caracteres.",
          });
          return;
        }
        setAdminPassword(newAdminPassword);
        setNewAdminPassword("");
        toast({
          title: "Sucesso!",
          description: "Sua senha de administrador foi alterada.",
        });
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
          Selecione a loja para continuar.
        </p>
        
        <div className="w-full max-w-md border bg-card p-6 rounded-lg shadow-sm mt-8">
            <h2 className="text-center text-lg font-semibold text-card-foreground mb-6">Acessar Painel da Loja</h2>
            {loading ? (
                 <p className="text-center text-muted-foreground">Carregando lojas...</p>
            ) : (
                 <div className="grid grid-cols-1 gap-4">
                    {state.stores.map((store) => (
                      <div key={store.id} className="flex items-center gap-2">
                        <Button asChild size="lg" variant="outline" className="flex-grow justify-start h-auto py-3">
                          <Link href={`/loja/${store.id}`} className="flex items-center gap-4">
                             <StoreIcon className="h-10 w-10" />
                             <div className="flex flex-col items-start">
                                <span className="font-semibold text-base">{store.name}</span>
                                <span className="text-sm text-muted-foreground font-normal">Ver painel da loja</span>
                             </div>
                             <ArrowRight className="ml-auto h-5 w-5" />
                          </Link>
                        </Button>
                        {isAdmin && (
                           <AlertDialog>
                              <AlertDialogTrigger asChild>
                                  <Button size="icon" variant="ghost" className="text-destructive hover:text-destructive"><Trash2 className="h-5 w-5"/></Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                  <AlertDialogHeader>
                                      <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
                                      <AlertDialogDescription>
                                          Essa ação não pode ser desfeita. Isso irá remover permanentemente a loja e todos os seus dados (vendedores, metas, etc.).
                                      </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                      <AlertDialogAction onClick={() => handleRemoveStore(store.id)} className="bg-destructive hover:bg-destructive/90">Remover</AlertDialogAction>
                                  </AlertDialogFooter>
                              </AlertDialogContent>
                          </AlertDialog>
                        )}
                      </div>
                    ))}
                 </div>
            )}
        </div>
        
        {isAdmin && (
            <div className="w-full max-w-md mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Adicionar Loja</CardTitle>
                        <CardDescription>Crie uma nova loja.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                             <Label htmlFor="new-store">Nome da Loja</Label>
                             <Input
                                id="new-store"
                                value={newStoreName}
                                onChange={(e) => setNewStoreName(e.target.value)}
                                placeholder="Ex: SUPERMODA ITABUNA"
                                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddStore(); }}}
                            />
                        </div>
                        <Button onClick={handleAddStore} className="w-full"><PlusCircle/> Adicionar Loja</Button>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <CardTitle>Segurança</CardTitle>
                        <CardDescription>Altere sua senha.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                             <Label htmlFor="new-password">Nova Senha</Label>
                             <Input
                                id="new-password"
                                type="password"
                                value={newAdminPassword}
                                onChange={(e) => setNewAdminPassword(e.target.value)}
                                placeholder="Pelo menos 4 caracteres"
                            />
                        </div>
                        <Button onClick={handleChangePassword} className="w-full"><KeyRound/> Alterar Senha</Button>
                    </CardContent>
                </Card>
            </div>
        )}


         <div className="text-center mt-8">
            <Link href="/login" className="text-sm text-muted-foreground hover:text-primary transition-colors flex items-center gap-2">
                <Lock className="h-4 w-4" />
                Acesso Restrito de Administrador
            </Link>
        </div>
      </div>
    </main>
  );
}
