import { Pool } from 'pg';
import { env } from './env';

export const pool = new Pool({
  host: env.DB_HOST,
  port: env.DB_PORT,
  user: env.DB_USERNAME,
  password: env.DB_PASSWORD,
  database: env.DB_DATABASE,
  ssl: {
    rejectUnauthorized: false
  }
});

export const initializeDatabase = async (): Promise<void> => {
  try {
    const client = await pool.connect();
    console.log(`✅ Conectado a PostgreSQL - Schema: ${env.DB_SCHEMA}`);
    
    // Configurar schema por defecto
    await client.query(`SET search_path TO ${env.DB_SCHEMA}`);
    
    client.release();
  } catch (error) {
    console.error('❌ Error al conectar a la base de datos:', error);
    throw error;
  }
};

export const query = async (text: string, params?: any[]) => {
  const start = Date.now();
  try {
    const result = await pool.query(text, params);
    const duration = Date.now() - start;
    if (env.NODE_ENV === 'development') {
      console.log('📊 Query ejecutada:', { text, duration, rows: result.rowCount });
    }
    return result;
  } catch (error) {
    console.error('❌ Error en query:', { text, error });
    throw error;
  }
};
