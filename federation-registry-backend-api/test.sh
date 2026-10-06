#!/bin/bash
set -euo pipefail
cd "$(dirname "$0")"
export NODE_ENV="${1:-test}"
node JavaScript/test/reset-db.js
exec ./node_modules/.bin/mocha './JavaScript/test/reset-db.test.js' './JavaScript/test/test.js' --timeout 10000 --bail --exit
