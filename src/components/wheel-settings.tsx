
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Trash2, GripVertical, Info } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { ColorPicker } from '@/components/color-picker';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from './ui/card';
import { Tooltip, TooltipProvider, TooltipTrigger, TooltipContent } from './ui/tooltip';

interface Segment {
  id: string;
  label: string;
  type: string;
  value?: number | null;
  description?: string | null;
  color?: string;
  weight: number;
  position: number;
  isActive: boolean;
}

interface WheelSettingsProps {
  storeId: string;
}

export function WheelSettings({ storeId }: WheelSettingsProps) {
  const [segments, setSegments] = useState<Segment[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [configured, setConfigured] = useState<boolean | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    const fetchSettings = async () => {
      setLoading(true);
      setConfigured(null);
      try {
        const res = await fetch(`/api/wheel/settings?storeId=${storeId}`);
        if (!res.ok) {
            const errorData = await res.json();
            throw new Error(errorData.details || "Falha ao carregar configurações.");
        };
        const data = await res.json();

        if (data.configured === false || !data.segments) {
          setConfigured(false);
          setSegments([]); 
        } else {
          setSegments(data.segments);
          setConfigured(true);
        }
      } catch (error) {
        setConfigured(false);
        toast({ variant: 'destructive', title: 'Erro', description: (error as Error).message });
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, [storeId, toast]);

  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return;
    const items = Array.from(segments);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);
    setSegments(items.map((item, index) => ({ ...item, position: index })));
  };

  const updateSegment = (index: number, field: keyof Segment, value: any) => {
    const newSegments = [...segments];
    const segment = { ...newSegments[index], [field]: value };

    if (field === 'type' && value !== 'money') {
      segment.value = null;
    }
    if (field === 'value') {
      segment.value = value === '' ? null : Number(value);
    }

    newSegments[index] = segment;
    setSegments(newSegments);
  };

  const addSegment = () => setSegments([...segments, { id: `new-${Date.now()}`, label: '', type: 'money', weight: 10, position: segments.length, color: '#3B82F6', isActive: true }]);
  const removeSegment = (index: number) => setSegments(segments.filter((_, i) => i !== index));

  const saveSettings = async () => {
    setSaving(true);
    try {
      if (segments.length < 2 || segments.length > 12) throw new Error('A roleta deve ter entre 2 e 12 segmentos.');
      if (segments.some(s => !s.label.trim())) throw new Error('Todos os segmentos precisam ter um rótulo.');

      const res = await fetch('/api/wheel/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ storeId, segments }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.details || error.error || 'Falha ao salvar');
      }
      const updatedSettings = await res.json();
      setSegments(updatedSettings.segments);
      setConfigured(true); 
      toast({ title: 'Sucesso', description: 'Configurações da roleta salvas com sucesso!' });
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Erro ao salvar', description: error.message });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="text-center p-8">Carregando roleta…</div>;
  }
  
  if (configured === false) {
    return (
      <Card><CardHeader><CardTitle>Roleta Não Configurada</CardTitle><CardDescription>A roleta ainda não foi configurada para esta loja.</CardDescription></CardHeader><CardContent className="text-center"><Button onClick={() => { setConfigured(true); addSegment(); addSegment(); }}>Criar Nova Roleta</Button></CardContent></Card>
    );
  }

  if (segments.length === 0) {
    return (
        <Card><CardHeader><CardTitle>Nenhum Prêmio Definido</CardTitle><CardDescription>A roleta está configurada, mas não tem nenhum prêmio. Adicione pelo menos dois para começar.</CardDescription></CardHeader><CardContent className="text-center"><Button onClick={addSegment}>Adicionar Primeiro Prêmio</Button></CardContent></Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Configurar Prêmios da Roleta</CardTitle>
        <CardDescription>Arraste e solte para reordenar. Defina o rótulo, tipo, valor (se aplicável), peso (probabilidade) e cor de cada segmento.</CardDescription>
      </CardHeader>
      <CardContent>
          <DragDropContext onDragEnd={handleDragEnd}>
            <Droppable droppableId="segments">
              {(provided) => (
                <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-4">
                  {segments.map((segment, index) => (
                    <Draggable key={segment.id} draggableId={String(segment.id)} index={index}>
                      {(provided) => (
                        <div ref={provided.innerRef} {...provided.draggableProps} className="flex flex-col md:flex-row items-start md:items-center gap-3 p-4 bg-muted/50 rounded-lg border">
                          <div {...provided.dragHandleProps} className="cursor-grab p-2 hidden md:block">
                            <GripVertical className="h-5 w-5 text-gray-400" />
                          </div>
                          <div className="flex-grow grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 w-full">
                            <Input placeholder="Rótulo do prêmio" value={segment.label} onChange={e => updateSegment(index, 'label', e.target.value)} />
                            <Select value={segment.type} onValueChange={value => updateSegment(index, 'type', value)}>
                              <SelectTrigger><SelectValue /></SelectTrigger>
                              <SelectContent>
                                <SelectItem value="money">Dinheiro</SelectItem>
                                <SelectItem value="voucher">Voucher</SelectItem>
                                <SelectItem value="product">Produto</SelectItem>
                                <SelectItem value="retry">Tente Novamente</SelectItem>
                              </SelectContent>
                            </Select>
                            <Input type="number" placeholder="Valor (R$)" value={segment.value ?? ''} onChange={e => updateSegment(index, 'value', e.target.value)} disabled={segment.type !== 'money'} />
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild><Input type="number" placeholder="Peso" value={segment.weight} onChange={e => updateSegment(index, 'weight', Number(e.target.value))} /></TooltipTrigger>
                                <TooltipContent><p>Maior o peso, maior a chance de cair neste prêmio.</p></TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                            <ColorPicker color={segment.color || '#3B82F6'} onChange={color => updateSegment(index, 'color', color)} />
                          </div>
                          <Button variant="ghost" size="icon" onClick={() => removeSegment(index)} className="mt-2 md:mt-0"><Trash2 className="h-4 w-4 text-red-500" /></Button>
                        </div>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </DragDropContext>
      </CardContent>
      <CardFooter className="flex justify-between items-center">
        <Button variant="outline" onClick={addSegment} disabled={segments.length >= 12}>
          Adicionar Prêmio
        </Button>
        <Button onClick={saveSettings} disabled={saving || segments.length < 2}>
          {saving ? 'Salvando...' : 'Salvar Configuração'}
        </Button>
      </CardFooter>
    </Card>
  );
}
