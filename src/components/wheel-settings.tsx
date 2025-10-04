
'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Trash2, Save, Settings } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Segment {
  id?: string;
  label: string;
  type: 'money' | 'product' | 'voucher';
  value?: number;
  description?: string;
  weight: number;
  color: string;
  isActive: boolean;
}

interface WheelSettingsProps {
  storeId: string;
}

const colors = [
  '#10B981', '#3B82F6', '#8B5CF6', '#F59E0B', 
  '#EF4444', '#EC4899', '#F97316', '#6366F1'
];

export function WheelSettings({ storeId }: WheelSettingsProps) {
  const [segments, setSegments] = useState<Segment[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadSettings();
  }, [storeId]);

  const loadSettings = async () => {
    try {
      const res = await fetch(`/api/wheel/settings?storeId=${storeId}`);
      const data = await res.json();
      setSegments(data.segments || []);
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Erro',
        description: 'Falha ao carregar configurações da roleta'
      });
    } finally {
      setLoading(false);
    }
  };

  const addSegment = () => {
    setSegments(prev => [...prev, {
      label: '',
      type: 'money',
      value: 5,
      weight: 10,
      color: colors[prev.length % colors.length],
      isActive: true
    }]);
  };

  const updateSegment = (index: number, field: keyof Segment, value: any) => {
    setSegments(prev => prev.map((seg, i) => 
      i === index ? { ...seg, [field]: value } : seg
    ));
  };

  const removeSegment = (index: number) => {
    if (segments.length <= 2) {
      toast({
        variant: 'destructive',
        title: 'Erro',
        description: 'É necessário ter pelo menos 2 segmentos na roleta'
      });
      return;
    }
    setSegments(prev => prev.filter((_, i) => i !== index));
  };

  const saveSettings = async () => {
    setSaving(true);
    try {
      // Validações
      if (segments.length < 2) {
        throw new Error('É necessário ter pelo menos 2 segmentos');
      }
      
      if (segments.some(s => !s.label.trim())) {
        throw new Error('Todos os segmentos precisam ter um rótulo');
      }

      const res = await fetch('/api/wheel/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ storeId, segments })
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Falha ao salvar');
      }

      toast({
        title: 'Sucesso!',
        description: 'Configurações da roleta salvas com sucesso'
      });
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Erro',
        description: error.message || 'Falha ao salvar configurações'
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="flex justify-center p-8">Carregando configurações...</div>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="h-5 w-5" />
          Configurar Prêmios da Roleta
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {segments.map((segment, index) => (
          <div key={index} className="grid grid-cols-12 gap-3 items-end p-4 border rounded-lg">
            <div className="col-span-3">
              <Label>Rótulo do Prêmio</Label>
              <Input
                value={segment.label}
                onChange={(e) => updateSegment(index, 'label', e.target.value)}
                placeholder="Ex: R$ 10,00"
              />
            </div>
            
            <div className="col-span-2">
              <Label>Tipo</Label>
              <Select
                value={segment.type}
                onValueChange={(value) => updateSegment(index, 'type', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="money">💰 Dinheiro</SelectItem>
                  <SelectItem value="product">🎁 Produto</SelectItem>
                  <SelectItem value="voucher">🎫 Vale</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {segment.type === 'money' && (
              <div className="col-span-2">
                <Label>Valor (R$)</Label>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={segment.value || ''}
                  onChange={(e) => updateSegment(index, 'value', parseFloat(e.target.value))}
                />
              </div>
            )}

            {(segment.type === 'product' || segment.type === 'voucher') && (
              <div className="col-span-2">
                <Label>Descrição</Label>
                <Input
                  value={segment.description || ''}
                  onChange={(e) => updateSegment(index, 'description', e.target.value)}
                  placeholder="Descreva o prêmio"
                />
              </div>
            )}

            <div className="col-span-1">
              <Label>Peso</Label>
              <Input
                type="number"
                value={segment.weight}
                onChange={(e) => updateSegment(index, 'weight', parseInt(e.target.value) || 0)}
                min="0"
                max="100"
              />
            </div>

            <div className="col-span-1">
              <Label>Cor</Label>
              <input
                type="color"
                value={segment.color}
                onChange={(e) => updateSegment(index, 'color', e.target.value)}
                className="w-full h-10 rounded border cursor-pointer"
              />
            </div>

            <div className="col-span-1">
              <Button
                variant="destructive"
                size="icon"
                onClick={() => removeSegment(index)}
                disabled={segments.length <= 2}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ))}

        <div className="flex gap-3">
          <Button onClick={addSegment} variant="outline">
            <Plus className="h-4 w-4 mr-2" />
            Adicionar Segmento
          </Button>
          
          <Button onClick={saveSettings} disabled={saving}>
            <Save className="h-4 w-4 mr-2" />
            {saving ? 'Salvando...' : 'Salvar Configurações'}
          </Button>
        </div>

        <div className="text-sm text-muted-foreground border-t pt-4">
          <strong>Dica:</strong> O peso determina a probabilidade do prêmio ser sorteado. 
          Quanto maior o peso, maior a chance.
        </div>
      </CardContent>
    </Card>
  );
}
