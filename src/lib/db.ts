import { Pool } from "pg";

// Tipagem para o cache global
declare global {
  // eslint-disable-next-line no-var
  var pgPool: Pool | undefined;
}

let conn: Pool;

// Previne múltiplas conexões em desenvolvimento com "hot-reload"
if (process.env.NODE_ENV === "development") {
  if (!global.pgPool) {
    global.pgPool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: {
        rejectUnauthorized: false,
      },
    });
  }
  conn = global.pgPool;
} else {
  // Em produção, cria uma única instância
  conn = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
      rejectUnauthorized: false,
    },
  });
}

export default conn;
