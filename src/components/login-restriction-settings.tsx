
"use client";

import { useState, useEffect } from "react";
import { Button } from "./ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Switch } from "./ui/switch";
import { Trash2, Plus, Save, MapPin, Wifi, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Separator } from "./ui/separator";

interface Area {
    id?: number;
    nome: string;
    latitude: number;
    longitude: number;
    raio: number;
    ativo: boolean;
}

interface Wifi {
    id?: number;
    nome: string;
    ssid: string;
    ativo: boolean;
}

interface RestrictionSettings {
    modo: "E" | "OU";
    areas: Area[];
    wifis: Wifi[];
}

export default function LoginRestrictionSettings({ storeId }: { storeId: string }) {
    const { toast } = useToast();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [settings, setSettings] = useState<RestrictionSettings>({
        modo: "OU",
        areas: [],
        wifis: [],
    });

    useEffect(() => {
        const fetchSettings = async () => {
            setLoading(true);
            try {
                const res = await fetch(`/api/loja/restricoes?storeId=${storeId}`);
                if (!res.ok) throw new Error("Falha ao carregar configurações de restrição.");
                const data = await res.json();
                setSettings({
                    modo: data.modo || "OU",
                    areas: data.areas || [],
                    wifis: data.wifis || [],
                });
            } catch (error) {
                toast({ variant: "destructive", title: "Erro", description: (error as Error).message });
            } finally {
                setLoading(false);
            }
        };
        fetchSettings();
    }, [storeId, toast]);

    const handleSave = async () => {
        setSaving(true);
        try {
            const res = await fetch(`/api/loja/restricoes`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ storeId, ...settings }),
            });
            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(errorData.error || "Falha ao salvar configurações.");
            }
            toast({ title: "Sucesso", description: "Configurações de restrição de login salvas." });
        } catch (error) {
            toast({ variant: "destructive", title: "Erro", description: (error as Error).message });
        } finally {
            setSaving(false);
        }
    };
    
    // --- Handlers para Áreas ---
    const addArea = () => {
        setSettings(prev => ({
            ...prev,
            areas: [...prev.areas, { nome: "", latitude: 0, longitude: 0, raio: 100, ativo: true }]
        }));
    };
    const updateArea = (index: number, field: keyof Area, value: any) => {
        setSettings(prev => {
            const newAreas = [...prev.areas];
            (newAreas[index] as any)[field] = value;
            return { ...prev, areas: newAreas };
        });
    };
    const removeArea = (index: number) => {
        setSettings(prev => ({ ...prev, areas: prev.areas.filter((_, i) => i !== index) }));
    };

    // --- Handlers para Wi-Fi ---
    const addWifi = () => {
        setSettings(prev => ({
            ...prev,
            wifis: [...prev.wifis, { nome: "", ssid: "", ativo: true }]
        }));
    };
    const updateWifi = (index: number, field: keyof Wifi, value: any) => {
        setSettings(prev => {
            const newWifis = [...prev.wifis];
            (newWifis[index] as any)[field] = value;
            return { ...prev, wifis: newWifis };
        });
    };
    const removeWifi = (index: number) => {
        setSettings(prev => ({ ...prev, wifis: prev.wifis.filter((_, i) => i !== index) }));
    };

    if (loading) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>Restrições de Login do Vendedor</CardTitle>
                    <CardDescription>Carregando configurações...</CardDescription>
                </CardHeader>
                <CardContent className="flex justify-center items-center p-8">
                    <Loader2 className="h-8 w-8 animate-spin" />
                </CardContent>
            </Card>
        )
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Restrições de Login do Vendedor</CardTitle>
                <CardDescription>
                    Defina locais e redes Wi-Fi permitidas para que os vendedores possam acessar o painel.
                    Esta funcionalidade requer que o vendedor autorize o uso da localização no navegador.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <div>
                    <Label>Modo de Verificação</Label>
                     <Select value={settings.modo} onValueChange={(value: "E" | "OU") => setSettings(prev => ({...prev, modo: value}))}>
                        <SelectTrigger className="w-[280px]">
                            <SelectValue placeholder="Selecione o modo" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="OU">Uma das opções (Localização OU Wi-Fi)</SelectItem>
                            <SelectItem value="E">Ambas as opções (Localização E Wi-Fi)</SelectItem>
                        </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground mt-1">
                        "OU" permite o login se o vendedor estiver na área ou no Wi-Fi. "E" exige ambos.
                    </p>
                </div>
                <Separator />
                
                {/* Gerenciamento de Áreas */}
                <div className="space-y-4">
                     <div className="flex items-center justify-between">
                        <h3 className="text-lg font-medium flex items-center gap-2"><MapPin className="h-5 w-5" /> Áreas Geográficas Permitidas</h3>
                        <Button variant="outline" size="sm" onClick={addArea}><Plus className="mr-2 h-4 w-4"/> Adicionar Área</Button>
                    </div>
                    <div className="space-y-2">
                        {settings.areas.map((area, index) => (
                            <div key={area.id || `new-area-${index}`} className="p-3 border rounded-lg grid grid-cols-1 md:grid-cols-12 gap-2 items-end">
                                <div className="md:col-span-3"><Label>Nome</Label><Input value={area.nome} onChange={e => updateArea(index, 'nome', e.target.value)} placeholder="Ex: Loja Centro"/></div>
                                <div className="md:col-span-3"><Label>Latitude</Label><Input type="number" value={area.latitude} onChange={e => updateArea(index, 'latitude', parseFloat(e.target.value))}/></div>
                                <div className="md:col-span-3"><Label>Longitude</Label><Input type="number" value={area.longitude} onChange={e => updateArea(index, 'longitude', parseFloat(e.target.value))}/></div>
                                <div className="md:col-span-1"><Label>Raio (m)</Label><Input type="number" value={area.raio} onChange={e => updateArea(index, 'raio', parseInt(e.target.value))}/></div>
                                <div className="flex items-center gap-2 md:col-span-2">
                                     <div className="flex flex-col items-center"><Label>Ativo</Label><Switch checked={area.ativo} onCheckedChange={checked => updateArea(index, 'ativo', checked)}/></div>
                                     <Button variant="ghost" size="icon" onClick={() => removeArea(index)}><Trash2 className="h-4 w-4 text-destructive"/></Button>
                                </div>
                            </div>
                        ))}
                         {settings.areas.length === 0 && <p className="text-xs text-muted-foreground text-center py-4">Nenhuma área geográfica definida.</p>}
                    </div>
                </div>
                
                <Separator />

                {/* Gerenciamento de Wi-Fi */}
                 <div className="space-y-4">
                     <div className="flex items-center justify-between">
                        <h3 className="text-lg font-medium flex items-center gap-2"><Wifi className="h-5 w-5" /> Redes Wi-Fi Permitidas</h3>
                        <Button variant="outline" size="sm" onClick={addWifi}><Plus className="mr-2 h-4 w-4"/> Adicionar Wi-Fi</Button>
                    </div>
                    <div className="space-y-2">
                         {settings.wifis.map((wifi, index) => (
                            <div key={wifi.id || `new-wifi-${index}`} className="p-3 border rounded-lg grid grid-cols-1 md:grid-cols-12 gap-2 items-end">
                                <div className="md:col-span-5"><Label>Nome Amigável</Label><Input value={wifi.nome} onChange={e => updateWifi(index, 'nome', e.target.value)} placeholder="Ex: Wi-Fi da Loja"/></div>
                                <div className="md:col-span-5"><Label>SSID (Nome da Rede)</Label><Input value={wifi.ssid} onChange={e => updateWifi(index, 'ssid', e.target.value)} placeholder="O nome exato que aparece no celular"/></div>
                                 <div className="flex items-center gap-2 md:col-span-2">
                                     <div className="flex flex-col items-center"><Label>Ativo</Label><Switch checked={wifi.ativo} onCheckedChange={checked => updateWifi(index, 'ativo', checked)}/></div>
                                     <Button variant="ghost" size="icon" onClick={() => removeWifi(index)}><Trash2 className="h-4 w-4 text-destructive"/></Button>
                                </div>
                            </div>
                         ))}
                         {settings.wifis.length === 0 && <p className="text-xs text-muted-foreground text-center py-4">Nenhuma rede Wi-Fi definida.</p>}
                    </div>
                </div>

            </CardContent>
            <CardFooter>
                <Button onClick={handleSave} disabled={saving}>
                    {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Save className="mr-2 h-4 w-4" />}
                    Salvar Restrições
                </Button>
            </CardFooter>
        </Card>
    );
}
