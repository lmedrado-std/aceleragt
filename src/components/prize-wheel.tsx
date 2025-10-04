
'use client';

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Seller } from '@/lib/storage';

interface PrizeWheelProps {
  storeId: string;
  sellerId: string;
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

export function PrizeWheel({ storeId, sellerId }: PrizeWheelProps) {
  const [segments, setSegments] = useState<WheelSegment[]>([]);
  const [spinning, setSpinning] = useState(false);
  const [credits, setCredits] = useState(0);
  const [loading, setLoading] = useState(true);
  const wheelRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    loadWheelData();
  }, [storeId, sellerId]);

  const loadWheelData = async () => {
    setLoading(true);
    try {
      // Carregar configurações da roleta
      const settingsRes = await fetch(`/api/wheel/settings?storeId=${storeId}`);
      if (!settingsRes.ok) throw new Error("Falha ao carregar a roleta.");
      const settingsData = await settingsRes.json();
      setSegments(settingsData.segments || []);

      // Carregar créditos do vendedor
      const statusRes = await fetch(`/api/wheel/status?storeId=${storeId}`);
      if (!statusRes.ok) throw new Error("Falha ao carregar seus giros.");
      const statusData = await statusRes.json();
      setCredits(statusData.creditsMap[sellerId] || 0);

    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Erro',
        description: (error as Error).message || 'Não foi possível carregar os dados da roleta.'
      });
    } finally {
      setLoading(false);
    }
  };

  const spinWheel = async () => {
    if (credits < 1) {
      toast({
        variant: 'destructive',
        title: 'Sem giros',
        description: 'Você não possui giros disponíveis. Fale com seu gerente!'
      });
      return;
    }

    setSpinning(true);

    try {
      const res = await fetch('/api/wheel/spin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ storeId, sellerId })
      });

      const result = await res.json();
      if (!result.success) throw new Error(result.error);
      
      await animateWheel(result.segmentIndex);
      
      toast({
        title: '🎉 Parabéns!',
        description: `Você ganhou: ${result.prize.label}`,
        duration: 5000
      });
      
      setCredits(result.remainingCredits);

    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Erro ao girar',
        description: error.message || 'Não foi possível completar o giro.'
      });
    } finally {
      setSpinning(false);
    }
  };

  const animateWheel = (winningIndex: number): Promise<void> => {
    return new Promise((resolve) => {
      if (!wheelRef.current) return resolve();

      const wheel = wheelRef.current;
      const segmentAngle = 360 / segments.length;
      const randomOffset = Math.random() * (segmentAngle * 0.8) - (segmentAngle * 0.4);
      const targetAngle = (winningIndex * segmentAngle) + (segmentAngle / 2) + randomOffset;
      const currentRotation = parseInt(wheel.style.transform.replace(/[^\d-]/g, '') || '0');
      const spinAngle = currentRotation + (360 * 5) + (360 - (targetAngle % 360));

      wheel.style.transition = 'transform 4s cubic-bezier(0.25, 1, 0.5, 1)';
      wheel.style.transform = `rotate(${spinAngle}deg)`;

      setTimeout(resolve, 4000);
    });
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto" />
          <p className="mt-2 text-muted-foreground">Carregando roleta...</p>
        </CardContent>
      </Card>
    );
  }

  if (segments.length === 0) {
    return (
      <Card>
        <CardContent className="p-6 text-center text-muted-foreground">
          A roleta de prêmios ainda não foi configurada para esta loja.
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden">
      <CardHeader>
        <CardTitle>🎡 Roleta de Prêmios</CardTitle>
        <CardDescription>Gire a roleta e ganhe prêmios instantâneos!</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col lg:flex-row items-center justify-center gap-8 p-8">
        <div className="relative flex-shrink-0">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-4 z-10 w-0 h-0 border-x-8 border-x-transparent border-b-12 border-b-destructive" style={{borderBottomWidth: '12px'}}></div>
          
          <div 
            ref={wheelRef}
            className="w-80 h-80 rounded-full border-8 border-primary/20 shadow-lg"
            style={{ 
              background: `conic-gradient(${segments.map((seg, i) => {
                const startAngle = (i / segments.length) * 360;
                const endAngle = ((i + 1) / segments.length) * 360;
                return `${seg.color} ${startAngle}deg ${endAngle}deg`;
              }).join(', ')})`,
              transition: 'transform 0.1s ease-out'
            }}
          >
            {segments.map((segment, index) => {
              const angle = (360 / segments.length);
              const rotation = angle * index + angle / 2;
              return (
                <div
                  key={segment.id}
                  className="absolute w-full h-full flex items-start justify-center"
                  style={{ transform: `rotate(${rotation}deg)` }}
                >
                  <span className="text-white font-bold text-sm transform -rotate-90 origin-center translate-y-8 max-w-[50%] text-center">
                    {segment.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="flex flex-col items-center justify-center gap-4 text-center">
          <div className="bg-muted p-4 rounded-lg">
            <p className="text-sm text-muted-foreground">Você tem</p>
            <p className="text-4xl font-bold text-primary">{credits}</p>
            <p className="text-sm text-muted-foreground">{credits === 1 ? 'giro disponível' : 'giros disponíveis'}</p>
          </div>

          <Button 
            onClick={spinWheel} 
            disabled={spinning || credits < 1}
            size="lg"
            className="w-full text-lg font-bold"
          >
            {spinning ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Girando...
              </>
            ) : 'GIRAR A ROLETA!'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
