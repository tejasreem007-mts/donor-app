import oracledb from "oracledb";

oracledb.outFormat = oracledb.OUT_FORMAT_OBJECT;
oracledb.autoCommit = false;

// Global singleton pool for Next.js hot-reloading support
const globalForOracle = globalThis;

export async function getPool() {
  if (!process.env.DB_USER || !process.env.DB_CONNECT) {
    throw new Error(
      "Database credentials not configured. Please define DB_USER, DB_PASSWORD, and DB_CONNECT in .env.local"
    );
  }

  if (!globalForOracle._oraclePool) {
    globalForOracle._oraclePool = await oracledb.createPool({
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      connectString: process.env.DB_CONNECT,
      poolMin: 1,
      poolMax: 10,
      poolIncrement: 1,
      poolTimeout: 60,
    });
  }
  return globalForOracle._oraclePool;
}

export async function getConn() {
  try {
    const pool = await getPool();
    return await pool.getConnection();
  } catch (err) {
    // If pool initialization fails, fallback to direct connection
    if (process.env.DB_USER && process.env.DB_CONNECT) {
      return await oracledb.getConnection({
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        connectString: process.env.DB_CONNECT,
      });
    }
    throw err;
  }
}

export { oracledb };
