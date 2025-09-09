
"use client";

import { UseFormReturn, useWatch } from "react-hook-form";
import {
  UserPlus,
  Trash2,
  Edit,
  Save,
  X,
  Eye,
  EyeOff,
  Calculator,
} from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { FormValues } from "./goal-getter-dashboard";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
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
import { Seller, Goals, Incentives, loadStateFromStorage, saveState } from "@/lib/storage";
import { incentiveProjection } from "@/ai/flows/incentive-projection";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const goalTiers = [
  { id: "Nível 1", goal: "paGoal1", prize: "paPrize1" },
  { id: "Nível 2", goal: "paGoal2", prize: "paPrize2" },
  { id: "Nível 3", goal: "paGoal3", prize: "paPrize3" },
  { id: "Nível 4", goal: "paGoal4", prize: "paPrize4" },
];

const ticketMedioTiers = [
  { id: "Nível 1", goal: "ticketMedioGoal1", prize: "ticketMedioPrize1" },
  { id: "Nível 2", goal: "ticketMedioGoal2", prize: "ticketMedioPrize2" },
  { id: "Nível 3", goal: "ticketMedioGoal3", prize: "ticketMedioPrize3" },
  { id: "Nível 4", goal: "ticketMedioGoal4", prize: "ticketMedioPrize4" },
];


interface AdminTabProps {
  form: UseFormReturn<FormValues>;
  storeId: string;
  onIncentivesCalculated: (incentives: Incentives) => void;
  incentives: Incentives;
  addSeller: (name: string, pass: string) => void;
  handleSaveGoals: () => void;
}

