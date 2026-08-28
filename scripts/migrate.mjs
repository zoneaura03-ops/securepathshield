import mysql from "mysql2/promise";
import { readFile, readdir } from "node:fs/promises";
import process from "node:process";

const required = ["DB_HOST", "DB_USER", "DB_PASSWORD", "DB_DATABASE"];
for (const name of required) {
  if (
    process.env[name] === undefined ||
    (name !== "DB_PASSWORD" && !process.env[name])
  )
    throw new Error(`Missing required environment variable: ${name}`);
}

const connection = await mysql.createConnection({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_DATABASE,
  multipleStatements: true,
});
try {
  await connection.query(`
    CREATE TABLE IF NOT EXISTS app_migrations (
      name VARCHAR(255) PRIMARY KEY,
      applied_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `);
  const [appliedRows] = await connection.query(
    "SELECT name FROM app_migrations",
  );
  const applied = new Set(appliedRows.map((row) => row.name));

  const directory = new URL("../database/migrations/", import.meta.url);
  const migrations = (await readdir(directory))
    .filter((file) => file.endsWith(".sql"))
    .sort();
  for (const migration of migrations) {
    if (applied.has(migration)) {
      console.log(`Skipped ${migration}`);
      continue;
    }
    const sql = await readFile(new URL(migration, directory), "utf8");
    await connection.query(sql);
    await connection.execute("INSERT INTO app_migrations (name) VALUES (?)", [
      migration,
    ]);
    console.log(`Applied ${migration}`);
  }
} finally {
  await connection.end();
}
