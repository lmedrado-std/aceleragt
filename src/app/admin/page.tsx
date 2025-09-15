
"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { KeyRound, Trash2, ArrowRight, Loader2, Edit, Save, X, Home } from "lucide-react";
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
import ClientOnly from "@/components/client-only";

function AdminPageComponent() {
  const [stores, setStores] = useState<Store[]>([]);
  const [loading, setLoading] = useState(true);
  const [newStoreName, setNewStoreName] = useState("");
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

  const handleSaveStore = async (id: string) => {
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

  if (loading) {
      return (
        <div className="flex flex-col items-center justify-center h-[calc(100vh-200px)]">
          <Loader2 className="mr-2 h-16 w-16 animate-spin text-primary" />
          <p className="mt-4 text-muted-foreground">Carregando painel de administrador...</p>
        </div>
      )
  }

  return (
    <div className="flex flex-col gap-6 w-full max-w-5xl mx-auto">
        <div className="w-full flex justify-between items-center">
            <div>
                <h1 className="text-3xl font-bold text-foreground">
                    Painel Administrativo
                </h1>
                <p className="text-muted-foreground">
                    Gerencie todas as lojas e configurações do sistema aqui.
                </p>
            </div>
            <Button asChild variant="outline">
              <Link href="/">
                <Home className="mr-2 h-4 w-4" />
                Voltar ao Início
              </Link>
            </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full mt-6">
            <Card>
                <CardHeader>
                    <CardTitle>Gerenciar Lojas</CardTitle>
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
                                <span className="font-medium">{store.name}</span>
                                <div className="flex items-center">
                                    <Button asChild variant="ghost" size="sm">
                                    <Link href={`/dashboard/${store.id}`}>
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
                    <CardTitle>Segurança</CardTitle>
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
  );
}

export default function AdminPage() {
    return (
        <ClientOnly>
            <AdminPageComponent />
        </ClientOnly>
    )
}
