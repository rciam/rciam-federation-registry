# Backend integration tests

Run commands from `federation-registry-backend-api/` unless stated otherwise.

## Local

1. Install the locked dependencies with `npm ci` (Node 18 or 20).
2. Provision a disposable PostgreSQL database named `service_registry_test_db`.
   Configure its connection in `db-config/test-db-config.json`; its user must
   be able to create and drop the fixture tables. Keep the development connection
   in `db-config/db-config.json` pointed at `service_registry_db`.
3. Stop any development API listening on port 5000, which the suite also uses.
4. Run `npm test`.

Every run **drops and recreates test tables and seeds fixture data** using
`setup_test_db.sql`. Initialization uses the same JSON connection as the API,
checks the connected database name, and executes SQL in a transaction. A failed
reset rolls back and prevents Mocha from starting. Only the explicit modes
`test` and `test-docker` are accepted; the reset refuses any database name other
than `service_registry_test_db` or any database named in the development config.

The API uses the existing `JavaScript/.env` environment and test tenant JSON files.
Both test tenants include EGI-style `machine_to_machine`, `resource_server`, and
`advanced` profiles, token-lifetime metadata, and the access-token validation-model
default. Advanced profile scopes use each test tenant's supported scope list;
existing tenant-specific environments, permissions, and form settings remain.
The fixtures are self-contained and do not load a local EGI configuration at runtime.
Test authentication and email suppression use the existing test-mode behavior.
The suite currently still attempts issuer discovery during startup and uses its
existing fixed delays. It is an integration suite, not complete feature coverage.

The integration command also runs the reset safeguards. Run `npm run test:setup`
to execute only those safeguards without PostgreSQL.

## Docker and Jenkins

From the repository root, use a unique Compose project name for each run:

```bash
docker-compose -p fr-tests-local -f docker/docker-compose.yml run --rm node
# Run even if the test command failed; removes this project's test data and deps.
docker-compose -p fr-tests-local -f docker/docker-compose.yml down --volumes --remove-orphans
```

Docker provisions PostgreSQL, waits up to 60 seconds for its TCP endpoint, installs
locked dependencies into a project-specific volume, and invokes `npm run test-docker`.
That command uses the same reset script and SQL fixture as `npm test`, selecting
`db-config/docker-test-db-config.json` instead. A database connection or SQL failure
stops the run. The repository is mounted into the test container, so application
logs can be written into the checkout.

The Jenkinsfile uses a build-specific Compose project and always cleans up its
containers and volumes. No Jenkins `setup_db` file credential is needed. Maintain
schema and seed changes in `setup_test_db.sql` alongside the tests. The existing
Node 20 and PostgreSQL 11 images are retained. Local Docker verification does not
replace a live Jenkins build.
