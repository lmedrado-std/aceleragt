
'use client';

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';

interface PrizeWheelProps {
  storeId: string;
  onSpinResult?: (result: any) => void;
}

interface WheelSegment {
  id: string;
  label: string;
  type: string;
  value?: number;
  description?: string;
  color: string;
  weight: number;
}

export function PrizeWheel({ storeId, onSpinResult }: PrizeWheelProps) {
  const [segments, setSegments] = useState<WheelSegment[]>([]);
  const [spinning, setSpinning] = useState(false);
  const [selectedSeller, setSelectedSeller] = useState('');
  const [sellers, setSellers] = useState<any[]>([]);
  const [creditsMap, setCreditsMap] = useState<Record<string, number>>({});
  const wheelRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    loadWheelData();
  }, [storeId]);

  const loadWheelData = async () => {
    try {
      // Carregar configurações da roleta
      const settingsRes = await fetch(`/api/wheel/settings?storeId=${storeId}`);
      const settingsData = await settingsRes.json();
      setSegments(settingsData.segments || []);

      // Carregar vendedores e créditos
      const statusRes = await fetch(`/api/wheel/status?storeId=${storeId}`);
      const statusData = await statusRes.json();
      setCreditsMap(statusData.creditsMap);

      // Carregar vendedores (adapte conforme sua API)
      const sellersRes = await fetch(`/api/sellers?storeId=${storeId}`);
      const sellersData = await sellersRes.json();
      setSellers(sellersData);
    } catch (error) {
      console.error('Erro ao carregar dados da roleta:', error);
    }
  };

  const spinWheel = async () => {
    if (!selectedSeller) {
      toast({
        variant: 'destructive',
        title: 'Erro',
        description: 'Selecione um vendedor para girar a roleta'
      });
      return;
    }

    if ((creditsMap[selectedSeller] || 0) < 1) {
      toast({
        variant: 'destructive',
        title: 'Sem giros',
        description: 'Este vendedor não possui giros disponíveis'
      });
      return;
    }

    setSpinning(true);

    try {
      const res = await fetch('/api/wheel/spin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          storeId,
          sellerId: selectedSeller
        })
      });

      const result = await res.json();

      if (!result.success) {
        throw new Error(result.error);
      }

      // Animar a roleta
      await animateWheel(result.segmentIndex);

      // Mostrar resultado
      toast({
        title: '🎉 Parabéns!',
        description: `Prêmio: ${result.prize.label}`,
        duration: 5000
      });

      // Callback para componente pai
      if (onSpinResult) {
        onSpinResult({
          ...result,
          sellerId: selectedSeller
        });
      }

      // Atualizar créditos localmente
      setCreditsMap(prev => ({
        ...prev,
        [selectedSeller]: result.remainingCredits
      }));

    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Erro',
        description: error.message || 'Erro ao girar a roleta'
      });
    } finally {
      setSpinning(false);
    }
  };

  const animateWheel = (winningIndex: number): Promise<void> => {
    return new Promise((resolve) => {
      if (!wheelRef.current) {
        resolve();
        return;
      }

      const wheel = wheelRef.current;
      const segmentAngle = 360 / segments.length;
      const targetAngle = (winningIndex * segmentAngle) + (segmentAngle / 2);
      const spinAngle = 360 * 5 + (360 - targetAngle); // 5 voltas + posição final

      wheel.style.transition = 'transform 3s cubic-bezier(0.23, 1, 0.32, 1)';
      wheel.style.transform = `rotate(${spinAngle}deg)`;

      setTimeout(resolve, 3000);
    });
  };

  if (segments.length === 0) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-muted-foreground">
            Configure os prêmios da roleta primeiro na aba "Configurar Prêmios"
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>🎡 Roleta de Prêmios</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Seletor de vendedor */}
        <div className="flex gap-4 items-end">
          <div className="flex-1">
            <label className="text-sm font-medium">Vendedor para girar</label>
            <select
              value={selectedSeller}
              onChange={(e) => setSelectedSeller(e.target.value)}
              className="w-full p-2 border rounded-md"
              disabled={spinning}
            >
              <option value="">Selecione um vendedor</option>
              {sellers
                .filter(seller => (creditsMap[seller.id] || 0) > 0)
                .map(seller => (
                <option key={seller.id} value={seller.id}>
                  {seller.name} ({creditsMap[seller.id]} giros)
                </option>
              ))}
            </select>
          </div>
          
          <Button 
            onClick={spinWheel} 
            disabled={spinning || !selectedSeller || (creditsMap[selectedSeller] || 0) < 1}
            size="lg"
          >
            {spinning ? 'Girando...' : 'GIRAR ROLETA! 🎯'}
          </Button>
        </div>

        {/* Roleta visual */}
        <div className="flex justify-center">
          <div className="relative">
            {/* Ponteiro */}
            <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-2 z-10">
              <div className="w-0 h-0 border-l-4 border-r-4 border-b-6 border-transparent border-b-black"></div>
            </div>
            
            {/* Roleta */}
            <div 
              ref={wheelRef}
              className="w-80 h-80 rounded-full border-4 border-gray-300 overflow-hidden"
              style={{ 
                background: `conic-gradient(${segments.map((seg, i) => {
                  const startAngle = (i / segments.length) * 360;
                  const endAngle = ((i + 1) / segments.length) * 360;
                  return `${seg.color} ${startAngle}deg ${endAngle}deg`;
                }).join(', ')})`
              }}
            >
              {segments.map((segment, index) => {
                const angle = (360 / segments.length) * index;
                const textAngle = angle + (180 / segments.length);
                
                return (
                  <div
                    key={segment.id}
                    className="absolute w-full h-full flex items-center justify-center text-white font-bold text-sm"
                    style={{
                      transform: `rotate(${textAngle}deg)`,
                      transformOrigin: 'center'
                    }}
                  >
                    <div 
                      className="text-center"
                      style={{ 
                        transform: `rotate(${-textAngle}deg)`,
                        maxWidth: '60px'
                      }}
                    >
                      {segment.label}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Legenda dos prêmios */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {segments.map((segment) => (
            <div key={segment.id} className="flex items-center gap-2">
              <div 
                className="w-4 h-4 rounded"
                style={{ backgroundColor: segment.color }}
              />
              <span className="text-sm">{segment.label}</span>
              {segment.weight > 0 && (
                <Badge variant="outline" className="text-xs">
                  {segment.weight}%
                </Badge>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
