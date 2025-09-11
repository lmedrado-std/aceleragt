
"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { KeyRound, Trash2, Home, ArrowRight, LogOut, Loader2, Edit, Save, X, LineChart, Building, Rocket, LayoutDashboard, Sun, Moon } from "lucide-react";
import { useEffect, useState } from "react";
import { Store, setAdminPassword } from "@/lib/storage";
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
  const [stores, setStores] = useState<Store[]>([]);
  const [loading, setLoading] = useState(true);
  const [newStoreName, setNewStoreName] = useState("");
  const [darkMode, setDarkMode] = useState(false);
  
  const [adminPasswords, setAdminPasswords] = useState({ new: '', confirm: ''});
  const [editingStoreId, setEditingStoreId] = useState<string | null>(null);
  const [editingStoreName, setEditingStoreName] = useState('');

  const { toast } = useToast();
  const router = useRouter();

  const fetchStores = async () => {
    try {
      const res = await fetch('/api/stores');
      if (!res.ok) throw new Error('Falha ao buscar lojas');
      const data = await res.json();
      setStores(data);
    } catch (error) {
      console.error(error);
      toast({ variant: 'destructive', title: 'Erro', description: 'Não foi possível carregar as lojas.' });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const isAdmin = sessionStorage.getItem('adminAuthenticated') === 'true';
    if (!isAdmin) {
      router.push('/login?redirect=/admin');
    } else {
      fetchStores();
    }
     // Reset theme to default when on this page
    document.documentElement.style.removeProperty('--primary');
    document.documentElement.style.removeProperty('--primary-raw');


    const isDark = localStorage.getItem('darkMode') === 'true';
    setDarkMode(isDark);
    if(isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }

  }, [router, toast]);

  const toggleDarkMode = () => {
    const newDarkMode = !darkMode;
    setDarkMode(newDarkMode);
    if(newDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('darkMode', 'true');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('darkMode', 'false');
    }
  };

  const handleAddStore = async () => {
    if (!newStoreName.trim()) {
       toast({ variant: "destructive", title: "Erro", description: "O nome da loja não pode estar vazio." });
      return;
    }

    try {
      const res = await fetch('/api/stores', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newStoreName }),
      });
      if (!res.ok) throw new Error('Falha ao adicionar loja');
      const newStore = await res.json();
      setStores(prevStores => [...prevStores, newStore]);
      setNewStoreName("");
      toast({ title: "Sucesso!", description: `Loja "${newStore.name}" adicionada.` });
    } catch (error) {
       console.error(error);
       toast({ variant: 'destructive', title: 'Erro', description: 'Não foi possível adicionar a loja.' });
    }
  };

  const handleRemoveStore = async (id: string) => {
    const storeToRemove = stores.find(s => s.id === id);
    try {
      const res = await fetch(`/api/stores/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Falha ao remover loja');

      setStores(prevStores => prevStores.filter(s => s.id !== id));
      
      if (storeToRemove) {
        toast({ title: "Loja removida", description: `A loja "${storeToRemove.name}" foi removida.` });
      }
    } catch (error) {
      console.error(error);
      toast({ variant: 'destructive', title: 'Erro', description: 'Não foi possível remover a loja.' });
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

  const handleSaveStore = async (id: string) => {
    if (!editingStoreName.trim()) {
      toast({ variant: "destructive", title: "Erro", description: "O nome da loja não pode estar vazio." });
      return;
    }
    
    try {
      const res = await fetch(`/api/stores/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: editingStoreName }),
      });
      if (!res.ok) throw new Error('Falha ao atualizar loja');
      const updatedStore = await res.json();
      
      setStores(stores.map(store => store.id === id ? updatedStore : store));
      toast({ title: "Sucesso!", description: `Loja "${updatedStore.name}" atualizada.` });
      
    } catch (error) {
      console.error(error);
      toast({ variant: 'destructive', title: 'Erro', description: 'Não foi possível atualizar a loja.' });
    } finally {
      handleCancelEditingStore();
    }
  };


  const handleChangePassword = () => {
    if (adminPasswords.new.length < 4) {
      toast({ variant: "destructive", title: "Senha muito curta", description: "A senha deve ter pelo menos 4 caracteres." });
      return;
    }
     if (adminPasswords.new !== adminPasswords.confirm) {
      toast({ variant: "destructive", title: "Senhas não conferem", description: "As senhas digitadas não são iguais." });
      return;
    }
    setAdminPassword(adminPasswords.new);
    setAdminPasswords({ new: '', confirm: ''});
    toast({ title: "Sucesso!", description: "Sua senha de administrador foi alterada." });
  };

  const handleLogout = () => {
    sessionStorage.removeItem('adminAuthenticated');
    toast({
        title: 'Saída segura!',
        description: 'Você saiu do modo de administrador.',
    });
    router.push('/');
  }


  if (loading) {
      return (
        <div className="flex flex-col items-center justify-center min-h-screen">
          <Loader2 className="mr-2 h-16 w-16 animate-spin text-primary" />
          <p className="mt-4 text-muted-foreground">Carregando painel de administrador...</p>
        </div>
      )
  }

  return (
    <div className="w-full max-w-6xl mx-auto h-[80vh] min-h-[600px] flex rounded-2xl shadow-2xl overflow-hidden bg-card">
       <aside className="w-64 bg-gradient-to-b from-primary to-destructive text-primary-foreground p-6 flex-col hidden md:flex">
        <div className="flex items-center gap-3 mb-12">
          <div className="bg-white/20 p-2 rounded-lg">
            <Rocket className="h-6 w-6 text-white" />
          </div>
          <h1 className="text-xl font-bold">Acelera GT</h1>
        </div>
        <nav className="space-y-3">
           {stores.length > 0 && (
             <div className="pt-4 mt-4 border-t border-white/20">
                 <h2 className="px-4 mb-2 text-xs font-semibold tracking-wider text-white/50 uppercase">Lojas</h2>
                  {stores.map((store) => (
                    <SidebarLink key={store.id} href={`/loja/${encodeURIComponent(store.id)}`} icon={LayoutDashboard}>
                      {store.name}
                    </SidebarLink>
                  ))}
             </div>
           )}
        </nav>
        <div className="mt-auto">
             <motion.button
              onClick={toggleDarkMode}
              whileHover={{ scale: 1.05, x: 5 }}
              className="flex items-center gap-3 px-4 py-2 w-full text-sm font-medium text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
            >
              {darkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
              <span>{darkMode ? 'Modo Claro' : 'Modo Escuro'}</span>
            </motion.button>
            <Button variant="link" onClick={handleLogout} className="text-sm text-white/80 hover:text-white transition-colors flex items-center gap-2 mt-4">
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
                        {stores.map((store) => (
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
                                        <div className="w-4 h-4 rounded-full" style={{backgroundColor: `hsl(${store.theme_color})`}}></div>
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
                                            <AlertDialogHeader><AlertDialogTitle>Você tem certeza?</AlertDialogTitle><AlertDialogDescription>Essa ação não pode ser desfeita. Isso irá remover permanentemente a loja e todos os seus dados associados.</AlertDialogDescription></AlertDialogHeader>
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