export function AdminTab({
  form,
  storeId,
  onIncentivesCalculated,
  incentives,
  addSeller,
  handleSaveGoals,
}: AdminTabProps) {
  const { toast } = useToast();
  const router = useRouter();
  const [editingSellerId, setEditingSellerId] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState<Record<string, boolean>>({});
  const [isCalculating, setIsCalculating] = useState(false);

  const {
    control,
    getValues,
    setValue,
    setError,
    clearErrors,
    formState: { errors },
    register,
  } = form;

  const sellers = useWatch({ control, name: "sellers" }) ?? [];
  const goals = useWatch({ control, name: "goals" });

  const handleAddSeller = () => {
    const newSellerName = getValues("newSellerName");
    const newSellerPassword = getValues("newSellerPassword");

    if (!newSellerName || newSellerName.trim() === "") {
      setError("newSellerName", { type: "manual", message: "Nome é obrigatório." });
      return;
    }
    if (sellers.some(s => s.name?.toLowerCase() === newSellerName.toLowerCase())) {
        setError("newSellerName", { type: "manual", message: "Este nome de vendedor já existe."});
        return;
    }
    clearErrors("newSellerName");

    const finalPassword =
      newSellerPassword && newSellerPassword.trim().length > 0
        ? newSellerPassword.trim()
        : newSellerName.trim().toLowerCase();

    if (finalPassword.length < 4) {
      setError("newSellerPassword", { type: "manual", message: "A senha deve ter no mínimo 4 caracteres." });
      return;
    }
    clearErrors("newSellerPassword");

    addSeller(newSellerName!, finalPassword);
    setValue("newSellerName", "");
    setValue("newSellerPassword", "");
  };

  const removeSeller = (sellerId: string) => {
    const updatedSellers = (getValues().sellers || []).filter((s) => s.id !== sellerId);
    setValue("sellers", updatedSellers, { shouldDirty: true });

    const newIncentives = { ...incentives };
    delete newIncentives[sellerId];
    onIncentivesCalculated(newIncentives);

    const currentState = loadStateFromStorage();
    currentState.sellers[storeId] = updatedSellers as Seller[];
    currentState.goals[storeId] = goals;
    currentState.incentives[storeId] = newIncentives;
    saveState(currentState);

    const newTab = updatedSellers.length > 0 && updatedSellers[0].id ? updatedSellers[0].id : "admin";
    router.push(`/dashboard/${storeId}?tab=${newTab}`);
  };

  const startEditing = (sellerId: string) => setEditingSellerId(sellerId);
  const cancelEditing = () => setEditingSellerId(null);

  const saveSeller = (sellerId: string) => {
    const currentSellers = getValues().sellers || [];
    const sellerIndex = currentSellers.findIndex((s) => s.id === sellerId);
    if (sellerIndex === -1) return;

    const newName = getValues(`sellers.${sellerIndex}.name`);
    const newPassword = getValues(`sellers.${sellerIndex}.password`);

    if (!newName || newName.trim() === "") {
      toast({ variant: "destructive", title: "Erro", description: "O nome do vendedor não pode estar vazio." });
      return;
    }
    if (!newPassword || newPassword.length < 4) {
      toast({ variant: "destructive", title: "Erro", description: "A senha deve ter pelo menos 4 caracteres." });
      return;
    }

    const updatedSellers = [...currentSellers];
    updatedSellers[sellerIndex] = { ...updatedSellers[sellerIndex], name: newName, password: newPassword };
    
    setValue("sellers", updatedSellers, { shouldDirty: true });

    const currentState = loadStateFromStorage();
    currentState.sellers[storeId] = updatedSellers as Seller[];
    currentState.goals[storeId] = goals;
    currentState.incentives[storeId] = incentives;
    saveState(currentState);

    setEditingSellerId(null);
    toast({ title: "Sucesso!", description: "Dados do vendedor atualizados." });
  };

  const togglePasswordVisibility = (sellerId: string) => {
    setShowPassword((prev) => ({ ...prev, [sellerId]: !prev[sellerId] }));
  };

  const handleCalculateIncentives = async () => {
    setIsCalculating(true);
    try {
      const currentSellers = getValues().sellers;
      const currentGoals = getValues().goals;
      const allIncentives: Incentives = {};

      if (!currentSellers || currentSellers.some(s => !s.id)) {
          toast({ variant: "destructive", title: "Erro", description: "Dados de vendedores incompletos. Salve todas as alterações antes de calcular." });
          return;
      }
      
      for (const seller of currentSellers) {
        const result = await incentiveProjection({
          seller: seller as Seller, // Now safe because we filter for valid sellers
          goals: currentGoals, // Now safe because the schema enforces the type
        });
        allIncentives[seller.id!] = result;
      }
      
      onIncentivesCalculated(allIncentives);

      const currentState = loadStateFromStorage();
      currentState.sellers[storeId] = currentSellers as Seller[];
      currentState.goals[storeId] = currentGoals;
      currentState.incentives[storeId] = allIncentives;
      saveState(currentState);

      toast({ title: "Sucesso!", description: "Incentivos de todos os vendedores foram calculados." });
    } catch (err) {
      console.error(err);
      const errorMessage = err instanceof Error ? err.message : "Falha ao calcular incentivos.";
      toast({ variant: "destructive", title: "Erro de Cálculo", description: errorMessage });
    } finally {
      setIsCalculating(false);
    }
  };
  
  const validSellers = (sellers || []).filter((s): s is Seller => !!s && !!s.id);

  return (
    <div className="space-y-8">
      <Tabs defaultValue="vendedores" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="vendedores">👥 Vendedores</TabsTrigger>
          <TabsTrigger value="lancamentos">📊 Lançamentos</TabsTrigger>
          <TabsTrigger value="metas">🎯 Metas & Prêmios</TabsTrigger>
        </TabsList>
        
        <TabsContent value="vendedores">
          <Card>
            <CardHeader>
              <CardTitle>Gerenciar Vendedores</CardTitle>
              <CardDescription>Adicione, edite ou remova vendedores da sua equipe.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h3 className="text-lg font-medium mb-4">Adicionar Novo Vendedor</h3>
                 <div className="space-y-4 p-4 border rounded-lg bg-card">
                    <FormField control={control} name="newSellerName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nome do Vendedor</FormLabel>
                          <FormControl><Input placeholder="Ex: João Silva" {...field} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField control={control} name="newSellerPassword"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Senha (mínimo 4 caracteres)</FormLabel>
                          <FormControl><Input type="password" placeholder="Opcional, se deixado em branco será o nome" {...field} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <Button type="button" onClick={handleAddSeller}><UserPlus className="mr-2" /> Adicionar Vendedor</Button>
                </div>
              </div>
              <Separator />
               <div>
                <h3 className="text-lg font-medium mb-4">Vendedores Atuais</h3>
                <div className="space-y-2">
                  {validSellers.length === 0 ? <p className="text-muted-foreground text-sm">Nenhum vendedor cadastrado ainda.</p> :
                  validSellers.map((seller, index) => (
                    <div key={seller.id} className="flex items-center justify-between gap-2 p-3 rounded-lg bg-muted">
                      {editingSellerId === seller.id ? (
                        <>
                          <div className="flex-grow space-y-2">
                            <FormField control={control} name={`sellers.${index}.name`} render={({ field }) => (
                                <FormItem><FormLabel className="sr-only">Nome</FormLabel><FormControl><Input {...field} className="h-9" autoFocus/></FormControl></FormItem>
                            )}/>
                            <FormField control={control} name={`sellers.${index}.password`} render={({ field }) => (
                               <FormItem><FormLabel className="sr-only">Senha</FormLabel><FormControl><Input type={showPassword[seller.id] ? "text" : "password"} {...field} className="h-9" /></FormControl></FormItem>
                            )}/>
                          </div>
                          <div className="flex items-center">
                            <Button size="icon" variant="ghost" type="button" onClick={() => togglePasswordVisibility(seller.id)}>{showPassword[seller.id] ? <EyeOff /> : <Eye />}</Button>
                            <Button size="icon" variant="ghost" type="button" onClick={() => saveSeller(seller.id)}><Save className="text-green-600" /></Button>
                            <Button size="icon" variant="ghost" type="button" onClick={cancelEditing}><X /></Button>
                          </div>
                        </>
                      ) : (
                        <>
                          <span className="font-medium">{seller.name ?? 'Vendedor sem nome'}</span>
                          <div className="flex items-center">
                            <Button size="icon" variant="ghost" type="button" onClick={() => startEditing(seller.id)}><Edit/></Button>
                            <AlertDialog>
                              <AlertDialogTrigger asChild><Button size="icon" variant="ghost" className="text-destructive hover:text-destructive" type="button"><Trash2 /></Button></AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader><AlertDialogTitle>Remover "{seller.name ?? 'Vendedor'}"?</AlertDialogTitle><AlertDialogDescription>Essa ação não pode ser desfeita. Todos os dados deste vendedor serão perdidos.</AlertDialogDescription></AlertDialogHeader>
                                <AlertDialogFooter><AlertDialogCancel>Cancelar</AlertDialogCancel><AlertDialogAction onClick={() => removeSeller(seller.id)} className="bg-destructive hover:bg-destructive/90">Remover</AlertDialogAction></AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="lancamentos">
          <Card>
            <CardHeader>
              <CardTitle>Lançamentos de Desempenho</CardTitle>
              <CardDescription>Insira os valores de Vendas, PA e Ticket Médio para cada vendedor.</CardDescription>
            </CardHeader>
            <CardContent>
              {validSellers.length === 0 ? <p className="text-muted-foreground">Adicione vendedores na aba "Vendedores" para começar.</p> : (
                <div className="space-y-6">
                  {validSellers.map((seller, index) => (
                    <div key={seller.id} className="p-4 border rounded-lg space-y-4 bg-card">
                      <h3 className="font-semibold text-lg text-card-foreground">{seller.name ?? 'Vendedor sem nome'}</h3>
                      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <FormField control={control} name={`sellers.${index}.vendas`} render={({field}) => (<FormItem><FormLabel>Vendas (R$)</FormLabel><FormControl><Input type="number" placeholder="0.00" {...field} /></FormControl></FormItem>)}/>
                        <FormField control={control} name={`sellers.${index}.pa`} render={({field}) => (<FormItem><FormLabel>PA (Unid.)</FormLabel><FormControl><Input type="number" placeholder="0.00" {...field} /></FormControl></FormItem>)}/>
                        <FormField control={control} name={`sellers.${index}.ticketMedio`} render={({field}) => (<FormItem><FormLabel>Ticket Médio (R$)</FormLabel><FormControl><Input type="number" placeholder="0.00" {...field} /></FormControl></FormItem>)}/>
                        <FormField control={control} name={`sellers.${index}.corridinhaDiaria`} render={({field}) => (<FormItem><FormLabel>Bônus Corridinha (R$)</FormLabel><FormControl><Input type="number" placeholder="0.00" {...field} /></FormControl></FormItem>)}/>
                      </div>
                    </div>
                  ))}
                  <Button onClick={handleCalculateIncentives} disabled={isCalculating}>
                    <Calculator className="mr-2" />
                    {isCalculating ? "Calculando..." : "Calcular Todos os Incentivos"}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="metas">
           <Card>
            <CardHeader>
                <CardTitle>Configuração de Metas e Prêmios</CardTitle>
                <CardDescription>Defina os objetivos para Vendas, PA e Ticket Médio.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-8">
                <div>
                    <h3 className="font-semibold text-lg mb-4 text-card-foreground">Metas de Vendas e Prêmios</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <FormField control={control} name="goals.metaMinha" render={({ field }) => (<FormItem><FormLabel>Metinha (R$)</FormLabel><FormControl><Input type="number" {...field} /></FormControl></FormItem>)} />
                        <FormField control={control} name="goals.metaMinhaPrize" render={({ field }) => (<FormItem><FormLabel>Prêmio Metinha (R$)</FormLabel><FormControl><Input type="number" {...field} /></FormControl></FormItem>)} />
                         <FormField control={control} name="goals.meta" render={({ field }) => (<FormItem><FormLabel>Meta (R$)</FormLabel><FormControl><Input type="number" {...field} /></FormControl></FormItem>)} />
                        <FormField control={control} name="goals.metaPrize" render={({ field }) => (<FormItem><FormLabel>Prêmio Meta (R$)</FormLabel><FormControl><Input type="number" {...field} /></FormControl></FormItem>)} />
                        <FormField control={control} name="goals.metona" render={({ field }) => (<FormItem><FormLabel>Metona (R$)</FormLabel><FormControl><Input type="number" {...field} /></FormControl></FormItem>)} />
                        <FormField control={control} name="goals.metonaPrize" render={({ field }) => (<FormItem><FormLabel>Prêmio Metona (R$)</FormLabel><FormControl><Input type="number" {...field} /></FormControl></FormItem>)} />
                    </div>
                     <div className="mt-4 pt-4 border-t">
                        <h4 className="font-medium mb-2 text-card-foreground">Bônus Lendária</h4>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                           <FormField control={control} name="goals.metaLendaria" render={({ field }) => (<FormItem><FormLabel>Atingir (R$)</FormLabel><FormControl><Input type="number" {...field} /></FormControl></FormItem>)} />
                           <FormField control={control} name="goals.legendariaBonusValorVenda" render={({ field }) => (<FormItem><FormLabel>A cada (R$)</FormLabel><FormControl><Input type="number" {...field} /></FormControl></FormItem>)} />
                           <FormField control={control} name="goals.legendariaBonusValorPremio" render={({ field }) => (<FormItem><FormLabel>Ganha-se (R$)</FormLabel><FormControl><Input type="number" {...field} /></FormControl></FormItem>)} />
                        </div>
                    </div>
                </div>
                 <Separator/>
                 <div>
                    <h3 className="font-semibold text-lg mb-4 text-card-foreground">Metas de Produtos por Atendimento (PA)</h3>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-x-6 gap-y-4">
                        {goalTiers.map(tier => (
                            <div key={tier.id} className="space-y-2">
                                <FormField control={control} name={`goals.${tier.goal}`} render={({field}) => (<FormItem><FormLabel>{tier.id} (PA)</FormLabel><FormControl><Input type="number" step="0.01" {...field} /></FormControl></FormItem>)} />
                                <FormField control={control} name={`goals.${tier.prize}`} render={({field}) => (<FormItem><FormLabel>Prêmio (R$)</FormLabel><FormControl><Input type="number" {...field} /></FormControl></FormItem>)} />
                            </div>
                        ))}
                    </div>
                </div>
                 <Separator/>
                <div>
                    <h3 className="font-semibold text-lg mb-4 text-card-foreground">Metas de Ticket Médio</h3>
                     <div className="grid grid-cols-1 md:grid-cols-4 gap-x-6 gap-y-4">
                        {ticketMedioTiers.map(tier => (
                            <div key={tier.id} className="space-y-2">
                                <FormField control={control} name={`goals.${tier.goal}`} render={({field}) => (<FormItem><FormLabel>{tier.id} (R$)</FormLabel><FormControl><Input type="number" {...field} /></FormControl></FormItem>)} />
                                <FormField control={control} name={`goals.${tier.prize}`} render={({field}) => (<FormItem><FormLabel>Prêmio (R$)</FormLabel><FormControl><Input type="number" {...field} /></FormControl></FormItem>)} />
                            </div>
                        ))}
                    </div>
                </div>
            </CardContent>
            <CardFooter>
                 <Button onClick={handleSaveGoals} >
                    <Save className="mr-2 h-4 w-4" />
                    Salvar Metas
                 </Button>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
