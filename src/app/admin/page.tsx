
"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { KeyRound, Trash2, ArrowRight, Loader2, Edit, Save, X, Home, Database, AlertTriangle, LogOut, LineChart, Store, Users } from "lucide-react";
import { useEffect, useState } from "react";
import { Store as StoreType } from "@/lib/storage";
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
import ClientOnly from "@/components/client-only";

interface DashboardStats {
    storeCount: number;
    sellerCount: number;
}

function AdminPageComponent() {
  const [stores, setStores] = useState<StoreType[]>([]);
  const [loading, setLoading] = useState(true);
  const [dashboardStats, setDashboardStats] = useState<DashboardStats | null>(null);
  const [newStoreName, setNewStoreName] = useState("");
  const [adminPasswords, setAdminPasswords] = useState({ new: '', confirm: '' });
  const [editingStoreId, setEditingStoreId] = useState<string | null>(null);
  const [editingStore, setEditingStore] = useState<{ name: string, password?: string }>({ name: '' });
  const [isResettingDb, setIsResettingDb] = useState(false);
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);

  const { toast } = useToast();
  const router = useRouter();

  const fetchStores = async () => {
    try {
        const res = await fetch('/api/stores?admin=true');
        if (!res.ok) throw new Error('Falha ao buscar lojas');
        const data = await res.json();
        setStores(data);
    } catch (error) {
        toast({ variant: 'destructive', title: 'Erro', description: (error as Error).message });
    }
  }
  
  const fetchDashboardStats = async () => {
     try {
        const res = await fetch('/api/admin/dashboard-stats');
        if (!res.ok) return;
        const data = await res.json();
        setDashboardStats({ storeCount: data.storeCount, sellerCount: data.sellerCount });
    } catch (error) {
        // Silenciosamente falha, não é crítico para a página principal
        console.error("Failed to fetch dashboard stats", error);
    }
  }

  useEffect(() => {
    const isAdmin = sessionStorage.getItem('adminAuthenticated') === 'true';
    if (!isAdmin) {
      router.push('/login?redirect=/admin');
    } else {
      Promise.all([fetchStores(), fetchDashboardStats()]).finally(() => setLoading(false));
    }
  }, [router]);

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
        if (!res.ok) {
            const errorData = await res.json();
            throw new Error(errorData.error || 'Falha ao adicionar loja');
        }
        await Promise.all([fetchStores(), fetchDashboardStats()]);
        setNewStoreName("");
        toast({ title: "Sucesso!", description: `Loja "${newStoreName}" adicionada.` });
    } catch (error) {
        toast({ variant: 'destructive', title: 'Erro', description: (error as Error).message });
    }
  };

  const handleRemoveStore = async (id: string) => {
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
        fetchDashboardStats();
        toast({ title: "Loja removida", description: `A loja foi removida com sucesso.` });
    } catch (error) {
         toast({ variant: 'destructive', title: 'Erro', description: (error as Error).message });
    }
  };
  
  const handleStartEditingStore = (store: StoreType) => {
    setEditingStoreId(store.id);
    setEditingStore({ name: store.name, password: store.password });
  };

  const handleCancelEditingStore = () => {
    setEditingStoreId(null);
    setEditingStore({ name: '' });
  };

  const handleSaveStore = async (id: string) => {
    if (!editingStore.name.trim()) {
      toast({ variant: "destructive", title: "Erro", description: "O nome da loja não pode estar vazio." });
      return;
    }
    try {
        const res = await fetch(`/api/stores/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: editingStore.name, password: editingStore.password })
        });
        if (!res.ok) throw new Error('Falha ao atualizar loja');
        fetchStores();
        toast({ title: "Sucesso!", description: `Loja "${editingStore.name}" atualizada.` });
    } catch(error) {
        toast({ variant: 'destructive', title: 'Erro', description: (error as Error).message });
    } finally {
        handleCancelEditingStore();
    }
  };
  
  const handleResetDatabase = async () => {
    setIsResettingDb(true);
    try {
        const res = await fetch('/api/setup-db');
        const data = await res.json();
        if (!res.ok) {
            throw new Error(data.error || 'Falha ao resetar o banco de dados.');
        }
        toast({ title: "Sucesso!", description: "A estrutura do banco de dados foi configurada com sucesso."});
        fetchStores();
    } catch(error) {
        toast({ variant: 'destructive', title: 'Erro', description: (error as Error).message });
    } finally {
        setIsResettingDb(false);
    }
  };
  
  const handlePasswordChange = async () => {
    if (adminPasswords.new !== adminPasswords.confirm) {
        toast({ variant: "destructive", title: "Erro", description: "As senhas não coincidem." });
        return;
    }
    if (adminPasswords.new.length < 4) {
        toast({ variant: "destructive", title: "Erro", description: "A senha deve ter no mínimo 4 caracteres." });
        return;
    }

    setIsUpdatingPassword(true);
    try {
        const res = await fetch('/api/admin/password', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ password: adminPasswords.new })
        });
        if (!res.ok) {
            const data = await res.json();
            throw new Error(data.error || 'Falha ao alterar a senha.');
        }
        toast({ title: "Sucesso!", description: "Senha do administrador global alterada." });
        setAdminPasswords({ new: '', confirm: '' });
    } catch(e) {
        toast({ variant: 'destructive', title: 'Erro', description: (e as Error).message });
    } finally {
        setIsUpdatingPassword(false);
    }
  };

  const handleLogout = () => {
    sessionStorage.removeItem('adminAuthenticated');
    toast({ title: "Sessão encerrada", description: "Você saiu do modo de administrador." });
    router.push('/');
  };


  if (loading) {
      return (
        <div className="flex flex-col items-center justify-center h-[calc(100vh-200px)]">
          <Loader2 className="mr-2 h-16 w-16 animate-spin text-primary" />
          <p className="mt-4 text-muted-foreground">Carregando painel de administrador...</p>
        </div>
      )
  }

  return (
    <div className="flex flex-col gap-8 w-full max-w-7xl mx-auto p-4 sm:p-6 md:p-8">
        <div className="w-full flex justify-between items-start">
            <div>
                <h1 className="text-3xl font-bold text-foreground">
                    Painel Administrativo Global
                </h1>
                <p className="text-muted-foreground">
                    Gerencie todas as lojas e configurações do sistema aqui.
                </p>
            </div>
             <div className="flex items-center gap-2">
                <Button asChild variant="outline">
                  <Link href="/">
                    <Home className="mr-2 h-4 w-4" />
                    Voltar ao Início
                  </Link>
                </Button>
                <Button onClick={handleLogout} variant="destructive">
                  <LogOut className="mr-2 h-4 w-4" />
                  Sair
                </Button>
            </div>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-8">
                 <Card>
                    <CardHeader>
                        <CardTitle>Gerenciar Lojas</CardTitle>
                        <CardDescription>Adicione, renomeie ou remova lojas e senhas.</CardDescription>
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
                                <div className="flex-grow flex items-center gap-2">
                                    <Input 
                                        value={editingStore.name}
                                        onChange={(e) => setEditingStore(prev => ({ ...prev, name: e.target.value }))}
                                        className="h-8"
                                        autoFocus
                                    />
                                    <Input 
                                        placeholder="Senha da loja"
                                        value={editingStore.password}
                                        onChange={(e) => setEditingStore(prev => ({ ...prev, password: e.target.value }))}
                                        className="h-8"
                                    />
                                    <Button size="icon" variant="ghost" onClick={() => handleSaveStore(store.id)}><Save className="h-4 w-4 text-green-600"/></Button>
                                    <Button size="icon" variant="ghost" onClick={handleCancelEditingStore}><X className="h-4 w-4"/></Button>
                                </div>
                                ) : (
                                <>
                                    <span className="font-medium">{store.name}</span>
                                    <div className="flex items-center">
                                        <Button asChild variant="ghost" size="sm">
                                        <Link href={`/loja/${store.id}`}>
                                            Acessar <ArrowRight className="ml-2 h-4 w-4"/>
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
                        <CardTitle>Dashboard Geral</CardTitle>
                        <CardDescription>Visão geral do desempenho de todas as lojas.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {dashboardStats ? (
                            <>
                                <div className="flex items-center gap-4 p-4 rounded-lg bg-muted/50">
                                    <Store className="h-8 w-8 text-primary" />
                                    <div>
                                        <p className="text-sm text-muted-foreground">Total de Lojas</p>
                                        <p className="text-2xl font-bold">{dashboardStats.storeCount}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-4 p-4 rounded-lg bg-muted/50">
                                    <Users className="h-8 w-8 text-primary" />
                                    <div>
                                        <p className="text-sm text-muted-foreground">Total de Vendedores</p>
                                        <p className="text-2xl font-bold">{dashboardStats.sellerCount}</p>
                                    </div>
                                </div>
                            </>
                        ) : (
                             <div className="flex items-center justify-center p-4">
                                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                            </div>
                        )}
                        <Button asChild className="w-full">
                            <Link href="/admin/dashboard">
                                <LineChart className="mr-2 h-4 w-4" />
                                Ver Dashboard Completo
                            </Link>
                        </Button>
                    </CardContent>
                </Card>
            </div>
            <div className="lg:col-span-1">
                <Card>
                    <CardHeader>
                        <CardTitle>Segurança e Diagnóstico</CardTitle>
                        <CardDescription>Gerencie a segurança e verifique a saúde do sistema.</CardDescription>
                    </CardHeader>
                    <CardContent>
                    <div className="space-y-6">
                        <div className="space-y-2">
                            <Label>Alterar Senha de Admin Global</Label>
                            <div className="space-y-2">
                                <Input 
                                    type="password"
                                    placeholder="Nova Senha"
                                    value={adminPasswords.new}
                                    onChange={(e) => setAdminPasswords(p => ({...p, new: e.target.value}))}
                                />
                                <Input 
                                    type="password"
                                    placeholder="Confirmar Nova Senha"
                                    value={adminPasswords.confirm}
                                    onChange={(e) => setAdminPasswords(p => ({...p, confirm: e.target.value}))}
                                />
                            </div>
                            <Button onClick={handlePasswordChange} disabled={isUpdatingPassword}>
                                {isUpdatingPassword && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
                                Alterar Senha
                            </Button>
                        </div>

                        <Separator />
                        
                         <div className="space-y-2">
                            <Label>Manutenção do Banco de Dados</Label>
                            <p className="text-sm text-muted-foreground">
                                Use estas ferramentas para diagnósticos ou para a configuração inicial do sistema.
                            </p>
                             <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                <Button asChild variant="outline" className="w-full">
                                    <Link href="/admin/db-schema">
                                        <Database className="mr-2 h-4 w-4" />
                                        Ver Schema
                                    </Link>
                                </Button>
                                <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                        <Button variant="destructive" className="w-full">
                                            <AlertTriangle className="mr-2 h-4 w-4" />
                                            Configurar Banco
                                        </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                        <AlertDialogHeader>
                                            <AlertDialogTitle>Confirmar Ação</AlertDialogTitle>
                                            <AlertDialogDescription>
                                                Esta ação irá verificar e criar as tabelas necessárias (`stores`, `sellers`, `goals`, `app_config`) se elas não existirem. 
                                                É uma operação segura e **não apaga dados existentes**. Use para a configuração inicial ou para corrigir problemas de schema.
                                            </AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                            <AlertDialogAction onClick={handleResetDatabase} disabled={isResettingDb}>
                                                {isResettingDb && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
                                                Confirmar e Configurar
                                            </AlertDialogAction>
                                        </AlertDialogFooter>
                                    </AlertDialogContent>
                                </AlertDialog>
                            </div>
                        </div>
                    </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    </div>
  );
}

export default function AdminDashboardPage() {
    return (
        <ClientOnly>
            <AdminPageComponent />
        </ClientOnly>
    )
}
