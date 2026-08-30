import mysql, { type Pool, type RowDataPacket } from "mysql2/promise";

const globalDatabase = globalThis as typeof globalThis & {
  securepathbankPool?: Pool;
};

function createPool() {
  for (const name of ["DB_HOST", "DB_USER", "DB_DATABASE"]) {
    if (!process.env[name])
      throw new Error(`Missing database setting: ${name}`);
  }
  return mysql.createPool({
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD || "",
    database: process.env.DB_DATABASE,
    connectionLimit: 10,
    connectTimeout: 3000,
    enableKeepAlive: true,
  });
}

function pool() {
  if (!globalDatabase.securepathbankPool)
    globalDatabase.securepathbankPool = createPool();
  return globalDatabase.securepathbankPool;
}

export const db = new Proxy({} as Pool, {
  get(_target, property) {
    const activePool = pool();
    const value = Reflect.get(activePool, property);
    return typeof value === "function" ? value.bind(activePool) : value;
  },
});

export type DatabaseRow = RowDataPacket;