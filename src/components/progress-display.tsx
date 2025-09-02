import React, { useEffect, useState } from "react";
import { calcularIncentivos } from "@/services/genkit"; // Ajuste conforme seu caminho
import { toast } from "react-toastify";

interface Incentivos {
  metaMinhaPrize: number;
  metaPrize: number;
  metonaPrize: number;
  legendariaBonusValorPremio: number;
  paPrize1: number;
  paPrize2: number;
  paPrize3: number;
  paPrize4: number;
  ticketMedioPrize1: number;
  ticketMedioPrize2: number;
  ticketMedioPrize3: number;
  ticketMedioPrize4: number;
  corridinhaDiaria: number;
}

interface Props {
  vendas: string | number;
  pa: string | number;
  ticketMedio: string | number;
  corridinhaDiaria: string | number;
  metas: any;
}

const ProgressDisplay: React.FC<Props> = ({ vendas, pa, ticketMedio, corridinhaDiaria, metas }) => {
  const [incentivos, setIncentivos] = useState<Incentivos | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    if (!vendas && !pa && !ticketMedio && !corridinhaDiaria) return;

    const fetchIncentivos = async () => {
      try {
        setLoading(true);

        // Conversão para número para evitar erros do Genkit
        const payload = {
          vendas: Number(vendas) || 0,
          pa: Number(pa) || 0,
          ticketMedio: Number(ticketMedio) || 0,
          corridinhaDiaria: Number(corridinhaDiaria) || 0,
          metaMinha: Number(metas?.metaMinha) || 0,
          meta: Number(metas?.meta) || 0,
          metona: Number(metas?.metona) || 0,
          metaLendaria: Number(metas?.metaLendaria) || 0,
          legendariaBonusValorVenda: Number(metas?.legendariaBonusValorVenda) || 0,
          legendariaBonusValorPremio: Number(metas?.legendariaBonusValorPremio) || 0,
          metaMinhaPrize: Number(metas?.metaMinhaPrize) || 0,
          metaPrize: Number(metas?.metaPrize) || 0,
          metonaPrize: Number(metas?.metonaPrize) || 0,
          paGoal1: Number(metas?.paGoal1) || 0,
          paGoal2: Number(metas?.paGoal2) || 0,
          paGoal3: Number(metas?.paGoal3) || 0,
          paGoal4: Number(metas?.paGoal4) || 0,
          paPrize1: Number(metas?.paPrize1) || 0,
          paPrize2: Number(metas?.paPrize2) || 0,
          paPrize3: Number(metas?.paPrize3) || 0,
          paPrize4: Number(metas?.paPrize4) || 0,
          ticketMedioGoal1: Number(metas?.ticketMedioGoal1) || 0,
          ticketMedioGoal2: Number(metas?.ticketMedioGoal2) || 0,
          ticketMedioGoal3: Number(metas?.ticketMedioGoal3) || 0,
          ticketMedioGoal4: Number(metas?.ticketMedioGoal4) || 0,
          ticketMedioPrize1: Number(metas?.ticketMedioPrize1) || 0,
          ticketMedioPrize2: Number(metas?.ticketMedioPrize2) || 0,
          ticketMedioPrize3: Number(metas?.ticketMedioPrize3) || 0,
          ticketMedioPrize4: Number(metas?.ticketMedioPrize4) || 0,
        };

        const result = await calcularIncentivos(payload);

        if (result?.error) {
          toast.error("Erro de Cálculo: Não foi possível calcular os incentivos.");
        } else {
          setIncentivos(result);
        }
      } catch (error) {
        console.error("Erro ao calcular incentivos:", error);
        toast.error("Erro inesperado. Tente novamente.");
      } finally {
        setLoading(false);
      }
    };

    fetchIncentivos();
  }, [vendas, pa, ticketMedio, corridinhaDiaria, metas]);

  if (loading) {
    return <p>Calculando incentivos...</p>;
  }

  const ganhoTotal = (incentivos?.metaMinhaPrize || 0) +
                     (incentivos?.metaPrize || 0) +
                     (incentivos?.metonaPrize || 0) +
                     (incentivos?.legendariaBonusValorPremio || 0) +
                     (incentivos?.paPrize1 || 0) +
                     (incentivos?.paPrize2 || 0) +
                     (incentivos?.paPrize3 || 0) +
                     (incentivos?.paPrize4 || 0) +
                     (incentivos?.ticketMedioPrize1 || 0) +
                     (incentivos?.ticketMedioPrize2 || 0) +
                     (incentivos?.ticketMedioPrize3 || 0) +
                     (incentivos?.ticketMedioPrize4 || 0) +
                     (incentivos?.corridinhaDiaria || 0);

  return (
    <div>
      <h3>💰 Seu Ganho Total: R$ {ganhoTotal.toFixed(2)}</h3>

      <div>
        <p>🏆 PA: R$ {(incentivos?.paPrize1 || 0) + (incentivos?.paPrize2 || 0) + (incentivos?.paPrize3 || 0) + (incentivos?.paPrize4 || 0)}</p>
        <p>🏆 Ticket Médio: R$ {(incentivos?.ticketMedioPrize1 || 0) + (incentivos?.ticketMedioPrize2 || 0) + (incentivos?.ticketMedioPrize3 || 0) + (incentivos?.ticketMedioPrize4 || 0)}</p>
        <p>🏆 Corridinha: R$ {incentivos?.corridinhaDiaria || 0}</p>
      </div>
    </div>
  );
};

export default ProgressDisplay;
