"use client";

import { useForm, UseFormReturn, useWatch } from "react-hook-form";
import {
  UserPlus,
  Trash2,
  Edit,
  Save,
  X,
  Target,
  Eye,
  EyeOff,
  Calculator,
  Loader2,
} from "lucide-react";
import { useState, useMemo, useTransition } from "react";
import { useRouter } from "next/navigation";
import { FormValues } from "./goal-getter-dashboard";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription
} from "@/components/ui/card";
import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
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
import { Seller, Goals, Incentives } from "@/lib/storage";
import { ProgressDisplay } from "./progress-display";
import { incentiveProjection } from "@/ai/flows/incentive-projection";

const goalTiers = [
    { id: 'Nível 1', goal: 'paGoal1', prize: 'paPrize1'},
    { id: 'Nível 2', goal: 'paGoal2', prize: 'paPrize2' },
    { id: 'Nível 3', goal: 'paGoal3', prize: 'paPrize3' },
    { id: 'Nível 4', goal: 'paGoal4', prize: 'paPrize4' },
];

const ticketMedioTiers = [
    { id: 'Nível 1', goal: 'ticketMedioGoal1', prize: 'ticketMedioPrize1'},
    { id: 'Nível 2', goal: 'ticketMedioGoal2', prize: 'ticketMedioPrize2' },
    { id: 'Nível 3', goal: 'ticketMedioGoal3', prize: 'ticketMedioPrize3' },
    { id: 'Nível 4', goal: 'ticketMedioGoal4', prize: 'ticketMedioPrize4' },
];

const availableAvatarIds = ['avatar1', 'avatar2', 'avatar3', 'avatar4', 'avatar5', 'avatar6', 'avatar7', 'avatar8', 'avatar9', 'avatar10'];

interface AdminTabProps {
    form: UseFormReturn<FormValues>;
    storeId: string;
    onIncentivesCalculated: (incentives: Incentives) => void;
    incentives: Incentives;
}

