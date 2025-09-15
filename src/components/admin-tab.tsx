
"use client";

import { UseFormReturn, ControllerRenderProps } from "react-hook-form";
import {
  UserPlus,
  Trash2,
  Edit,
  Save,
  X,
  Eye,
  EyeOff,
  Calculator,
  Clock,
} from "lucide-react";
import { useState, useCallback } from "react";
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
import { Seller, Goals, Incentives } from "@/lib/storage";
import { incentiveProjection } from "@/ai/flows/incentive-projection";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { GoalsFormValues } from "./goal-getter-dashboard";

const goalTiers: { id: string; goal: keyof GoalsFormValues; prize: keyof GoalsFormValues }[] = [
  { id: "Nível 1", goal: "paGoal1", prize: "paPrize1" },
  { id: "Nível 2", goal: "paGoal2", prize: "paPrize2" },
  { id: "Nível 3", goal: "paGoal3", prize: "paPrize3" },
  { id: "Nível 4", goal: "paGoal4", prize: "paPrize4" },
];

const ticketMedioTiers: { id: string; goal: keyof GoalsFormValues; prize: keyof GoalsFormValues }[] = [
  { id: "Nível 1", goal: "ticketMedioGoal1", prize: "ticketMedioPrize1" },
  { id: "Nível 2", goal: "ticketMedioGoal2", prize: "ticketMedioPrize2" },
  { id: "Nível 3", goal: "ticketMedioGoal3", prize: "ticketMedioPrize3" },
  { id: "Nível 4", goal: "ticketMedioGoal4", prize: "ticketMedioPrize4" },
];

interface AdminTabProps {
  form: UseFormReturn<FormValues>;
  storeId: string;
  sellers: Seller[];
  onSellersChange: () => void;
  onIncentivesCalculated: (incentives: Incentives, lastUpdated: string) => void;
  handleSaveGoals: () => void;
  lastUpdated: string | null;
}

