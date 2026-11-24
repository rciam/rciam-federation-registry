var router = require('express').Router({ mergeParams: true });
var axios = require('axios');
var { rateLimit } = require('express-rate-limit');
var default_supported_attributes = require('../tenant_config/requested_attributes.json')
const log = require('../loggers.js');
var { authenticate } = require('./authentication.js');
var { assertSafeFetchUrl, createSafeLookup, UnsafeUrlError } = require('../functions/url_guard.js');
var { parseMetadataDocument, MetadataInfoError, refuseMetadataRequest } = require('../functions/saml_metadata.js');

// Redirects are followed here rather than by axios, so every hop goes through the same check.
const maxMetadataRedirects = 3;

// Each hop has its own ceiling, while the complete redirect chain has one deadline. This prevents
// a chain of individually slow endpoints from multiplying the time an authenticated request holds
// server resources.
const metadataHopTimeoutMs = 2000;
const metadataTotalTimeoutMs = 8000;

// A metadata document is tens of kilobytes; the host is chosen by the caller, so memory is capped.
const maxMetadataBytes = 2 * 1024 * 1024;

// This is deliberately after authenticate below, so the key represents a tenant user rather than
// a shared reverse-proxy address. Deployments with more than one API process should enforce the
// same policy at the ingress as well, because this in-process limiter is not a distributed quota.
const metadataRateLimit = rateLimit({
  windowMs: 60 * 1000,
  limit: 30,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => req.params.tenant + ':' + ((req.user && req.user.sub) || 'unknown'),
  handler: (req, res) => fail(res, 429, 'Too many metadata requests. Please try again shortly.')
});

// The reason travels in the body, never in res.statusMessage - see MetadataInfoError.
function fail(res, status, message) {
  if (res.headersSent) {
    return false;
  }
  res.status(status).send({ error: message });
  return true;
}

function isRedirect(response) {
  return !!response && response.status >= 300 && response.status < 400;
}

// One instance: stateless, and pins every hop's address - see createSafeLookup in url_guard.js.
const safeLookup = createSafeLookup();

async function requestHop(url, timeout) {
  return axios.get(url, {
    timeout: timeout,
    maxRedirects: 0,
    maxContentLength: maxMetadataBytes,
    // Axios honours HTTP_PROXY/HTTPS_PROXY by default. A proxy would resolve the destination itself,
    // so our lookup would pin the proxy rather than the checked metadata host.
    proxy: false,
    // A host serving the xml as application/json would otherwise come back parsed, and the redirect
    // is an answer to inspect below, not an error to throw.
    responseType: 'text',
    validateStatus: () => true,
    lookup: safeLookup
  });
}

// Fetches the document, refusing any url - including a redirect target - the server must not reach.
async function getMetadataDocument(url) {
  let current = assertSafeFetchUrl(url).toString();
  const started = Date.now();
  for (let hop = 0; ; hop++) {
    const remaining = metadataTotalTimeoutMs - (Date.now() - started);
    if (remaining <= 0) {
      throw new MetadataInfoError('The metadata url took too long to answer.', 504);
    }
    let response;
    try {
      response = await requestHop(current, Math.min(metadataHopTimeoutMs, remaining));
    }
    catch (err) {
      // An unfollowed redirect arrives as a response or a rejection depending on axios version.
      response = err && err.response;
      if (!isRedirect(response)) {
        throw err;
      }
    }
    if (!isRedirect(response)) {
      if (!response || response.status < 200 || response.status >= 300) {
        throw new MetadataInfoError('Could not get response from Metadata Url', 502);
      }
      return response.data;
    }
    const location = response.headers && response.headers.location;
    if (!location) {
      throw new MetadataInfoError('The metadata url redirected without a destination.', 502);
    }
    if (hop === maxMetadataRedirects) {
      throw new MetadataInfoError('The metadata url redirected too many times.', 502);
    }
    // Relative Locations resolve against the url that produced them, not the caller's.
    try {
      const next = assertSafeFetchUrl(new URL(location, current).toString());
      if (new URL(current).protocol === 'https:' && next.protocol !== 'https:') {
        throw new MetadataInfoError('The metadata url must not redirect from https to http.', 400);
      }
      current = next.toString();
    }
    catch (err) {
      if (err instanceof MetadataInfoError) {
        throw err;
      }
      if (err instanceof UnsafeUrlError) {
        throw new MetadataInfoError(err.message, err.status);
      }
      throw new MetadataInfoError('The metadata url redirected to an unusable destination.', 502);
    }
  }
}

function tenantOfferedAttributes(tenant) {
  const form = ((global.tenant_config || {})[tenant] || {}).form || {};
  const supported = Array.isArray(form.supported_attributes) ? form.supported_attributes : null;
  if (!supported) {
    return default_supported_attributes;
  }
  return default_supported_attributes.filter((x) => supported.includes(x.friendly_name));
}

function knownTenant(req, res, next) {
  const tenants = global.tenant_config || {};
  const clients = req.app.get('clients') || {};
  if (!Object.prototype.hasOwnProperty.call(tenants, req.params.tenant)
      || !Object.prototype.hasOwnProperty.call(clients, req.params.tenant)) {
    return fail(res, 404, 'Tenant not found.');
  }
  next();
}

router.get('/metadata_info', knownTenant, authenticate, metadataRateLimit, async (req, res, next) => {
  let requested = req.query.metadata_url;
  if (typeof requested !== 'string' || requested === '') {
    return fail(res, 400, 'The metadata_url parameter is required.');
  }

  let document;
  let parsed;
  try {
    document = await getMetadataDocument(requested);
    parsed = parseMetadataDocument(document, tenantOfferedAttributes(req.params.tenant));
  }
  catch (err) {
    const refusal = refuseMetadataRequest(err);
    if (refusal) {
      return fail(res, refusal.status, refusal.message);
    }
    log.warn('Could not read metadata: ' + (err.stack || err), { type: 'metadata_info' }, { req, res });
    return fail(res, 502, 'Could not get response from Metadata Url');
  }

  res.status(200).send({
    entity_id: parsed.entity_id,
    service_name: parsed.service_name,
    service_description: parsed.service_description,
    supported_attributes: parsed.supported_attributes,
    unsupported_attributes: parsed.unsupported_attributes,
    warnings: parsed.warnings,
    metadata_url: requested
  });
});

module.exports = router;
// Kept off the public API surface; these exports let the HTTP-policy tests exercise the real
// fetcher rather than reimplementing its redirect and Axios configuration in a fixture.
module.exports._test = { getMetadataDocument, requestHop, knownTenant };
