"use client";

import { useEffect, useState } from "react";

export default function DbStatus() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/db-status")
      .then((res) => res.json())
      .then((info) => {
        setData(info);
        setLoading(false);
      })
      .catch(() => {
        setData({ status: "❌ Erro ao buscar status do banco" });
        setLoading(false);
      });
  }, []);

  return (
    <div className="p-4 rounded-2xl shadow-md border max-w-md mx-auto mt-5 bg-white">
      <h2 className="text-xl font-bold mb-2">🔍 Status do Banco de Dados</h2>

      {loading ? (
        <p className="text-gray-500">Carregando...</p>
      ) : (
        <div>
          <p className="mb-2">
            <strong>Status:</strong> {data?.status}
          </p>
          {data?.database && (
            <p>
              <strong>Banco:</strong> {data.database}
            </p>
          )}
          {data?.server_time && (
            <p>
              <strong>Hora do servidor:</strong>{" "}
              {new Date(data.server_time).toLocaleString("pt-BR")}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
