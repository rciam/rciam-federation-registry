var router = require('express').Router({ mergeParams: true });
var axios = require('axios');
var default_supported_attributes = require('../tenant_config/requested_attributes.json')
const log = require('../loggers.js');
var { authenticate } = require('./authentication.js');
var { assertSafeFetchUrl, createSafeLookup, UnsafeUrlError } = require('../functions/url_guard.js');
var { parseMetadataDocument, MetadataInfoError, refuseMetadataRequest } = require('../functions/saml_metadata.js');

// Redirects are followed here rather than by axios, so every hop goes through the same check.
const maxMetadataRedirects = 3;

// A metadata document is tens of kilobytes; the host is chosen by the caller, so memory is capped.
const maxMetadataBytes = 2 * 1024 * 1024;

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

async function requestHop(url) {
  return axios.get(url, {
    timeout: 2000,
    maxRedirects: 0,
    maxContentLength: maxMetadataBytes,
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
  for (let hop = 0; ; hop++) {
    let response;
    try {
      response = await requestHop(current);
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
        throw new MetadataInfoError('Could not get response from Metadata Url', 404);
      }
      return response.data;
    }
    const location = response.headers && response.headers.location;
    if (!location) {
      throw new MetadataInfoError('The metadata url redirected without a destination.', 404);
    }
    if (hop === maxMetadataRedirects) {
      throw new MetadataInfoError('The metadata url redirected too many times.', 404);
    }
    // Relative Locations resolve against the url that produced them, not the caller's.
    try {
      current = assertSafeFetchUrl(new URL(location, current).toString()).toString();
    }
    catch (err) {
      if (err instanceof UnsafeUrlError) {
        throw new MetadataInfoError(err.message, err.status);
      }
      throw new MetadataInfoError('The metadata url redirected to an unusable destination.', 404);
    }
  }
}

// The same narrowing GET /tenants/:tenant applies to form_config.requested_attributes - the two
// must agree or an accepted attribute has no table row and is silently never submitted.
function tenantOfferedAttributes(tenant) {
  const form = ((global.tenant_config || {})[tenant] || {}).form || {};
  const supported = Array.isArray(form.supported_attributes) ? form.supported_attributes : null;
  if (!supported) {
    return default_supported_attributes;
  }
  return default_supported_attributes.filter((x) => supported.includes(x.friendly_name));
}

// Under /tenants/:tenant because authenticate resolves the session per tenant; anonymous callers
// have no use for this.
router.get('/metadata_info', authenticate, async (req, res, next) => {
  let requested = req.query.metadata_url;
  if (typeof requested !== 'string' || requested === '') {
    return fail(res, 400, 'The metadata_url parameter is required.');
  }

  let document;
  let parsed;
  try {
    // Express decoded the query once already; decoding twice would let a doubly encoded address
    // past the checks below.
    document = await getMetadataDocument(requested);
    parsed = parseMetadataDocument(document, tenantOfferedAttributes(req.params.tenant));
  }
  catch (err) {
    const refusal = refuseMetadataRequest(err);
    if (refusal) {
      return fail(res, refusal.status, refusal.message);
    }
    // The document may hold user data, so the details are logged and not sent.
    log.warn('Could not read metadata: ' + (err.stack || err), { type: 'metadata_info' }, { req, res });
    return fail(res, 404, 'Could not get response from Metadata Url');
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
