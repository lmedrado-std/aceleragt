
"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { KeyRound, Trash2, Home, ArrowRight, LogOut, Loader2, Edit, Save, X, LineChart, Building, Rocket, LayoutDashboard } from "lucide-react";
import { useEffect, useState } from "react";
import { AppState, loadStateFromStorage, saveState, Store, setAdminPassword, getInitialState, Seller, Goals } from "@/lib/storage";
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
import Link from "next/link";
import { motion } from "framer-motion";


const SidebarLink = ({ href, icon: Icon, children }: { href: string, icon: React.ElementType, children: React.ReactNode}) => (
    <Link href={href} passHref>
      <motion.div
        whileHover={{ scale: 1.05, x: 5 }}
        className="flex items-center gap-3 px-4 py-2 text-sm font-medium text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
      >
        <Icon className="h-5 w-5" />
        <span>{children}</span>
      </motion.div>
    </Link>
  )

export default function AdminPage() {
  const [state, setState] = useState<AppState | null>(null);
  const [loading, setLoading] = useState(true);
  const [newStoreName, setNewStoreName] = useState("");
  
  const [adminPasswords, setAdminPasswords] = useState({ new: '', confirm: ''});
  const [editingStoreId, setEditingStoreId] = useState<string | null>(null);
  const [editingStoreName, setEditingStoreName] = useState('');

  const { toast } = useToast();
  const router = useRouter();


  useEffect(() => {
    const isAdmin = sessionStorage.getItem('adminAuthenticated') === 'true';
    if (!isAdmin) {
      router.push('/login?redirect=/admin');
    } else {
      setState(loadStateFromStorage());
      setLoading(false);
    }
     // Reset theme to default when on this page
    document.documentElement.style.removeProperty('--primary');
  }, [router]);

  const handleAddStore = () => {
    if (!newStoreName.trim()) {
       setTimeout(() => {
        toast({ variant: "destructive", title: "Erro", description: "O nome da loja não pode estar vazio." });
      }, 0);
      return;
    }

    setState(currentState => {
      if (!currentState) return null;

      const newStoreId = crypto.randomUUID();
      const newStore: Store = { id: newStoreId, name: newStoreName, themeColor: '217.2 32.6% 17.5%' };
      
      const newState: AppState = {
        ...currentState,
        stores: [...currentState.stores, newStore],
        sellers: { ...currentState.sellers, [newStoreId]: [] as Seller[] },
        goals: { ...currentState.goals, [newStoreId]: currentState.goals.default || getInitialState().goals.default as Goals },
        incentives: { ...currentState.incentives, [newStoreId]: {} }
      };

      saveState(newState);
       setTimeout(() => {
          toast({ title: "Sucesso!", description: `Loja "${newStore.name}" adicionada.` });
       }, 0);
      
      setNewStoreName("");
      
      return newState;
    });
  };

  const handleRemoveStore = (id: string) => {
    const currentState = state;
    if (!currentState) return;

    if (currentState.stores.length <= 1) {
        setTimeout(() => {
            toast({ variant: "destructive", title: "Ação não permitida", description: "Não é possível remover a última loja." });
        }, 0);
        return;
    }

    const storeToRemove = currentState.stores.find(s => s.id === id);
    const newState: AppState = { ...currentState };
    newState.stores = currentState.stores.filter(s => s.id !== id);
    delete newState.sellers[id];
    delete newState.goals[id];
    delete newState.incentives[id];
    
    saveState(newState);
    setState(newState);
    
    if (storeToRemove) {
      setTimeout(() => {
        toast({ title: "Loja removida", description: `A loja "${storeToRemove.name}" foi removida.` });
      }, 0);
    }
  };

  const handleStartEditingStore = (store: Store) => {
    setEditingStoreId(store.id);
    setEditingStoreName(store.name);
  };

  const handleCancelEditingStore = () => {
    setEditingStoreId(null);
    setEditingStoreName('');
  };

  const handleSaveStore = (id: string) => {
    if (!editingStoreName.trim()) {
      setTimeout(() => {
        toast({ variant: "destructive", title: "Erro", description: "O nome da loja não pode estar vazio." });
      }, 0);
      return;
    }
    setState(currentState => {
      if (!currentState) return null;
      const newState = {
        ...currentState,
        stores: currentState.stores.map(store => 
          store.id === id ? { ...store, name: editingStoreName } : store
        )
      };
      saveState(newState);
      setTimeout(() => {
        toast({ title: "Sucesso!", description: `Loja "${editingStoreName}" atualizada.` });
      }, 0);
      return newState;
    });
    handleCancelEditingStore();
  };


  const handleChangePassword = () => {
    if (adminPasswords.new.length < 4) {
      setTimeout(() => {
        toast({ variant: "destructive", title: "Senha muito curta", description: "A senha deve ter pelo menos 4 caracteres." });
      }, 0);
      return;
    }
     if (adminPasswords.new !== adminPasswords.confirm) {
      setTimeout(() => {
        toast({ variant: "destructive", title: "Senhas não conferem", description: "As senhas digitadas não são iguais." });
      }, 0);
      return;
    }
    setAdminPassword(adminPasswords.new);
    setAdminPasswords({ new: '', confirm: ''});
    setTimeout(() => {
      toast({ title: "Sucesso!", description: "Sua senha de administrador foi alterada." });
    }, 0);
  };

  const handleLogout = () => {
    sessionStorage.removeItem('adminAuthenticated');
    setTimeout(() => {
      toast({
          title: 'Saída segura!',
          description: 'Você saiu do modo de administrador.',
      });
    }, 0);
    router.push('/');
  }


  if (loading || !state) {
      return (
        <div className="flex flex-col items-center justify-center min-h-screen">
          <Loader2 className="mr-2 h-16 w-16 animate-spin text-primary" />
          <p className="mt-4 text-muted-foreground">Carregando painel de administrador...</p>
        </div>
      )
  }

  return (
    <div className="w-full max-w-6xl mx-auto h-[80vh] min-h-[600px] flex rounded-2xl shadow-2xl overflow-hidden bg-card">
       <aside className="w-64 bg-gradient-to-b from-primary to-destructive text-primary-foreground p-6 flex flex-col">
        <div className="flex items-center gap-3 mb-12">
          <div className="bg-white/20 p-2 rounded-lg">
            <Rocket className="h-6 w-6 text-white" />
          </div>
          <h1 className="text-xl font-bold">Acelera GT</h1>
        </div>
        <nav className="space-y-3">
          <SidebarLink href="/admin" icon={Building}>
            Admin
          </SidebarLink>
           {state.stores.length > 0 && (
             <div className="pt-4 mt-4 border-t border-white/20">
                 <h2 className="px-4 mb-2 text-xs font-semibold tracking-wider text-white/50 uppercase">Lojas</h2>
                  {state.stores.map((store) => (
                    <SidebarLink key={store.id} href={`/loja/${encodeURIComponent(store.id)}`} icon={LayoutDashboard}>
                      {store.name}
                    </SidebarLink>
                  ))}
             </div>
           )}
        </nav>
        <div className="mt-auto text-center">
            <Button variant="link" onClick={handleLogout} className="text-sm text-white/80 hover:text-white transition-colors flex items-center gap-2">
                <LogOut className="h-4 w-4" />
                Sair do Modo Admin
            </Button>
            <div className="text-center text-xs text-white/50 space-y-1 mt-4">
                <p>© {new Date().getFullYear()} Acelera GT</p>
            </div>
        </div>
      </aside>

      <main className="flex-1 flex flex-col bg-background p-4 sm:p-8 overflow-y-auto">
        <div className="flex flex-col items-center gap-6 w-full max-w-4xl mx-auto">
            <div className="w-full text-center">
                <h1 className="text-4xl font-bold font-headline text-primary">
                    Painel Administrativo Global
                </h1>
                <p className="text-lg text-muted-foreground">
                    Gerencie todas as lojas e configurações do sistema aqui.
                </p>
            </div>

            <div className="w-full mt-4">
              <Button asChild size="lg" className="w-full md:w-auto">
                <Link href="/admin/dashboard">
                  <LineChart className="mr-2 h-5 w-5"/>
                  Acessar Dashboard Geral
                </Link>
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full mt-6">
                <Card>
                    <CardHeader>
                        <CardTitle className="text-xl">Gerenciar Lojas</CardTitle>
                        <CardDescription>Adicione, renomeie ou remova lojas.</CardDescription>
                    </CardHeader>
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
                        <Button type="button" onClick={handleAddStore}>Adicionar</Button>
                        </div>
                    </div>
                    <Separator className="my-4"/>
                    <Label>Lojas Atuais</Label>
                    <div className="space-y-2 mt-2 max-h-60 overflow-y-auto pr-2">
                        {state?.stores.map((store) => (
                            <div key={store.id} className="flex items-center justify-between gap-2 p-2 rounded-md bg-muted/50">
                                {editingStoreId === store.id ? (
                                <>
                                    <Input 
                                    value={editingStoreName}
                                    onChange={(e) => setEditingStoreName(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleSaveStore(store.id)}
                                    autoFocus
                                    className="h-8"
                                    />
                                    <Button size="icon" variant="ghost" onClick={() => handleSaveStore(store.id)}><Save className="h-4 w-4 text-green-600"/></Button>
                                    <Button size="icon" variant="ghost" onClick={handleCancelEditingStore}><X className="h-4 w-4"/></Button>
                                </>
                                ) : (
                                <>
                                    <div className="flex items-center gap-2">
                                        <div className="w-4 h-4 rounded-full" style={{backgroundColor: `hsl(${store.themeColor})`}}></div>
                                        <span className="font-medium">{store.name}</span>
                                    </div>
                                    <div className="flex items-center">
                                        <Button asChild variant="ghost" size="sm">
                                        <Link href={`/loja/${store.id}`}>
                                            Ir para Loja <ArrowRight className="ml-2 h-4 w-4"/>
                                        </Link>
                                        </Button>
                                        <Button size="icon" variant="ghost" onClick={() => handleStartEditingStore(store)}><Edit className="h-4 w-4"/></Button>
                                        <AlertDialog><AlertDialogTrigger asChild><Button size="icon" variant="ghost" className="text-destructive hover:text-destructive"><Trash2 className="h-4 w-4"/></Button></AlertDialogTrigger>
                                            <AlertDialogContent>
                                            <AlertDialogHeader><AlertDialogTitle>Você tem certeza?</AlertDialogTitle><AlertDialogDescription>Essa ação não pode ser desfeita. Isso irá remover permanentemente a loja e todos os seus dados.</AlertDialogDescription></AlertDialogHeader>
                                            <AlertDialogFooter><AlertDialogCancel>Cancelar</AlertDialogCancel><AlertDialogAction onClick={() => handleRemoveStore(store.id)} className="bg-destructive hover:bg-destructive/90">Remover</AlertDialogAction></AlertDialogFooter>
                                            </AlertDialogContent>
                                        </AlertDialog>
                                    </div>
                                </>
                                )}
                            </div>
                        ))}
                    </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <CardTitle className="text-xl">Segurança</CardTitle>
                        <CardDescription>Altere a senha de acesso ao painel de administrador.</CardDescription>
                    </CardHeader>
                    <CardContent>
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="new-password">Nova Senha</Label>
                            <Input 
                                id="new-password"
                                type="password" 
                                placeholder="Pelo menos 4 caracteres"
                                value={adminPasswords.new}
                                onChange={(e) => setAdminPasswords(p => ({...p, new: e.target.value}))}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="confirm-password">Confirmar Nova Senha</Label>
                            <Input 
                                id="confirm-password"
                                type="password" 
                                placeholder="Repita a senha"
                                value={adminPasswords.confirm}
                                onChange={(e) => setAdminPasswords(p => ({...p, confirm: e.target.value}))}
                                onKeyDown={(e) => e.key === 'Enter' && handleChangePassword()}
                            />
                        </div>
                    </div>
                    <Button onClick={handleChangePassword} className="w-full mt-6"><KeyRound/> Alterar Senha</Button>
                    </CardContent>
                </Card>
            </div>
        </div>
      </main>
    </div>
  );
}
