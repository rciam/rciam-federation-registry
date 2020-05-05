#!/bin/bash

set -e

psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" <<-EOSQL
    CREATE DATABASE service_registry_test_db;
    GRANT ALL PRIVILEGES ON DATABASE service_registry_test_db TO postgres;
EOSQL

psql  -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname service_registry_test_db < /setup_db.sql