'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { DragDropContext, Draggable, Droppable, type DropResult } from '@hello-pangea/dnd';
import { AlertTriangle, Archive, ArchiveRestore, ChevronDown, GripVertical, Loader2, Plus, RotateCcw, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { useToast } from '@/components/ui/use-toast';
import { ColorPicker } from '@/components/color-picker';
import { cn } from '@/lib/utils';
import { MAX_ACTIVE_SEGMENTS, MIN_ACTIVE_SEGMENTS, probabilities } from '@/lib/wheel/engine';
import { WheelSvg, prizeIcon } from '@/components/wheel/wheel-svg';

interface EditableSegment {
  key: string; // chave estável para o React/arrastar (id real ou "new-...")
  id: string | null;
  label: string;
  type: string;
  value: string; // texto do campo; convertido ao salvar
  description: string;
  color: string;
  weight: string;
}

interface ApiSegment {
  id: string;
  label: string;
  type: string;
  value: number | null;
  description: string | null;
  color: string;
  weight: number;
}

const TYPE_LABELS: Record<string, string> = {
  money: 'Dinheiro',
  voucher: 'Voucher',
  product: 'Produto',
  retry: 'Tente novamente',
};
const PALETTE = ['#005A73', '#00B7A8', '#F2446A', '#FDE047', '#7C3AED', '#0EA5E9', '#F97316', '#16A34A', '#E2E8F0', '#1E3A8A', '#DB2777', '#65A30D'];

let newCounter = 0;
const toEditable = (s: ApiSegment): EditableSegment => ({
  key: s.id,
  id: s.id,
  label: s.label,
  type: s.type,
  value: s.value === null || s.value === undefined ? '' : String(s.value),
  description: s.description ?? '',
  color: s.color,
  weight: String(s.weight),
});
const blankSegment = (index: number): EditableSegment => ({
  key: `new-${Date.now()}-${newCounter++}`,
  id: null,
  label: '',
  type: 'money',
  value: '',
  description: '',
  color: PALETTE[index % PALETTE.length],
  weight: '10',
});

const parseNumber = (v: string) => {
  const n = Number(String(v).replace(',', '.'));
  return v.trim() === '' || !Number.isFinite(n) ? NaN : n;
};

function segmentErrors(s: EditableSegment): Partial<Record<'label' | 'value' | 'weight' | 'type', string>> {
  const e: Partial<Record<'label' | 'value' | 'weight' | 'type', string>> = {};
  if (!s.label.trim()) e.label = 'Informe o nome do prêmio.';
  else if (s.label.trim().length > 100) e.label = 'Máximo de 100 caracteres.';
  if (!TYPE_LABELS[s.type]) e.type = 'Tipo desconhecido — escolha um tipo.';
  const w = parseNumber(s.weight);
  if (!Number.isInteger(w) || w < 1) e.weight = 'Peso precisa ser inteiro maior que zero.';
  else if (w > 1000) e.weight = 'Peso máximo é 1000.';
  if (s.type === 'money') {
    const v = parseNumber(s.value);
    if (!Number.isFinite(v) || v < 0) e.value = 'Informe o valor em R$.';
  }
  return e;
}

const snapshotKey = (list: EditableSegment[]) =>
  JSON.stringify(list.map(({ key: _k, ...rest }) => rest));

export function WheelSettings({ storeId }: { storeId: string }) {
  const [segments, setSegments] = useState<EditableSegment[]>([]);
  const [archived, setArchived] = useState<ApiSegment[]>([]);
  const [savedKey, setSavedKey] = useState('[]');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [loadError, setLoadError] = useState('');
  const [showErrors, setShowErrors] = useState(false);
  const [archivedOpen, setArchivedOpen] = useState(false);
  const { toast } = useToast();

  const applyServerState = useCallback((data: { segments?: ApiSegment[]; archived?: ApiSegment[] }) => {
    const list = (data.segments ?? []).map(toEditable);
    setSegments(list);
    setArchived(data.archived ?? []);
    setSavedKey(snapshotKey(list));
    setShowErrors(false);
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError('');
    try {
      const res = await fetch(`/api/wheel/settings?storeId=${encodeURIComponent(storeId)}&include=archived`, { cache: 'no-store' });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Falha ao carregar configurações.');
      applyServerState(data);
    } catch (e) {
      setLoadError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, [storeId, applyServerState]);

  useEffect(() => {
    void load();
  }, [load]);

  const dirty = snapshotKey(segments) !== savedKey;

  useEffect(() => {
    if (!dirty) return;
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = '';
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [dirty]);

  const errors = useMemo(() => segments.map(segmentErrors), [segments]);
  const listError =
    segments.length < MIN_ACTIVE_SEGMENTS
      ? `A roleta precisa de pelo menos ${MIN_ACTIVE_SEGMENTS} prêmios ativos.`
      : segments.length > MAX_ACTIVE_SEGMENTS
        ? `A roleta aceita no máximo ${MAX_ACTIVE_SEGMENTS} prêmios ativos.`
        : '';
  const hasErrors = !!listError || errors.some((e) => Object.keys(e).length > 0);

  const weights = segments.map((s) => {
    const w = parseNumber(s.weight);
    return Number.isInteger(w) && w > 0 ? w : 0;
  });
  const chances = probabilities(weights);
  const previewSlices = segments
    .map((s, i) => ({ id: s.key, label: s.label || '—', type: s.type, color: s.color, w: weights[i] }))
    .filter((s) => s.w > 0);

  const update = (index: number, patch: Partial<EditableSegment>) => {
    setSegments((prev) => prev.map((s, i) => (i === index ? { ...s, ...patch, ...(patch.type && patch.type !== 'money' ? { value: '' } : {}) } : s)));
  };

  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return;
    setSegments((prev) => {
      const items = Array.from(prev);
      const [moved] = items.splice(result.source.index, 1);
      items.splice(result.destination!.index, 0, moved);
      return items;
    });
  };

  const addSegment = () => setSegments((prev) => [...prev, blankSegment(prev.length)]);
  const archiveSegment = (index: number) => setSegments((prev) => prev.filter((_, i) => i !== index));
  const restoreSegment = (seg: ApiSegment) => {
    setArchived((prev) => prev.filter((a) => a.id !== seg.id));
    setSegments((prev) => [...prev, toEditable({ ...seg, weight: seg.weight > 0 ? seg.weight : 10 })]);
  };

  const save = async () => {
    setShowErrors(true);
    if (hasErrors) {
      toast({ variant: 'destructive', title: 'Revise a configuração', description: listError || 'Há campos com erro destacados em vermelho.' });
      return;
    }
    setSaving(true);
    try {
      const payload = {
        storeId,
        segments: segments.map((s) => ({
          id: s.id,
          label: s.label.trim(),
          type: s.type,
          value: s.type === 'money' ? parseNumber(s.value) : null,
          description: s.description.trim() || null,
          color: s.color,
          weight: parseNumber(s.weight),
        })),
      };
      const res = await fetch('/api/wheel/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Falha ao salvar.');
      applyServerState(data);
      toast({ title: 'Roleta salva', description: 'Os vendedores já veem a nova configuração no próximo giro.' });
    } catch (e) {
      toast({ variant: 'destructive', title: 'Erro ao salvar', description: (e as Error).message });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-10 text-muted-foreground">
        <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Carregando roleta…
      </div>
    );
  }

  if (loadError) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Não foi possível carregar a roleta</CardTitle>
          <CardDescription>{loadError}</CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={() => void load()}>Tentar novamente</Button>
        </CardContent>
      </Card>
    );
  }

  if (segments.length === 0 && savedKey === '[]' && !dirty) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Roleta não configurada</CardTitle>
          <CardDescription>Cadastre pelo menos dois prêmios para liberar a roleta aos vendedores.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 text-center">
          <Button onClick={() => setSegments([blankSegment(0), blankSegment(1)])}>
            <Plus className="mr-2 h-4 w-4" /> Criar roleta
          </Button>
          {archived.length > 0 && (
            <p className="text-sm text-muted-foreground">Há {archived.length} prêmio(s) arquivado(s) que podem ser restaurados depois.</p>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]" data-testid="wheel-settings">
      <Card>
        <CardHeader>
          <CardTitle>Prêmios da roleta</CardTitle>
          <CardDescription>
            Arraste para mudar a ordem na roda. O peso define a chance: quanto maior, mais vezes o prêmio sai. Remover um prêmio
            apenas o arquiva — o histórico de giros é preservado.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <DragDropContext onDragEnd={handleDragEnd}>
            <Droppable droppableId="wheel-segments">
              {(provided) => (
                <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-3">
                  {segments.map((s, index) => {
                    const err = showErrors ? errors[index] : {};
                    const weightNum = parseNumber(s.weight);
                    const legacyZero = s.id !== null && Number.isFinite(weightNum) && weightNum <= 0;
                    return (
                      <Draggable key={s.key} draggableId={s.key} index={index}>
                        {(drag) => (
                          <div
                            ref={drag.innerRef}
                            {...drag.draggableProps}
                            className={cn(
                              'rounded-xl border bg-muted/40 p-3 sm:p-4',
                              Object.keys(err).length > 0 && 'border-destructive/60 bg-destructive/5',
                            )}
                            data-testid="wheel-settings-row"
                          >
                            <div className="flex items-start gap-2">
                              <div {...drag.dragHandleProps} className="mt-7 cursor-grab text-muted-foreground" aria-label="Arrastar para reordenar">
                                <GripVertical className="h-5 w-5" />
                              </div>
                              <div className="grid flex-1 grid-cols-2 gap-3 md:grid-cols-12">
                                <div className="col-span-2 md:col-span-4 space-y-1">
                                  <Label className="text-xs" htmlFor={`${s.key}-label`}>Prêmio</Label>
                                  <Input
                                    id={`${s.key}-label`}
                                    value={s.label}
                                    maxLength={100}
                                    placeholder="Ex.: R$ 20, Folga de 1 hora"
                                    onChange={(e) => update(index, { label: e.target.value })}
                                    aria-invalid={!!err.label}
                                  />
                                  {err.label && <p className="text-xs text-destructive">{err.label}</p>}
                                </div>
                                <div className="col-span-1 md:col-span-3 space-y-1">
                                  <Label className="text-xs">Tipo</Label>
                                  <Select value={TYPE_LABELS[s.type] ? s.type : undefined} onValueChange={(v) => update(index, { type: v })}>
                                    <SelectTrigger aria-invalid={!!err.type}>
                                      <SelectValue placeholder="Escolha" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {Object.entries(TYPE_LABELS).map(([value, label]) => (
                                        <SelectItem key={value} value={value}>
                                          {prizeIcon(value)} {label}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                  {err.type && <p className="text-xs text-destructive">{err.type}</p>}
                                </div>
                                <div className="col-span-1 md:col-span-2 space-y-1">
                                  <Label className="text-xs" htmlFor={`${s.key}-value`}>Valor (R$)</Label>
                                  <Input
                                    id={`${s.key}-value`}
                                    inputMode="decimal"
                                    value={s.value}
                                    disabled={s.type !== 'money'}
                                    placeholder={s.type === 'money' ? '0,00' : '—'}
                                    onChange={(e) => update(index, { value: e.target.value })}
                                    aria-invalid={!!err.value}
                                  />
                                  {err.value && <p className="text-xs text-destructive">{err.value}</p>}
                                </div>
                                <div className="col-span-1 md:col-span-2 space-y-1">
                                  <Label className="text-xs" htmlFor={`${s.key}-weight`}>Peso</Label>
                                  <Input
                                    id={`${s.key}-weight`}
                                    inputMode="numeric"
                                    value={s.weight}
                                    onChange={(e) => update(index, { weight: e.target.value.replace(/[^\d]/g, '') })}
                                    aria-invalid={!!err.weight}
                                  />
                                  {err.weight && <p className="text-xs text-destructive">{err.weight}</p>}
                                </div>
                                <div className="col-span-1 md:col-span-1 flex flex-col items-start justify-end gap-1 pb-1">
                                  <Label className="text-xs">Chance</Label>
                                  <Badge variant="secondary" className="font-mono" data-testid="wheel-settings-chance">
                                    {chances[index].toFixed(1)}%
                                  </Badge>
                                </div>
                                <div className="col-span-2 md:col-span-8 space-y-1">
                                  <Label className="text-xs" htmlFor={`${s.key}-description`}>Descrição (opcional, aparece no resultado)</Label>
                                  <Input
                                    id={`${s.key}-description`}
                                    value={s.description}
                                    maxLength={255}
                                    placeholder="Ex.: válido até o fim do mês"
                                    onChange={(e) => update(index, { description: e.target.value })}
                                  />
                                </div>
                                <div className="col-span-2 md:col-span-4 flex items-end justify-between gap-2">
                                  <div className="space-y-1">
                                    <Label className="text-xs">Cor</Label>
                                    <ColorPicker color={s.color} onChange={(c) => update(index, { color: c })} />
                                  </div>
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    className="text-muted-foreground hover:text-destructive"
                                    onClick={() => archiveSegment(index)}
                                  >
                                    <Archive className="mr-1 h-4 w-4" /> {s.id ? 'Arquivar' : 'Remover'}
                                  </Button>
                                </div>
                              </div>
                            </div>
                            {legacyZero && (
                              <p className="mt-2 flex items-center gap-2 text-xs font-medium text-amber-700 dark:text-amber-400">
                                <AlertTriangle className="h-4 w-4" /> Este prêmio estava com peso 0 e nunca saía no sorteio. Defina um peso
                                maior que zero ou arquive-o.
                              </p>
                            )}
                          </div>
                        )}
                      </Draggable>
                    );
                  })}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </DragDropContext>
          {showErrors && listError && <p className="text-sm font-semibold text-destructive">{listError}</p>}

          {archived.length > 0 && (
            <Collapsible open={archivedOpen} onOpenChange={setArchivedOpen} className="rounded-xl border border-dashed p-3">
              <CollapsibleTrigger className="flex w-full items-center justify-between text-sm font-semibold text-muted-foreground">
                <span>Prêmios arquivados ({archived.length})</span>
                <ChevronDown className={cn('h-4 w-4 transition-transform', archivedOpen && 'rotate-180')} />
              </CollapsibleTrigger>
              <CollapsibleContent className="mt-3 space-y-2">
                {archived.map((a) => (
                  <div key={a.id} className="flex items-center gap-3 rounded-lg bg-muted/40 px-3 py-2 text-sm">
                    <span className="h-3 w-3 rounded-full" style={{ backgroundColor: a.color }} />
                    <span>{prizeIcon(a.type)}</span>
                    <span className="flex-1 truncate">{a.label}</span>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => restoreSegment(a)}
                      disabled={segments.length >= MAX_ACTIVE_SEGMENTS}
                    >
                      <ArchiveRestore className="mr-1 h-4 w-4" /> Restaurar
                    </Button>
                  </div>
                ))}
                <p className="text-xs text-muted-foreground">Prêmios arquivados não aparecem na roda, mas continuam no histórico.</p>
              </CollapsibleContent>
            </Collapsible>
          )}
        </CardContent>
        <CardFooter className="flex flex-col-reverse gap-3 border-t pt-4 sm:flex-row sm:justify-between">
          <div className="flex gap-2">
            <Button variant="outline" onClick={addSegment} disabled={segments.length >= MAX_ACTIVE_SEGMENTS}>
              <Plus className="mr-2 h-4 w-4" /> Adicionar prêmio
            </Button>
            {dirty && (
              <Button variant="ghost" onClick={() => void load()} disabled={saving}>
                <RotateCcw className="mr-2 h-4 w-4" /> Descartar
              </Button>
            )}
          </div>
          <div className="flex items-center gap-3">
            {dirty && <span className="text-xs font-medium text-amber-700 dark:text-amber-400">Alterações não salvas</span>}
            <Button onClick={save} disabled={saving || !dirty} data-testid="wheel-settings-save">
              {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
              Salvar configuração
            </Button>
          </div>
        </CardFooter>
      </Card>

      <div className="space-y-4 lg:sticky lg:top-4 lg:self-start">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Prévia da roda</CardTitle>
            <CardDescription>É assim que o vendedor verá a roleta.</CardDescription>
          </CardHeader>
          <CardContent>
            <WheelSvg compact slices={previewSlices} ariaLabel="Prévia da roleta" />
            <p className="mt-3 text-center text-xs text-muted-foreground">
              {segments.length}/{MAX_ACTIVE_SEGMENTS} prêmios ativos · soma dos pesos {weights.reduce((a, b) => a + b, 0)}
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
