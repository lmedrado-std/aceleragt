
'use client';

import { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { WheelSettings } from './wheel-settings';
import { WheelManager } from './wheel-manager';
import { WheelHistory } from './wheel-history';
import { useToast } from '@/hooks/use-toast';

interface PrizeWheelTabProps {
  storeId: string;
}

export function PrizeWheelTab({ storeId }: PrizeWheelTabProps) {
  const [activeTab, setActiveTab] = useState("manager");
  const { toast } = useToast();

  return (
    <div className="w-full">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="manager">Gerenciar Giros</TabsTrigger>
          <TabsTrigger value="settings">Configurar Prêmios</TabsTrigger>
          <TabsTrigger value="history">Histórico</TabsTrigger>
        </TabsList>
        
        <TabsContent value="manager" className="space-y-4">
          <WheelManager storeId={storeId} />
        </TabsContent>
        
        <TabsContent value="settings" className="space-y-4">
          <WheelSettings storeId={storeId} />
        </TabsContent>
        
        <TabsContent value="history" className="space-y-4">
          <WheelHistory storeId={storeId} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