export function AdminTab({
  form,
  storeId,
  sellers,
  onSellersChange,
  onIncentivesCalculated,
  handleSaveGoals,
  lastUpdated,
}: AdminTabProps) {
  const { toast } = useToast();
  const [editingSellerId, setEditingSellerId] = useState<string | null>(null);
  const [editingSellerName, setEditingSellerName] = useState('');
  const [editingSellerPassword, setEditingSellerPassword] = useState('');
  const [showPassword, setShowPassword] = useState<Record<string, boolean>>({});
  const [isCalculating, setIsCalculating] = useState(false);

  const {
    control,
    getValues,
    setValue,
    setError,
    clearErrors,
  } = form;

  const handleNumericChange = useCallback((onChange: (value: any) => void, e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    const sanitizedValue = value.replace(/[^0-9,.]/g, '').replace(',', '.');
    onChange(sanitizedValue);
  }, []);

  const handleNumericBlur = useCallback((field: ControllerRenderProps<any, any>) => {
      const value = field.value;
      if (typeof value === 'string' && value.trim() !== '') {
          const num = parseFloat(value);
          if (!isNaN(num)) {
              let formattedValue = num.toFixed(2);
              if (formattedValue.endsWith('.00')) {
                  formattedValue = String(parseInt(formattedValue));
              } else if (formattedValue.endsWith('0')) {
                  formattedValue = formattedValue.slice(0, -1);
              }
              field.onChange(formattedValue.replace('.', ','));
          }
      }
  }, []);

  const handleAddSeller = async () => {
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
    
    const availableAvatarIds = Array.from({length: 10}, (_, i) => `avatar${i + 1}`);
    const usedAvatarIds = new Set(sellers.map(s => s.avatar_id));
    let randomAvatarId = availableAvatarIds[Math.floor(Math.random() * availableAvatarIds.length)];
    if(usedAvatarIds.size < availableAvatarIds.length) {
        while(usedAvatarIds.has(randomAvatarId)) {
            randomAvatarId = availableAvatarIds[Math.floor(Math.random() * availableAvatarIds.length)];
        }
    }

    try {
        const res = await fetch('/api/sellers', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: newSellerName, password: finalPassword, avatarId: randomAvatarId, storeId }),
        });

        if(!res.ok) throw new Error('Falha ao adicionar vendedor');
        
        onSellersChange();
        setValue("newSellerName", "");
        setValue("newSellerPassword", "");
        toast({ title: "Sucesso!", description: `Vendedor "${newSellerName}" adicionado.` });

    } catch (error) {
        console.error(error);
        toast({ variant: 'destructive', title: 'Erro', description: 'Não foi possível adicionar o vendedor.' });
    }
  };

  const removeSeller = async (sellerId: string) => {
    try {
      const res = await fetch(`/api/sellers/${sellerId}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Falha ao remover vendedor');
      onSellersChange();
      toast({ title: "Vendedor Removido", description: "O vendedor foi removido com sucesso." });
    } catch(error) {
        console.error(error);
        toast({ variant: 'destructive', title: 'Erro', description: 'Não foi possível remover o vendedor.' });
    }
  };

  const startEditing = (seller: Seller) => {
      setEditingSellerId(seller.id);
      setEditingSellerName(seller.name);
      setEditingSellerPassword(seller.password || '');
  }
  const cancelEditing = () => setEditingSellerId(null);

  const saveSeller = async (sellerId: string) => {
    if (!editingSellerName.trim()) {
      toast({ variant: "destructive", title: "Erro", description: "O nome não pode estar vazio." });
      return;
    }
    if (editingSellerPassword.length < 4) {
      toast({ variant: "destructive", title: "Erro", description: "A senha deve ter pelo menos 4 caracteres." });
      return;
    }

    try {
        const res = await fetch(`/api/sellers/${sellerId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: editingSellerName, password: editingSellerPassword }),
        });

        if(!res.ok) throw new Error('Falha ao atualizar vendedor');
        
        onSellersChange();
        setEditingSellerId(null);
        toast({ title: "Sucesso!", description: "Dados do vendedor atualizados." });

    } catch (error) {
        console.error(error);
        toast({ variant: 'destructive', title: 'Erro', description: 'Não foi possível atualizar o vendedor.' });
    }
  };

  const togglePasswordVisibility = (sellerId: string) => {
    setShowPassword((prev) => ({ ...prev, [sellerId]: !prev[sellerId] }));
  };

  const handleCalculateIncentives = async () => {
    setIsCalculating(true);
    try {
      const currentGoals = getValues().goals;
      const allIncentives: Incentives = {};

      if (!sellers || sellers.some(s => !s.id)) {
          toast({ variant: "destructive", title: "Erro", description: "Dados de vendedores incompletos." });
          return;
      }
      
       const parseGoals = (rawGoals: any): Goals => {
        const parsed: any = {};
        for (const key in rawGoals) {
            const value = rawGoals[key];
            if (typeof value === 'string') {
                const parsedValue = parseFloat(value.replace(',', '.'));
                parsed[key] = isNaN(parsedValue) ? value : parsedValue;
            } else {
                parsed[key] = value;
            }
        }
        return parsed as Goals;
      }

      const fixedGoals = parseGoals(currentGoals);

      for (const seller of sellers) {
        const sellerIndex = sellers.findIndex(s => s.id === seller.id);
        const sellerDataForUpdate = {
            vendas: getValues(`sellers.${sellerIndex}.vendas`),
            pa: getValues(`sellers.${sellerIndex}.pa`),
            ticket_medio: getValues(`sellers.${sellerIndex}.ticket_medio`),
            corridinha_diaria: getValues(`sellers.${sellerIndex}.corridinha_diaria`),
        };
        
        const parsedSellerData: any = {};
        for (const key in sellerDataForUpdate) {
            const value = (sellerDataForUpdate as any)[key];
             if (typeof value === 'string') {
                const parsedValue = parseFloat(value.replace(',', '.'));
                parsedSellerData[key] = isNaN(parsedValue) ? 0 : parsedValue;
            } else {
                parsedSellerData[key] = value || 0;
            }
        }

        await fetch(`/api/sellers/${seller.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(parsedSellerData)
        });

        const result = await incentiveProjection({
           seller: {
              ...seller,
              vendas: parsedSellerData.vendas,
              pa: parsedSellerData.pa,
              ticket_medio: parsedSellerData.ticket_medio,
              corridinha_diaria: parsedSellerData.corridinha_diaria,
            },
          goals: fixedGoals,
        });
        allIncentives[seller.id!] = result;
      }
      
      const newLastUpdated = new Date().toISOString();
      await fetch(`/api/stores/${storeId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ last_incentive_calculation: newLastUpdated })
      });
      onIncentivesCalculated(allIncentives, newLastUpdated);
      onSellersChange();

      toast({ title: "Sucesso!", description: "Incentivos de todos os vendedores foram calculados e os dados salvos." });
    } catch (err) {
      console.error(err);
      const errorMessage = err instanceof Error ? err.message : "Falha ao calcular incentivos.";
      toast({ variant: "destructive", title: "Erro de Cálculo", description: errorMessage });
    } finally {
      setIsCalculating(false);
    }
  };
  
  const formattedLastUpdated = lastUpdated
    ? new Date(lastUpdated).toLocaleString("pt-BR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : null;

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
                          <FormControl><Input placeholder="Ex: João Silva" {...field} value={field.value ?? ''} onKeyDown={(e) => e.key === 'Enter' && handleAddSeller()} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField control={control} name="newSellerPassword"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Senha (mínimo 4 caracteres)</FormLabel>
                          <FormControl><Input type="password" placeholder="Opcional, se deixado em branco será o nome" {...field} value={field.value ?? ''} onKeyDown={(e) => e.key === 'Enter' && handleAddSeller()}/></FormControl>
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
                  {sellers.length === 0 ? <p className="text-muted-foreground text-sm">Nenhum vendedor cadastrado ainda.</p> :
                  sellers.map((seller) => (
                    <div key={seller.id} className="flex items-center justify-between gap-2 p-3 rounded-lg bg-muted">
                      {editingSellerId === seller.id ? (
                        <>
                          <div className="flex-grow space-y-2">
                             <Input value={editingSellerName} onChange={e => setEditingSellerName(e.target.value)} className="h-9" autoFocus/>
                             <Input type={showPassword[seller.id] ? "text" : "password"} value={editingSellerPassword} onChange={e => setEditingSellerPassword(e.target.value)} className="h-9" />
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
                            <Button size="icon" variant="ghost" type="button" onClick={() => startEditing(seller)}><Edit/></Button>
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
            <CardContent className="space-y-8">
              {sellers.length === 0 ? <p className="text-muted-foreground">Adicione vendedores na aba "Vendedores" para começar.</p> : (
                <>
                   {formattedLastUpdated && (
                    <Card className="bg-secondary/50 border-dashed">
                        <CardContent className="p-4 flex items-center gap-3">
                           <Clock className="h-5 w-5 text-muted-foreground" />
                           <p className="text-sm text-muted-foreground">
                               Última atualização de dados: <span className="font-semibold text-foreground">{formattedLastUpdated}</span>
                           </p>
                        </CardContent>
                    </Card>
                  )}
                  {sellers.map((seller, index) => (
                    <div key={seller.id}>
                        {index > 0 && <Separator className="my-6" />}
                        <h3 className="font-semibold text-lg mb-4 text-card-foreground">{seller.name ?? 'Vendedor sem nome'}</h3>
                        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
                            <FormField control={control} name={`sellers.${index}.vendas`} render={({field}) => (<FormItem><FormLabel>Vendas (R$)</FormLabel><FormControl><Input type="text" inputMode="decimal" placeholder="0,00" {...field} value={`${field.value ?? ''}`.replace('.', ',')} onChange={e => handleNumericChange(field.onChange, e)} onBlur={() => handleNumericBlur(field)} /></FormControl></FormItem>)}/>
                            <FormField control={control} name={`sellers.${index}.pa`} render={({field}) => (<FormItem><FormLabel>PA (Unid.)</FormLabel><FormControl><Input type="text" inputMode="decimal" placeholder="0,00" {...field} value={`${field.value ?? ''}`.replace('.', ',')} onChange={e => handleNumericChange(field.onChange, e)} onBlur={() => handleNumericBlur(field)} /></FormControl></FormItem>)}/>
                            <FormField control={control} name={`sellers.${index}.ticket_medio`} render={({field}) => (<FormItem><FormLabel>Ticket Médio (R$)</FormLabel><FormControl><Input type="text" inputMode="decimal" placeholder="0,00" {...field} value={`${field.value ?? ''}`.replace('.', ',')} onChange={e => handleNumericChange(field.onChange, e)} onBlur={() => handleNumericBlur(field)} /></FormControl></FormItem>)}/>
                            <FormField control={control} name={`sellers.${index}.corridinha_diaria`} render={({field}) => (<FormItem><FormLabel>Bônus Corridinha (R$)</FormLabel><FormControl><Input type="text" inputMode="decimal" placeholder="0,00" {...field} value={`${field.value ?? ''}`.replace('.', ',')} onChange={e => handleNumericChange(field.onChange, e)} onBlur={() => handleNumericBlur(field)} /></FormControl></FormItem>)}/>
                        </div>
                    </div>
                  ))}
                 </>
              )}
            </CardContent>
             <CardFooter className="flex-col items-start gap-4">
                {sellers.length > 0 && (
                    <Button onClick={handleCalculateIncentives} disabled={isCalculating}>
                        <Calculator className="mr-2" />
                        {isCalculating ? "Calculando e salvando..." : "Calcular e Salvar Lançamentos"}
                    </Button>
                )}
            </CardFooter>
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
                        <FormField control={control} name="goals.metaMinha" render={({ field }) => (<FormItem><FormLabel>Metinha (R$)</FormLabel><FormControl><Input type="text" inputMode="decimal" {...field} value={`${field.value ?? ''}`.replace('.', ',')} onChange={e => handleNumericChange(field.onChange, e)} onBlur={() => handleNumericBlur(field)}/></FormControl></FormItem>)} />
                        <FormField control={control} name="goals.metaMinhaPrize" render={({ field }) => (<FormItem><FormLabel>Prêmio Metinha (R$)</FormLabel><FormControl><Input type="text" inputMode="decimal" {...field} value={`${field.value ?? ''}`.replace('.', ',')} onChange={e => handleNumericChange(field.onChange, e)} onBlur={() => handleNumericBlur(field)}/></FormControl></FormItem>)} />
                        <FormField control={control} name="goals.meta" render={({ field }) => (<FormItem><FormLabel>Meta (R$)</FormLabel><FormControl><Input type="text" inputMode="decimal" {...field} value={`${field.value ?? ''}`.replace('.', ',')} onChange={e => handleNumericChange(field.onChange, e)} onBlur={() => handleNumericBlur(field)}/></FormControl></FormItem>)} />
                        <FormField control={control} name="goals.metaPrize" render={({ field }) => (<FormItem><FormLabel>Prêmio Meta (R$)</FormLabel><FormControl><Input type="text" inputMode="decimal" {...field} value={`${field.value ?? ''}`.replace('.', ',')} onChange={e => handleNumericChange(field.onChange, e)} onBlur={() => handleNumericBlur(field)}/></FormControl></FormItem>)} />
                        <FormField control={control} name="goals.metona" render={({ field }) => (<FormItem><FormLabel>Metona (R$)</FormLabel><FormControl><Input type="text" inputMode="decimal" {...field} value={`${field.value ?? ''}`.replace('.', ',')} onChange={e => handleNumericChange(field.onChange, e)} onBlur={() => handleNumericBlur(field)}/></FormControl></FormItem>)} />
                        <FormField control={control} name="goals.metonaPrize" render={({ field }) => (<FormItem><FormLabel>Prêmio Metona (R$)</FormLabel><FormControl><Input type="text" inputMode="decimal" {...field} value={`${field.value ?? ''}`.replace('.', ',')} onChange={e => handleNumericChange(field.onChange, e)} onBlur={() => handleNumericBlur(field)}/></FormControl></FormItem>)} />
                    </div>
                     <div className="mt-4 pt-4 border-t">
                        <h4 className="font-medium mb-2 text-card-foreground">Bônus Lendária</h4>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                           <FormField control={control} name="goals.metaLendaria" render={({ field }) => (<FormItem><FormLabel>Atingir (R$)</FormLabel><FormControl><Input type="text" inputMode="decimal" {...field} value={`${field.value ?? ''}`.replace('.', ',')} onChange={e => handleNumericChange(field.onChange, e)} onBlur={() => handleNumericBlur(field)}/></FormControl></FormItem>)} />
                           <FormField control={control} name="goals.legendariaBonusValorVenda" render={({ field }) => (<FormItem><FormLabel>A cada (R$)</FormLabel><FormControl><Input type="text" inputMode="decimal" {...field} value={`${field.value ?? ''}`.replace('.', ',')} onChange={e => handleNumericChange(field.onChange, e)} onBlur={() => handleNumericBlur(field)}/></FormControl></FormItem>)} />
                           <FormField control={control} name="goals.legendariaBonusValorPremio" render={({ field }) => (<FormItem><FormLabel>Ganha-se (R$)</FormLabel><FormControl><Input type="text" inputMode="decimal" {...field} value={`${field.value ?? ''}`.replace('.', ',')} onChange={e => handleNumericChange(field.onChange, e)} onBlur={() => handleNumericBlur(field)}/></FormControl></FormItem>)} />
                        </div>
                    </div>
                </div>
                 <Separator/>
                 <div>
                    <h3 className="font-semibold text-lg mb-4 text-card-foreground">Metas de Produtos por Atendimento (PA)</h3>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-x-6 gap-y-4">
                        {goalTiers.map(tier => (
                            <div key={tier.id} className="space-y-2">
                                <FormField control={control} name={`goals.${tier.goal}`} render={({field}) => (<FormItem><FormLabel>{tier.id} (PA)</FormLabel><FormControl><Input type="text" inputMode="decimal" step="0.01" {...field} value={`${field.value ?? ''}`.replace('.', ',')} onChange={e => handleNumericChange(field.onChange, e)} onBlur={() => handleNumericBlur(field)}/></FormControl></FormItem>)} />
                                <FormField control={control} name={`goals.${tier.prize}`} render={({field}) => (<FormItem><FormLabel>Prêmio (R$)</FormLabel><FormControl><Input type="text" inputMode="decimal" {...field} value={`${field.value ?? ''}`.replace('.', ',')} onChange={e => handleNumericChange(field.onChange, e)} onBlur={() => handleNumericBlur(field)}/></FormControl></FormItem>)} />
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
                                <FormField control={control} name={`goals.${tier.goal}`} render={({field}) => (<FormItem><FormLabel>{tier.id} (R$)</FormLabel><FormControl><Input type="text" inputMode="decimal" {...field} value={`${field.value ?? ''}`.replace('.', ',')} onChange={e => handleNumericChange(field.onChange, e)} onBlur={() => handleNumericBlur(field)}/></FormControl></FormItem>)} />
                                <FormField control={control} name={`goals.${tier.prize}`} render={({field}) => (<FormItem><FormLabel>Prêmio (R$)</FormLabel><FormControl><Input type="text" inputMode="decimal" {...field} value={`${field.value ?? ''}`.replace('.', ',')} onChange={e => handleNumericChange(field.onChange, e)} onBlur={() => handleNumericBlur(field)}/></FormControl></FormItem>)} />
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
