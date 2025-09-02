"use client";

import React, { useMemo } from "react";
import { useToast } from "@/hooks/use-toast";
import { Goals, Seller } from "@/lib/storage";
import { IncentiveProjectionOutput } from "@/ai/flows/incentive-projection";

interface Props {
  salesData: Partial<Seller> & { goals: Goals };
  incentives: IncentiveProjectionOutput | null;
}

export const ProgressDisplay: React.FC<Props> = ({ salesData, incentives }) => {
  const { toast } = useToast();
  
  const ganhoTotal = useMemo(() => {
    if (!incentives) return 0;
    return Object.values(incentives).reduce((acc, val) => acc + (val || 0), 0);
  }, [incentives]);

  const formatCurrency = (value: number) => {
    return (value || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  }

  return (
    <div className="p-4 rounded-xl shadow-md bg-white border">
      <div className="text-center mb-4">
        <h3 className="text-lg font-semibold text-gray-500">
          Ganho Total Projetado
        </h3>
        <p className="text-4xl font-bold text-green-600">
          {formatCurrency(ganhoTotal)}
        </p>
      </div>

      {incentives ? (
        <div className="mt-4 space-y-3 border-t pt-4">
          <div className="flex justify-between items-center text-lg">
            <span className="font-semibold text-gray-700">🏆 Prêmio de Vendas:</span>
            <strong className="font-bold text-blue-600">
              {formatCurrency((incentives.metinhaPremio || 0) + (incentives.metaPremio || 0) + (incentives.metonaPremio || 0))}
            </strong>
          </div>
          <div className="flex justify-between items-center text-lg">
            <span className="font-semibold text-gray-700">✨ Bônus Lendária:</span>
            <strong className="font-bold text-amber-500">
              {formatCurrency(incentives.legendariaBonus)}
            </strong>
          </div>
          <div className="flex justify-between items-center text-lg">
            <span className="font-semibold text-gray-700">🏆 PA:</span>
            <strong className="font-bold text-indigo-600">
              {formatCurrency(incentives.paBonus)}
            </strong>
          </div>
          <div className="flex justify-between items-center text-lg">
            <span className="font-semibold text-gray-700">🏆 Ticket Médio:</span>
            <strong className="font-bold text-purple-600">
              {formatCurrency(incentives.ticketMedioBonus)}
            </strong>
          </div>
          <div className="flex justify-between items-center text-lg">
            <span className="font-semibold text-gray-700">🏆 Corridinha:</span>
            <strong className="font-bold text-pink-600">
              {formatCurrency(incentives.corridinhaDiariaBonus)}
            </strong>
          </div>
        </div>
      ) : (
         <div className="text-center text-muted-foreground py-4">
            <p>Nenhum incentivo calculado ainda.</p>
            <p className="text-sm">Clique em "Salvar e Calcular" para ver os resultados.</p>
        </div>
      )}
    </div>
  );
};
