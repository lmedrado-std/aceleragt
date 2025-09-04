"use client";

import { useForm, UseFormReturn, useWatch } from "react-hook-form";
import {
  UserPlus,
  Trash2,
  Edit,
  Save,
  X,
  Eye,
  EyeOff,
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
} from "@/components/ui/card";
import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
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

interface AdminTabProps {
  form: UseFormReturn<FormValues>;
  storeId: string;
  onIncentivesCalculated: (incentives: Incentives) => void;
  incentives: Incentives;
  addSeller: (name: string, pass: string) => void;
}

export function AdminTab({
  form,
  storeId,
  onIncentivesCalculated,
  incentives,
  addSeller,
}: AdminTabProps) {
  const { toast } = useToast();
  const router = useRouter();
  const [editingSellerId, setEditingSellerId] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState<Record<string, boolean>>({});

  const {
    control,
    getValues,
    setValue,
    setError,
    clearErrors,
    formState: { errors },
  } = form;

  const sellers: Seller[] = useWatch<Seller[]>({ control, name: "sellers" }) ?? [];

  // ➕ Adicionar Vendedor
  const handleAddSeller = () => {
    const newSellerName = getValues("newSellerName");
    const newSellerPassword = getValues("newSellerPassword");

    if (!newSellerName || newSellerName.trim() === "") {
      setError("newSellerName", {
        type: "manual",
        message: "Nome é obrigatório.",
      });
      return;
    }
     if (sellers.some(s => s.name.toLowerCase() === newSellerName.toLowerCase())) {
        setError("newSellerName", { type: "manual", message: "Este nome de vendedor já existe."});
        return;
    }

    clearErrors(["newSellerName", "newSellerPassword"]);
    const finalPassword =
      newSellerPassword && newSellerPassword.trim().length > 0
        ? newSellerPassword.trim()
        : newSellerName.trim().toLowerCase();

    if (finalPassword.length < 4) {
      setError("newSellerPassword", {
        type: "manual",
        message: "A senha deve ter no mínimo 4 caracteres.",
      });
      return;
    }

    addSeller(newSellerName!, finalPassword);
    setValue("newSellerName", "");
    setValue("newSellerPassword", "");
  };

  // ❌ Remover vendedor
  const removeSeller = (sellerId: string) => {
    const updatedSellers = sellers.filter((s) => s.id !== sellerId);
    setValue("sellers", updatedSellers, { shouldDirty: true });
    const newTab = updatedSellers.length > 0 ? updatedSellers[0].id : "admin";
    router.push(`/dashboard/${storeId}?tab=${newTab}`);
  };

  // ✏️ Editar vendedor
  const startEditing = (sellerId: string) => setEditingSellerId(sellerId);
  const cancelEditing = () => setEditingSellerId(null);

  const saveSellerName = (sellerId: string) => {
    const sellerIndex = sellers.findIndex((s) => s.id === sellerId);
    if (sellerIndex === -1) return;

    const newName = getValues(`sellers.${sellerIndex}.name`);
    const newPassword = getValues(`sellers.${sellerIndex}.password`);

    if (newName.trim() === "") {
      toast({
        variant: "destructive",
        title: "Erro",
        description: "O nome do vendedor não pode estar vazio.",
      });
      return;
    }
    if (newPassword && newPassword.length < 4) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: "A senha deve ter pelo menos 4 caracteres.",
      });
      return;
    }

    setEditingSellerId(null);
    toast({ title: "Sucesso!", description: "Dados do vendedor atualizados." });
  };

  const togglePasswordVisibility = (sellerId: string) => {
    setShowPassword((prev) => ({ ...prev, [sellerId]: !prev[sellerId] }));
  };

  return (
    <div className="space-y-8">
      {/* ➕ Adicionar Novo Vendedor */}
      <Card>
        <CardHeader>
          <CardTitle>Adicionar Vendedor</CardTitle>
          <CardDescription>
            Crie um novo vendedor para esta loja. A senha padrão será o nome em minúsculo, caso não informe.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <FormField
              control={form.control}
              name="newSellerName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: João Silva" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="newSellerPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Senha (Opcional)</FormLabel>
                  <FormControl>
                    <Input type="password" placeholder="Min. 4 caracteres" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="button" onClick={handleAddSeller} disabled={!!errors.newSellerName}>
              <UserPlus className="mr-2 h-4 w-4" />
              Adicionar
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* 👥 Lista de Vendedores */}
      <Card>
        <CardHeader>
          <CardTitle>Vendedores Atuais</CardTitle>
          <CardDescription>Gerencie os vendedores desta loja.</CardDescription>
        </CardHeader>
        <CardContent>
          {sellers.length === 0 && (
            <p className="text-muted-foreground">Nenhum vendedor cadastrado ainda.</p>
          )}
          <div className="space-y-2 mt-2">
            {sellers.map((seller, index) => (
              <div
                key={seller.id}
                className="flex items-center justify-between gap-2 p-2 rounded-md bg-muted/50"
              >
                {editingSellerId === seller.id ? (
                  <>
                    <FormField
                        control={control}
                        name={`sellers.${index}.name`}
                        render={({ field }) => (
                            <Input {...field} className="h-8" autoFocus onKeyDown={(e) => e.key === 'Enter' && saveSellerName(seller.id)}/>
                        )}
                    />

                    <div className="flex items-center gap-1">
                       <FormField
                            control={control}
                            name={`sellers.${index}.password`}
                            render={({ field }) => (
                               <Input
                                    type={showPassword[seller.id] ? "text" : "password"}
                                    {...field}
                                    className="h-8"
                                    onKeyDown={(e) => e.key === 'Enter' && saveSellerName(seller.id)}
                                />
                            )}
                        />
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => togglePasswordVisibility(seller.id)}
                        type="button"
                      >
                        {showPassword[seller.id] ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => saveSellerName(seller.id)}
                        type="button"
                      >
                        <Save className="h-4 w-4 text-green-600" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={cancelEditing}
                        type="button"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="flex flex-col">
                      <span className="font-medium">{seller.name}</span>
                    </div>
                    <div className="flex items-center">
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => startEditing(seller.id)}
                        type="button"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="text-destructive hover:text-destructive"
                            type="button"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Remover "{seller.name}"?</AlertDialogTitle>
                            <AlertDialogDescription>
                              Essa ação não pode ser desfeita. Todos os dados deste vendedor serão perdidos.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => removeSeller(seller.id)}
                              className="bg-destructive hover:bg-destructive/90"
                            >
                              Remover
                            </AlertDialogAction>
                          </AlertDialogFooter>
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
    </div>
  );
}
