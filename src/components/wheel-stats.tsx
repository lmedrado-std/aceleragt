import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';

interface WheelStatsProps {
  storeId: string;
}

interface Spin {
  id: string;
  seller_id: string; // Assuming seller name is not directly available
  segment: {
    label: string;
  };
  created_at: string;
}

interface StatsData {
  totalSpins: number;
  totalValue: number;
}

interface StatusResponse {
  creditsMap: Record<string, number>;
  spins: Spin[];
  stats: StatsData;
}

export function WheelStats({ storeId }: WheelStatsProps) {
  const [loading, setLoading] = useState(true);
  const [configured, setConfigured] = useState<boolean | null>(null);
  const [stats, setStats] = useState<StatsData | null>(null);
  const [spins, setSpins] = useState<Spin[]>([]);
  const [credits, setCredits] = useState<Record<string, number>>({});

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setConfigured(null);
      try {
        // Primeiro, verificar a configuração
        const settingsRes = await fetch(`/api/wheel/settings?storeId=${storeId}`);
        const settingsData = await settingsRes.json();

        if (settingsData.configured === false) {
          setConfigured(false);
          return; // Não prosseguir se não estiver configurado
        }

        // Se configurado, buscar os status
        const statusRes = await fetch(`/api/wheel/status?storeId=${storeId}`);
        if (!statusRes.ok) throw new Error('Failed to fetch wheel status');
        const statusData: StatusResponse = await statusRes.json();

        setStats(statusData.stats);
        setSpins(statusData.spins);
        setCredits(statusData.creditsMap);
        setConfigured(true);

      } catch (error) {
        console.error(error);
        setConfigured(false); // Assume não configurado em caso de erro
      } finally {
        setLoading(false);
      }
    };

    if (storeId) {
      fetchData();
    }
  }, [storeId]);

  if (loading) {
    return <div className="text-center p-4">Carregando estatísticas...</div>;
  }

  if (configured === false) {
    // A mensagem de "Não configurado" já é mostrada pelo componente WheelSettings
    // Este componente simplesmente não renderiza nada.
    return null;
  }

  return (
    <div className="space-y-6 mt-6">
      <h3 className="text-xl font-semibold">Estatísticas e Atividade</h3>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader><CardTitle>Total de Giros</CardTitle></CardHeader>
          <CardContent><p className="text-2xl font-bold">{stats?.totalSpins || 0}</p></CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Valor Total (Prêmios)</CardTitle></CardHeader>
          <CardContent><p className="text-2xl font-bold">R$ {stats?.totalValue?.toFixed(2) || '0.00'}</p></CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle>Giros Recentes</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Vendedor</TableHead>
                <TableHead>Prêmio</TableHead>
                <TableHead>Data</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {spins.length > 0 ? (
                spins.map(spin => (
                  <TableRow key={spin.id}>
                    <TableCell>{spin.seller_id}</TableCell> {/* Idealmente, teríamos o nome do vendedor aqui */}
                    <TableCell><Badge variant="outline">{spin.segment.label}</Badge></TableCell>
                    <TableCell>{new Date(spin.created_at).toLocaleString('pt-BR')}</TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow><TableCell colSpan={3} className="text-center">Nenhum giro recente.</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

       <Card>
        <CardHeader><CardTitle>Créditos dos Vendedores</CardTitle></CardHeader>
        <CardContent>
           <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Vendedor</TableHead>
                <TableHead>Giros Restantes</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {Object.keys(credits).length > 0 ? (
                Object.entries(credits).map(([sellerId, creditCount]) => (
                  <TableRow key={sellerId}>
                    <TableCell>{sellerId}</TableCell> {/* Idealmente, nome do vendedor */}
                    <TableCell className="font-bold">{creditCount}</TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow><TableCell colSpan={2} className="text-center">Nenhum vendedor com créditos.</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
