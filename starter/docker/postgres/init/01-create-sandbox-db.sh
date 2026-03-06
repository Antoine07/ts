#!/bin/sh
set -e

SANDBOX_DB_NAME="${SANDBOX_DB_NAME:-db_sandbox}"

echo "Creating sandbox database if missing: ${SANDBOX_DB_NAME}"

psql -v ON_ERROR_STOP=1 --username "${POSTGRES_USER}" --dbname "${POSTGRES_DB}" <<-EOSQL
SELECT 'CREATE DATABASE "${SANDBOX_DB_NAME}"'
WHERE NOT EXISTS (
  SELECT FROM pg_database WHERE datname = '${SANDBOX_DB_NAME}'
)\gexec
EOSQL
