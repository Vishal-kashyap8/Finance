require('dotenv').config({ path: require('path').join(__dirname, '.env') });
const sql = require('mssql');

const isTrusted = process.env.DB_TRUSTED_CONNECTION === 'true';

const config = isTrusted
  ? {
      server: process.env.DB_SERVER || 'localhost',
      port: Number.parseInt(process.env.DB_PORT || '1433', 10),
      database: process.env.DB_DATABASE || 'FinanceTracker',
      options: {
        trustedConnection: true,
        encrypt: true,
        trustServerCertificate: true,
        enableArithAbort: true,
      },
      pool: { max: 10, min: 0, idleTimeoutMillis: 30000 },
    }
  : {
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      server: process.env.DB_SERVER || 'localhost',
      port: Number.parseInt(process.env.DB_PORT || '1433', 10),
      database: process.env.DB_DATABASE || 'FinanceTracker',
      options: {
        encrypt: true,
        trustServerCertificate: process.env.DB_TRUST_SERVER_CERTIFICATE === 'true',
        enableArithAbort: true,
      },
      pool: { max: 10, min: 0, idleTimeoutMillis: 30000 },
    };

let pool;

async function getPool() {
  if (!pool) {
    pool = await sql.connect(config);
  }
  return pool;
}

module.exports = { getPool, sql };
