
"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { KeyRound, Trash2, Home, ArrowRight, LogOut, Loader2, Edit, Save, X, LineChart, Building, Rocket, LayoutDashboard, Sun, Moon } from "lucide-react";
import { useEffect, useState } from "react";
import { Store } from "@/lib/storage";
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
  const [adminPasswords, setAdminPasswords] = useState({ new: '', confirm: ''});
  const [editingStoreId, setEditingStoreId] = useState<number | null>(null);
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
        toast({ variant: 'destructive', title: 'Erro', description: (error as Error).message });
    }
  }

  useEffect(() => {
    const isAdmin = sessionStorage.getItem('adminAuthenticated') === 'true';
    if (!isAdmin) {
      router.push('/login?redirect=/admin');
    } else {
      fetchStores().finally(() => setLoading(false));
    }
  }, [router, toast]);

  const handleAddStore = async () => {
    if (!newStoreName.trim()) {
       toast({ variant: "destructive", title: "Erro", description: "O nome da loja não pode estar vazio." });
      return;
    }

    try {
        const res = await fetch('/api/stores', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: newStoreName })
        });
        if (!res.ok) throw new Error('Falha ao adicionar loja');
        const newStore = await res.json();
        setStores(prev => [...prev, newStore]);
        setNewStoreName("");
        toast({ title: "Sucesso!", description: `Loja "${newStore.name}" adicionada.` });
    } catch (error) {
        toast({ variant: 'destructive', title: 'Erro', description: (error as Error).message });
    }
  };

  const handleRemoveStore = async (id: number) => {
    if (stores.length <= 1) {
        toast({ variant: "destructive", title: "Ação não permitida", description: "Não é possível remover a última loja." });
        return;
    }
    
    try {
        const res = await fetch(`/api/stores/${id}`, { method: 'DELETE' });
        if (!res.ok) {
            const data = await res.json();
            throw new Error(data.error || 'Falha ao remover loja');
        }
        setStores(prev => prev.filter(s => s.id !== id));
        toast({ title: "Loja removida", description: `A loja foi removida com sucesso.` });
    } catch (error) {
         toast({ variant: 'destructive', title: 'Erro', description: (error as Error).message });
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

  const handleSaveStore = async (id: number) => {
    if (!editingStoreName.trim()) {
      toast({ variant: "destructive", title: "Erro", description: "O nome da loja não pode estar vazio." });
      return;
    }
    try {
        const res = await fetch(`/api/stores/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: editingStoreName })
        });
        if (!res.ok) throw new Error('Falha ao atualizar loja');
        fetchStores(); // Re-fetch to get the updated list
        toast({ title: "Sucesso!", description: `Loja "${editingStoreName}" atualizada.` });
    } catch(error) {
        toast({ variant: 'destructive', title: 'Erro', description: (error as Error).message });
    } finally {
        handleCancelEditingStore();
    }
  };

  const handleChangePassword = () => {
    // This is a placeholder as admin password management is not implemented via DB yet
    toast({ title: "Funcionalidade em desenvolvimento", description: "A alteração de senha de admin será implementada em breve."});
  };

  const handleLogout = () => {
    sessionStorage.removeItem('adminAuthenticated');
    toast({ title: 'Saída segura!', description: 'Você saiu do modo de administrador.' });
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
    <div className="w-full max-w-6xl mx-auto h-screen md:h-[90vh] md:min-h-[700px] flex flex-col md:flex-row rounded-2xl shadow-2xl overflow-hidden bg-card my-4">
       <aside className="w-full md:w-64 bg-gradient-to-b from-primary to-destructive text-primary-foreground p-6 flex flex-col">
        <div className="flex items-center gap-3 mb-8">
          <Link href="/" className="flex items-center gap-3">
            <div className="bg-white/20 p-2 rounded-lg">
              <Rocket className="h-6 w-6 text-white" />
            </div>
            <h1 className="text-xl font-bold">Acelera GT</h1>
          </Link>
        </div>
        <nav className="space-y-3">
           {stores.length > 0 && (
             <div className="pt-4 mt-4 border-t border-white/20">
                 <h2 className="px-4 mb-2 text-xs font-semibold tracking-wider text-white/50 uppercase">Lojas</h2>
                  {stores.map((store) => (
                    <SidebarLink key={store.id} href={`/loja/${store.id}`} icon={LayoutDashboard}>
                      {store.name}
                    </SidebarLink>
                  ))}
             </div>
           )}
        </nav>
        <div className="mt-auto space-y-3">
            <Button variant="ghost" onClick={handleLogout} className="w-full justify-start text-base text-white/80 hover:text-white hover:bg-white/10">
                <LogOut className="mr-2 h-5 w-5" />
                Sair
            </Button>
            <div className="text-center text-xs text-white/50 pt-4 border-t border-white/20">
                <p>© {new Date().getFullYear()} Acelera GT</p>
            </div>
        </div>
      </aside>

      <main className="flex-1 flex flex-col bg-background p-4 sm:p-8 overflow-y-auto">
        <div className="flex flex-col items-center gap-6 w-full max-w-4xl mx-auto">
            <div className="w-full text-center">
                <h1 className="text-4xl font-bold font-headline text-primary">
                    Painel Administrativo
                </h1>
                <p className="text-lg text-muted-foreground">
                    Gerencie todas as lojas e configurações do sistema aqui.
                </p>
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
                                            <AlertDialogHeader><AlertDialogTitle>Você tem certeza?</AlertDialogTitle><AlertDialogDescription>Essa ação não pode ser desfeita. Isso irá remover permanentemente a loja e todos os seus dados associados (vendedores, metas).</AlertDialogDescription></AlertDialogHeader>
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
                                placeholder="Funcionalidade em breve"
                                value={adminPasswords.new}
                                onChange={(e) => setAdminPasswords(p => ({...p, new: e.target.value}))}
                                disabled
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="confirm-password">Confirmar Nova Senha</Label>
                            <Input 
                                id="confirm-password"
                                type="password" 
                                placeholder="Funcionalidade em breve"
                                value={adminPasswords.confirm}
                                onChange={(e) => setAdminPasswords(p => ({...p, confirm: e.target.value}))}
                                onKeyDown={(e) => e.key === 'Enter' && handleChangePassword()}
                                disabled
                            />
                        </div>
                    </div>
                    <Button onClick={handleChangePassword} className="w-full mt-6" disabled><KeyRound/> Alterar Senha</Button>
                    </CardContent>
                </Card>
            </div>
        </div>
      </main>
    </div>
  );
}
