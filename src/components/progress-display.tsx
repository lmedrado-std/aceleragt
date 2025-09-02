"use client";

import { useMemo } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import type { IncentiveProjectionOutput } from "@/ai/flows/incentive-projection";
import { Goals } from "@/lib/storage";

interface ProgressDisplayProps {
  salesData: {
    vendas: number;
    pa: number;
    ticketMedio: number;
    corridinhaDiaria: number;
  } & Goals;
  incentives: IncentiveProjectionOutput | null;
  themeColor?: string | null;
}

export function ProgressDisplay({
  salesData,
  incentives,
  themeColor = "#4F46E5",
}: ProgressDisplayProps) {
  // Extraindo dados importantes
  const {
    vendas,
    meta,
  } = salesData;

  // Cálculo dos ganhos com segurança
  const ganhos = useMemo(() => {
    const premioPA = incentives?.paBonus || 0;
    const premioTicket = incentives?.ticketMedioBonus || 0;
    const premioCorridinha = incentives?.corridinhaDiariaBonus || 0;
    const premioVendas = (incentives?.metinhaPremio || 0) + (incentives?.metaPremio || 0) + (incentives?.metonaPremio || 0) + (incentives?.legendariaBonus || 0);

    return {
      pa: premioPA,
      ticket: premioTicket,
      corridinha: premioCorridinha,
      total: premioPA + premioTicket + premioCorridinha + premioVendas,
    };
  }, [incentives]);

  // Dados do gráfico de barras
  const data = [
    { name: "PA", value: ganhos.pa, color: "#3B82F6" },
    { name: "Ticket", value: ganhos.ticket, color: "#8B5CF6" },
    { name: "Corridinha", value: ganhos.corridinha, color: "#22C55E" },
  ];
  
  const formatCurrency = (value: number) =>
    value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });


  return (
    <div className="bg-white p-6 rounded-2xl shadow-lg border">
      <h2 className="text-lg font-bold text-gray-700 mb-2">Seu Desempenho</h2>
      <p className="text-sm text-gray-500 mb-4">
        Acompanhe o andamento das metas e seus ganhos.
      </p>

      {/* Gráfico de ganhos */}
      <div className="h-64 w-full">
        <ResponsiveContainer>
          <BarChart data={data} barSize={50}>
            <XAxis dataKey="name" stroke="#666" />
            <YAxis tickFormatter={(value) => `R$${value}`} />
            <Tooltip
              formatter={(value: number) =>
                formatCurrency(value)
              }
            />
            <Bar dataKey="value">
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Resumo dos ganhos */}
      <div className="mt-6 grid grid-cols-1 sm:grid-cols-4 gap-4">
        {/* Ganho PA */}
        <div className="bg-blue-50 rounded-xl p-4 shadow-sm text-center">
          <p className="text-blue-700 font-medium">PA</p>
          <p className="text-2xl font-bold text-blue-600">
            {formatCurrency(ganhos.pa)}
          </p>
        </div>

        {/* Ganho Ticket */}
        <div className="bg-purple-50 rounded-xl p-4 shadow-sm text-center">
          <p className="text-purple-700 font-medium">Ticket Médio</p>
          <p className="text-2xl font-bold text-purple-600">
            {formatCurrency(ganhos.ticket)}
          </p>
        </div>

        {/* Ganho Corridinha */}
        <div className="bg-green-50 rounded-xl p-4 shadow-sm text-center">
          <p className="text-green-700 font-medium">Corridinha</p>
          <p className="text-2xl font-bold text-green-600">
            {formatCurrency(ganhos.corridinha)}
          </p>
        </div>

        {/* Ganho Total */}
        <div className="bg-gradient-to-r from-green-200 to-green-100 rounded-xl p-4 shadow-sm text-center">
          <p className="text-green-800 font-medium">Total</p>
          <p className="text-2xl font-bold text-green-700">
            {formatCurrency(ganhos.total)}
          </p>
        </div>
      </div>

      {/* Barra de progresso geral */}
      <div className="mt-8">
        <div className="flex justify-between mb-1">
          <span className="text-sm text-gray-700 font-semibold">Meta de Vendas Atual</span>
          <span className="text-sm text-gray-700 font-semibold">
            {formatCurrency(vendas)}
            /{" "}
            {formatCurrency(meta)}
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-3">
          <div
            className="h-3 rounded-full"
            style={{
              width: `${Math.min((vendas / (meta || 1)) * 100, 100)}%`,
              backgroundColor: themeColor,
              transition: "width 0.5s ease-in-out",
            }}
          />
        </div>
      </div>
    </div>
  );
}
