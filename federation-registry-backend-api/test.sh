#!/bin/bash
set -euo pipefail
cd "$(dirname "$0")"
export NODE_ENV="${1:-test}"
node JavaScript/test/reset-db.js
# The url guard and metadata suites need no database and run alongside the integration tests.
exec ./node_modules/.bin/mocha './JavaScript/test/reset-db.test.js' './JavaScript/test/url_guard.test.js' './JavaScript/test/saml_metadata.test.js' './JavaScript/test/test.js' --timeout 10000 --bail --exit
