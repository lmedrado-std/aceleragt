'use client';

import { useCallback, useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight, Download, Loader2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import { prizeIcon } from '@/components/wheel/wheel-svg';

interface SpinRow {
  id: string;
  seller_id: string;
  sellerName: string | null;
  createdAt: string;
  segment: { id: string; label: string; type: string; value: number | null; color: string; archived: boolean } | null;
}

const PAGE_SIZE = 25;
const EXPORT_PAGE = 200;
const EXPORT_MAX = 10000;
const ALL = '__all__';
const brl = (v: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);

export function WheelHistory({ storeId }: { storeId: string }) {
  const [spins, setSpins] = useState<SpinRow[]>([]);
  const [sellers, setSellers] = useState<{ id: string; name: string }[]>([]);
  const [total, setTotal] = useState(0);
  const [filteredStats, setFilteredStats] = useState({ totalSpins: 0, totalValue: 0 });
  const [page, setPage] = useState(0);
  const [sellerId, setSellerId] = useState(ALL);
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const { toast } = useToast();

  const buildQuery = useCallback(
    (limit: number, offset: number) => {
      const q = new URLSearchParams({ storeId, limit: String(limit), offset: String(offset) });
      if (sellerId !== ALL) q.set('sellerId', sellerId);
      if (from) q.set('from', from);
      if (to) q.set('to', to);
      return `/api/wheel/status?${q.toString()}`;
    },
    [storeId, sellerId, from, to],
  );

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(buildQuery(PAGE_SIZE, page * PAGE_SIZE), { cache: 'no-store' });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Falha ao carregar o histórico.');
      setSpins(data.spins ?? []);
      setTotal(data.pagination?.total ?? 0);
      setFilteredStats(data.filteredStats ?? { totalSpins: 0, totalValue: 0 });
      if (sellerId === ALL) setSellers((data.sellers ?? []).map((s: { id: string; name: string }) => ({ id: s.id, name: s.name })));
    } catch (e) {
      toast({ variant: 'destructive', title: 'Erro', description: (e as Error).message });
    } finally {
      setLoading(false);
    }
  }, [buildQuery, page, sellerId, toast]);

  useEffect(() => {
    void load();
  }, [load]);

  // Ao mudar filtro, volta para a primeira página.
  useEffect(() => {
    setPage(0);
  }, [sellerId, from, to]);

  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const exportCsv = async () => {
    setExporting(true);
    try {
      const rows: SpinRow[] = [];
      for (let offset = 0; offset < EXPORT_MAX; offset += EXPORT_PAGE) {
        const res = await fetch(buildQuery(EXPORT_PAGE, offset), { cache: 'no-store' });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Falha ao exportar.');
        rows.push(...(data.spins ?? []));
        if ((data.spins ?? []).length < EXPORT_PAGE) break;
      }
      const esc = (v: unknown) => `"${String(v ?? '').replace(/"/g, '""')}"`;
      const lines = [
        ['Data', 'Vendedor', 'Prêmio', 'Tipo', 'Valor (R$)', 'Prêmio arquivado'].map(esc).join(';'),
        ...rows.map((r) =>
          [
            new Date(r.createdAt).toLocaleString('pt-BR'),
            r.sellerName ?? r.seller_id,
            r.segment?.label ?? 'Prêmio desconhecido',
            r.segment?.type ?? '',
            r.segment?.type === 'money' && r.segment.value != null ? String(r.segment.value).replace('.', ',') : '',
            r.segment?.archived ? 'sim' : 'não',
          ]
            .map(esc)
            .join(';'),
        ),
      ];
      const blob = new Blob(['﻿' + lines.join('\r\n')], { type: 'text/csv;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `historico-roleta-${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      toast({ variant: 'destructive', title: 'Erro ao exportar', description: (e as Error).message });
    } finally {
      setExporting(false);
    }
  };

  return (
    <Card data-testid="wheel-history">
      <CardHeader className="gap-4">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <CardTitle>Histórico de giros</CardTitle>
            <CardDescription>
              Todos os prêmios sorteados. O histórico é permanente e não pode ser apagado.
            </CardDescription>
          </div>
          <Button variant="outline" onClick={exportCsv} disabled={exporting || total === 0}>
            {exporting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
            Exportar CSV
          </Button>
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div className="space-y-1">
            <Label className="text-xs">Vendedor</Label>
            <Select value={sellerId} onValueChange={setSellerId}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL}>Todos os vendedores</SelectItem>
                {sellers.map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label className="text-xs">De</Label>
            <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Até</Label>
            <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} />
          </div>
        </div>
        <p className="text-sm text-muted-foreground" data-testid="wheel-history-summary">
          {filteredStats.totalSpins} giro(s) no filtro · {brl(filteredStats.totalValue)} em prêmios em dinheiro
        </p>
      </CardHeader>
      <CardContent className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Data</TableHead>
              <TableHead>Vendedor</TableHead>
              <TableHead>Prêmio</TableHead>
              <TableHead className="text-right">Valor</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={4} className="h-24 text-center">
                  <Loader2 className="mx-auto h-5 w-5 animate-spin" />
                </TableCell>
              </TableRow>
            ) : spins.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">
                  Nenhum giro encontrado.
                </TableCell>
              </TableRow>
            ) : (
              spins.map((spin) => (
                <TableRow key={spin.id} data-testid="wheel-history-row">
                  <TableCell className="whitespace-nowrap">{new Date(spin.createdAt).toLocaleString('pt-BR')}</TableCell>
                  <TableCell>{spin.sellerName ?? spin.seller_id}</TableCell>
                  <TableCell>
                    <span className="inline-flex items-center gap-2">
                      <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: spin.segment?.color ?? '#94A3B8' }} />
                      {spin.segment ? `${prizeIcon(spin.segment.type)} ${spin.segment.label}` : 'Prêmio desconhecido'}
                      {spin.segment?.archived && <span className="text-xs text-muted-foreground">(arquivado)</span>}
                    </span>
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    {spin.segment?.type === 'money' && spin.segment.value != null ? brl(spin.segment.value) : '—'}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
        <div className="mt-4 flex items-center justify-between text-sm text-muted-foreground">
          <span data-testid="wheel-history-page">
            Página {Math.min(page + 1, pages)} de {pages} · {total} registro(s)
          </span>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled={page === 0 || loading} onClick={() => setPage((p) => p - 1)}>
              <ChevronLeft className="h-4 w-4" /> Anterior
            </Button>
            <Button variant="outline" size="sm" disabled={page + 1 >= pages || loading} onClick={() => setPage((p) => p + 1)}>
              Próxima <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
