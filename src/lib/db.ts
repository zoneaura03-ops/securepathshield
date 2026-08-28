import mysql, { type Pool, type RowDataPacket } from "mysql2/promise";

const globalDatabase = globalThis as typeof globalThis & {
  securepathshieldPool?: Pool;
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

export const db = globalDatabase.securepathshieldPool ?? createPool();
if (process.env.NODE_ENV !== "production") globalDatabase.securepathshieldPool = db;
export type DatabaseRow = RowDataPacket;
