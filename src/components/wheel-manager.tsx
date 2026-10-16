'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AlertTriangle, Gift, Loader2, Plus, RefreshCw, Search, Ticket, TrendingUp, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/components/ui/use-toast';
import { cn } from '@/lib/utils';

interface SellerRow {
  id: string;
  name: string;
  credits: number;
  spins: number;
  lastSpinAt: string | null;
}

const MAX_GRANT = 50;
const brl = (v: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);
const fmtDate = (v: string | null) =>
  v ? new Date(v).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }) : '—';

export function WheelManager({ storeId }: { storeId: string }) {
  const [sellers, setSellers] = useState<SellerRow[]>([]);
  const [stats, setStats] = useState({ totalSpins: 0, totalValue: 0 });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [amounts, setAmounts] = useState<Record<string, string>>({});
  const [pending, setPending] = useState<Record<string, boolean>>({});
  const pendingRef = useRef<Set<string>>(new Set()); // trava síncrona contra clique duplo
  const { toast } = useToast();

  const load = useCallback(
    async (silent = false) => {
      if (!silent) setLoading(true);
      try {
        const res = await fetch(`/api/wheel/status?storeId=${encodeURIComponent(storeId)}&limit=1`, { cache: 'no-store' });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data.error || 'Falha ao carregar dados da roleta.');
        setSellers(data.sellers ?? []);
        setStats(data.stats ?? { totalSpins: 0, totalValue: 0 });
      } catch (e) {
        toast({ variant: 'destructive', title: 'Erro ao carregar', description: (e as Error).message });
      } finally {
        setLoading(false);
      }
    },
    [storeId, toast],
  );

  useEffect(() => {
    if (storeId) void load();
  }, [storeId, load]);

  const grant = async (seller: SellerRow, credits: number) => {
    if (pendingRef.current.has(seller.id)) return;
    if (!Number.isInteger(credits) || credits < 1 || credits > MAX_GRANT) {
      toast({ variant: 'destructive', title: 'Quantidade inválida', description: `Informe de 1 a ${MAX_GRANT} giros.` });
      return;
    }
    pendingRef.current.add(seller.id);
    setPending((p) => ({ ...p, [seller.id]: true }));
    try {
      const res = await fetch('/api/wheel/grant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ storeId, sellerId: seller.id, credits }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Falha ao conceder giros.');
      setSellers((prev) => prev.map((s) => (s.id === seller.id ? { ...s, credits: data.totalCredits } : s)));
      setAmounts((a) => ({ ...a, [seller.id]: '' }));
      toast({ title: 'Giros concedidos', description: data.message });
    } catch (e) {
      toast({ variant: 'destructive', title: 'Erro', description: (e as Error).message });
      void load(true);
    } finally {
      pendingRef.current.delete(seller.id);
      setPending((p) => ({ ...p, [seller.id]: false }));
    }
  };

  const filtered = useMemo(
    () => sellers.filter((s) => s.name.toLowerCase().includes(search.trim().toLowerCase())),
    [sellers, search],
  );
  const withCredits = sellers.filter((s) => s.credits > 0);
  const pendingSpins = withCredits.reduce((sum, s) => sum + s.credits, 0);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="mt-4 text-muted-foreground">Carregando gerenciador da roleta...</p>
      </div>
    );
  }

  const statCards = [
    { title: 'Total de giros', value: String(stats.totalSpins), icon: TrendingUp },
    { title: 'Valor distribuído (dinheiro)', value: brl(stats.totalValue), icon: Gift },
    { title: 'Giros a usar', value: String(pendingSpins), icon: Ticket },
    { title: 'Vendedores com giros', value: `${withCredits.length}/${sellers.length}`, icon: Users },
  ];

  return (
    <div className="space-y-6" data-testid="wheel-manager">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {statCards.map(({ title, value, icon: Icon }) => (
          <Card key={title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{title}</CardTitle>
              <Icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader className="gap-3 sm:flex-row sm:items-end sm:justify-between sm:space-y-0">
          <div>
            <CardTitle>Conceder giros</CardTitle>
            <CardDescription>Cada concessão soma ao saldo do vendedor (de 1 a {MAX_GRANT} por vez).</CardDescription>
          </div>
          <div className="flex gap-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Buscar vendedor" value={search} onChange={(e) => setSearch(e.target.value)} className="pl-8 w-full sm:w-56" />
            </div>
            <Button variant="outline" size="icon" onClick={() => void load(true)} aria-label="Atualizar">
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Vendedor</TableHead>
                <TableHead className="text-center">Saldo</TableHead>
                <TableHead className="hidden md:table-cell text-center">Giros feitos</TableHead>
                <TableHead className="hidden md:table-cell">Último giro</TableHead>
                <TableHead className="text-right">Conceder</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-20 text-center text-muted-foreground">
                    Nenhum vendedor encontrado.
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((s) => {
                  const busy = !!pending[s.id];
                  const custom = amounts[s.id] ?? '';
                  return (
                    <TableRow key={s.id} data-testid="wheel-manager-row" data-seller-id={s.id}>
                      <TableCell className="font-medium">{s.name}</TableCell>
                      <TableCell className="text-center">
                        <span
                          className={cn(
                            'inline-flex min-w-9 items-center justify-center gap-1 rounded-full px-2 py-0.5 text-sm font-bold',
                            s.credits > 0 ? 'bg-primary/10 text-primary' : s.credits < 0 ? 'bg-destructive/10 text-destructive' : 'bg-muted text-muted-foreground',
                          )}
                          title={s.credits < 0 ? 'Saldo negativo herdado da versão anterior da roleta' : undefined}
                          data-testid="wheel-manager-credits"
                        >
                          {s.credits < 0 && <AlertTriangle className="h-3 w-3" />}
                          {s.credits}
                        </span>
                      </TableCell>
                      <TableCell className="hidden md:table-cell text-center">{s.spins}</TableCell>
                      <TableCell className="hidden md:table-cell text-muted-foreground">{fmtDate(s.lastSpinAt)}</TableCell>
                      <TableCell>
                        <div className="flex items-center justify-end gap-2">
                          <Button size="sm" variant="secondary" disabled={busy} onClick={() => void grant(s, 1)} data-testid="wheel-grant-1">
                            +1
                          </Button>
                          <Button size="sm" variant="secondary" disabled={busy} onClick={() => void grant(s, 5)} className="hidden sm:inline-flex">
                            +5
                          </Button>
                          <Input
                            inputMode="numeric"
                            placeholder="Qtd."
                            value={custom}
                            onChange={(e) => setAmounts((a) => ({ ...a, [s.id]: e.target.value.replace(/[^\d]/g, '').slice(0, 2) }))}
                            className="h-9 w-16"
                            aria-label={`Quantidade de giros para ${s.name}`}
                          />
                          <Button size="sm" disabled={busy || !custom} onClick={() => void grant(s, Number(custom))}>
                            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
