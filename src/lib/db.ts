import { Pool } from 'pg';

let conn: Pool;

if (!conn) {
  conn = new Pool({
    connectionString: process.env.DATABASE_URL,
  });
}

export default conn;
