import { Pool } from 'pg';

declare global {
  // eslint-disable-next-line no-var
  var pgPool: Pool | undefined;
}

const isDevelopment = process.env.NODE_ENV === 'development';

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("A variável de ambiente DATABASE_URL não está definida.");
}

let pool: Pool;

if (isDevelopment) {
  // Em desenvolvimento, evita a criação de múltiplos pools durante o hot reload
  if (!global.pgPool) {
    console.log('🔹 Criando novo pool de conexão para desenvolvimento.');
    global.pgPool = new Pool({
      connectionString,
      // O SSL é desabilitado em dev para permitir conexão com banco local sem SSL.
      // Se usar uma branch do Neon para dev, a string de conexão já deve conter `?sslmode=require`.
      ssl: false,
    });
  }
  pool = global.pgPool;
} else {
  // Em produção, cria um novo pool com SSL obrigatório para o Neon.
  pool = new Pool({
    connectionString,
    ssl: {
      rejectUnauthorized: false,
    },
  });
}

export { pool as conn };
