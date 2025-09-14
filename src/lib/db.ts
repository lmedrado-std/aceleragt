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
  // Lança um erro se a DATABASE_URL não estiver definida.
  // Isso garante que a aplicação falhe rapidamente se a configuração estiver incompleta.
  throw new Error("A variável de ambiente DATABASE_URL não está definida.");
}

// Configura o SSL para produção ou se a URL for do Neon.
const sslConfig = process.env.NODE_ENV === 'production' 
    ? { rejectUnauthorized: false } 
    : undefined;

// Lógica para evitar múltiplas conexões em ambiente de desenvolvimento (hot-reload).
if (process.env.NODE_ENV === "development") {
  // Se a instância global do pool ainda não existe, cria uma nova.
  if (!global.pgPool) {
    console.log("🔹 Criando novo pool de conexão para desenvolvimento.");
    global.pgPool = new Pool({
      connectionString: connectionString,
      ssl: sslConfig, // SSL pode ser necessário em dev se usando Neon
    });
  }
  // Atribui a instância global (nova ou existente) à conexão.
  conn = global.pgPool;
} else {
  // Em produção, sempre cria uma nova instância do pool.
  conn = new Pool({
    connectionString: connectionString,
    ssl: { rejectUnauthorized: false }, // Exigido pelo Neon em produção
  });
}

// Exporta a conexão para ser usada em outras partes da aplicação.
export { conn };
