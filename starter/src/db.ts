import { Pool } from "pg";

export const pool = new Pool({
  host: "postgres",
  port: 5432,
  user: "postgres",
  password: "postgres",
  database: "db_sandbox",
});
