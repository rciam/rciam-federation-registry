const fs = require('fs');
const path = require('path');
const pgPromise = require('pg-promise');

function validateTarget(config, development) {
  if (config.database !== 'service_registry_test_db') {
    throw new Error('Refusing to reset a database other than service_registry_test_db');
  }
  if (config.database === development.database) {
    throw new Error('Refusing to reset the development database');
  }
}

async function resetDatabase(mode) {
  if (!['test', 'test-docker'].includes(mode)) throw new Error('Invalid test mode');
  const config = require('../../db-config/' + (mode === 'test' ? 'test-db-config.json' : 'docker-test-db-config.json'));
  validateTarget(config, require('../../db-config/db-config.json'));
  const pgp = pgPromise();
  const db = pgp({...config, connectionTimeoutMillis: 5000});
  try {
    const identity = await db.one('SELECT current_database() AS name');
    if (identity.name !== config.database) throw new Error('Connected database does not match test configuration');
    console.log('Resetting ' + identity.name);
    const sql = fs.readFileSync(path.join(__dirname, 'setup_test_db.sql'), 'utf8');
    await db.tx(t => t.none(sql));
  } finally {
    pgp.end();
  }
}

if (require.main === module) {
  resetDatabase(process.env.NODE_ENV).catch(error => {
    console.error('Test database initialization failed (' + (error.code || error.message) + ')');
    process.exitCode = 1;
  });
}
module.exports = {validateTarget, resetDatabase};
