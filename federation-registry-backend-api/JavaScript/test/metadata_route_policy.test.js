'use strict';

const { expect } = require('chai');
const axios = require('axios');
// The policy helpers do not need a database. Stub the authentication module's database import so
// this unit suite remains hermetic while loading the real route module.
const dbPath = require.resolve('../db');
const priorDbModule = require.cache[dbPath];
require.cache[dbPath] = {
  id: dbPath,
  filename: dbPath,
  loaded: true,
  exports: { db: {} }
};
const utilRoutes = require('../routes/util_routes.js');
if (priorDbModule) {
  require.cache[dbPath] = priorDbModule;
}
else {
  delete require.cache[dbPath];
}

const { getMetadataDocument, requestHop, knownTenant } = utilRoutes._test;

describe('# Metadata route policy', function () {
  let originalGet;

  beforeEach(function () {
    originalGet = axios.get;
  });

  afterEach(function () {
    axios.get = originalGet;
  });

  it('disables environment proxies so lookup validates the destination host', async function () {
    let received;
    axios.get = async function (url, options) {
      received = { url, options };
      return { status: 200, data: '<xml />', headers: {} };
    };

    await requestHop('https://metadata.example.org/document.xml', 1234);

    expect(received.options.proxy).to.equal(false);
    expect(received.options.lookup).to.be.a('function');
    expect(received.options.timeout).to.equal(1234);
    expect(received.options.maxRedirects).to.equal(0);
  });

  it('refuses an https to http downgrade', async function () {
    axios.get = async function () {
      return { status: 302, data: '', headers: { location: 'http://metadata.example.org/plain.xml' } };
    };

    let refused;
    try {
      await getMetadataDocument('https://metadata.example.org/document.xml');
    }
    catch (err) {
      refused = err;
    }

    expect(refused).to.be.an('error');
    expect(refused.status).to.equal(400);
    expect(refused.message).to.contain('must not redirect from https to http');
  });

  it('allows an http origin to upgrade to https', async function () {
    const answers = [
      { status: 302, data: '', headers: { location: 'https://metadata.example.org/secure.xml' } },
      { status: 200, data: '<EntityDescriptor />', headers: {} }
    ];
    axios.get = async function () { return answers.shift(); };

    expect(await getMetadataDocument('http://metadata.example.org/document.xml'))
      .to.equal('<EntityDescriptor />');
  });

  it('returns a controlled response for an unknown tenant before authentication', function () {
    const prior = global.tenant_config;
    global.tenant_config = { known: {} };
    const req = { params: { tenant: 'missing' }, app: { get: () => ({ known: {} }) } };
    const response = {};
    const res = {
      headersSent: false,
      status: function (status) { response.status = status; return this; },
      send: function (body) { response.body = body; return this; }
    };
    let continued = false;

    knownTenant(req, res, function () { continued = true; });
    global.tenant_config = prior;

    expect(continued).to.equal(false);
    expect(response).to.eql({ status: 404, body: { error: 'Tenant not found.' } });
  });
});
