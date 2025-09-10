import { Pool } from "pg";

// Tipagem para o cache global, que evita criar múltiplas conexões em desenvolvimento.
declare global {
  // eslint-disable-next-line no-var
  var pgPool: Pool | undefined;
}

let conn: Pool;

// A string de conexão é lida das variáveis de ambiente.
// Em produção, será a variável configurada no painel da Vercel/Firebase.
// Em desenvolvimento, será a variável do arquivo .env.local.
const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  // Alerta o desenvolvedor se a variável não estiver configurada.
  console.warn("⚠️ A variável de ambiente DATABASE_URL não está definida. A conexão com o banco de dados não será estabelecida.");
}

// Previne múltiplas conexões em desenvolvimento durante o "hot-reload".
if (process.env.NODE_ENV === "development") {
  if (connectionString) {
    if (!global.pgPool) {
      console.log("🔹 Criando novo pool de conexão para desenvolvimento.");
      global.pgPool = new Pool({
        connectionString: connectionString,
        ssl: {
          rejectUnauthorized: false, // Necessário para algumas configurações do Neon
        },
      });
    }
    conn = global.pgPool;
  }
} else {
  // Em produção, cria uma única instância se a string de conexão existir.
  if (connectionString) {
    conn = new Pool({
      connectionString: connectionString,
      ssl: {
        rejectUnauthorized: false, // Necessário para Neon
      },
    });
  }
}

// Exporta a conexão para ser usada em outras partes da aplicação.
// Se a conexão não foi estabelecida (por falta de DATABASE_URL), `conn` será undefined.
// O código que a utiliza deverá tratar esse caso para evitar erros em tempo de execução.
export { conn };
