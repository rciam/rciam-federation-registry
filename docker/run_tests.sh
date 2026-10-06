#!/bin/bash
set -euo pipefail
cd /home/federation-registry-backend-api
npm ci
exec npm run test-docker
