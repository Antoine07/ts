import { defineConfig } from "drizzle-kit";
 
export default defineConfig({
  dialect: "postgresql",
  schema: "./src/drizzle/schema.ts",
  out: "./drizzle",
  dbCredentials: {
    host:  "postgres",
    port: 5432,
    user:  "postgres",
    password:  "postgres",
    database:  "db_sandbox",
    ssl: false,
  },
});