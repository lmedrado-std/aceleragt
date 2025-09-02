"use client";

import React, { useEffect, useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { Goals, Seller } from "@/lib/storage";

interface Props {
  salesData: Partial<Seller> & { goals: Goals };
}

export const ProgressDisplay: React.FC<Props> = ({ salesData }) => {
  const [ganhoTotal, setGanhoTotal] = useState<number>(0);
  const [vendasPremio, setVendasPremio] = useState<number>(0);
  const [lendariaPremio, setLendariaPremio] = useState<number>(0);
  const [paPremio, setPaPremio] = useState<number>(0);
  const [ticketPremio, setTicketPremio] = useState<number>(0);
  const [corridinhaPremio, setCorridinhaPremio] = useState<number>(0);
  const { toast } = useToast();


  useEffect(() => {
    try {
      const vendasAtual = Number(salesData.vendas) || 0;
      const paAtual = Number(salesData.pa) || 0;
      const ticketAtual = Number(salesData.ticketMedio) || 0;
      const corridinhaAtual = Number(salesData.corridinhaDiaria) || 0;
      const metas = salesData.goals;

      let total = 0;
      
      // Premiação não cumulativa para metas principais
      let premioVendas = 0;
      if (vendasAtual >= metas.metona) {
        premioVendas = metas.metonaPrize;
      } else if (vendasAtual >= metas.meta) {
        premioVendas = metas.metaPrize;
      } else if (vendasAtual >= metas.metaMinha) {
        premioVendas = metas.metaMinhaPrize;
      }
      setVendasPremio(premioVendas);
      total += premioVendas;

      // Bônus Lendária
      let bonusLendaria = 0;
      if (vendasAtual >= metas.metaLendaria && metas.legendariaBonusValorVenda > 0) {
        bonusLendaria = Math.floor((vendasAtual - metas.metaLendaria) / metas.legendariaBonusValorVenda) * metas.legendariaBonusValorPremio;
      }
      setLendariaPremio(bonusLendaria);
      total += bonusLendaria;
      
      // PA — Produtos por Atendimento
      let premioPA = 0;
      if (paAtual >= metas.paGoal4) premioPA = metas.paPrize4;
      else if (paAtual >= metas.paGoal3) premioPA = metas.paPrize3;
      else if (paAtual >= metas.paGoal2) premioPA = metas.paPrize2;
      else if (paAtual >= metas.paGoal1) premioPA = metas.paPrize1;
      total += premioPA;
      setPaPremio(premioPA);

      // Ticket Médio
      let premioTicket = 0;
      if (ticketAtual >= metas.ticketMedioGoal4) premioTicket = metas.ticketMedioPrize4;
      else if (ticketAtual >= metas.ticketMedioGoal3) premioTicket = metas.ticketMedioPrize3;
      else if (ticketAtual >= metas.ticketMedioGoal2) premioTicket = metas.ticketMedioPrize2;
      else if (ticketAtual >= metas.ticketMedioGoal1) premioTicket = metas.ticketMedioPrize1;
      total += premioTicket;
      setTicketPremio(premioTicket);

      // Corridinha Diária
      const premioCorridinha = corridinhaAtual || 0;
      total += premioCorridinha;
      setCorridinhaPremio(premioCorridinha);

      setGanhoTotal(total);
    } catch (error) {
      console.error("Erro ao calcular incentivos:", error);
      toast({
        variant: "destructive",
        title: "Erro de Cálculo",
        description: "Não foi possível calcular os incentivos.",
      });
    }
  }, [salesData, toast]);

  const formatCurrency = (value: number) => {
    return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  }

  return (
    <div className="p-4 rounded-xl shadow-md bg-white border">
      <div className="text-center mb-4">
        <h3 className="text-lg font-semibold text-gray-500">
          Seu Ganho Total
        </h3>
        <p className="text-4xl font-bold text-green-600">
          {formatCurrency(ganhoTotal)}
        </p>
      </div>

      <div className="mt-4 space-y-3 border-t pt-4">
         <div className="flex justify-between items-center text-lg">
          <span className="font-semibold text-gray-700">🏆 Prêmio de Vendas:</span>
          <strong className="font-bold text-blue-600">
            {formatCurrency(vendasPremio)}
          </strong>
        </div>
         <div className="flex justify-between items-center text-lg">
          <span className="font-semibold text-gray-700">✨ Bônus Lendária:</span>
          <strong className="font-bold text-amber-500">
            {formatCurrency(lendariaPremio)}
          </strong>
        </div>
        <div className="flex justify-between items-center text-lg">
          <span className="font-semibold text-gray-700">🏆 PA:</span>
          <strong className="font-bold text-indigo-600">
            {formatCurrency(paPremio)}
          </strong>
        </div>
        <div className="flex justify-between items-center text-lg">
          <span className="font-semibold text-gray-700">🏆 Ticket Médio:</span>
          <strong className="font-bold text-purple-600">
            {formatCurrency(ticketPremio)}
          </strong>
        </div>
        <div className="flex justify-between items-center text-lg">
          <span className="font-semibold text-gray-700">🏆 Corridinha:</span>
          <strong className="font-bold text-pink-600">
            {formatCurrency(corridinhaPremio)}
          </strong>
        </div>
      </div>
    </div>
  );
};
