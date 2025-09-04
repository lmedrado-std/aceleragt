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
  Loader2
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

interface AdminTabProps {
    form: UseFormReturn<FormValues>;
    storeId: string;
    onIncentivesCalculated: (incentives: Incentives) => void;
    incentives: Incentives;
    addSeller: (name: string, pass: string) => void;
}

export function AdminTab({ form, storeId, onIncentivesCalculated, incentives, addSeller }: AdminTabProps) {
    const { toast } = useToast();
    const router = useRouter();
    const [editingSellerId, setEditingSellerId] = useState<string | null>(null);
    const [showPassword, setShowPassword] = useState<Record<string, boolean>>({});
    const [isPending, startTransition] = useTransition();

    const { control, getValues, setValue, setError, clearErrors, formState: { errors } } = form;
    
    // ✅ Tipagem correta com fallback para array vazio
    const sellers: Seller[] = useWatch<Seller[]>({ control, name: 'sellers' }) ?? [];
    const goals: Goals = useWatch<Goals>({ control, name: 'goals' });

    const handleAddSeller = () => {
        const newSellerName = getValues("newSellerName");
        const newSellerPassword = getValues("newSellerPassword");

        if (!newSellerName || newSellerName.trim() === "") {
            setError("newSellerName", { type: "manual", message: "Nome é obrigatório." });
            return;
        }
        
        clearErrors(["newSellerName", "newSellerPassword"]);
        const finalPassword = newSellerPassword && newSellerPassword.trim().length > 0 
            ? newSellerPassword.trim() 
            : newSellerName.trim().toLowerCase();
        
        if (finalPassword.length < 4) {
             setError("newSellerPassword", { type: "manual", message: "A senha deve ter no mínimo 4 caracteres." });
            return;
        }
        
        addSeller(newSellerName!, finalPassword);
        setValue("newSellerName", "");
        setValue("newSellerPassword", "");
    };

    const removeSeller = (sellerId: string) => {
        const updatedSellers = sellers.filter(s => s.id !== sellerId);
        setValue("sellers", updatedSellers, { shouldDirty: true });
        const newTab = updatedSellers.length > 0 ? updatedSellers[0].id : "admin";
        router.push(`/dashboard/${storeId}?tab=${newTab}`);
    }

    const startEditing = (sellerId: string) => setEditingSellerId(sellerId);
    const cancelEditing = () => setEditingSellerId(null);

    const saveSellerName = (sellerId: string) => {
        const sellerIndex = sellers.findIndex(s => s.id === sellerId);
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

    // ... resto do componente continua igual
}
