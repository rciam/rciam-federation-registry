const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const {spawnSync} = require('child_process');
const {validateTarget, resetDatabase} = require('./reset-db');

// These checks never connect to PostgreSQL.
describe('Test database reset safeguards', () => {
  const development = {database: 'service_registry_db'};
  it('accepts the dedicated test database', () => {
    assert.doesNotThrow(() => validateTarget({database: 'service_registry_test_db'}, development));
  });
  it('rejects development, arbitrary, and unspecified database names', () => {
    for (const database of ['service_registry_db', 'test_db', undefined]) {
      assert.throws(() => validateTarget({database}, development), /Refusing/);
    }
  });
  it('rejects a development configuration pointing at the test database', () => {
    const config = {database: 'service_registry_test_db'};
    assert.throws(() => validateTarget(config, config), /development database/);
  });
  it('rejects an invalid mode before connecting', async () => {
    await assert.rejects(resetDatabase('development'), /Invalid test mode/);
  });
  it('stops the shell runner when initialization fails', () => {
    const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'fr-reset-'));
    try {
      fs.writeFileSync(path.join(directory, 'node'), '#!/bin/sh\nexit 42\n', {mode: 0o755});
      const result = spawnSync('bash', [path.resolve(__dirname, '../../test.sh')], {
        env: {...process.env, PATH: directory + ':' + process.env.PATH}, encoding: 'utf8'
      });
      assert.strictEqual(result.status, 42);
      assert.strictEqual(result.stdout, '');
    } finally {
      fs.rmSync(directory, {recursive: true, force: true});
    }
  });
});
