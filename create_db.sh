#!/bin/bash

set -e

psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" <<-EOSQL
	CREATE DATABASE service_registry_test_db;
EOSQL

psql  -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$TEST_DB" < /setup_db.sql