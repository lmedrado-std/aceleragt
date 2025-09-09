
"use client";

import { useEffect, useState } from "react";

export default function DbDashboard() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/db-dashboard");
      const result = await res.json();
      if (!res.ok) throw new Error(result.message || "Erro desconhecido");
      setData(result);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  return (
    <div className="p-6 max-w-xl mx-auto bg-white rounded-2xl shadow-lg border border-gray-200 mt-8">
      <h1 className="text-2xl font-bold mb-4">📊 Painel do Banco de Dados</h1>

      {loading && <p className="text-gray-500">Carregando...</p>}

      {error && (
        <p className="text-red-500 font-semibold">
          ❌ Erro: {error}
        </p>
      )}

      {data && (
        <>
          <div className="mb-4">
            <p className="mb-2">
              <strong>Status:</strong> {data.status}
            </p>
            <p className="mb-2">
              <strong>Banco:</strong> {data.database}
            </p>
            <p className="mb-2">
              <strong>Hora do servidor:</strong>{" "}
              {new Date(data.server_time).toLocaleString("pt-BR")}
            </p>
          </div>

          <div className="bg-gray-50 p-4 rounded-lg mb-4">
            <h2 className="text-lg font-semibold mb-2">📌 Registros no Banco</h2>
            <ul className="space-y-1">
              <li>👤 Usuários: <strong>{data.tables.usuarios}</strong></li>
              <li>📦 Produtos: <strong>{data.tables.produtos}</strong></li>
            </ul>
          </div>

          <button
            onClick={fetchData}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition"
          >
            🔄 Atualizar Dados
          </button>
        </>
      )}
    </div>
  );
}
