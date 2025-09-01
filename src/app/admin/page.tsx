
"use client";

import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { AppState, loadState, saveState, Store } from '@/lib/storage';
import { Home, Store as StoreIcon, Trash2 } from 'lucide-react';
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
import Link from 'next/link';
import { Logo } from '@/components/logo';

export default function AdminPage() {
    const [state, setState] = useState<AppState>(loadState());
    const [newStoreName, setNewStoreName] = useState("");
    const { toast } = useToast();

    useEffect(() => {
        const loadedState = loadState();
        setState(loadedState);
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

        const newStore: Store = {
            id: new Date().toISOString(),
            name: newStoreName,
        };
        
        const newState: AppState = {
            ...state,
            stores: [...state.stores, newStore],
        };
        
        saveState(newState);
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

    return (
        <main className="container mx-auto p-4 py-8 md:p-8">
            <header className="flex items-center justify-between gap-4 mb-8">
                <div className="flex items-center gap-4">
                    <Logo />
                    <div>
                        <h1 className="text-3xl font-bold font-headline text-primary">Admin Global</h1>
                        <p className="text-muted-foreground">Gerencie suas lojas aqui.</p>
                    </div>
                </div>
                <Button asChild variant="outline">
                    <Link href="/">
                        <Home className="mr-2 h-4 w-4" />
                        Página Inicial
                    </Link>
                </Button>
            </header>

            <Card>
                <CardHeader>
                    <CardTitle>Gerenciamento de Lojas</CardTitle>
                    <CardDescription>Adicione novas lojas ou remova existentes.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="space-y-2">
                        <Label htmlFor="new-store">Nova Loja</Label>
                        <div className="flex gap-2">
                            <Input
                                id="new-store"
                                value={newStoreName}
                                onChange={(e) => setNewStoreName(e.target.value)}
                                placeholder="Nome da nova loja"
                            />
                            <Button onClick={handleAddStore}>Adicionar Loja</Button>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <h3 className="text-lg font-medium">Lojas existentes</h3>
                        {state.stores.map(store => (
                            <div key={store.id} className="flex items-center justify-between p-3 rounded-md bg-muted/50">
                                <div className="flex items-center gap-3">
                                    <StoreIcon className="h-5 w-5 text-primary"/>
                                    <span className="font-medium">{store.name}</span>
                                </div>
                                <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                        <Button size="icon" variant="ghost" className="text-destructive hover:text-destructive"><Trash2 className="h-4 w-4"/></Button>
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
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>
        </main>
    );
}
