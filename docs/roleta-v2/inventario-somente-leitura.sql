-- AceleraGT — Roleta V2 — inventário do banco (SOMENTE LEITURA)
-- Rodar no SQL Editor do Neon. A transação é READ ONLY: qualquer escrita é recusada pelo próprio Postgres.
-- Objetivo: confirmar que o banco real tem as colunas que a Roleta V2 usa e medir dados legados.

BEGIN TRANSACTION READ ONLY;

-- 1) Colunas reais das tabelas da roleta (comparar com prisma/schema.prisma)
SELECT table_name, column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name IN ('prize_wheel_settings','prize_wheel_segments','prize_wheel_credits','prize_wheel_spins')
ORDER BY table_name, ordinal_position;

-- 2) Índice único de saldo (store_id, seller_id) — necessário para o upsert de concessão
SELECT indexname, indexdef FROM pg_indexes
WHERE schemaname = 'public' AND tablename = 'prize_wheel_credits';

-- 3) Fatias com dados legados que mudam de comportamento ou exigem ajuste na tela
SELECT
  count(*)                                         AS fatias_total,
  count(*) FILTER (WHERE is_active IS NULL)        AS ativo_nulo,
  count(*) FILTER (WHERE is_active = false)        AS arquivadas,
  count(*) FILTER (WHERE weight IS NULL)           AS peso_nulo,
  count(*) FILTER (WHERE weight <= 0)              AS peso_zero_ou_negativo,
  count(*) FILTER (WHERE type NOT IN ('money','voucher','product','retry')) AS tipo_desconhecido,
  count(*) FILTER (WHERE type = 'money' AND value IS NULL) AS dinheiro_sem_valor
FROM prize_wheel_segments;

-- 4) Lojas com mais de 12 fatias ativas (a nova tela exige 2 a 12)
SELECT s.store_id, count(*) AS ativas
FROM prize_wheel_segments g JOIN prize_wheel_settings s ON s.id = g.settings_id
WHERE g.is_active IS NOT FALSE
GROUP BY s.store_id HAVING count(*) > 12 OR count(*) < 2;

-- 5) Saldos negativos e saldos de vendedores inexistentes
SELECT
  count(*) FILTER (WHERE c.credits < 0) AS saldos_negativos,
  count(*) FILTER (WHERE se.id IS NULL) AS saldos_sem_vendedor
FROM prize_wheel_credits c
LEFT JOIN sellers se ON se.id::text = c.seller_id;

-- 6) Volume do histórico (para dimensionar a paginação) e giros duplicados em < 4 s
SELECT store_id, count(*) AS giros FROM prize_wheel_spins GROUP BY store_id ORDER BY giros DESC;

SELECT count(*) AS pares_em_menos_de_4s
FROM (
  SELECT seller_id, created_at,
         lag(created_at) OVER (PARTITION BY store_id, seller_id ORDER BY created_at) AS anterior
  FROM prize_wheel_spins
) t
WHERE anterior IS NOT NULL AND created_at - anterior < interval '4 seconds';

-- 7) Fuso do servidor (created_at é "timestamp sem fuso")
SHOW timezone;

ROLLBACK;