export function AdminTab({ form, storeId, onIncentivesCalculated, incentives }: AdminTabProps) {
    const { toast } = useToast();
    const router = useRouter();
    const [editingSellerId, setEditingSellerId] = useState<string | null>(null);
    const [showPassword, setShowPassword] = useState<Record<string, boolean>>({});
    const [isPending, startTransition] = useTransition();

    const { control, getValues, setValue, setError, clearErrors, formState: { errors } } = form;
    
    const sellers = useWatch({ control, name: 'sellers' });
    const goals = useWatch({ control, name: 'goals' });

    const addSeller = () => {
        const newSellerName = getValues("newSellerName");
        const newSellerPassword = getValues("newSellerPassword");

        if (newSellerName.trim() === "") {
            setError("newSellerName", { type: "manual", message: "Nome é obrigatório." });
            return;
        }
        if (newSellerPassword.trim().length < 4) {
            setError("newSellerPassword", { type: "manual", message: "Senha deve ter no mínimo 4 caracteres." });
            return;
        }
        clearErrors(["newSellerName", "newSellerPassword"]);

        const currentSellers = getValues("sellers") || [];
        const existingAvatarIds = new Set(currentSellers.map(s => s.avatarId));
        let randomAvatarId = availableAvatarIds[Math.floor(Math.random() * availableAvatarIds.length)];

        if (existingAvatarIds.size < availableAvatarIds.length) {
            while (existingAvatarIds.has(randomAvatarId)) {
                randomAvatarId = availableAvatarIds[Math.floor(Math.random() * availableAvatarIds.length)];
            }
        }
        const newSeller: Seller = {
            id: crypto.randomUUID(),
            name: newSellerName,
            password: newSellerPassword,
            avatarId: randomAvatarId,
            vendas: 0, pa: 0, ticketMedio: 0, corridinhaDiaria: 0,
        };
        const updatedSellers = [...currentSellers, newSeller];
        setValue("sellers", updatedSellers, { shouldDirty: true });
        setValue("newSellerName", "");
        setValue("newSellerPassword", "");
        router.push(`/dashboard/${storeId}?tab=${newSeller.id}`);
    };

    const removeSeller = (sellerId: string) => {
        const updatedSellers = (sellers || []).filter(s => s.id !== sellerId);
        setValue("sellers", updatedSellers, { shouldDirty: true });
        const newTab = updatedSellers.length > 0 ? updatedSellers[0].id : "admin";
        router.push(`/dashboard/${storeId}?tab=${newTab}`);
    }

    const startEditing = (sellerId: string) => setEditingSellerId(sellerId);
    const cancelEditing = () => setEditingSellerId(null);

    const saveSellerName = (sellerId: string) => {
        const sellerIndex = (sellers || []).findIndex(s => s.id === sellerId);
        if (sellerIndex === -1) return;

        const newName = getValues(`sellers.${sellerIndex}.name`);
        const newPassword = getValues(`sellers.${sellerIndex}.password`);
        if (newName.trim() === "") {
            toast({ variant: "destructive", title: "Erro", description: "O nome do vendedor não pode estar vazio." });
            return;
        }
        if (newPassword && newPassword.length < 4) {
            toast({ variant: "destructive", title: "Erro", description: "A senha deve ter pelo menos 4 caracteres." });
            return;
        }

        setEditingSellerId(null);
        toast({ title: "Sucesso!", description: "Dados do vendedor atualizados." });
    }

    const togglePasswordVisibility = (sellerId: string) => {
        setShowPassword(prev => ({ ...prev, [sellerId]: !prev[sellerId] }));
    }
    
    const renderGoalInputs = (level: string, tiers: typeof goalTiers | typeof ticketMedioTiers) => (
        <div>
            <h3 className="font-semibold mb-4 text-primary">{level}</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-6">
                {tiers.map(tier => (
                     <div className="space-y-2" key={tier.id}>
                        <h4 className="font-medium text-sm">{tier.id}</h4>
                        <div className="flex items-center gap-2">
                            <FormField control={control} name={`goals.${tier.goal}` as any} render={({ field }) => ( <FormItem className="flex-grow"><FormLabel className="sr-only">Meta</FormLabel><FormControl><Input type="number" placeholder="Meta" {...field} /></FormControl><FormMessage /></FormItem> )}/>
                            <FormField control={control} name={`goals.${tier.prize}` as any} render={({ field }) => ( <FormItem className="flex-grow"><FormLabel className="sr-only">Prêmio</FormLabel><FormControl><Input type="number" placeholder="Prêmio (R$)" {...field} /></FormControl><FormMessage /></FormItem> )}/>
                        </div>
                    </div>
                ))}
            </div>
        </div>
      )

      const storeConsolidatedData = useMemo(() => {
        const currentSellers = sellers || [];
        const currentGoals = goals as Goals;

        return {
            vendas: currentSellers.reduce((acc, s) => acc + (s.vendas || 0), 0),
            pa: currentSellers.length > 0 ? currentSellers.reduce((acc, s) => acc + (s.pa || 0), 0) / currentSellers.length : 0,
            ticketMedio: currentSellers.length > 0 ? currentSellers.reduce((acc, s) => acc + (s.ticketMedio || 0), 0) / currentSellers.length : 0,
            corridinhaDiaria: currentSellers.reduce((acc, s) => acc + (s.corridinhaDiaria || 0), 0),
            goals: currentGoals,
        };
      }, [sellers, goals]);

      const storeConsolidatedIncentives = useMemo(() => {
        if (!incentives || Object.keys(incentives).length === 0) return null;
        
        return Object.values(incentives).reduce((acc, current) => {
            if (!current) return acc;
            return {
                metinhaPremio: (acc.metinhaPremio || 0) + (current.metinhaPremio || 0),
                metaPremio: (acc.metaPremio || 0) + (current.metaPremio || 0),
                metonaPremio: (acc.metonaPremio || 0) + (current.metonaPremio || 0),
                legendariaBonus: (acc.legendariaBonus || 0) + (current.legendariaBonus || 0),
                paBonus: (acc.paBonus || 0) + (current.paBonus || 0),
                ticketMedioBonus: (acc.ticketMedioBonus || 0) + (current.ticketMedioBonus || 0),
                corridinhaDiariaBonus: (acc.corridinhaDiariaBonus || 0) + (current.corridinhaDiariaBonus || 0),
            };
        }, { metinhaPremio: 0, metaPremio: 0, metonaPremio: 0, legendariaBonus: 0, paBonus: 0, ticketMedioBonus: 0, corridinhaDiariaBonus: 0 });
      }, [incentives]);

      const handleCalculateIncentives = () => {
        startTransition(async () => {
            const currentFormValues = getValues();
            const newIncentives: Incentives = {};

            for (const seller of currentFormValues.sellers) {
                const result = await incentiveProjection({
                    vendas: seller.vendas,
                    pa: seller.pa,
                    ticketMedio: seller.ticketMedio,
                    corridinhaDiaria: seller.corridinhaDiaria,
                    ...currentFormValues.goals
                });
                newIncentives[seller.id] = result;
            }
            onIncentivesCalculated(newIncentives);
            toast({
                title: "Sucesso!",
                description: "Incentivos de todos os vendedores foram calculados e salvos.",
            });
        });
    };

    return (
        <Card className="mt-4">
            <CardHeader>
                <CardTitle>Painel Administrativo da Loja</CardTitle>
                 <CardDescription>Ajuste as metas, prêmios e gerencie os vendedores aqui. Salve para ver os resultados.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-10">
                <div className="grid lg:grid-cols-2 gap-x-8 gap-y-10">
                    <div className="space-y-8">
                        <Card>
                            <CardHeader><h3 className="font-semibold text-lg text-primary flex items-center gap-2"><Target /> Lançar Vendas</h3></CardHeader>
                            <CardContent className="space-y-4 max-h-80 overflow-y-auto pr-2">
                                {(sellers || []).length > 0 ? (sellers || []).map((seller, index) => (
                                    <div key={seller.id}>
                                        <h4 className="font-medium mb-2">{seller.name}</h4>
                                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
                                            <FormField control={control} name={`sellers.${index}.vendas`} render={({ field }) => (<FormItem><FormLabel className="text-xs">Vendas (R$)</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>)} />
                                            <FormField control={control} name={`sellers.${index}.pa`} render={({ field }) => (<FormItem><FormLabel className="text-xs">PA</FormLabel><FormControl><Input type="number" step="0.01" {...field} /></FormControl><FormMessage /></FormItem>)} />
                                            <FormField control={control} name={`sellers.${index}.ticketMedio`} render={({ field }) => (<FormItem><FormLabel className="text-xs">Ticket Médio</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>)} />
                                            <FormField control={control} name={`sellers.${index}.corridinhaDiaria`} render={({ field }) => (<FormItem><FormLabel className="text-xs">Corridinha</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>)} />
                                        </div>
                                    </div>
                                )) : (<p className="text-sm text-muted-foreground text-center py-4">Cadastre um vendedor para lançar as vendas.</p>)}
                            </CardContent>
                        </Card>
                        
                        <div className="px-6">
                            <Button onClick={handleCalculateIncentives} disabled={isPending} className="w-full" size="lg">
                                {isPending ? <Loader2 className="animate-spin mr-2" /> : <Calculator className="mr-2"/>}
                                {isPending ? "Calculando..." : "Salvar e Calcular Incentivos"}
                            </Button>
                        </div>


                        <Card>
                            <CardHeader><h3 className="font-semibold text-lg text-primary flex items-center gap-2"><UserPlus /> Gerenciar Vendedores</h3></CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-4">
                                    <FormLabel>Cadastrar Novo Vendedor</FormLabel>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                        <FormField control={control} name="newSellerName" render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="sr-only">Nome do Vendedor</FormLabel>
                                                <FormControl><Input placeholder="Nome do Vendedor" {...field} /></FormControl>
                                                <FormMessage>{errors.newSellerName?.message}</FormMessage>
                                            </FormItem>
                                        )} />
                                        <FormField control={control} name="newSellerPassword" render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="sr-only">Senha</FormLabel>
                                                <FormControl><Input type="password" placeholder="Senha" {...field} /></FormControl>
                                                <FormMessage>{errors.newSellerPassword?.message}</FormMessage>
                                            </FormItem>
                                        )} />
                                    </div>
                                    <Button type="button" onClick={addSeller} className="w-full"><UserPlus className="mr-2" /> Adicionar Vendedor</Button>
                                </div>
                                <Separator />
                                <div className="space-y-2">
                                    <FormLabel>Vendedores Atuais</FormLabel>
                                    {(sellers || []).length > 0 ? (
                                        <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
                                            {(sellers || []).map((seller, index) => (
                                                <div key={seller.id} className="flex items-center justify-between gap-2 p-2 rounded-md bg-muted/50">
                                                    {editingSellerId === seller.id ? (
                                                        <>
                                                            <FormField control={control} name={`sellers.${index}.name`} render={({ field }) => (
                                                                <FormItem className="flex-grow"><FormControl><Input {...field} autoFocus onKeyDown={(e) => { if (e.key === 'Enter') saveSellerName(seller.id); }} /></FormControl></FormItem>
                                                            )} />
                                                            <div className="relative flex-grow">
                                                                <FormField control={control} name={`sellers.${index}.password`} render={({ field }) => (
                                                                    <FormItem><FormControl><Input type={showPassword[seller.id] ? 'text' : 'password'} {...field} onKeyDown={(e) => { if (e.key === 'Enter') saveSellerName(seller.id); }} /></FormControl></FormItem>
                                                                )} />
                                                                <Button size="icon" variant="ghost" type="button" className="absolute right-0 top-1/2 -translate-y-1/2 h-full" onClick={() => togglePasswordVisibility(seller.id)}>
                                                                    {showPassword[seller.id] ? <EyeOff /> : <Eye />}
                                                                </Button>
                                                            </div>
                                                            <Button size="icon" variant="ghost" onClick={() => saveSellerName(seller.id)}><Save className="h-4 w-4 text-green-600" /></Button>
                                                            <Button size="icon" variant="ghost" onClick={cancelEditing}><X className="h-4 w-4" /></Button>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <span className="font-medium">{seller.name}</span>
                                                            <div className="flex items-center">
                                                                <Button size="icon" variant="ghost" onClick={() => startEditing(seller.id)}><Edit className="h-4 w-4" /></Button>
                                                                <AlertDialog>
                                                                    <AlertDialogTrigger asChild><Button size="icon" variant="ghost" className="text-destructive hover:text-destructive"><Trash2 className="h-4 w-4" /></Button></AlertDialogTrigger>
                                                                    <AlertDialogContent>
                                                                        <AlertDialogHeader><AlertDialogTitle>Você tem certeza?</AlertDialogTitle><AlertDialogDescription>Essa ação não pode ser desfeita. Isso irá remover permanentemente o vendedor e seus dados.</AlertDialogDescription></AlertDialogHeader>
                                                                        <AlertDialogFooter><AlertDialogCancel>Cancelar</AlertDialogCancel><AlertDialogAction onClick={() => removeSeller(seller.id)} className="bg-destructive hover:bg-destructive/90">Remover</AlertDialogAction></AlertDialogFooter>
                                                                    </AlertDialogContent>
                                                                </AlertDialog>
                                                            </div>
                                                        </>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    ) : (<p className="text-sm text-muted-foreground text-center py-4">Nenhum vendedor cadastrado.</p>)}
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    <div className="space-y-8">
                        <Card>
                            <CardHeader><h3 className="font-semibold text-lg text-primary">Metas de Vendas</h3></CardHeader>
                            <CardContent className="space-y-6">
                                <div className="space-y-2"><h4 className="font-medium text-sm">Metinha</h4><div className="flex items-center gap-2"><FormField control={control} name="goals.metaMinha" render={({ field }) => (<FormItem className="flex-grow"><FormLabel className="sr-only">Meta</FormLabel><FormControl><Input type="number" placeholder="Meta" {...field} /></FormControl></FormItem>)} /><FormField control={control} name="goals.metaMinhaPrize" render={({ field }) => (<FormItem className="flex-grow"><FormLabel className="sr-only">Prêmio</FormLabel><FormControl><Input type="number" placeholder="Prêmio (R$)" {...field} /></FormControl></FormItem>)} /></div></div>
                                <div className="space-y-2"><h4 className="font-medium text-sm">Meta</h4><div className="flex items-center gap-2"><FormField control={control} name="goals.meta" render={({ field }) => (<FormItem className="flex-grow"><FormLabel className="sr-only">Meta</FormLabel><FormControl><Input type="number" placeholder="Meta" {...field} /></FormControl></FormItem>)} /><FormField control={control} name="goals.metaPrize" render={({ field }) => (<FormItem className="flex-grow"><FormLabel className="sr-only">Prêmio</FormLabel><FormControl><Input type="number" placeholder="Prêmio (R$)" {...field} /></FormControl></FormItem>)} /></div></div>
                                <div className="space-y-2"><h4 className="font-medium text-sm">Metona</h4><div className="flex items-center gap-2"><FormField control={control} name="goals.metona" render={({ field }) => (<FormItem className="flex-grow"><FormLabel className="sr-only">Meta</FormLabel><FormControl><Input type="number" placeholder="Meta" {...field} /></FormControl></FormItem>)} /><FormField control={control} name="goals.metonaPrize" render={({ field }) => (<FormItem className="flex-grow"><FormLabel className="sr-only">Prêmio</FormLabel><FormControl><Input type="number" placeholder="Prêmio (R$)" {...field} /></FormControl></FormItem>)} /></div></div>
                                <div className="space-y-2">
                                    <h4 className="font-medium text-sm">Lendária</h4>
                                    <FormField control={control} name="goals.metaLendaria" render={({ field }) => (<FormItem className="flex-grow"><FormLabel className="sr-only">Meta</FormLabel><FormControl><Input type="number" placeholder="Meta" {...field} /></FormControl></FormItem>)} />
                                    <div className="flex items-center gap-2">
                                        <FormField control={control} name="goals.legendariaBonusValorVenda" render={({ field }) => (<FormItem className="flex-grow"><FormLabel>A cada (R$)</FormLabel><FormControl><Input type="number" placeholder="Valor Venda" {...field} /></FormControl><FormMessage /></FormItem>)} />
                                        <FormField control={control} name="goals.legendariaBonusValorPremio" render={({ field }) => (<FormItem className="flex-grow"><FormLabel>Bônus (R$)</FormLabel><FormControl><Input type="number" placeholder="Valor Prêmio" {...field} /></FormControl><FormMessage /></FormItem>)} />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader><h3 className="font-semibold text-lg text-primary">Metas de PA e Ticket Médio</h3></CardHeader>
                            <CardContent className="space-y-6">{renderGoalInputs("Metas de PA", goalTiers)}<Separator />{renderGoalInputs("Metas de Ticket Médio", ticketMedioTiers)}</CardContent>
                        </Card>
                    </div>
                </div>

                <Separator />
                
                <Card>
                    <CardHeader>
                        <CardTitle>Resumo da Loja</CardTitle>
                        <CardDescription>Visão consolidada do desempenho da equipe. Clique em "Salvar e Calcular" para atualizar.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <ProgressDisplay
                            salesData={storeConsolidatedData}
                            incentives={storeConsolidatedIncentives}
                        />
                    </CardContent>
                </Card>

            </CardContent>
        </Card>
    )
}
