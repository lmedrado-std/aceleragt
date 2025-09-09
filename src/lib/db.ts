import { Pool } from "pg";

// Tipagem para o cache global
declare global {
  // eslint-disable-next-line no-var
  var pgPool: Pool | undefined;
}

let conn: Pool;

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.warn("⚠️ A variável de ambiente DATABASE_URL não está definida. A conexão com o banco de dados não será estabelecida.");
  // Em um cenário de desenvolvimento sem banco, podemos não querer lançar um erro fatal.
  // No entanto, para produção, você deve garantir que esta variável esteja sempre presente.
}

// Previne múltiplas conexões em desenvolvimento com "hot-reload"
if (process.env.NODE_ENV === "development") {
  if (!global.pgPool && connectionString) {
    global.pgPool = new Pool({
      connectionString: connectionString,
      ssl: {
        rejectUnauthorized: false, // Necessário para algumas configurações do Neon
      },
    });
  }
  if(global.pgPool) conn = global.pgPool;
} else {
  // Em produção, cria uma única instância se a string de conexão existir
  if (connectionString) {
    conn = new Pool({
      connectionString: connectionString,
      ssl: {
        rejectUnauthorized: false,
      },
    });
  }
}

// Exporta a conexão para ser usada em outras partes da aplicação
// Se a conexão não foi estabelecida (por falta de DATABASE_URL), `conn` será undefined.
// O código que a utiliza deverá tratar esse caso.
export { conn };
