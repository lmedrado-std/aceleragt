
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
  LayoutDashboard,
  FileUp,
  AlertTriangle,
  Users,
  BarChart,
  Target,
  KeyRound,
  Info,
  TrendingUp,
  Check,
  Loader2,
  Megaphone,
} from "lucide-react";
import { useState, useCallback, useRef, useEffect } from "react";
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
import { Seller, Goals, Incentives } from "@/lib/storage";
import { incentiveProjection } from "@/ai/flows/incentive-projection";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { GoalsFormValues } from "./goal-getter-dashboard";
import { StoreAdminDashboard } from "./store-admin-dashboard";
import * as XLSX from 'xlsx';
import { cn } from "@/lib/utils";
import { SellerAvatar } from "./seller-avatar";
import { Switch } from "./ui/switch";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "./ui/tooltip";
import { ErrorBoundary } from "./ErrorBoundary";
import { ArchivePeriodCard } from "./archive-period-card";

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
  incentives: Incentives;
}

type ParsedRow = {
  sellerIndex: number;
  salesValue: any;
  paValue: any;
  ticketMedioValue: any;
}

export function AdminTab({
  form,
  storeId,
  sellers,
  onSellersChange,
  onIncentivesCalculated,
  handleSaveGoals,
  lastUpdated,
  incentives
}: AdminTabProps) {
  const { toast } = useToast();
  const [activeAdminTab, setActiveAdminTab] = useState("dashboard");
  const [editingSellerId, setEditingSellerId] = useState<string | null>(null);
  const [editingSellerName, setEditingSellerName] = useState('');
  const [editingSellerPassword, setEditingSellerPassword] = useState('');
  const [showPassword, setShowPassword] = useState<Record<string, boolean>>({});
  const [isCalculating, setIsCalculating] = useState(false);
  const [isSavingGoals, setIsSavingGoals] = useState(false);
  const [storePasswords, setStorePasswords] = useState({ new: '', confirm: '' });
  const [showStorePassword, setShowStorePassword] = useState(false);
  const [showConfirmStorePassword, setShowConfirmStorePassword] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importDialog, setImportDialog] = useState<{
      open: boolean;
      notFound: string[];
      found: ParsedRow[];
  }>({ open: false, notFound: [], found: [] });
  const [formattedLastUpdated, setFormattedLastUpdated] = useState<string | null>(null);


  const {
    control,
    getValues,
    setValue,
    setError,
    clearErrors,
    watch,
    formState: { dirtyFields },
  } = form;

  const legendariaValues = watch([
    "goals.metaLendaria",
    "goals.legendariaBonusValorVenda",
    "goals.legendariaBonusValorPremio",
  ]);
  const performanceBonusEnabled = watch("goals.performanceBonusEnabled");
  
  useEffect(() => {
    if (lastUpdated) {
        setFormattedLastUpdated(
            new Date(lastUpdated).toLocaleString("pt-BR", {
                day: "2-digit",
                month: "2-digit",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
            })
        );
    }
  }, [lastUpdated]);

  const handleNumericChange = useCallback((onChange: (value: any) => void, e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    const sanitizedValue = value.replace(/[^0-9,.]/g, '').replace(',', '.');
    onChange(sanitizedValue);
  }, []);

  const handleNumericBlur = useCallback((field: ControllerRenderProps<any, any>) => {
      let value = field.value;
      if (typeof value === 'string') {
        const num = parseFloat(value.replace(',', '.'));
        if (!isNaN(num)) {
          value = num;
        }
      }
      field.onChange(value);
  }, []);

  const handleAddSeller = async (name?: string, password?: string) => {
    const newSellerName = (name || getValues("newSellerName"))?.trim();
    const newSellerPassword = password || getValues("newSellerPassword");

    if (!newSellerName) {
      setError("newSellerName", { type: "manual", message: "Nome é obrigatório." });
      return false;
    }
     if (sellers.some(s => s.name?.toLowerCase() === newSellerName.toLowerCase())) {
        setError("newSellerName", { type: "manual", message: "Este nome de vendedor já existe."});
        return false;
    }
    clearErrors("newSellerName");

    let finalPassword = newSellerPassword?.trim();

    if (!finalPassword) {
      if (newSellerName.length <= 3) {
        finalPassword = "1234";
      } else {
        finalPassword = newSellerName.toLowerCase();
      }
    }


    if (finalPassword.length < 4) {
      setError("newSellerPassword", { type: "manual", message: "A senha deve ter no mínimo 4 caracteres." });
      return false;
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
            body: JSON.stringify({ 
              name: newSellerName, 
              password: finalPassword, 
              avatar_id: randomAvatarId, 
              store_id: storeId 
            }),
        });

        if(!res.ok) {
            const errorData = await res.json();
            throw new Error(errorData.details || errorData.error || 'Falha ao adicionar vendedor');
        }
        
        onSellersChange(); // This will refetch sellers and update the state
        setValue("newSellerName", "");
        setValue("newSellerPassword", "");
        toast({ title: "Sucesso!", description: `Vendedor "${newSellerName}" adicionado.` });
        return true;

    } catch (error) {
        console.error(error);
        toast({ variant: 'destructive', title: 'Erro', description: (error as Error).message });
        return false;
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
            if (key === 'performanceBonusEnabled') {
                parsed[key] = !!value;
                continue;
            }
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
        
        const sellerForAI = {
          id: seller.id,
          name: seller.name,
          avatarId: seller.avatar_id,
          password: seller.password,
          vendas: parsedSellerData.vendas,
          pa: parsedSellerData.pa,
          ticketMedio: parsedSellerData.ticket_medio,
          corridinhaDiaria: parsedSellerData.corridinha_diaria,
        }

        const result = await incentiveProjection({
          seller: sellerForAI,
          goals: {
            ...fixedGoals,
            performanceBonusEnabled: !!fixedGoals.performanceBonusEnabled,
          },
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
    
  const proceedWithImport = (rows: ParsedRow[]) => {
      let updatedCount = 0;
      rows.forEach(row => {
          setValue(`sellers.${row.sellerIndex}.vendas`, row.salesValue, { shouldDirty: true });
          setValue(`sellers.${row.sellerIndex}.pa`, row.paValue, { shouldDirty: true });
          setValue(`sellers.${row.sellerIndex}.ticket_medio`, row.ticketMedioValue, { shouldDirty: true });
          updatedCount++;
      });

      if (updatedCount > 0) {
          toast({
              title: "Importação Concluída!",
              description: `${updatedCount} vendedor(es) atualizado(s). O bônus 'Corridinha Diária' deve ser inserido manualmente, se aplicável.`,
              duration: 8000
          });
      }
      setImportDialog({ open: false, notFound: [], found: [] });
  };


  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
        const data = e.target?.result;
        if (!data) return;

        try {
            const workbook = XLSX.read(data, { type: 'array' });
            const sheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[sheetName];
            if (!worksheet) {
                throw new Error(`A planilha "${sheetName}" não foi encontrada no arquivo.`);
            }

            const jsonData = XLSX.utils.sheet_to_json<any>(worksheet);

            const updatesToApply: ParsedRow[] = [];
            const notFoundSellers: string[] = [];

            jsonData.forEach(row => {
                const sellerName = row['reportgroup']?.toString().trim().toLowerCase();
                if (!sellerName) return;

                const sellerIndex = sellers.findIndex(s => s.name?.trim().toLowerCase() === sellerName);

                if (sellerIndex !== -1) {
                    updatesToApply.push({
                        sellerIndex: sellerIndex,
                        salesValue: row['totalliquido'],
                        paValue: row['mediapecasvendas'],
                        ticketMedioValue: row['mediavendas'],
                    });
                } else {
                    notFoundSellers.push(row['reportgroup']);
                }
            });

            if (updatesToApply.length === 0 && notFoundSellers.length === 0) {
              toast({
                  variant: "destructive",
                  title: "Nenhum dado para importar",
                  description: "Verifique se o arquivo Excel tem as colunas corretas e se os nomes dos vendedores correspondem.",
                  duration: 10000
              });
              return;
            }

            if (notFoundSellers.length > 0) {
                setImportDialog({
                    open: true,
                    notFound: notFoundSellers,
                    found: updatesToApply
                });
            } else {
                proceedWithImport(updatesToApply);
            }

        } catch (error) {
            console.error(error);
            toast({ variant: 'destructive', title: 'Erro de Importação', description: (error as Error).message });
        } finally {
            if (fileInputRef.current) {
                fileInputRef.current.value = "";
            }
        }
    };

    reader.onerror = (error) => {
        toast({ variant: 'destructive', title: 'Erro de Leitura', description: 'Não foi possível ler o arquivo.' });
    };

    reader.readAsArrayBuffer(file);
  };
  
    const handleQuickAddSeller = async (name: string) => {
        const success = await handleAddSeller(name);
        if (success) {
            // Remove from notFound list if successfully added
            setImportDialog(prev => ({
                ...prev,
                notFound: prev.notFound.filter(n => n.toLowerCase() !== name.toLowerCase()),
            }));
            toast({ title: `Vendedor "${name}" cadastrado!` });
        }
    };

    const handleStorePasswordChange = async () => {
    if (storePasswords.new !== storePasswords.confirm) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: "As senhas não coincidem.",
      });
      return;
    }
    if (!storePasswords.new || storePasswords.new.length < 4) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: "A senha deve ter no mínimo 4 caracteres.",
      });
      return;
    }

    try {
      const res = await fetch(`/api/stores/${storeId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: storePasswords.new }),
      });
      if (!res.ok) {
        throw new Error('Falha ao atualizar a senha da loja');
      }
      toast({
        title: "Sucesso!",
        description: "A senha da loja foi alterada com sucesso.",
      });
      setStorePasswords({ new: '', confirm: '' });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: (error as Error).message,
      });
    }
  };

  const onSaveGoals = async () => {
    setIsSavingGoals(true);
    const { id } = toast({
      title: "Salvando Metas...",
      description: "Aguarde enquanto aplicamos as novas configurações.",
    });
    
    await handleSaveGoals();

    toast.update(id, {
      title: "Metas Salvas!",
      description: "As novas metas e prêmios foram salvos com sucesso.",
    });
    setIsSavingGoals(false);
  }


  return (
    <div className="space-y-8">
      {/* Import Confirmation Dialog */}
      <AlertDialog open={importDialog.open} onOpenChange={(open) => !open && setImportDialog({ open: false, notFound: [], found: [] })}>
          <AlertDialogContent>
              <AlertDialogHeader>
                  <AlertDialogTitle className="flex items-center gap-2">
                      <AlertTriangle className="text-yellow-500" />
                      Vendedores não encontrados
                  </AlertDialogTitle>
                   <AlertDialogDescription asChild>
                    <div>
                      <p>
                        A importação pode continuar para os {importDialog.found.length} vendedores encontrados, mas os vendedores abaixo não existem no sistema. Você pode cadastrá-los agora ou ignorá-los.
                      </p>
                      <div className="mt-4 space-y-2 max-h-40 overflow-y-auto pr-2">
                          {importDialog.notFound.map((name, i) => (
                              <div key={i} className="flex justify-between items-center bg-muted p-2 rounded-md">
                                  <span className="font-medium text-sm">{name}</span>
                                  <Button size="sm" variant="outline" onClick={() => handleQuickAddSeller(name)}>
                                    <UserPlus className="mr-2 h-4 w-4"/> Cadastrar
                                  </Button>
                              </div>
                          ))}
                      </div>
                    </div>
                  </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                  <AlertDialogCancel onClick={() => setImportDialog({ open: false, notFound: [], found: [] })}>
                      Cancelar Tudo
                  </AlertDialogCancel>
                  <AlertDialogAction onClick={() => proceedWithImport(importDialog.found)}>
                      Continuar com Vendedores Encontrados
                  </AlertDialogAction>
              </AlertDialogFooter>
          </AlertDialogContent>
      </AlertDialog>

      <Tabs value={activeAdminTab} onValueChange={setActiveAdminTab} className="w-full">
        <TooltipProvider>
          <TabsList className="grid w-full grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
            <Tooltip>
              <TooltipTrigger asChild>
                <TabsTrigger
                  value="dashboard"
                  className={cn(
                    "inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-background transition-all",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                    "disabled:pointer-events-none disabled:opacity-50",
                    "data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm data-[state=active]:animate-subtle-pulse"
                   )}
                >
                  <LayoutDashboard className="mr-2 h-4 w-4" />
                  Dashboard
                </TabsTrigger>
              </TooltipTrigger>
              <TooltipContent>
                <p>Visão geral do desempenho da equipe.</p>
              </TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <TabsTrigger
                  value="vendedores"
                  className={cn(
                    "inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-background transition-all",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                    "disabled:pointer-events-none disabled:opacity-50",
                    "data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm data-[state=active]:animate-subtle-pulse"
                   )}
                >
                  <Users className="mr-2 h-4 w-4" />
                  Vendedores
                </TabsTrigger>
              </TooltipTrigger>
              <TooltipContent>
                <p>Adicionar, editar ou remover vendedores.</p>
              </TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <TabsTrigger
                  value="lancamentos"
                  className={cn(
                    "inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-background transition-all",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                    "disabled:pointer-events-none disabled:opacity-50",
                    "data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm data-[state=active]:animate-subtle-pulse"
                   )}
                >
                  <BarChart className="mr-2 h-4 w-4" />
                  Lançamentos
                </TabsTrigger>
              </TooltipTrigger>
              <TooltipContent>
                <p>Inserir dados de vendas e importar de planilhas.</p>
              </TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <TabsTrigger
                  value="metas"
                  className={cn(
                    "inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-background transition-all",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                    "disabled:pointer-events-none disabled:opacity-50",
                    "data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm data-[state=active]:animate-subtle-pulse"
                   )}
                >
                  <Target className="mr-2 h-4 w-4" />
                  Metas & Prêmios
                </TabsTrigger>
              </TooltipTrigger>
              <TooltipContent>
                <p>Configurar as metas e os valores dos prêmios.</p>
              </TooltipContent>
            </Tooltip>
             <Tooltip>
              <TooltipTrigger asChild>
                <TabsTrigger
                  value="seguranca"
                  className={cn(
                    "inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-background transition-all",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                    "disabled:pointer-events-none disabled:opacity-50",
                    "data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm data-[state=active]:animate-subtle-pulse"
                   )}
                >
                  <KeyRound className="mr-2 h-4 w-4" />
                  Segurança
                </TabsTrigger>
              </TooltipTrigger>
              <TooltipContent>
                <p>Alterar a senha de acesso da loja.</p>
              </TooltipContent>
            </Tooltip>
          </TabsList>
        </TooltipProvider>

        <TabsContent value="dashboard" className="mt-6">
          <ErrorBoundary>
            {sellers && getValues().goals && incentives ? (
                <StoreAdminDashboard
                  sellers={sellers}
                  goals={getValues().goals as Goals}
                  incentives={incentives}
                />
            ) : (
              <div className="flex items-center justify-center p-12">
                <div className="text-center text-muted-foreground">
                  <div className="text-lg mb-2">Carregando painel de administração...</div>
                  <div className="text-sm">Aguarde enquanto os dados são carregados.</div>
                </div>
              </div>
            )}
          </ErrorBoundary>
        </TabsContent>
        
        <TabsContent value="vendedores" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Gerenciar Vendedores</CardTitle>
              <CardDescription>Adicione, edite ou remova vendedores e acompanhe o engajamento.</CardDescription>
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
                    <Button type="button" onClick={() => handleAddSeller()}><UserPlus className="mr-2" /> Adicionar Vendedor</Button>
                </div>
              </div>
              <Separator />
               <div>
                <h3 className="text-lg font-medium mb-4">Vendedores Atuais</h3>
                <div className="space-y-2">
                  {sellers.length === 0 ? <p className="text-muted-foreground text-sm">Nenhum vendedor cadastrado ainda.</p> :
                  sellers.map((seller) => (
                    <div key={seller.id} className="flex flex-wrap items-center justify-between gap-4 p-3 rounded-lg bg-muted">
                        {editingSellerId === seller.id ? (
                        <>
                          <div className="flex-grow grid grid-cols-1 sm:grid-cols-2 gap-2">
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
                            <div className="flex-grow">
                                <p className="font-medium">{seller.name ?? 'Vendedor sem nome'}</p>
                                {seller.last_viewed_at && (
                                    <div className="flex items-center gap-4 text-xs text-muted-foreground mt-1">
                                        <span className="flex items-center gap-1.5"><Clock className="h-3.5 w-3.5"/> 
                                            visto por último há {new Date(seller.last_viewed_at).toLocaleDateString()}
                                        </span>
                                        <span className="flex items-center gap-1.5"><TrendingUp className="h-3.5 w-3.5"/> {seller.view_count || 0} acessos</span>
                                    </div>
                                )}
                            </div>
                          <div className="flex items-center flex-shrink-0">
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

        <TabsContent value="lancamentos" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Lançamentos de Desempenho</CardTitle>
              <CardDescription>Insira os valores de Vendas, PA e Ticket Médio para cada vendedor.</CardDescription>
            </CardHeader>
            <CardContent>
                {sellers.length > 0 ? (
                    <div className="space-y-8">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {sellers.map((seller, index) => (
                            <Card key={seller.id} className="overflow-hidden">
                                <CardHeader className="flex flex-row items-center gap-4 bg-muted/50 p-4">
                                    <SellerAvatar avatarId={seller.avatar_id} className="h-12 w-12"/>
                                    <CardTitle className="text-xl">{seller.name ?? 'Vendedor sem nome'}</CardTitle>
                                </CardHeader>
                                <CardContent className="p-4">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <FormField control={control} name={`sellers.${index}.vendas`} render={({field}) => (<FormItem><FormLabel>Vendas (R$)</FormLabel><FormControl><Input type="text" inputMode="decimal" placeholder="0,00" {...field} value={`${field.value ?? ''}`.replace('.', ',')} onChange={e => handleNumericChange(field.onChange, e)} onBlur={() => handleNumericBlur(field)} className={cn(dirtyFields.sellers?.[index]?.vendas && "bg-yellow-100 dark:bg-yellow-900/30")} /></FormControl></FormItem>)}/>
                                        <FormField control={control} name={`sellers.${index}.pa`} render={({field}) => (<FormItem><FormLabel>PA (Unid.)</FormLabel><FormControl><Input type="text" inputMode="decimal" placeholder="0,00" {...field} value={`${field.value ?? ''}`.replace('.', ',')} onChange={e => handleNumericChange(field.onChange, e)} onBlur={() => handleNumericBlur(field)} className={cn(dirtyFields.sellers?.[index]?.pa && "bg-yellow-100 dark:bg-yellow-900/30")} /></FormControl></FormItem>)}/>
                                        <FormField control={control} name={`sellers.${index}.ticket_medio`} render={({field}) => (<FormItem><FormLabel>Ticket Médio (R$)</FormLabel><FormControl><Input type="text" inputMode="decimal" placeholder="0,00" {...field} value={`${field.value ?? ''}`.replace('.', ',')} onChange={e => handleNumericChange(field.onChange, e)} onBlur={() => handleNumericBlur(field)} className={cn(dirtyFields.sellers?.[index]?.ticket_medio && "bg-yellow-100 dark:bg-yellow-900/30")} /></FormControl></FormItem>)}/>
                                        <FormField control={control} name={`sellers.${index}.corridinha_diaria`} render={({field}) => (<FormItem><FormLabel>Bônus Corridinha (R$)</FormLabel><FormControl><Input type="text" inputMode="decimal" placeholder="0,00" {...field} value={`${field.value ?? ''}`.replace('.', ',')} onChange={e => handleNumericChange(field.onChange, e)} onBlur={() => handleNumericBlur(field)} className={cn(dirtyFields.sellers?.[index]?.corridinha_diaria && "bg-yellow-100 dark:bg-yellow-900/30")} /></FormControl></FormItem>)} />
                                    </div>
                                </CardContent>
                            </Card>
                            ))}
                        </div>
                    </div>
                ) : (
                    <p className="text-muted-foreground text-center py-4">Adicione vendedores na aba "Vendedores" para começar.</p>
                )}
            </CardContent>
             <CardFooter className="flex flex-wrap items-start justify-between gap-6 border-t pt-6">
                <div className="flex flex-col sm:flex-row items-center gap-4">
                    {sellers.length > 0 && (
                        <Button onClick={handleCalculateIncentives} disabled={isCalculating} className="w-full sm:w-auto">
                            <Calculator className="mr-2" />
                            {isCalculating ? "Calculando e salvando..." : "Calcular e Salvar Lançamentos"}
                        </Button>
                    )}
                    {formattedLastUpdated && (
                        <div className="text-sm text-muted-foreground flex items-center gap-2">
                           <Clock className="h-4 w-4" />
                           <span>
                               Última atualização: <span className="font-semibold text-foreground">{formattedLastUpdated}</span>
                           </span>
                        </div>
                    )}
                </div>
                <div className="w-full sm:w-auto flex-shrink-0">
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="p-4 border rounded-lg bg-muted/50 w-full sm:max-w-xs">
                            <div className="flex flex-col items-start gap-2">
                                <h3 className="font-semibold text-sm flex items-center gap-2">
                                  Importar de Arquivo Excel
                                  <Info className="h-4 w-4" />
                                </h3>
                                <p className="text-xs text-muted-foreground mb-2">Colunas: reportgroup, totalliquido, etc.</p>
                                <Button onClick={() => fileInputRef.current?.click()} size="sm" variant="outline" className="w-full">
                                    <FileUp className="mr-2 h-4 w-4" />
                                    Importar Planilha
                                </Button>
                                <Input 
                                    type="file" 
                                    ref={fileInputRef} 
                                    className="hidden"
                                    accept=".xlsx, .xls"
                                    onChange={handleFileUpload}
                                />
                            </div>
                        </div>
                      </TooltipTrigger>
                      <TooltipContent side="top" align="end" className="max-w-xs">
                        <p className="font-bold">Como Gerar o Relatório:</p>
                        <p>No sistema Seta, acesse:</p>
                        <p>Relatórios &gt; Relatórios para Lojas, defina o período e clique em 'Excel' à esquerda para exportar.</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
            </CardFooter>
          </Card>
           <div className="mt-8">
              <ArchivePeriodCard storeId={storeId} onArchiveSuccess={onSellersChange} />
            </div>
        </TabsContent>
        
        <TabsContent value="metas" className="mt-6">
           <Card>
            <CardHeader>
                <CardTitle>Configuração de Metas e Prêmios</CardTitle>
                <CardDescription>Defina os objetivos para Vendas, PA e Ticket Médio.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-8">
                <div>
                    <h3 className="font-semibold text-lg mb-4 text-card-foreground">Metas de Vendas e Prêmios</h3>
                    <div className="space-y-4">
                        <div className="p-4 border rounded-lg bg-card space-y-2">
                            <h4 className="font-medium text-md text-card-foreground">Meta 1</h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <FormField control={control} name="goals.metaMinha" render={({ field }) => (<FormItem><FormLabel>Valor da Meta (R$)</FormLabel><FormControl><Input type="text" inputMode="decimal" {...field} value={`${field.value ?? ''}`.replace('.', ',')} onChange={e => handleNumericChange(field.onChange, e)} onBlur={() => handleNumericBlur(field)}/></FormControl></FormItem>)} />
                                <FormField control={control} name="goals.metaMinhaPrize" render={({ field }) => (<FormItem><FormLabel>Prêmio (R$)</FormLabel><FormControl><Input type="text" inputMode="decimal" {...field} value={`${field.value ?? ''}`.replace('.', ',')} onChange={e => handleNumericChange(field.onChange, e)} onBlur={() => handleNumericBlur(field)}/></FormControl></FormItem>)} />
                            </div>
                        </div>
                        <div className="p-4 border rounded-lg bg-card space-y-2">
                            <h4 className="font-medium text-md text-card-foreground">Meta 2</h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <FormField control={control} name="goals.meta" render={({ field }) => (<FormItem><FormLabel>Valor da Meta (R$)</FormLabel><FormControl><Input type="text" inputMode="decimal" {...field} value={`${field.value ?? ''}`.replace('.', ',')} onChange={e => handleNumericChange(field.onChange, e)} onBlur={() => handleNumericBlur(field)}/></FormControl></FormItem>)} />
                                <FormField control={control} name="goals.metaPrize" render={({ field }) => (<FormItem><FormLabel>Prêmio (R$)</FormLabel><FormControl><Input type="text" inputMode="decimal" {...field} value={`${field.value ?? ''}`.replace('.', ',')} onChange={e => handleNumericChange(field.onChange, e)} onBlur={() => handleNumericBlur(field)}/></FormControl></FormItem>)} />
                            </div>
                        </div>
                        <div className="p-4 border rounded-lg bg-card space-y-2">
                            <h4 className="font-medium text-md text-card-foreground">Meta 3</h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <FormField control={control} name="goals.metona" render={({ field }) => (<FormItem><FormLabel>Valor da Meta (R$)</FormLabel><FormControl><Input type="text" inputMode="decimal" {...field} value={`${field.value ?? ''}`.replace('.', ',')} onChange={e => handleNumericChange(field.onChange, e)} onBlur={() => handleNumericBlur(field)}/></FormControl></FormItem>)} />
                                <FormField control={control} name="goals.metonaPrize" render={({ field }) => (<FormItem><FormLabel>Prêmio (R$)</FormLabel><FormControl><Input type="text" inputMode="decimal" {...field} value={`${field.value ?? ''}`.replace('.', ',')} onChange={e => handleNumericChange(field.onChange, e)} onBlur={() => handleNumericBlur(field)}/></FormControl></FormItem>)} />
                            </div>
                        </div>
                    </div>
                     <div className="mt-6 pt-6 border-t">
                        <div className="flex items-center justify-between p-4 border rounded-lg bg-muted/50">
                             <div className="pr-4">
                                <h4 className="font-medium text-md text-card-foreground">Bônus Performance</h4>
                                <p className="text-sm text-muted-foreground">Ative para habilitar um bônus por vendas acima da Meta 3.</p>
                             </div>
                             <FormField
                                control={control}
                                name="goals.performanceBonusEnabled"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormControl>
                                            <Switch
                                                checked={field.value}
                                                onCheckedChange={field.onChange}
                                            />
                                        </FormControl>
                                    </FormItem>
                                )}
                            />
                        </div>

                        {performanceBonusEnabled && (
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                               <FormField control={control} name="goals.metaLendaria" render={({ field }) => (<FormItem><FormLabel>Atingir (R$)</FormLabel><FormControl><Input type="text" inputMode="decimal" {...field} value={`${field.value ?? ''}`.replace('.', ',')} onChange={e => handleNumericChange(field.onChange, e)} onBlur={() => handleNumericBlur(field)}/></FormControl></FormItem>)} />
                               <FormField control={control} name="goals.legendariaBonusValorVenda" render={({ field }) => (<FormItem><FormLabel>A cada (R$)</FormLabel><FormControl><Input type="text" inputMode="decimal" {...field} value={`${field.value ?? ''}`.replace('.', ',')} onChange={e => handleNumericChange(field.onChange, e)} onBlur={() => handleNumericBlur(field)}/></FormControl></FormItem>)} />
                               <FormField control={control} name="goals.legendariaBonusValorPremio" render={({ field }) => (<FormItem><FormLabel>Ganha-se (R$)</FormLabel><FormControl><Input type="text" inputMode="decimal" {...field} value={`${field.value ?? ''}`.replace('.', ',')} onChange={e => handleNumericChange(field.onChange, e)} onBlur={() => handleNumericBlur(field)}/></FormControl></FormItem>)} />
                               <p className="text-xs text-muted-foreground mt-2 md:col-span-3">
                                 Você ganha <strong>R$ {Number(legendariaValues[2] || 0).toFixed(2).replace('.',',')}</strong> a cada <strong>R$ {Number(legendariaValues[1] || 0).toFixed(2).replace('.',',')}</strong> vendidos acima de <strong>R$ {Number(legendariaValues[0] || 0).toFixed(2).replace('.',',')}</strong>.
                               </p>
                            </div>
                        )}
                    </div>
                </div>
                
                 <Separator/>
                 <div>
                    <h3 className="font-semibold text-lg mb-4 text-card-foreground">Metas de Produtos por Atendimento (PA)</h3>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-x-6 gap-y-4">
                        {goalTiers.map(tier => (
                            <div key={tier.id} className="space-y-2">
                                <FormField control={control} name={`goals.${tier.goal}`} render={({ field }) => (<FormItem><FormLabel>{tier.id} (PA)</FormLabel><FormControl><Input type="text" inputMode="decimal" step="0.01" {...field} value={`${field.value ?? ''}`.replace('.', ',')} onChange={e => handleNumericChange(field.onChange, e)} onBlur={() => handleNumericBlur(field)}/></FormControl></FormItem>)} />
                                <FormField control={control} name={`goals.${tier.prize}`} render={({ field }) => (<FormItem><FormLabel>Prêmio (R$)</FormLabel><FormControl><Input type="text" inputMode="decimal" {...field} value={`${field.value ?? ''}`.replace('.', ',')} onChange={e => handleNumericChange(field.onChange, e)} onBlur={() => handleNumericBlur(field)}/></FormControl></FormItem>)} />
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
                 <Button onClick={onSaveGoals} disabled={isSavingGoals}>
                    {isSavingGoals ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Save className="mr-2 h-4 w-4" />}
                    {isSavingGoals ? "Salvando..." : "Salvar Metas"}
                 </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        <TabsContent value="seguranca" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Alterar Senha da Loja</CardTitle>
              <CardDescription>
                Defina uma nova senha para o acesso de gerente a esta loja. O administrador global ainda poderá acessar e redefinir esta senha.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 max-w-sm">
              <div className="space-y-2">
                <Label htmlFor="new-store-password">Nova Senha</Label>
                <div className="relative">
                  <Input
                    id="new-store-password"
                    type={showStorePassword ? "text" : "password"}
                    placeholder="Mínimo 4 caracteres"
                    value={storePasswords.new}
                    onChange={(e) => setStorePasswords(p => ({...p, new: e.target.value}))}
                    className="pr-10"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute inset-y-0 right-0 h-full px-3"
                    onClick={() => setShowStorePassword(!showStorePassword)}
                  >
                    {showStorePassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirm-store-password">Confirmar Nova Senha</Label>
                 <div className="relative">
                  <Input
                    id="confirm-store-password"
                    type={showConfirmStorePassword ? "text" : "password"}
                    placeholder="Repita a nova senha"
                    value={storePasswords.confirm}
                    onChange={(e) => setStorePasswords(p => ({...p, confirm: e.target.value}))}
                    className="pr-10"
                  />
                   <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute inset-y-0 right-0 h-full px-3"
                    onClick={() => setShowConfirmStorePassword(!showConfirmStorePassword)}
                  >
                    {showConfirmStorePassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button onClick={handleStorePasswordChange}>
                <Save className="mr-2 h-4 w-4" />
                Salvar Nova Senha
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

    
    
    
