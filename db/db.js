import pkg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const {Pool} = pkg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false, // Nécessaire pour accepter les certificats auto-signés
  },
});

export default pool;
